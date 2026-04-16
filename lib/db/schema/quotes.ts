import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  integer,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core"
import { users } from "./users"
import { customers } from "./customers"
import { jobs } from "./jobs"

export const quotes = pgTable("quotes", {
  id:             uuid("id").primaryKey().defaultRandom(),
  userId:         uuid("user_id").notNull().references(() => users.id),
  jobId:          uuid("job_id").references(() => jobs.id),
  customerId:     uuid("customer_id").notNull().references(() => customers.id),
  quoteNumber:    text("quote_number").notNull(),
  status:         text("status").default("draft"),   // draft | sent | accepted | rejected | expired
  validUntil:     date("valid_until"),
  discountType:   text("discount_type"),             // 'percent' | 'fixed'
  discountValue:  numeric("discount_value", { precision: 10, scale: 2 }),
  notes:          text("notes"),                     // shown to customer
  internalNotes:  text("internal_notes"),
  shareToken:     text("share_token"),               // for shareable public link
  acceptedAt:     timestamp("accepted_at"),
  rejectedAt:     timestamp("rejected_at"),
  sentAt:         timestamp("sent_at"),
  createdAt:      timestamp("created_at").defaultNow(),
  updatedAt:      timestamp("updated_at").defaultNow(),
  deletedAt:      timestamp("deleted_at"),
})

export const quoteItems = pgTable("quote_items", {
  id:            uuid("id").primaryKey().defaultRandom(),
  quoteId:       uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  itemType:      text("item_type").notNull(),   // 'labour' | 'material' | 'fixed' | 'travel'
  description:   text("description").notNull(),
  quantity:      numeric("quantity", { precision: 10, scale: 2 }),
  unitPrice:     numeric("unit_price", { precision: 10, scale: 2 }),
  markupPercent: numeric("markup_percent", { precision: 5, scale: 2 }),
  vatRate:       numeric("vat_rate", { precision: 5, scale: 2 }).default("25.00"),
  sortOrder:     integer("sort_order").default(0),
  createdAt:     timestamp("created_at").defaultNow(),
})

export const quoteTemplates = pgTable("quote_templates", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id),
  name:      text("name").notNull(),
  items:     jsonb("items"),   // snapshot of line items
  createdAt: timestamp("created_at").defaultNow(),
})

export const materialsCatalog = pgTable("materials_catalog", {
  id:             uuid("id").primaryKey().defaultRandom(),
  userId:         uuid("user_id").notNull().references(() => users.id),
  name:           text("name").notNull(),
  defaultUnit:    text("default_unit"),
  defaultPrice:   numeric("default_price", { precision: 10, scale: 2 }),
  defaultMarkup:  numeric("default_markup", { precision: 5, scale: 2 }),
  createdAt:      timestamp("created_at").defaultNow(),
})

export type Quote = typeof quotes.$inferSelect
export type NewQuote = typeof quotes.$inferInsert
export type QuoteItem = typeof quoteItems.$inferSelect
export type NewQuoteItem = typeof quoteItems.$inferInsert
export type QuoteTemplate = typeof quoteTemplates.$inferSelect
export type MaterialCatalogItem = typeof materialsCatalog.$inferSelect
