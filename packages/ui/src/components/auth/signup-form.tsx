"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Mail, Lock, Eye, EyeOff, User, UserCircle2 } from "lucide-react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Separator } from "../ui/separator"

const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "El nombre es obligatorio")
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(50, "El nombre es demasiado largo")
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "Solo letras y espacios"),
    lastName: z
      .string()
      .min(1, "El apellido es obligatorio")
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .max(50, "El apellido es demasiado largo")
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "Solo letras y espacios"),
    email: z
      .string()
      .min(1, "El email es obligatorio")
      .email("Ingresa un email válido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
      .regex(/[a-z]/, "Debe incluir al menos una minúscula")
      .regex(/[0-9]/, "Debe incluir al menos un número"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    acceptTerms: z
      .boolean()
      .refine((v) => v === true, "Debes aceptar los términos y condiciones"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export type SignupFormValues = z.infer<typeof signupSchema>

export type SignupAuthClient = {
  signUp: {
    email: (args: {
      email: string
      password: string
      name: string
      firstName: string
      lastName: string
    }) => Promise<{ error: { message: string } | null }>
  }
  signIn: {
    social: (args: {
      provider: "google" | "github"
      callbackURL: string
    }) => Promise<{ error: { message: string } | null }>
  }
}

export interface SignupFormProps {
  authClient: SignupAuthClient
  redirectUrl: string
  methods?: Array<"password" | "google" | "github">
  termsUrl?: string
  privacyUrl?: string
  loginUrl?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ caracteres", ok: password.length >= 8 },
    { label: "Mayúscula", ok: /[A-Z]/.test(password) },
    { label: "Minúscula", ok: /[a-z]/.test(password) },
    { label: "Número", ok: /[0-9]/.test(password) },
  ]
  const passed = checks.filter((c) => c.ok).length

  if (!password) return null

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              passed >= i
                ? passed <= 1
                  ? "bg-destructive"
                  : passed <= 2
                    ? "bg-orange-500"
                    : passed <= 3
                      ? "bg-yellow-500"
                      : "bg-green-500"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
        {checks.map((c) => (
          <li
            key={c.label}
            className={c.ok ? "text-green-600 dark:text-green-500" : ""}
          >
            {c.ok ? "✓" : "○"} {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SignupForm({
  authClient,
  redirectUrl,
  methods = ["password", "google", "github"],
  termsUrl,
  privacyUrl,
  loginUrl,
  onSuccess,
  onError,
}: SignupFormProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [oauthLoading, setOauthLoading] = React.useState<"google" | "github" | null>(
    null
  )

  const showPasswordSignup = methods.includes("password")
  const showGoogle = methods.includes("google")
  const showGithub = methods.includes("github")
  const showAnyOAuth = showGoogle || showGithub
  const showSeparator = showPasswordSignup && showAnyOAuth

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
    mode: "onBlur",
  })

  const passwordValue = watch("password") ?? ""

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const fullName = `${values.firstName} ${values.lastName}`.trim()
      const { error } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: fullName,
        firstName: values.firstName,
        lastName: values.lastName,
      })
      if (error) {
        setError("root", { message: error.message })
        toast.error("No pudimos crear tu cuenta", {
          description: error.message,
        })
        onError?.(error.message)
        return
      }
      toast.success("Cuenta creada", {
        description: "Revisa tu email para confirmar la cuenta.",
      })
      onSuccess?.()
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
      {showPasswordSignup && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              type="text"
              autoComplete="given-name"
              placeholder="Juan"
              leftIcon={<User className="size-4" />}
              status={errors.firstName ? "error" : "default"}
              error={errors.firstName?.message}
              disabled={isLoading}
              {...register("firstName")}
            />
            <Input
              label="Apellido"
              type="text"
              autoComplete="family-name"
              placeholder="Pérez"
              leftIcon={<UserCircle2 className="size-4" />}
              status={errors.lastName ? "error" : "default"}
              error={errors.lastName?.message}
              disabled={isLoading}
              {...register("lastName")}
            />
          </div>

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
              autoComplete="new-password"
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
            <PasswordStrength password={passwordValue} />
          </div>

          <Input
            label="Confirmar contraseña"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            leftIcon={<Lock className="size-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="flex size-full cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            }
            status={errors.confirmPassword ? "error" : "default"}
            error={errors.confirmPassword?.message}
            disabled={isLoading}
            showStatusIcon={false}
            {...register("confirmPassword")}
          />

          <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-input text-primary focus:ring-2 focus:ring-ring/50"
              disabled={isLoading}
              {...register("acceptTerms")}
            />
            <span>
              Acepto los{" "}
              {termsUrl && (
                <a
                  href={termsUrl}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  términos y condiciones
                </a>
              )}
              {!termsUrl && "términos y condiciones"}
              {privacyUrl && (
                <>
                  {" "}
                  y la{" "}
                  <a
                    href={privacyUrl}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    política de privacidad
                  </a>
                </>
              )}
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="-mt-2 text-sm text-destructive" role="alert">
              {errors.acceptTerms.message}
            </p>
          )}

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
                Creando cuenta...
              </>
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </>
      )}

      {showSeparator && (
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            o regístrate con
          </span>
          <Separator className="flex-1" />
        </div>
      )}

      {showAnyOAuth && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {showGoogle && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
              onClick={() => handleOAuth("google")}
            >
              {oauthLoading === "google" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Google
            </Button>
          )}
          {showGithub && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
              onClick={() => handleOAuth("github")}
            >
              {oauthLoading === "github" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              GitHub
            </Button>
          )}
        </div>
      )}

      {loginUrl && (
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <a
            href={loginUrl}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Inicia sesión
          </a>
        </p>
      )}
    </form>
  )
}

export { SignupForm }
