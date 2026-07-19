# packages/db

Schema de Drizzle + cliente de Neon. Lo consumen `apps/api-worker` y
`apps/jobs-worker`. Los frontends Next **no** importan de acá
directamente.

## Variables de entorno

| Variable | Tipo | Descripción |
|---|---|---|
| `DATABASE_URL` | **secreta** (en `.env` para drizzle-kit) | URL de Postgres de Neon |

Solo la usa `drizzle-kit` (CLI para generar y aplicar migraciones). Los
Workers la reciben en runtime como secret (`wrangler secret put`).

## Comandos

Desde la raíz del monorepo:

```bash
pnpm db:generate     # genera SQL de migración desde el schema actual
pnpm db:migrate      # aplica las migraciones pendientes a DATABASE_URL
pnpm db:studio       # abre Drizzle Studio (UI web para explorar la DB)
```

Equivalentes filtrados:

```bash
pnpm --filter @repo/db run generate
pnpm --filter @repo/db run migrate
pnpm --filter @repo/db run studio
```

## Estructura

```
src/
  client.ts            createDb(url) — fábrica de cliente Drizzle/Neon
  schema/
    index.ts           Re-exporta todo el schema
    auth.ts            ⚠️ GENERADO por Better Auth CLI — no editar a mano
    billing.ts         plans, features, plan_features, organization_subscriptions
```

## Detalles importantes

- **`schema/auth.ts` es placeholder hasta correr `auth:generate`**.
  Después de generarse, NO se edita a mano. Si cambiás la config de
  plugins en `apps/api-worker/src/lib/auth.ts`, volvé a correr
  `auth:generate` para regenerar este archivo.
- **Migraciones**: el output de `db:generate` cae en `drizzle/` (en la
  raíz del package). Está en `.gitignore` en este starter — la
  intención es que las migraciones se commiteen al clonar el repo
  para producción; ver AGENTS.md.
- **No tiene script `build`**: este package expone TS directo vía el
  campo `main` y `exports` del `package.json`. Las apps que lo
  importan transpilean (Next y Vite lo hacen por defecto; Workers vía
  esbuild de wrangler).
- **No agregues tablas de dominio acá sin pensarlo**: el core no
  debe asumir un dominio de negocio (no tablas de `orders`, `patients`,
  etc.). Al clonar el repo, las tablas del dominio se suman en este
  mismo directorio (`src/schema/<dominio>.ts`).
