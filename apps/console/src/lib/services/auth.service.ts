import type { authClient } from "../auth-client"
import { authClient as client } from "../auth-client"

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

function create(client: AuthClient): AuthService {
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

export const authService = create(client)
