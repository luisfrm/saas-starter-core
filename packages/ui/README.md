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
    overview.stories.tsx  ← "kitchen sink" usado en Overview/Showcase
  stories/
    introduction.mdx      ← MDX introductoria del Storybook
  lib/
    utils.ts       ← cn()
  index.ts         ← re-exports
.storybook/
  main.ts          ← builder Vite, addons, globs de stories
  preview.tsx      ← import de globals.css, decorator withThemeByClassName
postcss.mjs        ← re-exportable (lo consumen las apps Next via @repo/ui/postcss)
postcss.config.mjs ← config que Vite autodetecta al buildear Storybook local
components.json    ← config del CLI de shadcn
tsconfig.json
```

## Storybook

Este paquete corre [Storybook 10](https://storybook.js.org/) para
catalogar los componentes con controles interactivos, autodocs y
aislamiento real (iframe). Usa `@storybook/react-vite` (no
`@storybook/nextjs`) porque los componentes son React puro — no usan
`next/image` ni `next/font`.

Requiere **Node 20.19+ o 22.12+** (ESM-only).

### Comandos

```bash
pnpm --filter @repo/ui storybook        # dev server en http://localhost:6006
pnpm --filter @repo/ui build-storybook  # build estático en storybook-static/
```

### Addons incluidos

- **addons/a11y** — chequeo automático de accesibilidad sobre cada story
  (basado en axe-core). Errores aparecen en el panel "Accessibility".
- **addons/themes** — toolbar con toggle **light** ↔ **dark** que agrega
  la clase correspondiente al `<html>` (mismo mecanismo que
  `next-themes` en las apps). Implementado con `withThemeByClassName`
  en `preview.tsx`.
- **addons/docs** — autodocs (tabla de props autogenerada) + soporte MDX
  (la intro está en `src/stories/introduction.mdx`).

Los "essentials" (controls, actions, viewport, backgrounds, etc.) ya
**no son un paquete separado** en Storybook 9+ — pasaron al core. Por
eso no se listan en `addons` en `main.ts` pero igual funcionan.

### Cómo agregar una story

Al sumar un componente shadcn nuevo (`pnpm dlx shadcn@latest add …`),
creá un archivo `src/components/ui/<componente>.stories.tsx` al lado
siguiendo el patrón de los existentes (button.stories.tsx es el más
completo). Las stories se descubren automáticamente por el glob en
`.storybook/main.ts`.

Importá los tipos de `@storybook/react-vite` (no de `@storybook/react`,
que ya no se usa en v10):

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "./button"

const meta = { title: "UI/Button", component: Button } satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: { children: "Click me" } }
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
