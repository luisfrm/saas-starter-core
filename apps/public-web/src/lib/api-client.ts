import axios, { type AxiosError, type AxiosInstance } from "axios"

/**
 * Error normalizado para cualquier falla HTTP del api-worker.
 * Conserva el `statusCode` y el cuerpo crudo de la respuesta para
 * que los services puedan mostrar mensajes específicos o hacer
 * fallbacks según el código.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly data?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export interface ApiClientOptions {
  /** URL base del api-worker. Leída de NEXT_PUBLIC_API_URL. */
  baseURL: string
  /**
   * Path al que redirigir cuando el backend devuelve 401 (sesión
   * expirada o cookie inválida) o 404 sobre un endpoint que
   * requiere organización activa. Default: "/login".
   */
  redirectOnAuthError?: string
  /**
   * Llamado por el interceptor de respuesta cuando detecta un
   * error que amerita redirección. Permite que cada app decida
   * si usa `next/navigation`, `useRouter` o un store global.
   */
  onRedirect?: (path: string) => void
}

/**
 * Crea un cliente HTTP basado en axios para una app Next.js.
 *
 * Características:
 * - `withCredentials: true` para enviar la cookie de sesión
 *   HTTP-Only de Better Auth en cada request automáticamente.
 * - Interceptor de respuesta: si llega 401 o 404 de organización
 *   no encontrada, llama a `onRedirect` con el path configurado
 *   (default "/login"). Esto centraliza la lógica de "sesión
 *   vencida" o "sin org activa" en un solo lugar.
 * - Errores HTTP se normalizan a `ApiError` con `statusCode` y
 *   `data` accesibles.
 *
 * Cada app (public-web, panel, console) crea su propio `apiClient`
 * con su `baseURL` y (opcionalmente) su `onRedirect` particular.
 * No hay un cliente HTTP compartido en `@repo/shared` a propósito:
 * cada app puede tener headers, redirects y manejo de errores
 * distintos sin acoplarse.
 *
 * @example
 *   // apps/panel/src/lib/api-client.ts
 *   import { useRouter } from "next/navigation"
 *   const router = useRouter()
 *   export const apiClient = createApiClient({
 *     baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
 *     onRedirect: (path) => router.push(path),
 *   })
 */
export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const redirectPath = options.redirectOnAuthError ?? "/login"
  const instance = axios.create({
    baseURL: options.baseURL,
    withCredentials: true,
    headers: { "content-type": "application/json" },
  })

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error?: string; message?: string }>) => {
      const status = error.response?.status
      const data = error.response?.data
      const message =
        data?.error ?? data?.message ?? error.message ?? "Request failed"

      // 401: sesión expirada o inválida. 404 sobre un endpoint que
      // típicamente requiere organización activa puede indicar que
      // el usuario pertenece a varias orgs pero no hay `activeOrg`
      // seteada todavía. Redirigimos a login para que el OrgSelector
      // (pendiente) o el flujo normal tome el control.
      if (status === 401 || status === 404) {
        options.onRedirect?.(redirectPath)
      }

      return Promise.reject(new ApiError(message, status ?? 0, data))
    },
  )

  return instance
}
