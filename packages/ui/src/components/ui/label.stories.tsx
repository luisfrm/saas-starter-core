import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input } from "./input"
import { Label } from "./label"

const meta = {
  title: "UI/Label",
  component: Label,
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
}

export const WithRequired: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="username">
        Username <span className="text-destructive">*</span>
      </Label>
      <Input id="username" type="text" placeholder="Choose a username" />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="group flex flex-col gap-1.5" data-disabled="true">
      <Label htmlFor="locked">Locked field</Label>
      <Input id="locked" type="text" disabled defaultValue="Cannot edit" />
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <form className="flex w-80 flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" type="text" placeholder="Your full name" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email-form">Email</Label>
        <Input id="email-form" type="email" placeholder="you@example.com" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password-form">Password</Label>
        <Input id="password-form" type="password" placeholder="••••••••" />
      </div>
    </form>
  ),
}
