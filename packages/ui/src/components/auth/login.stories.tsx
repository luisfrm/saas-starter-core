import * as React from "react"
import { LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react"
import { Toaster, toast } from "sonner"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { Login } from "./login"
import type { AuthClient } from "./login-form"

const meta = {
  title: "Auth/Login",
  component: Login,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <>
        <Toaster richColors position="top-right" />
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof Login>

export default meta

type Story = StoryObj<typeof meta>

const baseMockClient: AuthClient = {
  signIn: {
    email: async ({ email, password }) => {
      await new Promise((r) => setTimeout(r, 1200))
      if (email === "error@ejemplo.com") {
        return { error: { message: "Credenciales inválidas" } }
      }
      toast.success("Login simulado exitoso", {
        description: `${email} / ${password.replace(/./g, "•")}`,
      })
      return { error: null }
    },
    social: async ({ provider }) => {
      await new Promise((r) => setTimeout(r, 600))
      toast.success(`OAuth simulado: ${provider}`)
      return { error: null }
    },
  },
}

export const Default: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/dashboard",
    methods: ["password", "google", "github"],
    forgotPasswordUrl: "/forgot-password",
    signupUrl: "/signup",
    heading: "Bienvenido",
    subtitle: "Ingresa a tu cuenta para continuar",
    footer: (
      <p>
        ¿No tienes cuenta?{" "}
        <a
          href="/signup"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Regístrate
        </a>
      </p>
    ),
  },
}

export const DarkTheme: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/dashboard",
    methods: ["password", "google", "github"],
    forgotPasswordUrl: "/forgot-password",
    brand: {
      name: "SaaS Core · Panel",
      icon: <LayoutDashboard className="size-5" />,
    },
    subtitle: "Accede a tu organización",
    featureCard: {
      icon: <LayoutDashboard className="size-8" />,
      title: "Panel de organización",
      description:
        "Gestiona tu equipo, membresías y configuración desde un solo lugar.",
    },
    footer: (
      <p>
        ¿No tienes cuenta? Contacta a tu administrador para que te invite.
      </p>
    ),
  },
  render: (args) => (
    <div className="dark">
      <Login {...args} />
    </div>
  ),
}

export const PasswordOnly: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/organizations",
    methods: ["password"],
    brand: {
      name: "SaaS Core · Console",
      icon: <ShieldCheck className="size-5" />,
    },
    subtitle: "Acceso restringido — solo staff de plataforma",
    featureCard: {
      icon: <ShieldCheck className="size-8" />,
      title: "Acceso de plataforma",
      description:
        "Solo personal autorizado. Tus acciones quedan registradas para auditoría.",
    },
    pageFooter: null,
  },
}

export const NoFeatureCard: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/dashboard",
    methods: ["password", "google", "github"],
    forgotPasswordUrl: "/forgot-password",
    signupUrl: "/signup",
    featureCard: null,
  },
}

export const OAuthOnly: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/dashboard",
    methods: ["google", "github"],
    subtitle: "Continúa con tu cuenta social preferida",
    brand: {
      name: "SaaS Core",
      icon: <Sparkles className="size-5" />,
    },
    featureCard: {
      icon: <Sparkles className="size-8" />,
      title: "Acceso sin fricción",
      description: "Sin contraseñas, sin formularios largos. Un click y listo.",
    },
    signupUrl: "/signup",
  },
}

export const Mobile: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/dashboard",
    methods: ["password", "google", "github"],
    forgotPasswordUrl: "/forgot-password",
    signupUrl: "/signup",
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
}
