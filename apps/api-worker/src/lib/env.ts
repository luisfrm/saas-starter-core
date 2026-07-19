import type { Auth } from "./auth"
import type { TaskQueueBinding } from "./queue"

export type Env = {
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  TASK_QUEUE: TaskQueueBinding
}

export type Session = NonNullable<
  Awaited<ReturnType<Auth["api"]["getSession"]>>
>["session"] & {
  activeOrganizationId?: string | null
}

export type SessionUser = NonNullable<
  Awaited<ReturnType<Auth["api"]["getSession"]>>
>["user"]

export type AppVariables = {
  auth: Auth
  session?: Session
  user?: SessionUser
}

export type AppEnv = {
  Bindings: Env
  Variables: AppVariables
}
