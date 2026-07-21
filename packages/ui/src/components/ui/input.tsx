import * as React from "react"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { cn } from "../../lib/utils"

const inputStatusStyles = {
  default: "",
  loading: "[&:not(:focus)]:pr-10",
  success:
    "border-green-500/60 focus-visible:border-green-500 focus-visible:ring-green-500/20 dark:border-green-500/40",
  error:
    "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
} as const

function Input({
  className,
  type,
  leftIcon,
  rightIcon,
  status = "default",
  error,
  hint,
  label,
  id,
  wrapperClassName,
  showStatusIcon = true,
  ...props
}: React.ComponentProps<"input"> & {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  status?: "default" | "loading" | "success" | "error"
  error?: string
  hint?: string
  label?: string
  wrapperClassName?: string
  showStatusIcon?: boolean
}) {
  const inputId = id ?? React.useId()
  const hasError = status === "error" || !!error
  const effectiveStatus = hasError ? "error" : status

  const showRightIcon = rightIcon ?? (showStatusIcon && effectiveStatus !== "default")

  return (
    <div className={cn("flex w-full flex-col gap-1.5", wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm leading-none font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span
            className="pointer-events-none absolute left-3 flex size-4 items-center justify-center text-muted-foreground"
            aria-hidden
          >
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          type={type}
          data-slot="input"
          data-status={effectiveStatus}
          aria-invalid={hasError || undefined}
          aria-describedby={
            hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={cn(
            "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
            leftIcon && "pl-9",
            showRightIcon && "pr-9",
            inputStatusStyles[effectiveStatus as keyof typeof inputStatusStyles],
            className
          )}
          {...props}
        />

        {showRightIcon && (
          <span
            className="absolute right-3 flex size-4 items-center justify-center text-muted-foreground [&>svg]:size-4"
            aria-hidden
          >
            {effectiveStatus === "loading" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : effectiveStatus === "success" ? (
              <CheckCircle2 className="size-4 text-green-500" />
            ) : effectiveStatus === "error" ? (
              <AlertCircle className="size-4 text-destructive" />
            ) : (
              rightIcon
            )}
          </span>
        )}
      </div>

      {hasError && error && (
        <p
          id={`${inputId}-error`}
          className="flex items-center gap-1 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      )}

      {!hasError && hint && (
        <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}

export { Input }
export type { inputStatusStyles }
