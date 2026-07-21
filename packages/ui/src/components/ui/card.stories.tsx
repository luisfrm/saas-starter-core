import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Settings } from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"
import { Button } from "./button"

const meta = {
  title: "UI/Card",
  component: Card,
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">This is the main content of the card.</p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost">Cancel</Button>
        <Button>Submit</Button>
      </CardFooter>
    </Card>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Manage your subscription.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon">
            <Settings />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Your plan renews on Jan 1, 2027.</p>
      </CardContent>
    </Card>
  ),
}

export const Simple: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent className="pt-6">
        <p className="text-sm">A simple card with only content.</p>
      </CardContent>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Confirm action</CardTitle>
        <CardDescription>Are you sure you want to continue?</CardDescription>
      </CardHeader>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button variant="destructive">Delete</Button>
      </CardFooter>
    </Card>
  ),
}
