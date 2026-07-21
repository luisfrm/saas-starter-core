import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const authCardVariants = cva(
  "relative flex w-full max-w-md flex-col gap-6 overflow-hidden rounded-2xl border p-8 shadow-2xl backdrop-blur-xl",
  {
    variants: {
      variant: {
        light:
          "border-zinc-200/60 bg-white/85 text-zinc-950 dark:border-zinc-200/10 dark:bg-zinc-950/70 dark:text-zinc-50",
        dark: "border-white/10 bg-zinc-950/80 text-zinc-50",
      },
    },
    defaultVariants: {
      variant: "light",
    },
  }
)

const authCardGradientVariants = cva(
  "absolute inset-0 -z-10",
  {
    variants: {
      variant: {
        light:
          "bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950",
        dark: "bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950",
      },
    },
    defaultVariants: {
      variant: "light",
    },
  }
)

const authCardGlowVariants = cva(
  "pointer-events-none absolute -z-10 rounded-full blur-3xl",
  {
    variants: {
      variant: {
        light:
          "bg-indigo-400/20 dark:bg-indigo-500/10",
        dark: "bg-indigo-500/20",
      },
    },
    defaultVariants: {
      variant: "light",
    },
  }
)

export interface AuthCardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof authCardVariants> {
  title: string
  subtitle?: string
  logo?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  /** Muestra el gradient de fondo del page (no solo el glow del card) */
  showPageGradient?: boolean
}

function AuthCard({
  className,
  variant,
  title,
  subtitle,
  logo,
  children,
  footer,
  showPageGradient = true,
  ...props
}: AuthCardProps) {
  return (
    <>
      {showPageGradient && (
        <div
          className={cn(
            "fixed inset-0 -z-20",
            authCardGradientVariants({ variant })
          )}
          aria-hidden
        />
      )}
      {showPageGradient && (
        <div
          className={cn(
            "fixed -top-32 -right-32 -z-10 size-96",
            authCardGlowVariants({ variant })
          )}
          aria-hidden
        />
      )}
      {showPageGradient && (
        <div
          className={cn(
            "fixed -bottom-32 -left-32 -z-10 size-96",
            authCardGlowVariants({ variant })
          )}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "flex min-h-svh items-center justify-center px-4 py-12"
        )}
      >
        <div
          className={cn(authCardVariants({ variant, className }))}
          {...props}
        >
          {(logo || title || subtitle) && (
            <header className="flex flex-col items-center gap-3 text-center">
              {logo && (
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
                  {logo}
                </div>
              )}
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </header>
          )}

          <div className="flex flex-col gap-4">{children}</div>

          {footer && (
            <footer className="text-center text-sm text-muted-foreground">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </>
  )
}

export { AuthCard, authCardVariants }
