import { Hono } from "hono"
import { createAuth } from "./lib/auth"
import { type AppEnv } from "./lib/env"
import { organizationRoutes } from "./routes/organizations.route"
import { adminOrganizationRoutes } from "./routes/admin-organizations.route"

const app = new Hono<AppEnv>()

// Una instancia de auth POR REQUEST. Evita compartir la conexión
// a Neon entre requests concurrentes dentro del mismo Worker.
app.use("*", async (c, next) => {
  c.set("auth", createAuth(c.env))
  await next()
})

// Healthcheck
app.get("/healthz", (c) => c.json({ ok: true }))

// Better Auth maneja TODAS sus rutas internamente:
// /api/auth/sign-in, /api/auth/sign-up, /api/auth/organization/*,
// /api/auth/admin/*, etc. No las escribes tú.
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return c.get("auth").handler(c.req.raw)
})

// Rutas custom del api-worker. Los sub-routers encapsulan
// sus propios guards (requireAuth, requirePlatformPermission, ...).
// Para agregar una ruta nueva: crear el archivo en routes/ y
// montarla acá con `app.route()`.
app.route("/api/organizations", organizationRoutes)
app.route("/api/admin/organizations", adminOrganizationRoutes)

export default app
