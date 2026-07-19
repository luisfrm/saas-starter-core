# apps/panel

Next.js — dashboard para el equipo de cada organización cliente. Roles
internos de la organización: `owner`, `admin`, `manager`, `member`.

## Variables de entorno

| Variable | Tipo | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **pública** (visible en el browser) | URL del api-worker |

## Dev local

```bash
pnpm dev                          # levanta todo (turbo)
# o solo esta app:
pnpm --filter panel run dev
```

Queda en `http://localhost:3001`. Requiere que `api-worker` esté
corriendo.

## Deploy (Vercel)

1. Crear un proyecto en Vercel apuntando a `apps/panel`.
2. Configurar `NEXT_PUBLIC_API_URL` apuntando a la URL de producción
   del api-worker.
3. Push o `vercel --prod`.

**No necesita** secretos: el frontend solo habla con el api-worker.
La sesión y los permisos los maneja Better Auth en el backend.

## Estructura

```
src/
  app/
    layout.tsx
    page.tsx     Placeholder — reemplazar con la UI del dashboard
  lib/
    auth-client.ts Better Auth client con organizationAc + organizationRoles
                   (los roles internos de la organización)
```

## Detroles importantes

- **`auth-client.ts` incluye `organizationClient({ ac, roles })`**:
  permite chequeos client-side de permisos a nivel organización
  (ej. esconder un botón si el usuario no tiene `content:publish`).
  Pero el chequeo real y autoritativo se hace en el api-worker con
  `requireOrgPermission`. No confíes en el cliente para autorización.
- **Diferencia con `public-web`**: este panel es para usuarios
  logueados que son miembros de la organización. La sesión, la org
  activa y los roles se gestionan vía Better Auth.
- **Diferencia con `console`**: console es para tu equipo de
  plataforma (owner/admin/support), no para clientes.
