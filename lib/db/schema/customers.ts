import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core"
import { users } from "./users"

export const customers = pgTable("customers", {
  id:               uuid("id").primaryKey().defaultRandom(),
  userId:           uuid("user_id").notNull().references(() => users.id),
  name:             text("name").notNull(),
  contactPerson:    text("contact_person"),
  phone:            text("phone"),
  secondPhone:      text("second_phone"),
  email:            text("email"),
  addressLine1:     text("address_line1"),
  addressCity:      text("address_city"),
  addressZip:       text("address_zip"),
  country:          text("country").default("DK"),
  cvrNumber:        text("cvr_number"),
  eanNumber:        text("ean_number"),
  notes:            text("notes"),
  paymentTermsDays: integer("payment_terms_days").default(14),
  preferredLanguage: text("preferred_language").default("da"),
  vatExempt:        boolean("vat_exempt").default(false),
  isFavorite:       boolean("is_favorite").default(false),
  createdAt:        timestamp("created_at").defaultNow(),
  updatedAt:        timestamp("updated_at").defaultNow(),
  deletedAt:        timestamp("deleted_at"),
})

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
