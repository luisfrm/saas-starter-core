import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input } from "./input"

const meta = {
  title: "UI/Input",
  component: Input,
  argTypes: {
    type: {
      control: { type: "select" },
      options: [
        "text",
        "email",
        "password",
        "number",
        "search",
        "tel",
        "url",
        "date",
        "file",
      ],
    },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  args: {
    type: "text",
    placeholder: "Type something...",
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithValue: Story = {
  args: { defaultValue: "Hello world" },
}

export const Disabled: Story = {
  args: { disabled: true, placeholder: "Disabled input" },
}

export const File: Story = {
  args: { type: "file" },
}

export const Invalid: Story = {
  args: {
    placeholder: "Invalid input",
    "aria-invalid": true,
    defaultValue: "wrong value",
  },
}

export const AllTypes: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Input type="text" placeholder="Text" />
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="Number" />
      <Input type="search" placeholder="Search..." />
      <Input type="date" />
      <Input type="file" />
    </div>
  ),
}
