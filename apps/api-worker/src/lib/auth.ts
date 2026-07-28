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
import { ALLOWED_ORIGINS } from "./cors"
import type { TaskQueueBinding } from "./queue"

type Env = {
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  TASK_QUEUE: TaskQueueBinding
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

    // Orígenes desde los que se aceptan sign-in/sign-up con cookie.
    // Misma lista que el middleware CORS (ver lib/cors.ts).
    trustedOrigins: [...ALLOWED_ORIGINS],

    emailAndPassword: {
      enabled: true,
      // Forgot-password: la UI ya llama `requestPasswordReset`; este
      // hook es el que realmente envía el email (vía cola → Resend).
      sendResetPassword: async ({ user, url }) => {
        await env.TASK_QUEUE.send({
          type: "user.password_reset",
          email: user.email,
          name: user.name ?? null,
          url,
        })
      },
    },

    // Side effects de ciclo de vida de usuarios. El email de
    // bienvenida se publica acá (no en una ruta custom) porque
    // Better Auth es quien crea el usuario — sign-up, invitación
    // a una org, o alta desde el plugin admin pasan por este hook.
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await env.TASK_QUEUE.send({
              type: "user.welcome_email",
              userId: user.id,
              email: user.email,
              name: user.name ?? null,
            })
          },
        },
      },
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
