"use client"

import { LayoutDashboard } from "lucide-react"
import { Toaster } from "sonner"

import { AuthCard, ForgotPasswordForm } from "@repo/ui/components/auth"

import { authService } from "@/lib/services"

export default function ForgotPasswordPage() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <AuthCard
        title="Recuperar contraseña"
        subtitle="Te enviaremos un enlace para restablecerla"
        logo={<LayoutDashboard className="size-6" />}
        variant="dark"
      >
        <ForgotPasswordForm
          authClient={authService}
          resetUrl="/reset-password"
          loginUrl="/login"
        />
      </AuthCard>
    </>
  )
}
