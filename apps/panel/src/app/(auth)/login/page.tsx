"use client"

import { LayoutDashboard } from "lucide-react"
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
        brand={{
          name: "SaaS Core · Panel",
          icon: <LayoutDashboard className="size-5" />,
        }}
        subtitle="Accede a tu organización"
        featureCard={{
          icon: <LayoutDashboard className="size-8" />,
          title: "Panel de organización",
          description:
            "Gestiona tu equipo, membresías y configuración desde un solo lugar.",
        }}
        footer={
          <p>
            ¿No tienes cuenta? Contacta a tu administrador para que te invite.
          </p>
        }
      />
    </>
  )
}
