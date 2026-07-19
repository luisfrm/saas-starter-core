# packages/shared

Tipos, constantes y validaciones compartidas entre `api-worker` y los
frontends. Lo más importante que vive acá: el sistema de roles y
permisos (access-control).

## Variables de entorno

Ninguna. Es código puro.

## Comandos

No tiene scripts propios. Se importa desde las apps vía workspace:

```ts
import { platformAc, platformRoles, organizationAc, organizationRoles } from "@repo/shared/access-control"
```

Los frontends Next lo transpilean automáticamente (configurado en su
`next.config.ts` con `transpilePackages`).

## Estructura

```
src/
  index.ts             Re-exporta todo (agregá acá tus tipos/Zod schemas)
  access-control.ts    Catálogo de permisos y roles (plataforma + organización)
```

## Detalles importantes

- **`access-control.ts` es el único archivo que vas a editar al clonar
  este repo para un proyecto nuevo.** Es donde agregás los recursos
  y permisos del dominio (ej. `orders: ["refund", "cancel"]`). No
  requiere migración ni codegen — es código de runtime que se pasa a
  Better Auth en la config de plugins.
- **Roles fijos en código**, no en base de datos. Decisión explícita
  del starter: se ajustan todos los tenants al clonar, no por
  organización individual.
- **Dos sistemas de permisos separados**:
  - `platformAc` / `platformRoles` → roles de TU equipo (owner, admin, support)
  - `organizationAc` / `organizationRoles` → roles del equipo de cada cliente
  Nunca los mezcles en un mismo chequeo de autorización.
- **Zod y Better Auth** son dependencias directas porque este package
  exporta tipos que los referencian. Si vas a sumar schemas de Zod
  para validación de inputs (ej. `CreateOrderInput`), importalos
  desde acá y reexportá desde `index.ts` para usarlos en api-worker y
  los frontends.
