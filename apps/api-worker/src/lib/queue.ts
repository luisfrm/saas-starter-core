/**
 * Binding de la cola de eventos del api-worker (producer).
 *
 * El CONTRATO de eventos vive en `@repo/shared/queue-events` y es
 * compartido con jobs-worker (consumer). Agregar o cambiar un
 * evento se hace en UN solo archivo — el typecheck avisa en ambos
 * Workers si se desincronizan.
 */
import type { QueueEvent } from "@repo/shared/queue-events"

export type { QueueEvent }

export type TaskQueueBinding = Queue<QueueEvent>
