import { createAuthClient } from "better-auth/react"
import { adminClient, organizationClient } from "better-auth/client/plugins"
import { platformAc, platformRoles } from "@repo/shared/access-control"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  plugins: [
    adminClient({ ac: platformAc, roles: platformRoles }),
    organizationClient(), // para listar/gestionar TODAS las organizaciones
  ],
})
