// Re-exports UNIVERSALES del shared package.
// Solo lo que se puede importar desde CUALQUIER runtime (cliente,
// servidor, Cloudflare Workers) sin arrastrar dependencias de un
// runtime específico. Si necesitás algo del cliente (ofetch, services
// de frontend, AuthClientLike), importá explícitamente:
//
//   import { createOrganizationService } from "@repo/shared/client"
//
// Acá adentro NO va nada que importe ofetch, next, hono, drizzle, etc.

export * from "./access-control"

// DTOs (Zod schemas + tipos inferidos). Compartidos entre api-worker
// y frontends. Cambiar un DTO = cambiar un solo archivo; ambos lados
// se enteran por typecheck.
export * from "./dto/organization.dto"
