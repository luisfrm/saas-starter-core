# apps/public-web

Next.js — cara al cliente final de cada organización. Es la app que
visitan los usuarios que no son parte del equipo interno de la
organización (visitantes, clientes que compran, etc.).

## Variables de entorno

| Variable | Tipo | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **pública** (visible en el browser) | URL del api-worker. `http://localhost:8787` en dev, la URL del deploy en prod |

`NEXT_PUBLIC_*` se embebe en el bundle del cliente — nunca pongas
secretos acá. Solo la URL del backend, que igual es pública.

## Dev local

```bash
pnpm dev                                # levanta todo (turbo)
# o solo esta app:
pnpm --filter public-web run dev
```

Queda en `http://localhost:3000`. Requiere que `api-worker` esté
corriendo (la app habla con él vía `NEXT_PUBLIC_API_URL`).

## Deploy (Vercel)

1. Crear un proyecto en Vercel apuntando a `apps/public-web` como
   Root Directory.
2. Configurar las env vars en el dashboard de Vercel (Project → Settings
   → Environment Variables) o por CLI:
   ```bash
   vercel link --cwd apps/public-web
   vercel env add NEXT_PUBLIC_API_URL production
   ```
3. Push a la rama conectada a producción (o `vercel --prod`).

**No necesita** `DATABASE_URL` ni `BETTER_AUTH_SECRET` — el frontend
solo habla con el api-worker, no toca la base directamente.

## Estructura

```
src/
  app/
    layout.tsx     Layout raíz
    page.tsx       Página de inicio (placeholder — reemplazar)
  lib/
    auth-client.ts Better Auth client (solo organizationClient, sin roles)
```

## Detalles importantes

- **`auth-client.ts` no incluye `organizationAc`/`organizationRoles`**
  a propósito: public-web es para visitantes/clientes que no son
  miembros de la organización. El chequeo de permisos se hace del
  lado del api-worker con los guards (`requireOrgPermission`).
- **Stack**: Next.js 15 con App Router, React 19, Turbopack en dev.
- **Sin shadcn todavía**: `packages/ui` está vacío en este starter.
  Cuando lo inicialices, los componentes caen ahí y se importan
  como `@repo/ui/<componente>`.
