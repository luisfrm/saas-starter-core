import { Hono } from "hono"
import { requireAuth } from "../middleware/auth"
import { requirePlatformPermission } from "../middleware/guards"
import { createOrganization } from "../services/organization.service"
import { createOrganizationSchema } from "@repo/shared/contracts/organization"
import type { AppEnv } from "../lib/env"

/**
 * Sub-router: rutas de administración de organizaciones.
 *
 * Solo accesible para staff de plataforma con el permiso
 * `organization:create` (o superior). El handler queda
 * delgado: valida input, llama al service, devuelve JSON.
 * Toda la lógica vive en `services/organization.service.ts`.
 */
export const adminOrganizationRoutes = new Hono<AppEnv>().post(
  "/",
  requireAuth,
  requirePlatformPermission({ organization: ["create"] }),
  async (c) => {
    const body = await c.req.json()
    const input = createOrganizationSchema.parse(body)
    const organization = await createOrganization(
      { auth: c.get("auth"), queue: c.env.TASK_QUEUE, headers: c.req.raw.headers },
      input,
    )
    return c.json({ organization })
  },
)
