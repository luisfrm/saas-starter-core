import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Separator } from "./separator"

const meta = {
  title: "UI/Separator",
  component: Separator,
  argTypes: {
    orientation: {
      control: { type: "select" },
      options: ["horizontal", "vertical"],
    },
    decorative: { control: "boolean" },
  },
  args: {
    orientation: "horizontal",
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-4">
      <span className="text-sm">Home</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Pricing</span>
      <Separator orientation="vertical" />
      <span className="text-sm">About</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Contact</span>
    </div>
  ),
}

export const InContent: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div>
        <h4 className="text-sm font-medium">Plan</h4>
        <p className="text-sm text-muted-foreground">Pro · $20/month</p>
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-medium">Status</h4>
        <p className="text-sm text-muted-foreground">Active</p>
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-medium">Renews on</h4>
        <p className="text-sm text-muted-foreground">January 1, 2027</p>
      </div>
    </div>
  ),
}
