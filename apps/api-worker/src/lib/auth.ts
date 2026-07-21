import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization, admin as adminPlugin } from "better-auth/plugins"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "@repo/db/schema"
import {
  platformAc,
  platformRoles,
  organizationAc,
  organizationRoles,
} from "@repo/shared/access-control"

type Env = {
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

/**
 * IMPORTANTE: esta función se llama UNA VEZ POR REQUEST, nunca en
 * el scope global del Worker. Los bindings/env vars de Cloudflare
 * solo existen dentro del ciclo de vida de un request — instanciar
 * esto afuera rompe en producción (ver middleware en index.ts).
 */
export function createAuth(env: Env) {
  const sql = neon(env.DATABASE_URL)
  const db = drizzle(sql, { schema })

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,

    emailAndPassword: {
      enabled: true,
    },

    plugins: [
      // --- Roles de PLATAFORMA: tu equipo interno ---
      adminPlugin({
        ac: platformAc,
        roles: platformRoles,
        defaultRole: "support",
      }),

      // --- Roles de ORGANIZACIÓN: equipo de cada cliente ---
      organization({
        ac: organizationAc,
        roles: organizationRoles,
        // Las organizaciones las crea un platform admin desde el
        // panel, no el cliente por su cuenta (según lo definido).
        allowUserToCreateOrganization: false,
        // Sin límite: un usuario puede pertenecer a N organizaciones,
        // y una organización puede tener N miembros.
      }),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
