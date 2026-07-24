import type { authClient } from "../auth-client"

/**
 * Tipos del Better Auth client que esta app inyecta. El service
 * no conoce los plugins específicos de cada app (public-web, panel,
 * console) — solo el subconjunto común que usan los componentes
 * de `@repo/ui`.
 */
type AuthClient = typeof authClient

export type AuthServiceError = { message: string } | null

export interface AuthService {
  signIn: {
    email: (args: {
      email: string
      password: string
      rememberMe?: boolean
    }) => Promise<{ error: AuthServiceError }>
    social: (args: {
      provider: "google" | "github"
      callbackURL: string
    }) => Promise<{ error: AuthServiceError }>
  }
  signUp: {
    email: (args: {
      email: string
      password: string
      name: string
    }) => Promise<{ error: AuthServiceError }>
  }
  requestPasswordReset: (args: {
    email: string
    redirectTo: string
  }) => Promise<{ error: AuthServiceError }>
}

/**
 * Factory del service de autenticación de la app.
 *
 * Este service NO usa axios — Better Auth expone su propio
 * client (que ya está configurado con los plugins específicos
 * de cada app) y maneja las rutas `/api/auth/*` internamente.
 * La razón de existir es:
 *   1. Normalizar `{ data, error }` de Better Auth a la forma
 *      `{ error: { message } | null }` que esperan los componentes.
 *   2. Dar un punto único donde extender (telemetría, lockout
 *      en login, reintentos, etc.) sin tocar las páginas.
 */
export function createAuthService(client: AuthClient): AuthService {
  return {
    signIn: {
      email: async (args) => {
        const { error } = await client.signIn.email(args)
        return { error: error ? { message: error.message ?? "Error" } : null }
      },
      social: async (args) => {
        const { error } = await client.signIn.social(args)
        return { error: error ? { message: error.message ?? "Error" } : null }
      },
    },
    signUp: {
      email: async (args) => {
        const { error } = await client.signUp.email(args)
        return { error: error ? { message: error.message ?? "Error" } : null }
      },
    },
    requestPasswordReset: async (args) => {
      const { error } = await client.requestPasswordReset(args)
      return { error: error ? { message: error.message ?? "Error" } : null }
    },
  }
}
