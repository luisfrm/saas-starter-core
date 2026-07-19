import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

/**
 * Crea un cliente de Drizzle nuevo. En Workers, llama esto DENTRO
 * del request (ver apps/api-worker/src/lib/auth.ts) — nunca en el
 * scope global del módulo.
 */
export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl)
  return drizzle(sql, { schema })
}

export type Db = ReturnType<typeof createDb>
export * from "./schema"
