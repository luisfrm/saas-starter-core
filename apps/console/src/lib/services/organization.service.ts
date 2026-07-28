import type { AxiosInstance } from "axios"
import type {
  CreateOrganizationInput,
  CreateOrganizationResponse,
} from "@repo/shared/dto/organization.dto"

/**
 * Factory del service de organización para el frontend.
 *
 * Recibe el `apiClient` (axios instance) de la app por dependency
 * injection. Esto permite que cada app tenga su propio cliente HTTP
 * con su `baseURL` y `onRedirect`, y que los services sean funciones
 * puras fáciles de testear con un mock del cliente.
 *
 * SOLO vive en console: `POST /api/admin/organizations` es una ruta
 * de PLATAFORMA (requiere el permiso `organization:create` del rol
 * de plataforma del usuario). Un miembro de organización (panel) o
 * un cliente final (public-web) recibiría 403 siempre.
 *
 * @example
 *   // apps/console/src/lib/services/index.ts
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
