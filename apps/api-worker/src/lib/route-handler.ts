import { createMiddleware } from "hono/factory"
import type { RoleAuthorizeRequest } from "better-auth/plugins/access"
import {
  type OrganizationStatement,
  type PlatformStatement,
  organizationRoles,
  platformRoles,
} from "@repo/shared/access-control"
import type { AppEnv } from "./env"

/**
 * ============================================================
 * Route Handlers del api-worker (Hono + Cloudflare Workers)
 * ============================================================
 *
 * Este archivo encapsula la autenticación, extracción de
 * `organizationId` y validación de permisos. Es el equivalente
 * a los `route-handler.ts` wrappers de Next.js App Router,
 * pero como middlewares de Hono (la API es la misma: encadenar
 * funciones antes del handler).
 *
 * Capas:
 *   route  → con withSession() o withAuth(module, action)
 *     ↓    (este archivo)
 *   service → lógica de negocio (no conoce Hono)
 *     ↓
 *   repository → acceso a datos (no conoce Hono)
 *
 * La idea: el handler de un route queda delgado — solo parsea
 * input, llama al service, devuelve JSON. Toda la auth/perms
 * vive en este archivo.
 *
 * @example
 *   import { withAuth, withSession } from "../lib/route-handler"
 *
 *   export const orgRoutes = new Hono<AppEnv>()
 *     .get("/me", withSession(), async (c) => c.json({ ... }))
 *     .post("/", withAuth("organization", "create"), async (c) => {
 *       const input = createOrganizationSchema.parse(await c.req.json())
 *       const org = await organizationService.create(input, {
 *         auth: c.get("auth"),
 *         queue: c.env.TASK_QUEUE,
 *         headers: c.req.raw.headers,
 *       })
 *       return c.json({ organization: org })
 *     })
 */

// ----- Helpers internos -----

const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("session") || !c.get("user")) {
    return c.json({ error: "No autenticado" }, 401)
  }
  await next()
})

/**
 * `withSession()`
 *
 * Garantiza que la request tenga sesión activa. Carga `c.var.session`
 * y `c.var.user` (lo hace el middleware global en `index.ts`).
 * Si no hay sesión, corta con 401.
 *
 * Úsalo para endpoints que requieren usuario logueado pero no
 * un permiso específico (ej. `GET /api/organizations/me`).
 */
export function withSession() {
  return requireSession
}

/**
 * `withAuth(module, action)`
 *
 * Garantiza sesión + que el rol del usuario autorice el permiso
 * `module:action`. Integra con Better Auth:
 *   - Si la ruta está bajo `/api/admin/*` usa permisos de plataforma
 *     (`auth.api.userHasPermission`).
 *   - Si la ruta está bajo `/api/.../:orgId/...` o usa la org activa,
 *     usa permisos de organización (`auth.api.hasPermission`).
 *
 * La distinción se hace pasando el segundo parámetro:
 *   - `withAuth("user", "list")` → chequea permiso de plataforma
 *   - `withAuth("member", "invite", { org: true })` → chequea permiso de org
 */
export type AuthScope = "platform" | "organization"

export interface WithAuthOptions {
  /**
   * Si es "organization", resuelve el `organizationId` desde el
   * param de ruta ":orgId" o desde `session.activeOrganizationId`.
   * Default: "platform".
   */
  scope?: AuthScope
}

export function withAuth(
  module: keyof PlatformStatement,
  action: PlatformStatement[keyof PlatformStatement][number],
  options?: { scope: "platform" },
): ReturnType<typeof createMiddleware<AppEnv>>

export function withAuth(
  module: keyof OrganizationStatement,
  action: OrganizationStatement[keyof OrganizationStatement][number],
  options: { scope: "organization" },
): ReturnType<typeof createMiddleware<AppEnv>>

export function withAuth(
  module: string,
  action: string,
  options: WithAuthOptions = { scope: "platform" },
) {
  return createMiddleware<AppEnv>(async (c, next) => {
    await requireSession(c, next)
    const auth = c.get("auth")
    const headers = c.req.raw.headers

    if (options.scope === "organization") {
      const orgIdFromRoute = c.req.param("orgId")
      const session = c.get("session")!
      const activeOrgId = (session as { activeOrganizationId?: string | null })
        .activeOrganizationId

      const result = await auth.api.hasPermission({
        body: {
          organizationId: orgIdFromRoute ?? activeOrgId ?? undefined,
          permissions: { [module]: [action] },
        },
        headers,
      })

      if (!result) {
        return c.json({ error: "Sin permiso" }, 403)
      }
    } else {
      const result = await auth.api.userHasPermission({
        body: { permissions: { [module]: [action] } },
        headers,
      })

      if (!result.success) {
        return c.json({ error: "Sin permiso" }, 403)
      }
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
