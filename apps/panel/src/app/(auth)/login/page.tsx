"use client"

import { LayoutDashboard } from "lucide-react"
import { Toaster } from "sonner"

import { AuthCard, LoginForm } from "@repo/ui/components/auth"

import { authService } from "@/lib/services"

export default function LoginPage() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <AuthCard
        title="Panel"
        subtitle="Accede a tu organización"
        logo={<LayoutDashboard className="size-6" />}
        variant="dark"
        footer={
          <p>
            ¿No tienes cuenta? Contacta a tu administrador para que te invite.
          </p>
        }
      >
        <LoginForm
          authClient={authService}
          redirectUrl="/dashboard"
          methods={["password", "google", "github"]}
          forgotPasswordUrl="/forgot-password"
        />
      </AuthCard>
    </>
  )
}
