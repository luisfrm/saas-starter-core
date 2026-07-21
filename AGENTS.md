# AGENTS.md — Visión y arquitectura de este repo

Este archivo es la fuente de verdad del proyecto. Cualquier agente de IA
(Claude Code, Cursor, etc.) o desarrollador que trabaje en este repo debe
leer esto primero, antes de tocar código.

Contenido verificado contra el código por última vez: julio 2026. Si algo
de aquí contradice lo que ves en el repo, gana el código — y actualiza
este archivo.

## Qué es este repo

Un **starter de SaaS multi-tenant de propósito general**, sin dominio de
negocio definido. No es un marketplace, no es un sistema de veterinaria,
no es nada específico — es la base que se **clona** para arrancar
cualquiera de esos proyectos sin reconstruir auth, roles, multi-tenancy
ni facturación desde cero cada vez.

Ejemplo de uso real: clonas este repo, y según el proyecto agregas los
módulos de dominio (productos/órdenes si es un marketplace, pacientes/citas
si es una veterinaria) sobre esta base ya funcional.

**Regla de oro al modificar el core:** si estás por escribir algo que
asume un dominio de negocio (ej. "cajero", "producto", "cita médica")
dentro de `packages/db`, `packages/shared` o `apps/api-worker`, deténte
— eso pertenece a un proyecto clonado, no al core.

## Los dos sistemas de usuarios (no confundir)

Este es el punto que más se presta a bugs si no queda claro:

1. **Plataforma** — tu equipo interno, el que administra el SaaS en sí.
   Crea organizaciones nuevas, aprueba/suspende clientes, hace soporte.
   No pertenece a ninguna organización. Roles: `owner`, `admin`, `support`.
2. **Organización** (antes "tenant") — cada cliente que usa el SaaS, con
   su propio equipo. Roles: `owner`, `admin`, `manager`, `member`.

Son dos tablas, dos enums, dos sistemas de permisos completamente
separados, aunque algunos nombres de rol se parezcan. Nunca deben
mezclarse en un mismo chequeo de autorización.

**Modelo de login:** un solo login compartido. La tabla `user` tiene un
`role` de plataforma (o `null` si no es staff). Un usuario puede ser
staff de plataforma Y miembro de una o varias organizaciones al mismo
tiempo — son ortogonales. Cada app filtra después de autenticar:

- `console` → exige `user.role` ∈ {owner, admin, support}. Si no, "sin acceso".
- `panel` → exige al menos un `member` (rol dentro de una org). Si no, OrgSelector.
- `public-web` → sesión opcional según el flujo.

**Sin límites de membresía:** un usuario puede pertenecer a N
organizaciones, y una organización puede tener N miembros. Esto lo
configura Better Auth en `apps/api-worker/src/lib/auth.ts`.

**Org activa:** Better Auth guarda `session.activeOrganizationId`. El
`panel` siempre opera sobre esa org (los permisos de org se evalúan
contra el `member.role` correspondiente). Si el usuario pertenece a
varias orgs y aún no hay org activa, hay que mostrar un **OrgSelector**
para que elija — esto se construye cuando inicialicemos `packages/ui`
con shadcn (ver pendiente abajo).

## Decisiones de arquitectura y el porqué

| Decisión | Por qué |
|---|---|
| Roles **fijos en código**, no en base de datos | No hay customización de roles por organización individual. Se ajustan al clonar el repo, editando `packages/shared/src/access-control.ts` — nunca con una migración. |
| **Permisos** granulares (`resource:action`) como átomo, roles como colección nombrada | Así "cajero", "veterinario", etc. nunca quedan hardcodeados en el core — se agregan como datos/roles al clonar, no como lógica nueva. |
| Auth: **Better Auth**, plugins `admin` + `organization` | Cubren el 90% de lo que íbamos a construir a mano (invitaciones, gestión de miembros, impersonation, ban de usuarios) sin mantenerlo nosotros. |
| Multi-tenancy: **shared schema + `organization_id`** en cada tabla | Encaja mejor con Neon serverless que schema-per-tenant o DB-per-tenant. Sin el overhead operativo de gestionar N bases. |
| DB: **Neon (Postgres serverless)**, no D1 | D1 tiene tope de ~50 escrituras/seg y 10GB por base, sin extensiones (nada de PostGIS/pgvector). Un SaaS multi-tenant con checkouts/transacciones concurrentes necesita Postgres real. |
| ORM: **Drizzle** | Tipado end-to-end, mejor soporte edge/serverless que otros ORMs. |
| Backend: **Hono en Cloudflare Workers** | Free tier generoso (100K req/día), Queues/R2/KV integrados, sin gestionar servidores. |
| Suscripciones: **precio fijo por plan**, no por asiento | Simplifica `plans`/`organization_subscriptions` — no hay que contar miembros para facturar. |
| Async: **Cloudflare Queues**, un solo `jobs-worker` | Menos piezas que mantener que 3 Workers separados (email/pdf/notificaciones). Se separa en Workers individuales solo si el volumen de un tipo de evento lo justifica. |
| Frontend: **Next.js en Vercel**, 3 apps separadas | `public-web` (cliente final), `panel` (equipo de cada organización), `console` (tu equipo/plataforma) — audiencias y niveles de permiso distintos, mejor separados que como rutas condicionales de una sola app. |

## Servicios / apps del monorepo

```
apps/
  api-worker/    → Hono en Cloudflare Workers. Único punto que habla
                   con Neon para operaciones transaccionales. Monta
                   Better Auth (/api/auth/*) y las rutas propias.
  jobs-worker/   → Consumer de Cloudflare Queues. Procesa emails, PDFs
                   y notificaciones en background. No recibe HTTP.
  public-web/    → Next.js. Cara al usuario/cliente final de cada
                   organización. Puede incluir sitio público leyendo
                   contenido de un CMS (a diseñar cuando se necesite).
  panel/         → Next.js. Dashboard para el equipo de cada
                   organización (roles owner/admin/manager/member).
  console/       → Next.js. Panel interno para TU equipo (plataforma):
                   crear organizaciones, aprobar/suspender, soporte.
  blog/          → NO scaffoldeado todavía. Mismo patrón que public-web
                   cuando se decida el modelo de contenido (CMS).

packages/
  db/            → Schema de Drizzle + cliente de Neon.
                   schema/auth.ts es GENERADO por Better Auth CLI, no
                   se edita a mano. schema/billing.ts sí es manual.
  shared/        → access-control.ts (roles/permisos — SE EDITA al
                   clonar), tipos y validaciones compartidas.
  ui/            → Componentes compartidos. Sigue la guía oficial de
                   shadcn para monorepos (no vienen preinstalados).
```

## Cloudflare — qué binding es cuál

| Binding | Dónde | Para qué |
|---|---|---|
| `TASK_QUEUE` | `api-worker` (producer) | Publicar eventos async (`user.welcome_email`, `organization.created`, ...) |
| `task-events` (consumer) | `jobs-worker` | Procesarlos: email, PDF, notificaciones |
| `FILES_BUCKET` (R2) | `jobs-worker` | Guardar PDFs generados, adjuntos |
| `DATABASE_URL` (secret) | `api-worker`, `jobs-worker` | Conexión a Neon vía `@neondatabase/serverless` |

Recuerda: los bindings solo existen **dentro de un request** en Workers.
`createAuth(env)` y `createDb(url)` se llaman por request, nunca en el
scope global del módulo (ver `apps/api-worker/src/lib/auth.ts`).

## Verificación y comandos (estado real hoy)

- `pnpm typecheck` (turbo → `tsc --noEmit` por paquete) es la **única**
  verificación que existe. Pasa en los 5 paquetes con script (los 3
  frontends + `api-worker` + `jobs-worker`).
- **No hay tests ni linter en ningún paquete.** `pnpm lint` corre
  `turbo run lint` pero ningún paquete define script `lint` → no-op.
  No asumas que "pasó lint" significa algo.
- Codegen, en orden cuando tocas auth/schema: `pnpm auth:generate`
  (regenera `packages/db/src/schema/auth.ts` desde la config de plugins
  de `apps/api-worker/src/lib/auth.ts`) → `pnpm db:generate` (SQL de
  migración) → `pnpm db:migrate` (lo aplica a `DATABASE_URL`).
- Setup completo desde cero (env vars, colas, bucket R2): ver README.

## Autorización en `api-worker` (estilo guards de NestJS)

Las rutas protegidas se encadenan con middlewares de Hono, en orden.
El equivalente directo de `@UseGuards()` en Nest:

```ts
app.post("/api/admin/organizations",
  requireAuth,                                            // 401 sin sesión
  requirePlatformPermission({ organization: ["create"] }), // 403 sin permiso
  async (c) => { /* handler limpio */ }
)
```

**Guards disponibles en `apps/api-worker/src/middleware/`:**

| Guard | Pregunta | Cómo decide | Costo |
|---|---|---|---|
| `requireAuth` | ¿Hay sesión? | `auth.api.getSession` | 1 round-trip a Neon |
| `requirePlatformPermission(perms)` | ¿El rol de **plataforma** del usuario incluye este permiso? | `auth.api.userHasPermission` (plugin `admin`) | 1 round-trip (chequeo en memoria después) |
| `requirePlatformRole(...roles)` | ¿El usuario tiene uno de estos roles de plataforma? | Lee `session.user.role` (sin llamada) | Gratis |
| `requireOrgPermission(perms)` | ¿El rol de **organización** del usuario incluye este permiso? | `auth.api.hasPermission` (plugin `organization`) | 1 round-trip a Neon (resuelve member) |

**Reglas:**

- `requireAuth` va **siempre primero**; los demás lo asumen.
- Para org-scoped, el guard busca `:orgId` en los params de la ruta; si
  no está, usa `session.activeOrganizationId`.
- Mejor Auth expone dos APIs distintas: `userHasPermission` (plataforma,
  plugin `admin`) y `hasPermission` (organización, plugin `organization`).
  No las mezcles. Las firmas exactas se verificaron contra
  `better-auth@1.6.23` (la instalada) — ver `apps/api-worker/src/middleware/guards.ts`.

## Gotchas que no se ven leyendo un solo archivo

- El contrato de eventos de la cola está **duplicado a mano**:
  `apps/api-worker/src/lib/queue.ts` define `QueueEvent` y
  `apps/jobs-worker/src/index.ts` lo **redefine** en vez de importarlo.
  Agregar/cambiar un evento exige editar ambos archivos o el producer
  y el consumer se desincronizan sin error de tipos.
- `drizzle/` (las migraciones generadas) está en `.gitignore` — hoy las
  migraciones no se commitean. Si eso no es intencional a largo plazo,
  revísalo al clonar.
- `packages/db/src/schema/auth.ts` actual es un **placeholder** (stub
  mínimo para que `billing.ts` compile). Hasta correr `auth:generate`
  la base real no tiene las tablas completas de Better Auth.
- Los 3 frontends tienen `auth-client.ts` distintos a propósito:
  `public-web` sin roles, `panel` con `organizationAc`, `console` con
  `adminClient` + `platformAc`. No los "unifiques".

## Qué falta / próximos pasos conocidos

Verificado contra el código (julio 2026). Dos grupos:

**Para que arranque de verdad (setup nunca corrido en este repo):**

- [ ] `pnpm auth:generate` — `schema/auth.ts` sigue siendo el placeholder
- [ ] `pnpm db:generate` + `pnpm db:migrate` — no existe `packages/db/drizzle/`,
      la base de Neon nunca fue migrada
- [ ] Secrets/recursos de Cloudflare: `wrangler secret put` para
      `DATABASE_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`; crear colas
      `task-events` + `task-events-dlq` y bucket `saas-starter-files`
      (pasos en README; no verificables desde el repo)

**De diseño/código (decisiones pospuestas a propósito):**

- [ ] `blog/`: no scaffoldeado a propósito — primero definir el modelo
      de contenido del CMS, luego crear la app siguiendo el patrón de
      `public-web`
- [ ] Elegir gateway de pago (Stripe u otro) para cobrar `plans` — el
      schema de billing existe pero nada cobra
- [ ] `OrgSelector` en `panel/`: cuando un usuario pertenece a N
      organizaciones pero `session.activeOrganizationId` es null,
      mostrar selector antes de entrar al dashboard. Requiere
      shadcn `select`/`command` (ya hay base para sumarlos).
- [ ] CI: no existe `.github/`; mínimo `typecheck` en cada PR

## Theming (Tailwind v4 + shadcn)

Stack instalado:

- **Tailwind v4** (CSS-first, sin `tailwind.config.js`) en
  `packages/ui/src/styles/globals.css`. Cada app Next importa
  `@repo/ui/globals.css` desde su layout.
- **shadcn/ui v4** (style `new-york`, base `neutral`) inicializado
  en `packages/ui` con `components.json`. Los componentes se
  agregan con:
  ```bash
  pnpm --filter @repo/ui dlx shadcn@latest add <componente>
  ```
  e importan desde `@repo/ui/components/ui/<componente>`.
- **Tokens editables** en `packages/ui/src/styles/tokens.css`.
  Al clonar el repo, este es el ÚNICO archivo de tema que se
  toca: cambiar los OKLCH de `--primary` y `--secondary` para
  los colores de marca. `globals.css` los mapea a utilidades
  de Tailwind (`bg-primary`, `text-muted-foreground`, etc.).
- **Modo oscuro**: selector `.dark` (via `next-themes`,
  `defaultTheme: "system"`). Toggle manual se agrega después.
- **Tipografía**: las 3 familias (`--font-sans/serif/mono`) están
  como token; actualmente usan system stack. Para usar Geist/Inter
  u otra, reemplazar el valor en `tokens.css` y configurar
  `next/font` en cada app.

## Storybook (catálogo de componentes)

Catalogamos `packages/ui` con [Storybook 10](https://storybook.js.org/).
Decisiones que se ven pocos archivos para entender:

- **Builder: `@storybook/react-vite`** (no `@storybook/nextjs`). Los
  componentes son React puro + Tailwind — no usan `next/image` ni
  `next/font`, así que el framework pesado de Next no aporta nada y
  duplicaría el bundler. Vite arranca en ~1s.
- **Versión**: Storybook 10.5.3 (ESM-only, requiere Node 20.19+ o
  22.12+). Vite 6 (`@storybook/react-vite@10` admite 5-8; Vite 8
  funciona pero Rolldown choca con el plugin interno de inyección de
  exports de Storybook en build, así que se mantiene Vite 6).
- **Addons**: `addons/a11y` (axe-core en cada story), `addons/themes`
  (toolbar light/dark que togglean la clase `light`/`dark` en
  `documentElement` — mismo mecanismo que `next-themes` en las apps),
  `addons/docs` (autodocs + MDX). Los "essentials" (controls, actions,
  viewport, backgrounds) ya **no son un paquete**: en v9+ pasaron al
  core de Storybook, por eso este repo no los lista explícitamente.
- **Theme switcher en stories**: `preview.tsx` usa
  `withThemeByClassName({ themes: { light, dark }, parentSelector: "html" })`
  — toolbar que aplica/quita la clase al `<html>`. En `globals.css`
  el tema se maneja con `@custom-variant dark (&:is(.dark *))` y los
  tokens de `.dark` en `tokens.css`. En las apps Next el mismo
  toggle lo maneja `next-themes`.
- **Stories co-located**: cada componente lleva su `*.stories.tsx`
  al lado (`button.stories.tsx`, `card.stories.tsx`, etc.). El glob
  en `.storybook/main.ts` las descubre automáticamente. Los imports
  de tipos (`Meta`, `StoryObj`, `Preview`) vienen de
  `@storybook/react-vite` (no de `@storybook/react`, que ya no se
  usa). Los `Meta` de MDX vienen de `@storybook/addon-docs/blocks`.
- **PostCSS local**: `packages/ui/postcss.config.mjs` re-exporta
  `@tailwindcss/postcss`. Sin esto Vite no encuentra Tailwind al
  build (las apps Next tienen su propio `postcss.config.mjs` que
  re-exporta `@repo/ui/postcss`, pero Storybook corre dentro de
  `packages/ui`, no de la app).
- **Comandos**:
  - `pnpm --filter @repo/ui storybook` → dev en `http://localhost:6006`
  - `pnpm --filter @repo/ui build-storybook` → bundle estático en
    `storybook-static/` (deployable a Cloudflare Pages, S3, lo que sea).
- **NO** se commitea `storybook-static/` — está en `.gitignore`.

## Arquitectura en capas (backend + services de frontend)

El backend usa **Route → Service → Repository**, en funciones
puras, con dependencias inyectadas por parámetro. Los services
del frontend viven en `@repo/shared` y se wiren en cada app con
una línea. El objetivo: que cambiar Hono por otro framework o
cambiar el shape de un endpoint custom rompa **un solo archivo**
(contrato Zod), no N.

### Capas del backend (apps/api-worker/src/)

```
routes/                   ← Hono. Lo ÚNICO que importa hono
  organizations.route.ts
  admin-organizations.route.ts
services/                 ← Lógica de negocio. SIN hono, SIN drizzle
  organization.service.ts
repositories/             ← Drizzle. Vacío en el core; aparece
                            cuando el clon agrega tablas de dominio
middleware/               ← Guards (requireAuth, requirePlatform*)
lib/                      ← createAuth, queue, env, db si aplica
index.ts                  ← Composición: monta sub-routers en rutas
```

**Regla de oro de las capas:**

- Una `route` puede importar de `service` y de `middleware`. Nunca
  de otra `route`.
- Un `service` puede importar de `contracts` (Zod), de la queue,
  de Better Auth (`auth.api.*`). **Nunca de Hono.** Si un service
  necesita headers, le llegan como parámetro.
- Un `repository` (cuando exista) solo importa Drizzle. Los
  services no llaman Drizzle directo; van por el repository.

**Better Auth ES el repository del dominio auth.** No escribimos
`UserRepository`/`OrganizationRepository`/`MemberRepository` con
Drizzle — pelearíamos contra los hooks/validaciones del plugin.
Los services que tocan `user`/`session`/`organization`/`member`
llaman `auth.api.*` directamente. Los repositories Drizzle
existen **solo para tablas de dominio del clon** (pacientes,
órdenes, productos — lo que se agregue al clonar).

### "Actions" y "Services" conviviendo

- **Service** (módulo con varios métodos del mismo dominio):
  mejor cuando hay CRUD + queries. Ej. `OrganizationService`.
- **Action** (función suelta por caso de uso): mejor cuando un
  flujo orquesta varias cosas (DB + queue + email). Una action
  puede llamar a un service o a `auth.api.*` directamente.
  En este repo no hace falta crear un archivo `actions/` todavía
  — el service de organización ya es chico.

### Instanciación por request

Cloudflare Workers: los bindings/env vars solo existen dentro de
un request. Por eso `createAuth(env)` y `createDb(url)` se llaman
**dentro del handler** o en middleware que setea `c.var`, nunca
en el scope global del módulo. Lo mismo para cualquier service
con estado: se instancia por request, no a nivel módulo.

```ts
// routes/admin-organizations.route.ts
.post("/", requireAuth, ..., async (c) => {
  const input = createOrganizationSchema.parse(await c.req.json())
  const organization = await createOrganization(
    { auth: c.get("auth"), queue: c.env.TASK_QUEUE, headers: c.req.raw.headers },
    input,
  )
  return c.json({ organization })
})
```

### Por qué funciones, no clases

- El stack entero es funcional (Hono, Better Auth, Drizzle, Zod).
  Las clases serían alienígenas.
- Tree-shaking en Workers: funciones se eliminan individualmente;
  una clase entera viaja junta.
- Inyección de dependencias por parámetro da el mismo testeo
  fácil que un constructor, sin la herencia.
- Herencia: si al clonar descubrís que escribís CRUD idéntico
  5 veces, preferí un factory `createCrudRepository(table)` antes
  que una `BaseRepository` class. Mismo resultado, sin jerarquía.

### Services compartidos del frontend (packages/shared/src/)

```
contracts/                ← Zod schemas + tipos inferidos
  organization.ts            createOrganizationSchema,
                             CreateOrganizationInput, CreateOrganizationResponse
services/                 ← Funciones puras, sin estado
  auth.service.ts            createAuthService(authClient) → AuthService
  session.service.ts         createSessionService(authClient)
  organization.service.ts    createOrganizationService({ baseUrl })
types/                    ← Interfaces mínimas para DI
  auth-client.ts             AuthClientLike (lo que los services esperan)
```

**Por qué el auth service está en `@repo/shared`:** las 3 apps
(public-web, panel, console) tienen el mismo `LoginForm`. Sin un
service compartido, había que escribir el adapter en cada una
(ya pasó — borramos 3 `auth-adapter.ts`). Con el service,
cambiar el shape de la respuesta de Better Auth toca **un solo
archivo**.

**El truco para que sirva a las 3 apps con plugins distintos:**
`createAuthService(client: AuthClientLike)`. Cada app le pasa su
client real (que tiene `organizationClient` o `adminClient` según
corresponda). El service solo toca el subconjunto común
(`signIn.email`, `signUp.email`, `signIn.social`,
`requestPasswordReset`).

**Wiring por app** (1 línea de file):

```ts
// apps/panel/src/lib/services.ts
import { createAuthService } from "@repo/shared"
import { authClient } from "./auth-client"

export const authService = createAuthService(authClient)
```

Las páginas siguen usando `authService` directo:

```tsx
<LoginForm authClient={authService} redirectUrl="/dashboard" />
```

El `AuthService` cumple por structural typing la forma que
esperan los componentes de `@repo/ui` — no hay que tocar los
componentes.

### Contratos HTTP compartidos (packages/shared/src/contracts/)

Cualquier ruta custom del api-worker (no las de Better Auth, que
ya las tipa el plugin) define su input/output como Zod schema
acá. El backend valida con `schema.parse()`, el frontend usa
`z.infer<typeof schema>` para tipar el service.

**Ejemplo — el único contrato del core:**

```ts
// packages/shared/src/contracts/organization.ts
export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
})
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
```

El backend parsea con este mismo schema. El frontend le pasa
este mismo tipo. Cambiar el contrato = un solo archivo, ambos
lados se enteran por typecheck.

### `firstName` / `lastName` — decisión consciente

El `SignupForm` pide `firstName` y `lastName` por separado (mejor
UX, autocomplete del navegador). El `authService.signUp.email`
los combina en un único `name: \`${firstName} ${lastName}\``
antes de pegarle a Better Auth. El backend **no necesita**
conocer `firstName`/`lastName` como campos de tabla — Better
Auth ya los ignora salvo que configures `additionalFields` en
`apps/api-worker/src/lib/auth.ts` + `pnpm auth:generate` + una
migración. Queda como pendiente documentado.

## Lo que este repo explícitamente NO incluye (a propósito)

- Chat en tiempo real — no es requisito actual. Si se vuelve prioridad,
  evaluar Durable Objects (ya dentro del ecosistema Cloudflare) antes
  que sumar un proveedor nuevo tipo Convex.
- Roles personalizables por organización — decisión explícita de
  mantenerlos fijos e iguales para todas.
- Ningún dominio de negocio (productos, citas, pacientes, pedidos...) —
  eso se agrega al clonar, nunca en el core.
