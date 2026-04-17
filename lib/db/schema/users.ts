import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
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
  mobilepayNumber:  text("mobilepay_number"),
  createdAt:        timestamp("created_at").defaultNow(),
  updatedAt:        timestamp("updated_at").defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
