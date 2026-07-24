import type { CreateOrganizationInput } from "@repo/shared/dto/organization.dto"
import type { TaskQueueBinding } from "../lib/queue"
import type { Auth } from "../lib/auth"
import { createOrganizationRepository } from "../repositories/organization.repository"

export interface CreateOrganizationDeps {
  auth: Auth
  queue: TaskQueueBinding
  headers: Headers
}

/**
 * Crea una organización y dispara el evento de bienvenida.
 *
 * No importa Hono, no importa Drizzle. Recibe dependencias
 * como parámetros para que sea trivial testearla y para
 * que cambiar de framework o de event bus no toque este
 * archivo.
 *
 * Capas:
 *   service   → orquesta (repository + side effects)
 *   repository → acceso a datos (Better Auth en este caso)
 *
 * El service NO llama a Better Auth directo. Va por el
 * repository. Si en el futuro agregás un repository Drizzle
 * propio, solo cambia el repository, no este archivo.
 */
export async function createOrganization(
  deps: CreateOrganizationDeps,
  input: CreateOrganizationInput,
) {
  const organizationRepository = createOrganizationRepository(deps.auth)
  const organization = await organizationRepository.create(
    { name: input.name, slug: input.slug },
    deps.headers,
  )

  await deps.queue.send({
    type: "organization.created",
    organizationId: organization.id,
    organizationName: organization.name,
  })

  return organization
}
