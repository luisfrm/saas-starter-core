import { Hono } from "hono"
import { requireAuth } from "../lib/route-handler"
import type { AppEnv } from "../lib/env"

/**
 * Sub-router: rutas de organización accesibles por usuarios
 * con sesión (cualquier rol: plataforma u organización).
 *
 * El único path que existe hoy es `/me` (devuelve sesión +
 * usuario actual). Las rutas con permisos más finos viven
 * en `admin-organizations.route.ts` y `org-*.route.ts` (a
 * crear al clonar el starter para un dominio real — usar
 * `requireOrgPermission(module, action)` ahí).
 */
export const organizationRoutes = new Hono<AppEnv>().get(
  "/me",
  requireAuth(),
  (c) => c.json({ session: c.get("session"), user: c.get("user") }),
)
