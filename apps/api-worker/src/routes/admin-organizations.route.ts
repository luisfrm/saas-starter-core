import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { createOrganization } from "../services/organization.service"
import { requirePlatformPermission } from "../lib/route-handler"
import { createOrganizationSchema } from "@repo/shared/dto/organization.dto"
import type { AppEnv } from "../lib/env"

/**
 * Sub-router: rutas de administración de organizaciones.
 *
 * Solo accesible para staff de plataforma con el permiso
 * `organization:create`. El handler queda delgado:
 * recibe input ya validado, llama al service, devuelve JSON.
 *
 * Capas:
 *   route    → con requirePlatformPermission() para auth+perms
 *   service  → lógica de negocio (en services/)
 *   repository → acceso a datos (en repositories/)
 */
export const adminOrganizationRoutes = new Hono<AppEnv>().post(
  "/",
  requirePlatformPermission("organization", "create"),
  // Input inválido → el hook relanza el ZodError y el onError
  // global lo mapea a 400 con el envelope único (lib/errors.ts).
  zValidator("json", createOrganizationSchema, (result) => {
    if (!result.success) throw result.error
  }),
  async (c) => {
    const input = c.req.valid("json")
    const organization = await createOrganization(
      { auth: c.get("auth"), queue: c.env.TASK_QUEUE, headers: c.req.raw.headers },
      input,
    )
    return c.json({ organization })
  },
)
