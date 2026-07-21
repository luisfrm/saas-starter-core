import * as React from "react"
import { Toaster, toast } from "sonner"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { ForgotPasswordForm } from "./forgot-password-form"
import { AuthCard } from "./auth-card"
import type { ForgotPasswordAuthClient } from "./forgot-password-form"

const meta = {
  title: "Auth/ForgotPasswordForm",
  component: ForgotPasswordForm,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <>
        <Toaster richColors position="top-right" />
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof ForgotPasswordForm>

export default meta

type Story = StoryObj<typeof meta>

const baseMockClient: ForgotPasswordAuthClient = {
  requestPasswordReset: async ({ email }) => {
    await new Promise((r) => setTimeout(r, 1000))
    if (email === "error@ejemplo.com") {
      return { error: { message: "No se pudo enviar el email" } }
    }
    return { error: null }
  },
}

export const InAuthCard: Story = {
  args: {
    authClient: baseMockClient,
    resetUrl: "/reset-password",
  },
  render: (args) => (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para restablecerla"
      variant="light"
    >
      <ForgotPasswordForm {...args} loginUrl="/login" />
    </AuthCard>
  ),
}

export const DarkTheme: Story = {
  args: {
    authClient: baseMockClient,
    resetUrl: "/reset-password",
  },
  render: (args) => (
    <div className="dark">
      <AuthCard
        title="Recuperar contraseña"
        subtitle="Te enviaremos un enlace"
        variant="dark"
      >
        <ForgotPasswordForm {...args} loginUrl="/login" />
      </AuthCard>
    </div>
  ),
}
