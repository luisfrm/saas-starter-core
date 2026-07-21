"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Ingresa un email válido"),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export type ForgotPasswordAuthClient = {
  requestPasswordReset: (args: {
    email: string
    redirectTo: string
  }) => Promise<{ error: { message: string } | null }>
  /**
   * @deprecated Better Auth v1.6.23 usa `requestPasswordReset`.
   * Mantenido por compatibilidad con adapters antiguos.
   */
  forgetPassword?: (args: {
    email: string
    redirectTo: string
  }) => Promise<{ error: { message: string } | null }>
}

export interface ForgotPasswordFormProps {
  authClient: ForgotPasswordAuthClient
  /** URL a donde el usuario será redirigido después de hacer click en el email. */
  resetUrl: string
  /** Link para volver al login. */
  loginUrl?: string
  onSuccess?: () => void
}

function ForgotPasswordForm({
  authClient,
  resetUrl,
  loginUrl,
  onSuccess,
}: ForgotPasswordFormProps) {
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [submittedEmail, setSubmittedEmail] = React.useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const { error } = await (authClient.requestPasswordReset
        ? authClient.requestPasswordReset({
            email: values.email,
            redirectTo: resetUrl,
          })
        : authClient.forgetPassword!({
            email: values.email,
            redirectTo: resetUrl,
          }))
      if (error) {
        toast.error("No pudimos enviar el enlace", {
          description: error.message,
        })
        return
      }
      setSubmittedEmail(values.email)
      setSubmitted(true)
      toast.success("Enlace enviado", {
        description: "Revisa tu bandeja de entrada.",
      })
      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      toast.error("Error inesperado", { description: message })
    } finally {
      setSubmitting(false)
    }
  })

  const isLoading = submitting || isSubmitting

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-500">
          <CheckCircle2 className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">Revisa tu email</h2>
          <p className="text-sm text-muted-foreground">
            Si la cuenta existe para{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>,
            te enviamos un enlace para restablecer tu contraseña.
          </p>
        </div>
        {loginUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = loginUrl)}
          >
            <ArrowLeft className="size-4" />
            Volver al inicio de sesión
          </Button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="tu@email.com"
        leftIcon={<Mail className="size-4" />}
        status={errors.email ? "error" : "default"}
        error={errors.email?.message}
        disabled={isLoading}
        {...register("email")}
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar enlace de recuperación"
        )}
      </Button>

      {loginUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-center"
          onClick={() => (window.location.href = loginUrl)}
        >
          <ArrowLeft className="size-4" />
          Volver al inicio de sesión
        </Button>
      )}
    </form>
  )
}

export { ForgotPasswordForm }
