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
 * `useSession` está tipado como `any` a propósito: Better Auth
 * expone un `Atom` (nanostore) o un hook de React según el entry
 * point (`better-auth/client` vs `better-auth/client/react`).
 * Forzar un tipo concreto rompe typecheck en uno de los dos.
 */
export function createSessionService(client: SessionClient) {
  // `as unknown as` para que TS no se queje de que `client.useSession`
  // es un `Atom` (nanostore) y no un callable cuando se importa
  // desde `better-auth/client` en vez de `better-auth/client/react`.
  const useSession = client.useSession as unknown as () => any
  return {
    useSession,
    getSession: () => client.getSession(),
  }
}

export type SessionService = ReturnType<typeof createSessionService>
