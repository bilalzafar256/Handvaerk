import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
  json,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  clerkId:      text("clerk_id").unique().notNull(),
  email:        text("email"),
  phone:        text("phone"),
  companyName:  text("company_name"),
  cvrNumber:    text("cvr_number"),
  addressLine1: text("address_line1"),
  addressCity:  text("address_city"),
  addressZip:   text("address_zip"),
  hourlyRate:   numeric("hourly_rate", { precision: 10, scale: 2 }),
  logoUrl:      text("logo_url"),
  tier:             text("tier").default("free"),  // 'free' | 'solo' | 'hold'
  mobilepayNumber:      text("mobilepay_number"),
  googleReviewUrl:      text("google_review_url"),
  invoiceReminder1Days: integer("invoice_reminder_1_days").default(3),
  invoiceReminder2Days: integer("invoice_reminder_2_days").default(7),
  dashboardWidgets:     json("dashboard_widgets").$type<{ id: string; enabled: boolean }[]>(),
  createdAt:            timestamp("created_at").defaultNow(),
  updatedAt:            timestamp("updated_at").defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
