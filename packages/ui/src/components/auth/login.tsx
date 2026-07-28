"use client"

import * as React from "react"
import { Sparkles, ArrowRight } from "lucide-react"

import { cn } from "../../lib/utils"
import { LoginForm, type AuthClient, type LoginFormProps } from "./login-form"

export interface LoginFeatureCard {
  icon?: React.ReactNode
  title?: string
  description?: string
}

export interface LoginBrand {
  name?: string
  icon?: React.ReactNode
  href?: string
}

export interface LoginPageFooter {
  copyright?: string
  links?: Array<{ label: string; href: string }>
}

export interface LoginProps
  extends Omit<
    LoginFormProps,
    "authClient" | "redirectUrl" | "methods" | "forgotPasswordUrl" | "signupUrl"
  > {
  authClient: AuthClient
  redirectUrl: string
  methods?: LoginFormProps["methods"]
  forgotPasswordUrl?: string
  signupUrl?: string

  brand?: LoginBrand
  heading?: string
  subtitle?: string

  featureCard?: LoginFeatureCard | null

  footer?: React.ReactNode
  pageFooter?: LoginPageFooter | null

  className?: string
}

const DEFAULT_BRAND: Required<LoginBrand> = {
  name: "SaaS Core",
  icon: <Sparkles className="size-5" />,
  href: "/",
}

const DEFAULT_FEATURE_CARD: Required<LoginFeatureCard> = {
  icon: <Sparkles className="size-8" />,
  title: "Secure Enterprise Core",
  description:
    "Manage your entire operational infrastructure through our unified administrative console.",
}

const DEFAULT_PAGE_FOOTER: Required<LoginPageFooter> = {
  copyright: "© 2024 SaaS Core",
  links: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
}

const DEFAULT_HEADING = "Bienvenido"
const DEFAULT_SUBTITLE = "Ingresa a tu cuenta para continuar"

function Login({
  authClient,
  redirectUrl,
  methods,
  forgotPasswordUrl,
  signupUrl,
  brand,
  heading,
  subtitle,
  featureCard,
  footer,
  pageFooter,
  onSuccess,
  onError,
  className,
}: LoginProps) {
  const resolvedBrand = { ...DEFAULT_BRAND, ...brand }
  const resolvedHeading = heading ?? DEFAULT_HEADING
  const resolvedSubtitle = subtitle ?? DEFAULT_SUBTITLE
  const showFeatureCard = featureCard !== null
  const resolvedFeatureCard = {
    ...DEFAULT_FEATURE_CARD,
    ...(featureCard ?? {}),
  }
  const resolvedPageFooter =
    pageFooter === null
      ? null
      : { ...DEFAULT_PAGE_FOOTER, ...(pageFooter ?? {}) }

  return (
    <main
      className={cn(
        "flex min-h-svh flex-col md:flex-row",
        className
      )}
    >
      <section className="bg-background relative flex w-full flex-col md:w-1/2">
        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8 md:px-12 lg:px-16">
          <div className="flex w-full max-w-md flex-col gap-8">
            <a
              href={resolvedBrand.href}
              className="group inline-flex w-fit items-center gap-2.5 text-foreground"
            >
              <span className="from-primary to-primary/70 flex size-10 items-center justify-center rounded-lg bg-gradient-to-br text-primary-foreground shadow-sm">
                {resolvedBrand.icon}
              </span>
              <span className="text-lg font-semibold tracking-tight">
                {resolvedBrand.name}
              </span>
            </a>

            <header className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {resolvedHeading}
              </h1>
              {resolvedSubtitle && (
                <p className="text-sm text-muted-foreground">
                  {resolvedSubtitle}
                </p>
              )}
            </header>

            <LoginForm
              authClient={authClient}
              redirectUrl={redirectUrl}
              methods={methods}
              forgotPasswordUrl={forgotPasswordUrl}
              signupUrl={signupUrl}
              onSuccess={onSuccess}
              onError={onError}
            />

            {footer && (
              <div className="text-center text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </div>
        </div>

        {resolvedPageFooter && (
          <footer className="mt-auto flex flex-col items-center justify-between gap-2 border-t px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-8 md:px-12 lg:px-16">
            <span>{resolvedPageFooter.copyright}</span>
            {resolvedPageFooter.links.length > 0 && (
              <nav className="flex items-center gap-4">
                {resolvedPageFooter.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            )}
          </footer>
        )}
      </section>

      {showFeatureCard && (
        <aside
          aria-hidden
          className="bg-aurora relative hidden overflow-hidden md:flex md:w-1/2"
        >
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="bg-white/10 flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-white/20 p-10 text-center shadow-2xl backdrop-blur-xl">
              <span className="flex size-16 items-center justify-center rounded-full bg-white/20 text-white">
                {resolvedFeatureCard.icon}
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {resolvedFeatureCard.title}
              </h2>
              <p className="max-w-md text-base text-white/80">
                {resolvedFeatureCard.description}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-white/70">
                <span>Trusted access</span>
                <ArrowRight className="size-4" />
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent mix-blend-overlay" />
        </aside>
      )}
    </main>
  )
}

export { Login }
