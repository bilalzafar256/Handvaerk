import { pgTable, uuid, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core"
import { users } from "./users"

export const pricebookItems = pgTable("pricebook_items", {
  id:          uuid("id").primaryKey().defaultRandom(),
  userId:      uuid("user_id").notNull().references(() => users.id),
  name:        text("name").notNull(),
  description: text("description"),
  unitPrice:   numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  itemType:    text("item_type").default("material"), // labour | material | fixed | travel
  isActive:    boolean("is_active").default(true),
  createdAt:   timestamp("created_at").defaultNow(),
  deletedAt:   timestamp("deleted_at"),
})

export type PricebookItem = typeof pricebookItems.$inferSelect
export type NewPricebookItem = typeof pricebookItems.$inferInsert
