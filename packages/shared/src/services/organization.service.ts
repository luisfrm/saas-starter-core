import type {
  CreateOrganizationInput,
  CreateOrganizationResponse,
} from "../contracts/organization"

/**
 * Service de organización para el frontend.
 *
 * Llama a las rutas custom del api-worker (no a Better Auth).
 * Usa el contrato Zod como única fuente del tipo de input/output
 * — si el backend cambia, rompemos acá en typecheck, no en
 * runtime.
 *
 * Para que arranque solo en un entorno (sin variables de env
 * faltantes, sin CORS raro), `baseUrl` se inyecta desde la app
 * vía `NEXT_PUBLIC_API_URL`.
 */

export interface ApiClientOptions {
  baseUrl: string
  /** Devuelve headers extra (ej. cookie de sesión, csrf, etc.). */
  getHeaders?: () => HeadersInit
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function apiFetch<T>(
  opts: ApiClientOptions,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${opts.baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...opts.getHeaders?.(),
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(
      body?.error ?? `Request failed: ${response.status}`,
      response.status,
    )
  }

  return (await response.json()) as T
}

export function createOrganizationService(opts: ApiClientOptions) {
  return {
    create: (input: CreateOrganizationInput) =>
      apiFetch<CreateOrganizationResponse>(opts, "/api/admin/organizations", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  }
}

export type OrganizationService = ReturnType<typeof createOrganizationService>
