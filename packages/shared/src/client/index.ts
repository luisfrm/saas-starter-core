// Re-exports del subpath @repo/shared/client.
// Lo que vive acá está pensado para correr en el NAVEGADOR
// (o en cualquier runtime que soporte `fetch`). Si importás
// desde un componente de Next.js, el bundle de ofetch termina
// en el cliente — está OK.
//
// NO importes desde `@repo/shared` (raíz) si necesitás un service
// de cliente, porque el barrel raíz solo re-exporta cosas
// universales (DTOs, access-control) para no contaminar bundles
// de server con dependencias de cliente.

export * from "./lib/http"

export * from "./services/auth.service"
export * from "./services/session.service"
export * from "./services/organization.service"

export * from "./types/auth-client"
