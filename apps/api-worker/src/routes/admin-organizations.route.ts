import { Hono } from "hono"
import { createOrganization } from "../services/organization.service"
import { withAuth } from "../lib/route-handler"
import { createOrganizationSchema } from "@repo/shared/dto/organization.dto"
import type { AppEnv } from "../lib/env"

/**
 * Sub-router: rutas de administración de organizaciones.
 *
 * Solo accesible para staff de plataforma con el permiso
 * `organization:create`. El handler queda delgado:
 * parsea input, llama al service, devuelve JSON.
 *
 * Capas:
 *   route    → con withAuth() para auth+perms
 *   service  → lógica de negocio (en services/)
 *   repository → acceso a datos (en repositories/)
 */
export const adminOrganizationRoutes = new Hono<AppEnv>().post(
  "/",
  withAuth("organization", "create", { scope: "platform" }),
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
