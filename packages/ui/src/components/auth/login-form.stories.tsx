import * as React from "react"
import { Toaster, toast } from "sonner"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { LoginForm } from "./login-form"
import { AuthCard } from "./auth-card"
import type { AuthClient } from "./login-form"

const meta = {
  title: "Auth/LoginForm",
  component: LoginForm,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <>
        <Toaster richColors position="top-right" />
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof LoginForm>

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

export const InAuthCard: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/dashboard",
  },
  render: (args) => (
    <AuthCard
      title="Bienvenido"
      subtitle="Ingresa a tu cuenta"
      variant="light"
    >
      <LoginForm {...args} forgotPasswordUrl="/forgot" signupUrl="/signup" />
    </AuthCard>
  ),
}

export const DarkTheme: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/dashboard",
  },
  render: (args) => (
    <div className="dark">
      <AuthCard
        title="Panel"
        subtitle="Acceso a tu organización"
        variant="dark"
      >
        <LoginForm {...args} forgotPasswordUrl="/forgot" />
      </AuthCard>
    </div>
  ),
}

export const PasswordOnly: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/dashboard",
    methods: ["password"],
  },
  render: (args) => (
    <AuthCard
      title="Console"
      subtitle="Acceso staff"
      variant="dark"
    >
      <LoginForm {...args} />
    </AuthCard>
  ),
}

export const OAuthOnly: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/dashboard",
    methods: ["google", "github"],
  },
  render: (args) => (
    <AuthCard
      title="Bienvenido"
      subtitle="Ingresa con tu cuenta"
      variant="light"
    >
      <LoginForm {...args} signupUrl="/signup" />
    </AuthCard>
  ),
}
