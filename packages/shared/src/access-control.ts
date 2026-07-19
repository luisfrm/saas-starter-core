import { createAccessControl } from "better-auth/plugins/access"

/**
 * ============================================================
 * PLATFORM-LEVEL ACCESS CONTROL  (plugin `admin` de Better Auth)
 * ============================================================
 * Roles para TU equipo interno (el que administra la plataforma
 * SaaS en sí). NO están atados a ninguna organización — un
 * usuario o es staff de plataforma, o no lo es, punto.
 *
 * Fijo en código, igual para todas las instalaciones. Ajusta
 * este bloque cuando clones el starter para un proyecto nuevo.
 * ============================================================
 */
const platformStatement = {
  user: ["create", "list", "ban", "impersonate", "delete", "set-role"],
  organization: ["create", "approve", "suspend", "delete"],
} as const

export type PlatformStatement = typeof platformStatement

export const platformAc = createAccessControl(platformStatement)

export const platformRoles = {
  // Puede ver/ayudar, pero no romper nada (soporte de primer nivel)
  support: platformAc.newRole({
    user: ["list"],
    organization: [],
  }),
  // Operación diaria de la plataforma: crear/aprobar/suspender
  // organizaciones, gestionar usuarios reportados
  admin: platformAc.newRole({
    user: ["list", "ban", "set-role"],
    organization: ["create", "approve", "suspend"],
  }),
  // Control total (fundador / equipo core)
  owner: platformAc.newRole({
    user: ["create", "list", "ban", "impersonate", "delete", "set-role"],
    organization: ["create", "approve", "suspend", "delete"],
  }),
}

export type PlatformRole = keyof typeof platformRoles

/**
 * ============================================================
 * ORGANIZATION-LEVEL ACCESS CONTROL  (plugin `organization`)
 * ============================================================
 * Roles para el equipo de CADA organización cliente. Fijos e
 * IGUALES para todas las organizaciones del proyecto — no hay
 * personalización por organización individual (decisión ya
 * tomada). Al clonar el starter para un dominio específico
 * (ej: veterinaria, marketplace de vehículos), edita los
 * recursos/permisos de este bloque — nunca la base de datos.
 *
 * "content" y "billing" son ejemplos genéricos. Agrega los
 * recursos reales del dominio del proyecto clonado (ej:
 * "orders", "patients", "appointments"...).
 * ============================================================
 */
const organizationStatement = {
  content: ["publish", "delete"],
  billing: ["manage"],
  member: ["invite", "remove", "update-role"],
} as const

export type OrganizationStatement = typeof organizationStatement

export const organizationAc = createAccessControl(organizationStatement)

export const organizationRoles = {
  member: organizationAc.newRole({
    content: [],
    billing: [],
    member: [],
  }),
  manager: organizationAc.newRole({
    content: ["publish", "delete"],
    billing: [],
    member: [],
  }),
  admin: organizationAc.newRole({
    content: ["publish", "delete"],
    billing: [],
    member: ["invite", "remove", "update-role"],
  }),
  owner: organizationAc.newRole({
    content: ["publish", "delete"],
    billing: ["manage"],
    member: ["invite", "remove", "update-role"],
  }),
}

export type OrganizationRole = keyof typeof organizationRoles

/**
 * NOTA: Better Auth también exporta statements/roles por defecto
 * para ambos plugins (ej. owner/admin/member ya definidos) que
 * puedes importar y fusionar con `...` en vez de redefinir todo
 * desde cero. El nombre exacto del import puede variar entre
 * versiones — revisa la sección "Access Control" de la doc de
 * cada plugin antes de asumirlo. Aquí se definieron completos
 * a propósito, para no depender de una ruta de import que pueda
 * cambiar.
 */
