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
- [ ] `packages/ui`: correr `npx shadcn@latest init` y elegir componentes
      base (hoy está vacío, sin siquiera `tsconfig.json`)
- [ ] `OrgSelector` en `panel/`: cuando un usuario pertenece a N
      organizaciones pero `session.activeOrganizationId` es null,
      mostrar selector antes de entrar al dashboard. Se construye
      junto con los componentes de UI (paquete anterior).
- [ ] CI: no existe `.github/`; mínimo `typecheck` en cada PR

## Lo que este repo explícitamente NO incluye (a propósito)

- Chat en tiempo real — no es requisito actual. Si se vuelve prioridad,
  evaluar Durable Objects (ya dentro del ecosistema Cloudflare) antes
  que sumar un proveedor nuevo tipo Convex.
- Roles personalizables por organización — decisión explícita de
  mantenerlos fijos e iguales para todas.
- Ningún dominio de negocio (productos, citas, pacientes, pedidos...) —
  eso se agrega al clonar, nunca en el core.
