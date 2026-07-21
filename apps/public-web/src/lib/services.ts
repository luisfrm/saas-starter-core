import { createAuthService, createSessionService, createOrganizationService } from "@repo/shared"
import { authClient } from "./auth-client"

export const authService = createAuthService(authClient)
export const sessionService = createSessionService(authClient)

export const organizationService = createOrganizationService({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
})
