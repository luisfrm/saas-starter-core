/**
 * Contrato de eventos de Cloudflare Queues, compartido entre
 * api-worker (producer) y jobs-worker (consumer).
 *
 * ÚNICA fuente de verdad: si agregas un evento nuevo aquí, agrega
 * su handler correspondiente en apps/jobs-worker/src/index.ts.
 * El typecheck avisa en ambos lados si se desincronizan.
 *
 * Genérico a propósito. Al clonar el starter para un dominio real,
 * agrega los eventos que necesites (ej: "order.created", "invoice.paid").
 */
export type QueueEvent =
  | {
      type: "user.welcome_email"
      userId: string
      email: string
      name: string | null
    }
  | {
      type: "user.password_reset"
      email: string
      name: string | null
      /** URL completa de reseteo generada por Better Auth (con token). */
      url: string
    }
  | {
      type: "organization.created"
      organizationId: string
      organizationName: string
    }
