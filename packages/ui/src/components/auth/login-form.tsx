"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Separator } from "../ui/separator"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Ingresa un email válido"),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
  rememberMe: z.boolean().optional(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export type AuthClient = {
  signIn: {
    email: (args: {
      email: string
      password: string
      rememberMe?: boolean
    }) => Promise<{ error: { message: string } | null }>
    social: (args: {
      provider: "google" | "github"
      callbackURL: string
    }) => Promise<{ error: { message: string } | null }>
  }
}

export interface LoginFormProps {
  /** Auth client inyectado por la app (Better Auth o cualquier otro). */
  authClient: AuthClient
  /** URL a donde redirigir después del login exitoso. */
  redirectUrl: string
  /** Métodos disponibles. Si no se pasa, se muestran todos. */
  methods?: Array<"password" | "google" | "github">
  /** Link a la página de recuperación. */
  forgotPasswordUrl?: string
  /** Link a la página de registro. */
  signupUrl?: string
  /** Callback opcional post-login exitoso. */
  onSuccess?: () => void
  /** Callback opcional post-login fallido. */
  onError?: (error: string) => void
}

function OAuthButton({
  provider,
  onClick,
  loading,
}: {
  provider: "google" | "github"
  onClick: () => void
  loading: boolean
}) {
  const label = provider === "google" ? "Google" : "GitHub"
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={onClick}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
    </Button>
  )
}

function LoginForm({
  authClient,
  redirectUrl,
  methods = ["password", "google", "github"],
  forgotPasswordUrl,
  signupUrl,
  onSuccess,
  onError,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [oauthLoading, setOauthLoading] = React.useState<"google" | "github" | null>(
    null
  )

  const showPasswordLogin = methods.includes("password")
  const showGoogle = methods.includes("google")
  const showGithub = methods.includes("github")
  const showAnyOAuth = showGoogle || showGithub
  const showSeparator = showPasswordLogin && showAnyOAuth

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
    mode: "onBlur",
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      })
      if (error) {
        setError("root", { message: error.message })
        toast.error("No pudimos iniciar sesión", {
          description: error.message,
        })
        onError?.(error.message)
        return
      }
      toast.success("Sesión iniciada", {
        description: "Redirigiendo...",
      })
      onSuccess?.()
      // window.location para que la cookie de sesión se aplique en la siguiente navegación
      window.location.href = redirectUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      setError("root", { message })
      toast.error("Error inesperado", { description: message })
    } finally {
      setSubmitting(false)
    }
  })

  async function handleOAuth(provider: "google" | "github") {
    setOauthLoading(provider)
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: redirectUrl,
      })
      if (error) {
        toast.error(`No pudimos continuar con ${provider}`, {
          description: error.message,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      toast.error("Error inesperado", { description: message })
    } finally {
      setOauthLoading(null)
    }
  }

  const isLoading = submitting || isSubmitting || oauthLoading !== null

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {showPasswordLogin && (
        <>
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

          <div className="space-y-1.5">
            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock className="size-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex size-full cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
              status={errors.password ? "error" : "default"}
              error={errors.password?.message}
              disabled={isLoading}
              showStatusIcon={false}
              {...register("password")}
            />
            {forgotPasswordUrl && (
              <div className="flex justify-end">
                <a
                  href={forgotPasswordUrl}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-input text-primary focus:ring-2 focus:ring-ring/50"
              disabled={isLoading}
              {...register("rememberMe")}
            />
            <span>Recordarme</span>
          </label>

          {errors.root && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {errors.root.message}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-2 w-full"
            disabled={isLoading}
          >
            {submitting || isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </>
      )}

      {showSeparator && (
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            o continúa con
          </span>
          <Separator className="flex-1" />
        </div>
      )}

      {showAnyOAuth && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {showGoogle && (
            <OAuthButton
              provider="google"
              loading={oauthLoading === "google"}
              onClick={() => handleOAuth("google")}
            />
          )}
          {showGithub && (
            <OAuthButton
              provider="github"
              loading={oauthLoading === "github"}
              onClick={() => handleOAuth("github")}
            />
          )}
        </div>
      )}

      {signupUrl && (
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <a
            href={signupUrl}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Regístrate
          </a>
        </p>
      )}
    </form>
  )
}

export { LoginForm }
