import { createAuthService, createSessionService } from "@repo/shared"
import { authClient } from "./auth-client"

export const authService = createAuthService(authClient)
export const sessionService = createSessionService(authClient)
