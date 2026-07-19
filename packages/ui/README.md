# packages/ui

Componentes compartidos entre los 3 frontends (`public-web`, `panel`,
`console`). Sigue la guía oficial de shadcn/ui para monorepos.

## Variables de entorno

Ninguna.

## Estado actual

Este paquete está **vacío a propósito** en este starter: no trae
componentes shadcn preinstalados (sería código de relleno). El
`src/components/` solo tiene un `.gitkeep`.

## Setup (una vez por proyecto clonado)

Desde la raíz del monorepo:

```bash
# 1. Inicializar shadcn en este paquete
pnpm --filter @repo/ui exec npx shadcn@latest init

# 2. Agregar componentes según necesidad
pnpm --filter @repo/ui exec npx shadcn@latest add button card input ...
```

Los componentes caen en `src/components/` y se importan desde las apps
como `@repo/ui/<componente>`:

```tsx
import { Button } from "@repo/ui/button"
```

El campo `exports` del `package.json` ya está preparado como
`"./*": "./src/components/*.tsx"`.

## Estructura esperada tras inicializar

```
src/
  components/
    ui/              Componentes shadcn generados (button.tsx, card.tsx, ...)
    <otros>          Componentes custom compartidos
  index.ts           Re-exports
```

## Detalles importantes

- **El package no tiene `tsconfig.json` todavía**. shadcn init lo
  crea como parte de su setup, o podés copiar el patrón de
  `packages/shared/tsconfig.json` (extiende `tsconfig.base.json`).
- **No agregues lógica de negocio acá**. Solo UI pura. Componentes
  que necesitan datos/estado del usuario se construyen en cada app,
  no acá.
- **Tailwind**: shadcn te va a preguntar por la config de Tailwind.
  En un monorepo con Next, la convención es generar la config en este
  package y que cada app la importe via `transpilePackages` (que ya
  está configurado en sus `next.config.ts`).
- **Si una app necesita un componente que otra no usa**, dos opciones:
  meterlo igual acá y que cada app importe solo lo que necesita (más
  simple), o duplicarlo en la app que lo usa (más aislado). Para
  componentes de shadcn, la convención es vivir todos en
  `@repo/ui/components/ui/`.
