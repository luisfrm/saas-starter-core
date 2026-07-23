import { createHttpClient, type HttpClientOptions } from "../lib/http"
import type {
  CreateOrganizationInput,
  CreateOrganizationResponse,
} from "../../dto/organization.dto"

/**
 * Service de organización para el frontend.
 *
 * Llama a las rutas custom del api-worker (NO a Better Auth). Usa
 * el DTO Zod como única fuente del tipo de input/output — si el
 * backend cambia, rompemos acá en typecheck, no en runtime.
 *
 * Internamente usa `createHttpClient` (ofetch). Si necesitás un
 * servicio que comparta headers o un baseURL distinto, llamalo con
 * otras opciones desde `src/lib/services.ts` de la app.
 *
 * `baseURL` se inyecta desde la app vía `NEXT_PUBLIC_API_URL`.
 *
 * @example
 *   const organizationService = createOrganizationService({
 *     baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
 *   })
 *   const { organization } = await organizationService.create(input)
 */
export function createOrganizationService(options: HttpClientOptions) {
  const http = createHttpClient(options)

  return {
    create: async (input: CreateOrganizationInput) => {
      return http<CreateOrganizationResponse>("/api/admin/organizations", {
        method: "POST",
        body: input,
      })
    },
  }
}

export type OrganizationService = ReturnType<typeof createOrganizationService>
