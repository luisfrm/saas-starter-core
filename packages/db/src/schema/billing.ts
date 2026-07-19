import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core"
import { organization } from "./auth"
// ⚠️ "./auth.ts" es generado automáticamente por Better Auth CLI:
//     npx @better-auth/cli generate
// No se edita a mano. Verifica ahí el tipo real de `organization.id`
// (Better Auth usa `text` por defecto) para que el FK de abajo
// coincida exactamente.

export const planIntervalEnum = pgEnum("plan_interval", ["monthly", "yearly"])

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "expired",
])

/**
 * Catálogo de planes. Precio FIJO por plan (no por asiento/usuario),
 * según lo definido.
 */
export const plans = pgTable("plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(), // "free" | "pro" | "enterprise"
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  interval: planIntervalEnum("interval").notNull().default("monthly"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

/**
 * Catálogo de features del sistema. Genérico a propósito — al
 * clonar el starter, agrega/quita filas según el dominio real
 * (ej: "cms", "advanced_reports", "api_access").
 */
export const features = pgTable("features", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
})

/** Qué features incluye cada plan (muchos-a-muchos) */
export const planFeatures = pgTable(
  "plan_features",
  {
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    featureId: text("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.planId, t.featureId] }),
  })
)

/**
 * Qué plan tiene activo cada organización. Una organización tiene
 * como máximo una suscripción activa a la vez (por eso `.unique()`
 * en organizationId) — ajusta si en algún proyecto clonado se
 * necesita historial de múltiples suscripciones por organización.
 */
export const organizationSubscriptions = pgTable("organization_subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  status: subscriptionStatusEnum("status").notNull().default("trialing"),
  currentPeriodStart: timestamp("current_period_start").notNull().defaultNow(),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
