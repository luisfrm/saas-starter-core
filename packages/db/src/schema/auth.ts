// ⚠️ ARCHIVO PLACEHOLDER — este archivo se SOBREESCRIBE al correr:
//
//   npx @better-auth/cli generate
//
// desde apps/api-worker (lee la config de src/lib/auth.ts, incluyendo
// los plugins `admin` y `organization`, y genera aquí las tablas
// reales: user, session, account, verification, organization, member,
// invitation, etc.)
//
// Se deja este stub mínimo únicamente para que el resto del monorepo
// (billing.ts, que referencia `organization`) compile antes de correr
// el generador por primera vez. NO EDITES ESTE ARCHIVO A MANO una vez
// generado — vuelve a correr el comando de arriba si cambias algo en
// la config de plugins.

import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role"), // agregado por el plugin `admin`
  banned: boolean("banned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // owner | admin | manager | member
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
