"use client"

import { Sparkles } from "lucide-react"
import { Toaster } from "sonner"

import { AuthCard, LoginForm } from "@repo/ui/components/auth"

import { authService } from "@/lib/services"

export default function LoginPage() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <AuthCard
        title="Bienvenido"
        subtitle="Ingresa a tu cuenta para continuar"
        logo={<Sparkles className="size-6" />}
        variant="light"
        footer={
          <p>
            ¿No tienes cuenta?{" "}
            <a
              href="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Regístrate
            </a>
          </p>
        }
      >
        <LoginForm
          authClient={authService}
          redirectUrl="/dashboard"
          methods={["password", "google", "github"]}
          forgotPasswordUrl="/forgot-password"
          signupUrl="/signup"
        />
      </AuthCard>
    </>
  )
}
