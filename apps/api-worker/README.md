# apps/api-worker

Backend único del SaaS. Hono sobre Cloudflare Workers, único punto que
habla con Neon (Drizzle) y monta Better Auth (`/api/auth/*` + rutas
propias). Productor de la cola `task-events` para jobs en background.

## Variables de entorno

| Variable | Tipo | Descripción |
|---|---|---|
| `DATABASE_URL` | **secreta** | URL de Postgres de Neon |
| `BETTER_AUTH_SECRET` | **secreta** | Clave para firmar sesiones de Better Auth. Generala con `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | pública (var en `wrangler.jsonc`) | URL pública del Worker. `http://localhost:8787` en dev, la URL del deploy en prod |

## Bindings de Cloudflare

| Binding | Tipo | Para qué |
|---|---|---|
| `TASK_QUEUE` | Queue producer | Publica eventos a la cola `task-events` (ej. `organization.created`) |

## Dev local

Desde la raíz del monorepo:

```bash
pnpm dev                  # levanta todo (turbo)
# o solo esta app:
pnpm --filter api-worker run dev
```

Queda en `http://localhost:8787`. Las rutas de Better Auth se exponen en
`/api/auth/*` automáticamente (sign-in, sign-up, organization/*, admin/*).

## Deploy

```bash
# 1. Cargar secrets (una vez, o cuando roten)
npx wrangler secret put DATABASE_URL        --cwd apps/api-worker
npx wrangler secret put BETTER_AUTH_SECRET --cwd apps/api-worker
# BETTER_AUTH_URL ya está como var no-secreta en wrangler.jsonc

# 2. Deploy
pnpm --filter api-worker run deploy
# equivalente a: cd apps/api-worker && npx wrangler deploy
```

Tras el primer deploy, tomá nota de la URL del Worker y actualizá
`BETTER_AUTH_URL` en `wrangler.jsonc` (y re-deployá) — Better Auth la
usa para construir redirects y validar orígenes de cookies.

## Estructura

```
src/
  index.ts            Entrada de Hono, registra rutas y el middleware global
  lib/
    auth.ts           createAuth(env) — Better Auth con plugins admin + organization
    env.ts            Tipos de Bindings y Variables compartidos
    queue.ts          Contrato de QueueEvent (ver apps/jobs-worker también)
  middleware/
    auth.ts           requireAuth — carga la sesión, 401 si no hay
    guards.ts         requirePlatformPermission, requirePlatformRole, requireOrgPermission
```

## Detalles importantes

- **`createAuth` se llama por request, nunca en el scope global del
  módulo.** Los bindings de Cloudflare solo existen dentro del ciclo
  de vida de un request. Ver `src/index.ts:21`.
- **Auth global de Better Auth**: `app.on(["POST","GET"], "/api/auth/*", c => c.get("auth").handler(c.req.raw))`. No escribas esas rutas a mano.
- **Autorización por guards**: las rutas protegidas se encadenan con
  middlewares de Hono (`requireAuth`, `requirePlatformPermission`,
  etc.). Detalle en el AGENTS.md.
- **Producción del evento a la cola**: el productor publica a
  `TASK_QUEUE`; el consumidor vive en `apps/jobs-worker`. Si agregás
  un evento nuevo, actualizá el `QueueEvent` en `src/lib/queue.ts` Y
  en `apps/jobs-worker/src/index.ts` (el contrato está duplicado a
  mano — ver AGENTS.md gotchas).
