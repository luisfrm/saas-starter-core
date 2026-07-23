import { ofetch, type FetchOptions } from "ofetch"

/**
 * Error uniforme para cualquier falla HTTP del api-worker.
 *
 * Lanzado por el `onResponseError` de `createHttpClient`. Cualquier
 * service que use el cliente HTTP lo propaga hacia la página, que
 * lo muestra vía toast de Sonner.
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

export interface HttpClientOptions {
  baseURL: string
  /** Devuelve headers extra (ej. cookies de sesión, csrf, etc.). */
  getHeaders?: () => Record<string, string>
  /** Cantidad de reintentos automáticos. Default: 1. */
  retry?: number
  /** Timeout en ms. Default: 10000. */
  timeout?: number
}

/**
 * Cliente HTTP basado en ofetch. ofetch envuelve `fetch` nativo —
 * funciona en navegador, Node y Cloudflare Workers sin polyfills.
 *
 * Centralizar acá el manejo de errores y los headers base permite
 * que cada service (auth, organization, billing, ...) se enfoque
 * solo en su endpoint y payload, sin repetir boilerplate.
 *
 * @example
 *   const http = createHttpClient({ baseURL: "https://api.example.com" })
 *   const org = await http<CreateOrganizationResponse>("/api/admin/organizations", {
 *     method: "POST",
 *     body: input,
 *   })
 */
export function createHttpClient(options: HttpClientOptions) {
  return ofetch.create({
    baseURL: options.baseURL,
    retry: options.retry ?? 1,
    timeout: options.timeout ?? 10000,
    headers: {
      "content-type": "application/json",
    },
    onRequest: ({ options: reqOptions }) => {
      const extra = options.getHeaders?.() ?? {}
      // ofetch expone `reqOptions.headers` como `Headers` (web platform).
      // Usamos `.set()` en lugar de reasignar para mantener la referencia
      // original que ofetch pasa a `fetch`.
      for (const [key, value] of Object.entries(extra)) {
        reqOptions.headers.set(key, value)
      }
    },
    onResponseError: ({ response }) => {
      const statusCode = response?.status ?? 0
      const data = response?._data
      const message =
        data?.error ?? data?.message ?? `Request failed: ${statusCode}`
      throw new ApiError(message, statusCode, data)
    },
  })
}

export type HttpClient = ReturnType<typeof createHttpClient>
