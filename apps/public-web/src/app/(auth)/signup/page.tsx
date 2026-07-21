"use client"

import { Sparkles } from "lucide-react"
import { Toaster } from "sonner"

import { AuthCard, SignupForm } from "@repo/ui/components/auth"

import { authService } from "@/lib/services"

export default function SignupPage() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <AuthCard
        title="Crear cuenta"
        subtitle="Empieza gratis, sin tarjeta de crédito"
        logo={<Sparkles className="size-6" />}
        variant="light"
        footer={
          <p>
            ¿Ya tienes cuenta?{" "}
            <a
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Inicia sesión
            </a>
          </p>
        }
      >
        <SignupForm
          authClient={authService}
          redirectUrl="/onboarding"
          methods={["password", "google", "github"]}
          loginUrl="/login"
        />
      </AuthCard>
    </>
  )
}
