import type { AxiosInstance } from "axios"
import type {
  CreateOrganizationInput,
  CreateOrganizationResponse,
} from "@repo/shared/dto/organization.dto"

/**
 * Factory del service de organización para el frontend.
 *
 * Recibe el `apiClient` (axios instance) de la app por dependency
 * injection. Esto permite que cada app (public-web, panel, console)
 * tenga su propio cliente HTTP con su `baseURL` y `onRedirect`,
 * y que los services sean funciones puras fáciles de testear
 * con un mock del cliente.
 *
 * @example
 *   // apps/public-web/src/lib/services/organization.service.ts
 *   import { apiClient } from "../api-client"
 *   export const organizationService = createOrganizationService(apiClient)
 *
 *   // en una página:
 *   const { organization } = await organizationService.create(input)
 */
export function createOrganizationService(client: AxiosInstance) {
  return {
    create: async (input: CreateOrganizationInput) => {
      const { data } = await client.post<CreateOrganizationResponse>(
        "/api/admin/organizations",
        input,
      )
      return data
    },
  }
}

export type OrganizationService = ReturnType<typeof createOrganizationService>
