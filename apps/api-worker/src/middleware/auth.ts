import { createMiddleware } from "hono/factory"
import type { AppEnv } from "../lib/env"

/**
 * requireAuth
 *
 * Carga la sesión de Better Auth y la deja en c.var.session / c.var.user.
 * Responde 401 si no hay sesión válida.
 *
 * SIEMPRE debe correr antes de cualquier guard de permiso, porque
 * los guards leen c.var.session / c.var.user.
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const auth = c.get("auth")
  const result = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!result) {
    return c.json({ error: "No autenticado" }, 401)
  }

  c.set("session", result.session as AppEnv["Variables"]["session"])
  c.set("user", result.user as AppEnv["Variables"]["user"])

  await next()
})
