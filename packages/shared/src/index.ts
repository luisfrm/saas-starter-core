export * from "./access-control"

// Contratos HTTP (Zod schemas + tipos) compartidos entre el
// api-worker y los frontends. Cambiar el contrato = cambiar
// un solo archivo; ambos lados se enteran por typecheck.
export * from "./contracts/organization"

// Services compartidos del frontend. Funciones puras que
// reciben el authClient de Better Auth (vía AuthClientLike)
// o un baseUrl (vía ApiClientOptions). Sin estado, sin
// dependencias de framework.
export * from "./services/auth.service"
export * from "./services/session.service"
export * from "./services/organization.service"

// Interfaces mínimas de librerías externas que los services
// esperan. Permiten que las apps con configuraciones distintas
// (public-web, panel, console) le pasen su client al service
// sin que el shared conozca el detalle.
export * from "./types/auth-client"
