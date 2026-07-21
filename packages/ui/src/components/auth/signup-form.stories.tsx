import * as React from "react"
import { Toaster, toast } from "sonner"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { SignupForm } from "./signup-form"
import { AuthCard } from "./auth-card"
import type { SignupAuthClient } from "./signup-form"

const meta = {
  title: "Auth/SignupForm",
  component: SignupForm,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <>
        <Toaster richColors position="top-right" />
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof SignupForm>

export default meta

type Story = StoryObj<typeof meta>

const baseMockClient: SignupAuthClient = {
  signUp: {
    email: async (values) => {
      await new Promise((r) => setTimeout(r, 1500))
      if (values.email === "existe@ejemplo.com") {
        return { error: { message: "Ya existe una cuenta con este email" } }
      }
      toast.success("Cuenta creada (simulado)", {
        description: `${values.firstName} ${values.lastName} - ${values.email}`,
      })
      return { error: null }
    },
  },
  signIn: {
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
    redirectUrl: "/onboarding",
  },
  render: (args) => (
    <AuthCard
      title="Crear cuenta"
      subtitle="Empieza gratis, sin tarjeta"
      variant="light"
    >
      <SignupForm {...args} loginUrl="/login" />
    </AuthCard>
  ),
}

export const DarkTheme: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/onboarding",
  },
  render: (args) => (
    <div className="dark">
      <AuthCard
        title="Únete"
        subtitle="Crea tu cuenta"
        variant="dark"
      >
        <SignupForm {...args} loginUrl="/login" />
      </AuthCard>
    </div>
  ),
}

export const PasswordOnly: Story = {
  args: {
    authClient: baseMockClient,
    redirectUrl: "/onboarding",
    methods: ["password"],
  },
  render: (args) => (
    <AuthCard
      title="Crear cuenta"
      subtitle="Con email y contraseña"
      variant="light"
    >
      <SignupForm {...args} loginUrl="/login" />
    </AuthCard>
  ),
}
