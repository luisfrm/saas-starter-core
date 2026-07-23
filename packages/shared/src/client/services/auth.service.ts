import type { AuthClientLike } from "../types/auth-client"

/**
 * Service de autenticación.
 *
 * Devuelve un objeto con la forma exacta que los componentes de
 * `@repo/ui` esperan (LoginForm, SignupForm, ForgotPasswordForm),
 * así que la página puede pasarlo directo como prop:
 *
 *   <LoginForm authClient={authService} redirectUrl="..." />
 *
 * Por qué no importamos el authClient de Better Auth directo:
 * porque cada app tiene plugins distintos (public-web, panel,
 * console) y el shared no debería conocer la configuración
 * específica. Recibe cualquier cosa que satisfaga `AuthClientLike`.
 *
 * El método de signup se llama con `name` (lo que Better Auth
 * espera). El frontend compone firstName + " " + lastName → name
 * antes de invocar este service. firstName/lastName son del UI,
 * no del backend.
 */
export function createAuthService(client: AuthClientLike) {
  return {
    signIn: {
      email: async (args: {
        email: string
        password: string
        rememberMe?: boolean
      }) => {
        const { error } = await client.signIn.email(args)
        return { error: error ? { message: error.message ?? "Error" } : null }
      },
      social: async (args: {
        provider: "google" | "github"
        callbackURL: string
      }) => {
        const { error } = await client.signIn.social(args)
        return { error: error ? { message: error.message ?? "Error" } : null }
      },
    },
    signUp: {
      email: async (args: {
        email: string
        password: string
        name: string
      }) => {
        const { error } = await client.signUp.email(args)
        return { error: error ? { message: error.message ?? "Error" } : null }
      },
    },
    requestPasswordReset: async (args: {
      email: string
      redirectTo: string
    }) => {
      const { error } = await client.requestPasswordReset(args)
      return { error: error ? { message: error.message ?? "Error" } : null }
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>
