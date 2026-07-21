import * as React from "react"
import { Sparkles } from "lucide-react"
import { Toaster, toast } from "sonner"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { AuthCard } from "./auth-card"
import { LoginForm } from "./login-form"
import type { AuthClient } from "./login-form"

const meta = {
  title: "Auth/AuthCard",
  component: AuthCard,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <>
        <Toaster richColors position="top-right" />
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof AuthCard>

export default meta

type Story = StoryObj<typeof meta>

export const LightVariant: Story = {
  args: {
    title: "Bienvenido",
    subtitle: "Ingresa a tu cuenta para continuar",
    logo: <Sparkles className="size-6" />,
    variant: "light",
    children: <div className="text-sm text-muted-foreground">Contenido del form</div>,
  },
}

export const DarkVariant: Story = {
  args: {
    title: "Console",
    subtitle: "Acceso para staff de plataforma",
    logo: <Sparkles className="size-6" />,
    variant: "dark",
    children: <div className="text-sm text-muted-foreground">Contenido del form</div>,
  },
}

export const WithFooter: Story = {
  args: {
    title: "Inicia sesión",
    subtitle: "Ingresa tus credenciales",
    variant: "light",
    children: <div className="text-sm text-muted-foreground">Contenido</div>,
    footer: (
      <p>
        ¿No tienes cuenta?{" "}
        <a className="font-medium text-primary underline-offset-4 hover:underline">
          Regístrate
        </a>
      </p>
    ),
  },
}

const mockAuthClient: AuthClient = {
  signIn: {
    email: async () => {
      await new Promise((r) => setTimeout(r, 1500))
      return { error: { message: "Email o contraseña incorrectos" } }
    },
    social: async ({ provider }) => {
      await new Promise((r) => setTimeout(r, 800))
      toast.success(`OAuth ${provider} simulado`)
      return { error: null }
    },
  },
}

export const WithLoginForm: Story = {
  args: {
    title: "Bienvenido",
    subtitle: "Ingresa a tu cuenta",
    variant: "light",
    children: (
      <LoginForm
        authClient={mockAuthClient}
        redirectUrl="/dashboard"
        forgotPasswordUrl="/forgot-password"
        signupUrl="/signup"
      />
    ),
  },
}
