import { createMiddleware } from "hono/factory"
import type { Context } from "hono"
import { APIError } from "better-auth/api"
import {
  type OrganizationStatement,
  type PlatformStatement,
  organizationRoles,
  platformRoles,
} from "@repo/shared/access-control"
import type { AppEnv } from "./env"

/**
 * ============================================================
 * Guards del api-worker (Hono + Cloudflare Workers)
 * ============================================================
 *
 * Middlewares de autorización que se encadenan antes del handler.
 * Equivalente a los `@UseGuards()` de NestJS o a los wrappers
 * `withAuth()` de Next.js App Router.
 *
 * Capas:
 *   route  → con requireAuth() / requirePlatformPermission() / requireOrgPermission()
 *     ↓    (este archivo)
 *   service → lógica de negocio (no conoce Hono)
 *     ↓
 *   repository → acceso a datos (no conoce Hono)
 *
 * La idea: el handler de un route queda delgado — solo parsea
 * input, llama al service, devuelve JSON. Toda la auth/perms
 * vive aquí.
 *
 * Reglas de implementación (no romper):
 *   - NUNCA componer un middleware llamando a otro con el mismo
 *     `next` (ej. `await requireAuth()(c, next)`): eso ejecuta el
 *     handler ANTES del chequeo de permisos y llama `next()` dos
 *     veces. Cada guard hace su chequeo de sesión inline.
 *   - `auth.api.hasPermission` (org) y `auth.api.userHasPermission`
 *     (plataforma) devuelven `{ success: boolean }`, NO un booleano
 *     — chequear siempre `.success`.
 *   - Ambas APIs lanzan `APIError` (sesión inválida, no-miembro,
 *     sin org activa): se mapea a 401/403, nunca propagar como 500.
 *
 * @example
 *   import { requireAuth, requirePlatformPermission } from "../lib/route-handler"
 *
 *   export const orgRoutes = new Hono<AppEnv>()
 *     .get("/me", requireAuth(), async (c) => c.json({ ... }))
 *     .post("/", requirePlatformPermission("organization", "create"), async (c) => {
 *       const input = c.req.valid("json")
 *       const org = await createOrganization(
 *         { auth: c.get("auth"), queue: c.env.TASK_QUEUE, headers: c.req.raw.headers },
 *         input,
 *       )
 *       return c.json({ organization: org })
 *     })
 */

// ----- Helpers internos -----

/** 401 inline. Cada guard lo usa directamente — sin composición. */
function unauthorized(c: Context<AppEnv>) {
  return c.json({ error: "No autenticado" }, 401)
}

function hasSession(c: Context<AppEnv>) {
  return !!c.get("session") && !!c.get("user")
}

/**
 * Mapea un APIError de Better Auth a respuesta limpia.
 * Cualquier otra excepción se propaga al `app.onError` global.
 */
function mapAuthApiError(c: Context<AppEnv>, err: unknown) {
  if (err instanceof APIError) {
    return c.json(
      { error: err.message },
      err.statusCode === 401 ? 401 : 403,
    )
  }
  throw err
}

// ----- Guards -----

/**
 * `requireAuth()`
 *
 * Garantiza sesión activa. Asume que el middleware global de
 * `index.ts` ya cargó `c.var.session` y `c.var.user` (lo hace para
 * todas las requests). Si no hay sesión, corta con 401.
 *
 * Úsalo para endpoints que requieren usuario logueado pero no un
 * permiso específico (ej. `GET /api/organizations/me`).
 */
export function requireAuth() {
  return createMiddleware<AppEnv>(async (c, next) => {
    if (!hasSession(c)) return unauthorized(c)
    await next()
  })
}

/**
 * `requirePlatformPermission(module, action)`
 *
 * Sesión + que el rol de PLATAFORMA del usuario autorice el permiso
 * `module:action` (plugin `admin` de Better Auth).
 *
 * @example
 *   .post("/", requirePlatformPermission("organization", "create"), handler)
 */
export function requirePlatformPermission<Module extends keyof PlatformStatement>(
  module: Module,
  action: PlatformStatement[Module][number],
) {
  return createMiddleware<AppEnv>(async (c, next) => {
    if (!hasSession(c)) return unauthorized(c)

    try {
      const result = await c.get("auth").api.userHasPermission({
        body: { permissions: { [module]: [action] } },
        headers: c.req.raw.headers,
      })
      if (!result.success) {
        return c.json({ error: "Sin permiso" }, 403)
      }
    } catch (err) {
      return mapAuthApiError(c, err)
    }

    await next()
  })
}

/**
 * `requireOrgPermission(module, action)`
 *
 * Sesión + que el rol de ORGANIZACIÓN del usuario autorice el
 * permiso `module:action` (plugin `organization` de Better Auth).
 *
 * El `organizationId` se resuelve del param de ruta `:orgId` si
 * existe; si no, de `session.activeOrganizationId`. Si no hay
 * ninguno, 403 (el usuario no tiene contexto de organización).
 *
 * @example
 *   .post("/:orgId/contents", requireOrgPermission("content", "publish"), handler)
 */
export function requireOrgPermission<Module extends keyof OrganizationStatement>(
  module: Module,
  action: OrganizationStatement[Module][number],
) {
  return createMiddleware<AppEnv>(async (c, next) => {
    if (!hasSession(c)) return unauthorized(c)

    const session = c.get("session")!
    const organizationId =
      c.req.param("orgId") ?? session.activeOrganizationId ?? undefined

    if (!organizationId) {
      return c.json({ error: "Sin organización activa" }, 403)
    }

    try {
      const result = await c.get("auth").api.hasPermission({
        body: {
          organizationId,
          permissions: { [module]: [action] },
        },
        headers: c.req.raw.headers,
      })
      if (!result.success) {
        return c.json({ error: "Sin permiso" }, 403)
      }
    } catch (err) {
      return mapAuthApiError(c, err)
    }

    await next()
  })
}

// ----- Peek helpers (para usar dentro de un handler, no como middleware) -----

/** Chequeo barato de rol de plataforma (no consulta la base). */
export function platformRoleHas(roles: string[], user: { role?: string }) {
  return !!user.role && roles.includes(user.role)
}

export function platformStatementHas(
  role: string,
  permissions: Record<string, string[]>,
) {
  const r = (platformRoles as Record<string, { authorize: (p: unknown) => { success: boolean } }>)[role]
  if (!r) return false
  return r.authorize(permissions).success
}

export function orgStatementHas(
  role: string,
  permissions: Record<string, string[]>,
) {
  const r = (organizationRoles as Record<string, { authorize: (p: unknown) => { success: boolean } }>)[role]
  if (!r) return false
  return r.authorize(permissions).success
}
