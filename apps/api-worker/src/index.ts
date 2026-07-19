import { Hono } from "hono"
import { createAuth } from "./lib/auth"
import { type AppEnv } from "./lib/env"
import { requireAuth } from "./middleware/auth"
import {
  requirePlatformPermission,
} from "./middleware/guards"

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

// Sesión del usuario logueado (cualquier rol, plataforma u organización).
app.get("/api/organizations/me", requireAuth, (c) => {
  return c.json({ session: c.get("session"), user: c.get("user") })
})

// Un platform admin crea una organización nueva.
// (allowUserToCreateOrganization está en false — esta es la única vía)
// Guarda: solo platform owner/admin pueden crear organizaciones.
app.post(
  "/api/admin/organizations",
  requireAuth,
  requirePlatformPermission({ organization: ["create"] }),
  async (c) => {
    const { name, slug } = await c.req.json()
    const organization = await c.get("auth").api.createOrganization({
      body: { name, slug },
      headers: c.req.raw.headers,
    })

    // Avisa al jobs-worker para que mande el email de bienvenida,
    // sin bloquear esta respuesta.
    await c.env.TASK_QUEUE.send({
      type: "organization.created",
      organizationId: organization.id,
      organizationName: organization.name,
    })

    return c.json({ organization })
  }
)

// Ejemplo de uso de requirePlatformRole: una ruta hipotética que
// solo el platform owner puede ver (métricas internas, etc).
// app.get("/api/admin/internal/metrics", requireAuth, requirePlatformRole("owner"), handler)

export default app
