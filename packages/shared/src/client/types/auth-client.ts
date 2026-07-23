/**
 * Interfaz mínima de un Better Auth client que los services
 * compartidos esperan. Existe para que el shared no tenga que
 * importar `better-auth` y para que las 3 apps (con plugins
 * distintos) puedan pasarle su propio client — por structural
 * typing el client real satisface esta forma sin necesidad de
 * match exacto.
 *
 * El subconjunto es el que usan los componentes de `@repo/ui`:
 * login (email/social), signup (email), forgot password, sesión.
 * Si necesitás un método de Better Auth que no está acá,
 * agregalo — pero pensá dos veces si no conviene un service
 * específico.
 */

export interface AuthClientLike {
  signIn: {
    email: (args: {
      email: string
      password: string
      rememberMe?: boolean
    }) => Promise<{ data?: unknown; error: { message?: string } | null }>
    social: (args: {
      provider: "google" | "github"
      callbackURL: string
    }) => Promise<{ data?: unknown; error: { message?: string } | null }>
  }
  signUp: {
    email: (args: {
      email: string
      password: string
      name: string
      // El backend ignora cualquier campo extra que Better Auth
      // no reconozca; firstName/lastName son del frontend.
      [key: string]: unknown
    }) => Promise<{ data?: unknown; error: { message?: string } | null }>
  }
  requestPasswordReset: (args: {
    email: string
    redirectTo: string
  }) => Promise<{ data?: unknown; error: { message?: string } | null }>
  getSession: () => Promise<{ data?: unknown; error?: unknown } | null>
  // Better Auth expone `useSession` como un nanostore `Atom` (vanilla
  // client) o como hook de React (`better-auth/client/react`). El
  // service lo pasa sin transformar, así que tipamos el valor como
  // `any` y dejamos que el consumidor use lo que reciba.
  useSession: any
}
