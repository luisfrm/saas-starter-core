# SaaS Starter Core

Starter de SaaS multi-tenant de propósito general. Para entender **qué es
esto, por qué está armado así, y qué hacer al clonarlo para un proyecto
nuevo**, lee primero **[AGENTS.md](./AGENTS.md)** — ese archivo es la
fuente de verdad del proyecto.

Este README es solo el quickstart práctico.

## Stack

Next.js (Vercel) · Hono en Cloudflare Workers · Neon (Postgres serverless)
· Drizzle ORM · Better Auth (`admin` + `organization` plugins) ·
Cloudflare Queues/R2 · Turborepo + pnpm workspaces

## Estructura

```
apps/
  api-worker/   Hono en Cloudflare Workers — API + Better Auth
  jobs-worker/  Consumer de Queues — email/PDF/notificaciones
  public-web/   Next.js — cara al cliente final       (puerto 3000)
  panel/        Next.js — panel de cada organización  (puerto 3001)
  console/      Next.js — panel de tu equipo/plataforma (puerto 3002)
packages/
  db/           Schema de Drizzle + cliente de Neon
  shared/       Roles/permisos (access-control.ts) + tipos compartidos
  ui/           Componentes compartidos (shadcn)
```

## Setup inicial

```bash
pnpm install
cp .env.example .env   # completa DATABASE_URL, BETTER_AUTH_SECRET, etc.
```

### 1. Generar el schema de auth

`packages/db/src/schema/auth.ts` es un placeholder. Genera el real según
los plugins configurados en `apps/api-worker/src/lib/auth.ts`:

```bash
pnpm --filter api-worker run auth:generate
```

### 2. Migrar la base de datos (Neon)

```bash
pnpm db:generate   # genera el SQL de migración a partir del schema
pnpm db:migrate    # lo aplica contra DATABASE_URL
```

### 3. Crear los recursos de Cloudflare (una sola vez, por cuenta)

```bash
npx wrangler login
npx wrangler queues create task-events
npx wrangler queues create task-events-dlq
npx wrangler r2 bucket create saas-starter-files
```

### 4. Levantar todo en desarrollo

```bash
pnpm dev
```

Esto corre, en paralelo (vía Turborepo):
- `api-worker` en `http://localhost:8787`
- `jobs-worker` con `wrangler dev` (consumer local de la cola)
- `public-web` en `http://localhost:3000`
- `panel` en `http://localhost:3001`
- `console` en `http://localhost:3002`

## Al clonar este repo para un proyecto nuevo

1. Lee `AGENTS.md` completo
2. Edita `packages/shared/src/access-control.ts` — agrega los recursos
   y permisos del dominio nuevo (ej: `orders`, `patients`)
3. Vuelve a correr `auth:generate` si cambiaste algo en los plugins
4. Agrega tus tablas de dominio en `packages/db/src/schema/`
5. El resto (auth, roles de plataforma, invitaciones, suscripciones)
   ya funciona sin tocarlo

## Deploy

- **Frontends** (`public-web`, `panel`, `console`): Vercel, un proyecto
  por app, apuntando cada uno a su carpeta en `apps/`
- **Workers** (`api-worker`, `jobs-worker`): `wrangler deploy` desde cada
  carpeta, o CI equivalente
