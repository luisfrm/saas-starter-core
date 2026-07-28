import type { authClient } from "../auth-client"
import { authClient as client } from "../auth-client"

type SessionClient = typeof authClient

function create(client: SessionClient) {
  return {
    useSession: client.useSession,
    getSession: () => client.getSession(),
  }
}

export const sessionService = create(client)
export type SessionService = ReturnType<typeof create>
