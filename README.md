# SaaS Starter Core

Starter de SaaS multi-tenant de propósito general. Para entender **qué es
esto, por qué está armado así, y qué hacer al clonarlo para un proyecto
nuevo**, lee primero **[AGENTS.md](./AGENTS.md)** — ese archivo es la
fuente de verdad del proyecto.

Este README es el quickstart práctico y la referencia operativa
(env vars, deploy por app, servicios externos).

## Stack

Next.js (Vercel) · Hono en Cloudflare Workers · Neon (Postgres serverless)
· Drizzle ORM · Better Auth (`admin` + `organization` plugins) ·
Cloudflare Queues/R2 · Turborepo + pnpm workspaces

## Estructura

```
apps/
  api-worker/   Hono en Cloudflare Workers — API + Better Auth      (puerto 8787)
  jobs-worker/  Consumer de Queues — email/PDF/notificaciones      (sin HTTP)
  public-web/   Next.js — cara al cliente final                    (puerto 3000)
  panel/        Next.js — panel de cada organización               (puerto 3001)
  console/      Next.js — panel de tu equipo/plataforma            (puerto 3002)
packages/
  db/           Schema de Drizzle + cliente de Neon
  shared/       Roles/permisos (access-control.ts) + tipos compartidos
  ui/           Componentes compartidos (shadcn)
```

Cada app/package tiene su propio `README.md` con detalle de envs, dev y
deploy.

## Servicios externos requeridos

| Servicio | Para qué | Costo inicial |
|---|---|---|
| [Neon](https://neon.tech) | Postgres serverless (la única base del SaaS) | Free tier |
| [Cloudflare](https://cloudflare.com) | Workers, Queues, R2, secrets | Free tier generoso |
| [Vercel](https://vercel.com) | Deploy de los 3 frontends Next.js | Free tier |
| [Resend](https://resend.com) | Envío de emails transaccionales (welcome, etc.) | Free tier |

Las cuentas se crean una sola vez por proyecto clonado. Las keys
producidas se cargan como **secrets** en cada destino (ver tabla de
env vars abajo).

## Variables de entorno

El repo incluye `.env.example` con los valores. Copialo y completá:

```bash
cp .env.example .env
```

Esta tabla indica dónde se usa cada variable y si es **pública**
(empieza con `NEXT_PUBLIC_` o es una var de wrangler) o **secreta**
(via `wrangler secret put` o Vercel env vars).

| Variable | Dónde se consume | Tipo | Descripción |
|---|---|---|---|
| `DATABASE_URL` | `packages/db` (drizzle-kit), `apps/api-worker`, `apps/jobs-worker` | **secreta** | URL de Postgres de Neon, formato `postgres://...` |
| `BETTER_AUTH_SECRET` | `apps/api-worker` | **secreta** | Clave para firmar sesiones de Better Auth. Generala con `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | `apps/api-worker` | pública (wrangler `vars`) | URL pública del api-worker. `http://localhost:8787` en dev, la URL de workers en prod |
| `NEXT_PUBLIC_API_URL` | `apps/public-web`, `apps/panel`, `apps/console` | **pública** (cliente) | URL del api-worker. Las apps Next la leen en el browser para hablar con el backend |
| `RESEND_API_KEY` | `apps/jobs-worker` | **secreta** | API key de Resend para enviar emails |

**Cómo se cargan en cada destino:**

- **Cloudflare Workers** (`api-worker`, `jobs-worker`):
  ```bash
  echo "$VALOR" | npx wrangler secret put NOMBRE --cwd apps/api-worker
  # BETTER_AUTH_URL va en wrangler.jsonc como var no-secreta (ya está)
  ```
- **Vercel** (cada frontend): dashboard → Settings → Environment Variables,
  o por CLI con `vercel env add`.
- **Local** (todo): en `.env` en la raíz del monorepo. Workers lo leen
  vía `wrangler dev`; Next lo lee automáticamente.

## Setup inicial

```bash
pnpm install
cp .env.example .env   # completa DATABASE_URL, BETTER_AUTH_SECRET, etc.
```

### 1. Generar el schema de auth

`packages/db/src/schema/auth.ts` es un placeholder. Genera el real según
los plugins configurados en `apps/api-worker/src/lib/auth.ts`:

```bash
pnpm auth:generate
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

### 4. Cargar los secrets en los Workers

```bash
# api-worker
npx wrangler secret put DATABASE_URL --cwd apps/api-worker
npx wrangler secret put BETTER_AUTH_SECRET --cwd apps/api-worker
# BETTER_AUTH_URL ya está como var no-secreta en wrangler.jsonc

# jobs-worker
npx wrangler secret put DATABASE_URL --cwd apps/jobs-worker
npx wrangler secret put RESEND_API_KEY --cwd apps/jobs-worker
```

### 5. Levantar todo en desarrollo

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

Cada app/package tiene su `README.md` con el detalle. Resumen:

| App | Plataforma | Comando | Notas |
|---|---|---|---|
| `api-worker` | Cloudflare Workers | `pnpm --filter api-worker run deploy` | Único punto que habla con Neon. URL pública debe coincidir con `BETTER_AUTH_URL` |
| `jobs-worker` | Cloudflare Workers | `pnpm --filter jobs-worker run deploy` | Consumer de la cola `task-events`, sin HTTP entrante |
| `public-web` | Vercel | import desde `apps/public-web` en el dashboard | Es la cara pública del cliente |
| `panel` | Vercel | import desde `apps/panel` | Dashboard del equipo de cada organización |
| `console` | Vercel | import desde `apps/console` | Panel interno de tu equipo de plataforma |

**Recomendación:** un proyecto de Vercel separado por frontend (no un
monorepo deploy). Las 3 apps tienen audiencias y permisos distintos,
conviene separarlas desde el deploy.
