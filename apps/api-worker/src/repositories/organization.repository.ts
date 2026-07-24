import type { Auth } from "../lib/auth"

/**
 * Repository de organización.
 *
 * En este starter, `auth.api.createOrganization` ES el data
 * access layer: Better Auth gestiona la tabla `organization`
 * con sus hooks, validaciones y la columna `slug` unique. Crear
 * un repository con Drizzle que inserte directo en la tabla de
 * Better Auth pelearía contra el framework y duplicaría lógica
 * (ej. validación de slug, creación del owner como member, etc.).
 *
 * Para dominios del proyecto clonado (pacientes, órdenes,
 * productos...) que NO estén gestionados por Better Auth, este
 * patrón se repite con Drizzle — y TODAS las queries se filtran
 * por `organizationId` para garantizar el aislamiento
 * multi-tenant.
 *
 * Regla multi-tenancy: cualquier query a una tabla propia del
 * proyecto clonado debe incluir `WHERE organizationId = ?` con
 * el `organizationId` del contexto, nunca `SELECT * FROM ...`
 * sin filtro.
 */
export function createOrganizationRepository(auth: Auth) {
  return {
    create: (args: { name: string; slug: string }, headers: Headers) =>
      auth.api.createOrganization({ body: args, headers }),
  }
}

export type OrganizationRepository = ReturnType<typeof createOrganizationRepository>
