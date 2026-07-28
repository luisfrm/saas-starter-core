import { Hono } from "hono"
import { createAuth } from "./lib/auth"
import { corsMiddleware } from "./lib/cors"
import { onError } from "./lib/errors"
import { type AppEnv } from "./lib/env"
import { organizationRoutes } from "./routes/organizations.route"
import { adminOrganizationRoutes } from "./routes/admin-organizations.route"

const app = new Hono<AppEnv>()

// CORS con credenciales para que las apps Next (otro origin) puedan
// llamar al API con la cookie de sesión. Lista en lib/cors.ts.
app.use("/api/*", corsMiddleware)

// Una instancia de auth POR REQUEST + carga de sesión. Los guards
// (requireAuth, requirePlatformPermission, requireOrgPermission)
// asumen que `c.var.session` y `c.var.user` ya están cargados acá.
// Evita compartir la conexión a Neon entre requests concurrentes
// dentro del mismo Worker.
app.use("*", async (c, next) => {
  const auth = createAuth(c.env)
  c.set("auth", auth)

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })
  if (session) {
    c.set("session", session.session)
    c.set("user", session.user)
  }

  await next()
})

// Envelope de error único (ver lib/errors.ts)
app.onError(onError)

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
