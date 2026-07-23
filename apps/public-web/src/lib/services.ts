import {
  createAuthService,
  createSessionService,
  createOrganizationService,
} from "@repo/shared/client"
import { authClient } from "./auth-client"

export const authService = createAuthService(authClient)
export const sessionService = createSessionService(authClient)

export const organizationService = createOrganizationService({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
})
