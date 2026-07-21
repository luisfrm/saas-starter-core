import { z } from "zod"

/**
 * Contratos HTTP entre el api-worker y los frontends.
 *
 * Regla: si una ruta custom del api-worker recibe o devuelve datos
 * de negocio (no de Better Auth), el input shape se define acá
 * como Zod schema. El backend valida con `schema.parse()`, el
 * frontend usa `z.infer<typeof schema>` para tipar sus servicios.
 *
 * Cambiar el contrato = cambiar un solo archivo. Frontend y
 * backend se enteran por typecheck.
 */

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre es demasiado largo"),
  slug: z
    .string()
    .min(2, "El slug es demasiado corto")
    .max(60, "El slug es demasiado largo")
    .regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "Solo minúsculas, números y guiones; no puede empezar ni terminar en guión"
    ),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export type CreateOrganizationResponse = {
  organization: {
    id: string
    name: string
    slug: string
    createdAt: Date | string
  }
}
