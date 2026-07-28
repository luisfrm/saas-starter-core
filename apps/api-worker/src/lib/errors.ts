import type { ErrorHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { APIError } from "better-auth/api"
import { ZodError } from "zod"
import type { AppEnv } from "./env"

/**
 * Manejador global de errores del api-worker.
 *
 * Envelope de error único para todo el API:
 *   { error: string, details?: unknown }
 *
 * El `apiClient` del frontend ya normaliza errores HTTP a `ApiError`
 * con `statusCode` y `data` accesibles, así que el shape de `data`
 * es siempre este envelope.
 *
 * Mapeo:
 *   - ZodError (input inválido en una ruta) → 400 + issues de Zod
 *   - APIError de Better Auth (dominio auth) → su statusCode real
 *   - HTTPException de Hono (throw manual en handlers) → su status
 *   - Cualquier otra excepción → 500 logueado, sin filtrar internals
 */
const KNOWN_STATUS_CODES = new Set([
  400, 401, 403, 404, 405, 409, 410, 422, 429, 500, 502, 503,
])

function toStatusCode(n: number): ContentfulStatusCode {
  return (KNOWN_STATUS_CODES.has(n) ? n : 500) as ContentfulStatusCode
}

export const onError: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      { error: "Validación fallida", details: err.issues },
      400,
    )
  }

  if (err instanceof APIError) {
    return c.json(
      { error: err.message, details: err.body },
      toStatusCode(err.statusCode),
    )
  }

  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }

  console.error("Error no manejado:", err)
  return c.json({ error: "Error interno" }, 500)
}
