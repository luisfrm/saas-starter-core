import * as React from "react"
import { Mail, Lock, Search, X } from "lucide-react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "./input"

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: "Escribe algo..." },
}

export const WithLabel: Story = {
  args: { label: "Email", placeholder: "tu@email.com", type: "email" },
}

export const WithLeftIcon: Story = {
  args: {
    leftIcon: <Search />,
    placeholder: "Buscar productos...",
  },
}

export const WithRightIcon: Story = {
  args: {
    rightIcon: <X />,
    defaultValue: "Texto con X para limpiar",
  },
}

export const EmailInput: Story = {
  args: {
    label: "Email",
    type: "email",
    leftIcon: <Mail />,
    placeholder: "tu@email.com",
    hint: "Te enviaremos un email de confirmación",
  },
}

export const PasswordInput: Story = {
  args: {
    label: "Contraseña",
    type: "password",
    leftIcon: <Lock />,
    placeholder: "••••••••",
  },
}

export const StatusLoading: Story = {
  args: {
    label: "Validando",
    defaultValue: "usuario@ejemplo.com",
    leftIcon: <Mail />,
    status: "loading",
    hint: "Verificando disponibilidad...",
  },
}

export const StatusSuccess: Story = {
  args: {
    label: "Email",
    defaultValue: "usuario@ejemplo.com",
    leftIcon: <Mail />,
    status: "success",
    hint: "Email disponible",
  },
}

export const StatusError: Story = {
  args: {
    label: "Email",
    defaultValue: "no-es-un-email",
    leftIcon: <Mail />,
    status: "error",
    error: "El email no tiene un formato válido",
  },
}

export const Disabled: Story = {
  args: {
    label: "Email",
    defaultValue: "deshabilitado@ejemplo.com",
    leftIcon: <Mail />,
    disabled: true,
  },
}

export const AllStates: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Input label="Default" placeholder="Placeholder..." />
      <Input
        label="Loading"
        defaultValue="verificando@ejemplo.com"
        leftIcon={<Mail />}
        status="loading"
        hint="Validando..."
      />
      <Input
        label="Success"
        defaultValue="disponible@ejemplo.com"
        leftIcon={<Mail />}
        status="success"
        hint="Email disponible"
      />
      <Input
        label="Error"
        defaultValue="no-valido"
        leftIcon={<Mail />}
        status="error"
        error="Formato inválido"
      />
      <Input
        label="Search"
        leftIcon={<Search />}
        rightIcon={<X />}
        placeholder="Buscar..."
      />
    </div>
  ),
}
