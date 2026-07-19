# apps/jobs-worker

Consumer único de Cloudflare Queues para el SaaS. Procesa emails, PDFs
y notificaciones en background, fuera del path crítico del request HTTP.
Lo publica `apps/api-worker`.

No expone HTTP: es un Worker con `queue` consumer configurado.

## Variables de entorno

| Variable | Tipo | Descripción |
|---|---|---|
| `DATABASE_URL` | **secreta** | URL de Postgres de Neon (si el handler necesita leer/escribir) |
| `RESEND_API_KEY` | **secreta** | API key de Resend para enviar emails transaccionales |

## Bindings de Cloudflare

| Binding | Tipo | Para qué |
|---|---|---|
| `task-events` (consumer) | Queue | Recibe los mensajes publicados por api-worker |
| `task-events-dlq` (DLQ) | Queue | Mensajes que fallaron más de `max_retries` (5) veces caen acá |
| `FILES_BUCKET` | R2 bucket `saas-starter-files` | PDFs generados, adjuntos |

## Dev local

```bash
pnpm dev                  # levanta todo (turbo)
# o solo esta app:
pnpm --filter jobs-worker run dev
```

`wrangler dev` arranca un emulador local de la cola. Los eventos
publicados por api-worker (también local) llegan automáticamente. Los
logs de cada handler aparecen en la consola de `wrangler dev`.

Para inspeccionar un mensaje en la DLQ local: `wrangler dev` los loguea
si activás el flag correspondiente en la consola.

## Deploy

```bash
# 1. Cargar secrets (una vez, o cuando roten)
npx wrangler secret put DATABASE_URL  --cwd apps/jobs-worker
npx wrangler secret put RESEND_API_KEY --cwd apps/jobs-worker

# 2. Deploy
pnpm --filter jobs-worker run deploy
# equivalente a: cd apps/jobs-worker && npx wrangler deploy
```

## Estructura

```
src/
  index.ts   Único archivo: define Env, QueueEvent, el handler de la
             cola y los dispatchers por tipo de evento
```

## Detalles importantes

- **Un solo jobs-worker maneja TODO el background** (email + PDF + notificaciones).
  Si el volumen de un tipo de evento lo justifica, se separa en su
  propio Worker. El productor (`api-worker`) no sabe ni le importa
  cuántos consumers hay.
- **El tipo `QueueEvent` está redefinido acá** (no importado de
  `apps/api-worker/src/lib/queue.ts`). Es un gotcha: si agregás un
  evento, editá ambos archivos o el consumer no lo reconocerá. Está
  documentado en AGENTS.md.
- **Reintentos**: si un handler tira excepción, el mensaje vuelve a
  la cola hasta `max_retries: 5`; después cae a la DLQ. No se llama
  `ack()` en error.
- **No recibe HTTP**: el Worker no expone endpoints. Todo su tráfico
  viene de la cola.
