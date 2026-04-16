import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core"
import { users } from "./users"

export const customers = pgTable("customers", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").notNull().references(() => users.id),
  name:         text("name").notNull(),
  phone:        text("phone"),
  email:        text("email"),
  addressLine1: text("address_line1"),
  addressCity:  text("address_city"),
  addressZip:   text("address_zip"),
  cvrNumber:    text("cvr_number"),        // F-208: business customers
  eanNumber:    text("ean_number"),        // NemHandel/PEPPOL — Phase 7
  notes:        text("notes"),             // F-209: internal notes
  isFavorite:   boolean("is_favorite").default(false),
  createdAt:    timestamp("created_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow(),
  deletedAt:    timestamp("deleted_at"),   // F-205: soft delete
})

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
