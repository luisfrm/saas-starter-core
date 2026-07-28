import type { authClient } from "../auth-client"

type SessionClient = typeof authClient

/**
 * Factory del service de sesión de la app.
 *
 * Wrapper fino sobre `useSession` / `getSession` de Better Auth.
 * La razón de existir es dar un único punto donde extender
 * (telemetría de sesiones, manejo de "sesión por expirar", etc.)
 * sin que las páginas importen el client de Better Auth directo.
 *
 * El client se crea desde `better-auth/react` (ver auth-client.ts),
 * así que `useSession` es un hook de React real y tipado — no un
 * nanostore Atom como expone `better-auth/client`.
 */
export function createSessionService(client: SessionClient) {
  return {
    useSession: client.useSession,
    getSession: () => client.getSession(),
  }
}

export type SessionService = ReturnType<typeof createSessionService>
