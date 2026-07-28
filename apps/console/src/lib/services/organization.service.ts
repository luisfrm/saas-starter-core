import type {
  CreateOrganizationInput,
  CreateOrganizationResponse,
} from "@repo/shared/dto/organization.dto"
import { api } from "../api-client"

/**
 * Service to manage organization endpoints via admin API.
 */
export const organizationService = {
  /**
   * Creates a new organization in the platform via admin API.
   */
  create: async (input: CreateOrganizationInput): Promise<CreateOrganizationResponse> => {
    return await api<CreateOrganizationResponse>("/api/admin/organizations", {
      method: "POST",
      body: input,
    })
  },
}

