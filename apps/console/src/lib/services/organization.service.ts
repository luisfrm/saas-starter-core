import type {
  CreateOrganizationInput,
  CreateOrganizationResponse,
} from "@repo/shared/dto/organization.dto"
import { createApiClient } from "../api-client"

const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
})

function create(client: typeof apiClient) {
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

export const organizationService = create(apiClient)
export type OrganizationService = ReturnType<typeof create>
