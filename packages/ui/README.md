# packages/ui

Componentes compartidos entre los 3 frontends (`public-web`, `panel`,
`console`). Sigue la guía oficial de shadcn/ui para monorepos con
Tailwind v4.

## Variables de entorno

Ninguna. Es código puro + estilos.

## Setup (ya hecho en este starter)

El paquete ya está inicializado con:
- `tsconfig.json` con paths para `#components/*`, `#lib/*`, `#hooks/*`.
- `components.json` apuntando a `src/styles/globals.css` con estilo
  `new-york`, base `neutral` y variables CSS.
- `src/lib/utils.ts` con la función `cn()` (clsx + tailwind-merge).
- `src/styles/tokens.css` — tokens editables (colores de marca, fonts,
  radius, sombras).
- `src/styles/globals.css` — `@import "tailwindcss"` + `@theme inline`
  + `@layer base`.
- `src/components/ui/{button,card,input,label,badge,separator,skeleton}.tsx`
  — componentes shadcn preinstalados.
- `postcss.mjs` con el plugin de Tailwind v4 (re-exportado por los
  frontends desde su propio `postcss.config.mjs`).

## Cómo agregar un componente nuevo

Desde la raíz del monorepo:

```bash
pnpm --filter @repo/ui dlx shadcn@latest add dialog dropdown-menu sonner
```

El CLI detecta la estructura monorepo por el `components.json` y deja
los componentes en `src/components/ui/`.

## Cómo usar un componente en un frontend

Importar desde `@repo/ui/components/ui/<componente>` (no del barrel
`@repo/ui` — así se preserva tree-shaking):

```tsx
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
```

Las apps ya tienen `transpilePackages: ["@repo/ui", "@repo/shared"]`
en su `next.config.ts`.

## Customizar el tema (al clonar el repo)

Editá **solo** `src/styles/tokens.css`. Los valores que típicamente se
ajustan al clonar para un proyecto nuevo:

```css
:root {
  --primary: oklch(0.5 0.2 250);            /* tu color de marca */
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.95 0 0);
  --secondary-foreground: oklch(0.2 0 0);
  /* ... */
}
```

Cambiá también los valores de `.dark` para tu modo oscuro. El archivo
`globals.css` los mapea automáticamente a utilidades de Tailwind
(`bg-primary`, `text-foreground`, `rounded-md`, `shadow-lg`, etc.).

## Estructura

```
src/
  styles/
    tokens.css     ← ÚNICO archivo a editar para cambiar el tema
    globals.css    ← @import tailwindcss + @theme inline (no tocar)
  components/
    ui/            ← Componentes shadcn (button, card, input, ...)
  lib/
    utils.ts       ← cn()
  index.ts         ← re-exports
postcss.mjs        ← config de Tailwind v4
components.json    ← config del CLI de shadcn
tsconfig.json
```

## Detalles importantes

- **No agregar lógica de negocio acá**. Solo UI pura.
- **El barrel `import { Button } from "@repo/ui"` está deshabilitado** a
  propósito: importar desde `@repo/ui/components/ui/button` permite
  tree-shaking. Si tree-shaking no es problema, podés re-exportar desde
  `src/index.ts` y usar `@repo/ui/button`.
- **Componentes client-side**: si un componente usa hooks, eventos o
  state, debe llevar `"use client"` en su primera línea. Los actuales
  (label, separator) ya lo tienen.
- **Modo oscuro**: las apps usan `next-themes` con `defaultTheme: "system"`.
  El toggle manual es un pendiente de UI (ver AGENTS.md).
