import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Mail, Plus, Settings, Trash } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Separator } from "./ui/separator"
import { Skeleton } from "./ui/skeleton"

const meta = {
  title: "Overview/Showcase",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const KitchenSink: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Design system overview
        </h1>
        <p className="text-sm text-muted-foreground">
          A single page showing how the components compose together. Useful as a
          smoke test after theme changes.
        </p>
      </header>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Buttons
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">
            <Trash /> Delete
          </Button>
          <Button variant="outline" size="icon">
            <Settings />
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Badges
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Trial</Badge>
          <Badge variant="destructive">Past due</Badge>
          <Badge variant="outline">Draft</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Form
        </h2>
        <form className="grid w-full max-w-md gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ks-email">Email</Label>
            <Input id="ks-email" type="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ks-password">Password</Label>
            <Input
              id="ks-password"
              type="password"
              placeholder="••••••••"
            />
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Card
        </h2>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>You are on the Pro plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge>Active</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Renews on</span>
              <span>Jan 1, 2027</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span>$20.00 / month</span>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Plus /> Upgrade
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Loading states
        </h2>
        <div className="flex w-full max-w-md items-center gap-3 rounded-xl border p-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Email-style action
        </h2>
        <Button>
          <Mail /> Login with Email
        </Button>
      </section>
    </div>
  ),
}
