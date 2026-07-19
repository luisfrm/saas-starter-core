/**
 * Tipos de eventos publicados a Cloudflare Queues. Este archivo es
 * el CONTRATO entre api-worker (productor) y jobs-worker (consumer)
 * — si agregas un evento nuevo aquí, agrega su handler correspondiente
 * en apps/jobs-worker/src/index.ts.
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
      type: "organization.created"
      organizationId: string
      organizationName: string
    }

export type TaskQueueBinding = Queue<QueueEvent>
