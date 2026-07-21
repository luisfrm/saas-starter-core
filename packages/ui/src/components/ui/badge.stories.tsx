import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Badge } from "./badge"

const meta = {
  title: "UI/Badge",
  component: Badge,
  argTypes: {
    asChild: { table: { disable: true } },
    variant: {
      control: { type: "select" },
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "ghost",
        "link",
      ],
    },
  },
  args: {
    children: "Badge",
    variant: "default",
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  ),
}

export const StatusExamples: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="default">Active</Badge>
        <span className="text-sm text-muted-foreground">account is active</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Trial</Badge>
        <span className="text-sm text-muted-foreground">7 days remaining</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="destructive">Overdue</Badge>
        <span className="text-sm text-muted-foreground">payment failed</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">Draft</Badge>
        <span className="text-sm text-muted-foreground">not published</span>
      </div>
    </div>
  ),
}
