import { ofetch } from "ofetch"

/**
 * Normalized error wrapper for any HTTP failure from api-worker.
 * Preserves statusCode and raw response data for downstream services.
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
  /** Base URL for api-worker. Read from NEXT_PUBLIC_API_URL. */
  baseURL: string
  /** Redirect path when 401 auth error occurs. Default: "/login". */
  redirectOnAuthError?: string
  /** Custom handler for 401 redirect. Default: full page navigation via window.location.href. */
  onRedirect?: (path: string) => void
}

const isServer = typeof window === "undefined"

/**
 * Creates an idiomatic ofetch-based HTTP client instance for Next.js applications.
 * Features:
 * - Cookie forwarding for SSR (next/headers) and credentials: "include" for CSR
 * - Automatic 401 redirect handler
 * - Normalized ApiError exceptions
 */
export function apiClient(options: ApiClientOptions) {
  const redirectPath = options.redirectOnAuthError ?? "/login"
  const onRedirect =
    options.onRedirect ??
    ((path: string) => {
      if (typeof window !== "undefined") window.location.href = path
    })

  return ofetch.create({
    baseURL: options.baseURL,
    retry: 1,
    timeout: 30_000,

    async onRequest({ options: reqOptions }) {
      if (isServer) {
        const { cookies } = await import("next/headers")
        const cookieStore = await cookies()
        reqOptions.headers.set("cookie", cookieStore.toString())
      } else {
        reqOptions.credentials = "include"
      }
    },

    onResponseError({ response }) {
      const status = response?.status ?? 0
      const data = response?._data as { error?: string; message?: string } | undefined
      const message =
        data?.error ?? data?.message ?? response?.statusText ?? "Request failed"

      if (status === 401) {
        onRedirect(redirectPath)
      }

      throw new ApiError(message, status, data)
    },
  })
}

/**
 * Pre-configured singleton API client instance for console application.
 */
export const api = apiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
})

export type ApiClient = typeof api


