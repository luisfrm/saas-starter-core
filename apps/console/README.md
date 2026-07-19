# apps/console

Next.js — panel interno para tu equipo de plataforma (no para clientes).
Acá entran los roles `owner`, `admin`, `support`: gente que crea
organizaciones nuevas, aprueba/suspende clientes, hace soporte.

## Variables de entorno

| Variable | Tipo | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **pública** (visible en el browser) | URL del api-worker |

## Dev local

```bash
pnpm dev                          # levanta todo (turbo)
# o solo esta app:
pnpm --filter console run dev
```

Queda en `http://localhost:3002`. Requiere que `api-worker` esté
corriendo.

## Deploy (Vercel)

1. Crear un proyecto en Vercel apuntando a `apps/console`.
2. Configurar `NEXT_PUBLIC_API_URL` apuntando al api-worker de
   producción.
3. Push o `vercel --prod`.

**Restringí el acceso a este deploy.** A diferencia de public-web
(visitantes) y panel (clientes), console es solo para tu equipo.
Opciones:
- Vercel Password Protection (Settings → Deployment Protection).
- Auth0/Cloudflare Access por delante de la URL.
- Un simple allowlist por IP.

Por defecto, cualquiera con la URL puede llegar al login. Sumá una capa
extra antes de production.

## Estructura

```
src/
  app/
    layout.tsx
    page.tsx     Placeholder — reemplazar con la UI del panel interno
  lib/
    auth-client.ts Better Auth client con adminClient + platformAc
                   (los roles de plataforma) + organizationClient
                   (para listar/gestionar TODAS las organizaciones)
```

## Detroles importantes

- **`auth-client.ts` usa `adminClient` con `platformAc`/`platformRoles`**:
  habilita chequeos client-side de permisos de plataforma (ej.
  esconder acciones de ban si el usuario no es admin). Como siempre,
  el chequeo autoritativo es server-side en el api-worker con
  `requirePlatformPermission`.
- **Diferencia con `panel`**: console maneja roles de plataforma
  (los tuyos), no de organización. Los permisos no se mezclan: para
  crear una organización usás `requirePlatformPermission({ organization: ["create"] })`,
  para invitar miembros a una organización existente usás
  `requireOrgPermission({ member: ["invite"] })` (en el panel).
- **Rutas más comunes que vas a necesitar acá**: listar todas las
  organizaciones, aprobar/suspender, ban/unban de usuarios, ver
  métricas, impersonation. Todas protegidas con guards de
  plataforma.
