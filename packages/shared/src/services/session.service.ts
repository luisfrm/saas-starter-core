import type { AuthClientLike } from "../types/auth-client"

/**
 * Service de sesión.
 *
 * Wrappers finos sobre `useSession` / `getSession` de Better Auth.
 * La razón de existir no es agregar lógica — es dar un punto
 * único donde extender cuando:
 *   - agregues telemetría al iniciar sesión
 *   - quieras trackear el método de login (magic link vs password)
 *   - necesites lógica de "session expirando" antes de que Better
 *     Auth la marque como tal
 *
 * El componente no debe importar `authClient.useSession()`
 * directo. Pasa por acá.
 */
export function createSessionService(client: AuthClientLike) {
  return {
    useSession: () => client.useSession(),
    getSession: () => client.getSession(),
  }
}

export type SessionService = ReturnType<typeof createSessionService>
