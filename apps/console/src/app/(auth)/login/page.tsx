"use client"

import { ShieldCheck } from "lucide-react"
import { Toaster } from "sonner"

import { Login } from "@repo/ui/components/auth"

import { authService } from "@/lib/services"

export default function LoginPage() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <Login
        authClient={authService}
        redirectUrl="/organizations"
        methods={["password"]}
        brand={{
          name: "SaaS Core · Console",
          icon: <ShieldCheck className="size-5" />,
        }}
        subtitle="Acceso restringido — solo staff de plataforma"
        featureCard={{
          icon: <ShieldCheck className="size-8" />,
          title: "Acceso de plataforma",
          description:
            "Solo personal autorizado. Tus acciones quedan registradas para auditoría.",
        }}
        pageFooter={null}
      />
    </>
  )
}
