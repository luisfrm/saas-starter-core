import { createApiClient } from "../api-client"

export const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
})

export { authService } from "./auth.service"
export { organizationService } from "./organization.service"
export { sessionService } from "./session.service"
