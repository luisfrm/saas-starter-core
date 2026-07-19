import { createMiddleware } from "hono/factory"
import type { RoleAuthorizeRequest } from "better-auth/plugins/access"
import {
  type OrganizationStatement,
  type PlatformStatement,
  organizationRoles,
  platformRoles,
} from "@repo/shared/access-control"
import type { AppEnv } from "../lib/env"

/**
 * requireAuth corre antes de cualquier guard. Estos guards
 * asumen que c.var.session y c.var.user ya están cargados
 * y devuelven 401 si no encuentran sesión.
 */

const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("session") || !c.get("user")) {
    return c.json({ error: "No autenticado" }, 401)
  }
  await next()
})

/**
 * requirePlatformRole
 *
 * Chequeo barato contra el rol de plataforma del usuario, leído
 * de la sesión. NO consulta la base. Úsalo para casos donde el
 * permiso granular no aporta (ej. "solo el owner ve...").
 */
export function requirePlatformRole(...roles: string[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    await requireSession(c, next)
    const user = c.get("user")!
    const userRole = (user as { role?: string }).role
    if (!userRole || !roles.includes(userRole)) {
      return c.json({ error: "Sin permiso" }, 403)
    }
    await next()
  })
}

/**
 * requirePlatformPermission
 *
 * Llama a auth.api.userHasPermission (plugin admin) y compara
 * el rol de plataforma contra los permisos del statement. El
 * chequeo se hace en memoria en Better Auth, no consulta Neon.
 */
export function requirePlatformPermission(
  permissions: RoleAuthorizeRequest<PlatformStatement>
) {
  return createMiddleware<AppEnv>(async (c, next) => {
    await requireSession(c, next)
    const auth = c.get("auth")
    const result = await auth.api.userHasPermission({
      body: { permissions: permissions as Record<string, string[]> },
      headers: c.req.raw.headers,
    })
    if (!result.success) {
      return c.json({ error: "Sin permiso" }, 403)
    }
    await next()
  })
}

/**
 * requireOrgPermission
 *
 * Llama a auth.api.hasPermission (plugin organization) y
 * resuelve la organización desde el param de ruta "orgId"
 * si existe, o desde la org activa de la sesión.
 */
export function requireOrgPermission(
  permissions: RoleAuthorizeRequest<OrganizationStatement>
) {
  return createMiddleware<AppEnv>(async (c, next) => {
    await requireSession(c, next)
    const auth = c.get("auth")
    const orgIdFromRoute = c.req.param("orgId")
    const session = c.get("session")!
    const activeOrgId = (session as { activeOrganizationId?: string | null })
      .activeOrganizationId

    const result = await auth.api.hasPermission({
      body: {
        organizationId: orgIdFromRoute ?? activeOrgId ?? undefined,
        permissions: permissions as Record<string, string[]>,
      },
      headers: c.req.raw.headers,
    })

    if (!result) {
      return c.json({ error: "Sin permiso" }, 403)
    }
    await next()
  })
}

/**
 * Peek helpers — no se usan como middleware, son para casos
 * dentro de un handler donde querés chequear sin cortar el
 * flujo (ej. devolver una UI condicional).
 */
export function platformRoleHas(roles: string[], user: { role?: string }) {
  return !!user.role && roles.includes(user.role)
}

export function platformStatementHas(
  role: string,
  permissions: Record<string, string[]>
) {
  const r = (platformRoles as Record<string, { authorize: (p: unknown) => { success: boolean } }>)[role]
  if (!r) return false
  return r.authorize(permissions).success
}

export function orgStatementHas(
  role: string,
  permissions: Record<string, string[]>
) {
  const r = (organizationRoles as Record<string, { authorize: (p: unknown) => { success: boolean } }>)[role]
  if (!r) return false
  return r.authorize(permissions).success
}
