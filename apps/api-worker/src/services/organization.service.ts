import type { CreateOrganizationInput } from "@repo/shared/contracts/organization"
import type { TaskQueueBinding } from "../lib/queue"
import type { Auth } from "../lib/auth"

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
 * El "repository" del dominio auth es `auth.api.*` (Better
 * Auth ya gestiona la tabla `organization`). No escribimos
 * un `OrganizationRepository` propio — pelearíamos contra
 * el framework.
 */
export async function createOrganization(
  deps: CreateOrganizationDeps,
  input: CreateOrganizationInput,
) {
  const organization = await deps.auth.api.createOrganization({
    body: { name: input.name, slug: input.slug },
    headers: deps.headers,
  })

  await deps.queue.send({
    type: "organization.created",
    organizationId: organization.id,
    organizationName: organization.name,
  })

  return organization
}
