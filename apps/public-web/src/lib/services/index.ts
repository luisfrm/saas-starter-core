// Wiring point de los services del frontend para public-web.
//
// Cada app Next.js (public-web, panel, console) tiene su propio
// archivo `services/index.ts` que:
//   1. Crea su `apiClient` (axios) con `baseURL` y `onRedirect`.
//   2. Crea su `authClient` (Better Auth) con los plugins que
//      correspondan a esta app (sin AC, con org AC, con admin AC).
//   3. Instancia y exporta los services ya construidos, listos
//      para que las páginas los consuman directo.
//
// Los DTOs y permisos viven en `@repo/shared`. Los types/services
// de Better Auth no se comparten entre apps porque cada una tiene
// un client con plugins distintos.

import { authClient } from "../auth-client"
import { createApiClient } from "../api-client"
import { createAuthService } from "./auth.service"
import { createSessionService } from "./session.service"

export const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
})

export const authService = createAuthService(authClient)
export const sessionService = createSessionService(authClient)
