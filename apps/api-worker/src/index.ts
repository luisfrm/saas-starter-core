import { Hono } from "hono"
import { createAuth, type Auth } from "./lib/auth"
import type { TaskQueueBinding } from "./lib/queue"

type Bindings = {
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  TASK_QUEUE: TaskQueueBinding
}

type Variables = {
  auth: Auth
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Una instancia de auth POR REQUEST. Evita compartir la conexión
// a Neon entre requests concurrentes dentro del mismo Worker.
app.use("*", async (c, next) => {
  const auth = createAuth(c.env)
  c.set("auth", auth)
  await next()
})

// Better Auth maneja TODAS sus rutas internamente:
// /api/auth/sign-in, /api/auth/sign-up, /api/auth/organization/*,
// /api/auth/admin/*, etc. No las escribes tú.
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return c.get("auth").handler(c.req.raw)
})

// Ejemplo de ruta propia, protegida con la sesión de Better Auth
app.get("/api/organizations/me", async (c) => {
  const auth = c.get("auth")
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    return c.json({ error: "No autenticado" }, 401)
  }

  return c.json({ session })
})

// Ejemplo: un platform admin crea una organización nueva.
// (allowUserToCreateOrganization está en false — esta es la única vía)
app.post("/api/admin/organizations", async (c) => {
  const auth = c.get("auth")
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    return c.json({ error: "No autenticado" }, 401)
  }
  // TODO: validar que session.user.role sea "admin" u "owner" de
  // plataforma antes de continuar (auth.api.userHasPermission).

  const { name, slug } = await c.req.json()

  const organization = await auth.api.createOrganization({
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
})

export default app
