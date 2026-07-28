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
   * expirada o cookie inválida). Default: "/login".
   */
  redirectOnAuthError?: string
  /**
   * Llamado por el interceptor de respuesta cuando llega un 401.
   * Default: navegación full-page con `window.location.href`
   * (la cookie de sesión ya quedó limpia y una recarga completa
   * garantiza que no quede estado stale de React Query / stores).
   * Pasalo solo si necesitás otra estrategia (ej. router de Next
   * sin recarga).
   */
  onRedirect?: (path: string) => void
}

/**
 * Crea un cliente HTTP basado en axios para una app Next.js.
 *
 * Características:
 * - `withCredentials: true` para enviar la cookie de sesión
 *   HTTP-Only de Better Auth en cada request automáticamente.
 * - Interceptor de respuesta: ante un 401 (sesión expirada o
 *   inválida) llama a `onRedirect` con el path configurado
 *   (default "/login"). Centraliza la lógica de "sesión vencida"
 *   en un solo lugar. Los 404 NO redirigen: un recurso no
 *   encontrado es un caso de negocio, no de sesión.
 * - Errores HTTP se normalizan a `ApiError` con `statusCode` y
 *   `data` accesibles.
 *
 * Cada app (public-web, panel, console) crea su propio `apiClient`
 * con su `baseURL` y (opcionalmente) su `onRedirect` particular.
 * No hay un cliente HTTP compartido en `@repo/shared` a propósito:
 * cada app puede tener headers, redirects y manejo de errores
 * distintos sin acoplarse.
 */
export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const redirectPath = options.redirectOnAuthError ?? "/login"
  const onRedirect =
    options.onRedirect ??
    ((path: string) => {
      if (typeof window !== "undefined") window.location.href = path
    })

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

      // 401: sesión expirada o cookie inválida. Cualquier otro
      // status (incluido 404) se propaga como ApiError para que
      // el service/página decida — no es problema de sesión.
      if (status === 401) {
        onRedirect(redirectPath)
      }

      return Promise.reject(new ApiError(message, status ?? 0, data))
    },
  )

  return instance
}
