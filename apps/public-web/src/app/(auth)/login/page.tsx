"use client"

import { Sparkles } from "lucide-react"
import { Toaster } from "sonner"

import { Login } from "@repo/ui/components/auth"

import { authService } from "@/lib/services"

export default function LoginPage() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <Login
        authClient={authService}
        redirectUrl="/dashboard"
        methods={["password", "google", "github"]}
        forgotPasswordUrl="/forgot-password"
        signupUrl="/signup"
        heading="Bienvenido"
        subtitle="Ingresa a tu cuenta para continuar"
        featureCard={{
          icon: <Sparkles className="size-8" />,
          title: "Acceso unificado",
          description:
            "Un solo login para el panel de tu organización y todas las apps comerciales.",
        }}
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
      />
    </>
  )
}
