"use client"

import { ShieldCheck } from "lucide-react"
import { Toaster } from "sonner"

import { AuthCard, LoginForm } from "@repo/ui/components/auth"

import { authService } from "@/lib/services"

export default function LoginPage() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <AuthCard
        title="Console"
        subtitle="Acceso restringido — solo staff"
        logo={<ShieldCheck className="size-6" />}
        variant="dark"
      >
        <LoginForm
          authClient={authService}
          redirectUrl="/organizations"
          methods={["password"]}
        />
      </AuthCard>
    </>
  )
}
