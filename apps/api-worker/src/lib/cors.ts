import { cors } from "hono/cors"

/**
 * Orígenes permitidos para llamar al api-worker con credenciales
 * (cookie de sesión de Better Auth).
 *
 * HARDCODEADO a propósito (decisión del proyecto): son los puertos
 * dev de las 3 apps Next. Esta misma lista alimenta dos consumidores:
 *   1. `corsMiddleware` (hono/cors) — responde los preflight OPTIONS
 *      y deja pasar requests cross-origin con `withCredentials`.
 *   2. `trustedOrigins` en Better Auth (lib/auth.ts) — sin esto,
 *      Better Auth rechaza sign-in/sign-up que vengan de un origin
 *      distinto al del propio worker.
 *
 * Si agregas una app nueva (ej. blog) o un dominio de producción,
 * suma su origin acá y redeploy.
 */
export const ALLOWED_ORIGINS = [
  "http://localhost:3000", // public-web
  "http://localhost:3001", // panel
  "http://localhost:3002", // console
] as const

export const corsMiddleware = cors({
  origin: [...ALLOWED_ORIGINS],
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
})
