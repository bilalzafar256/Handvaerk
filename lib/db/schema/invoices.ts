import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  integer,
  numeric,
  boolean,
} from "drizzle-orm/pg-core"
import { users } from "./users"
import { customers } from "./customers"
import { jobs } from "./jobs"
import { quotes } from "./quotes"

export const invoices = pgTable("invoices", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  userId:             uuid("user_id").notNull().references(() => users.id),
  jobId:              uuid("job_id").references(() => jobs.id),
  customerId:         uuid("customer_id").notNull().references(() => customers.id),
  quoteId:            uuid("quote_id").references(() => quotes.id),
  invoiceNumber:      text("invoice_number").notNull(),
  status:             text("status").default("draft"),   // draft | sent | viewed | paid | overdue
  isCreditNote:       boolean("is_credit_note").default(false),
  originalInvoiceId:  uuid("original_invoice_id"),       // for credit notes

  // Dates
  issueDate:          date("issue_date").notNull().defaultNow(),
  dueDate:            date("due_date").notNull(),
  paymentTermsDays:   integer("payment_terms_days").default(14),

  // Financial
  subtotalExVat:      numeric("subtotal_ex_vat", { precision: 12, scale: 2 }),
  vatAmount:          numeric("vat_amount", { precision: 12, scale: 2 }),
  totalInclVat:       numeric("total_incl_vat", { precision: 12, scale: 2 }),
  discountAmount:     numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),

  // Payment info
  bankAccount:        text("bank_account"),
  mobilepayNumber:    text("mobilepay_number"),          // static reference
  mobilepayLink:      text("mobilepay_link"),            // future

  // NemHandel / PEPPOL (Phase 7 UI, stored from Phase 5)
  eanNumber:          text("ean_number"),
  oioubl:             boolean("oioubl_format").default(false),
  peppolId:           text("peppol_id"),

  // Meta
  notes:              text("notes"),
  paidAt:             timestamp("paid_at"),
  sentAt:             timestamp("sent_at"),
  viewedAt:           timestamp("viewed_at"),
  reminder1SentAt:    timestamp("reminder_1_sent_at"),
  reminder2SentAt:    timestamp("reminder_2_sent_at"),
  createdAt:          timestamp("created_at").defaultNow(),
  updatedAt:          timestamp("updated_at").defaultNow(),
  deletedAt:          timestamp("deleted_at"),
})

export const invoiceItems = pgTable("invoice_items", {
  id:          uuid("id").primaryKey().defaultRandom(),
  invoiceId:   uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  itemType:    text("item_type").notNull(),   // 'labour' | 'material' | 'fixed' | 'travel'
  description: text("description").notNull(),
  quantity:    numeric("quantity", { precision: 10, scale: 2 }),
  unitPrice:   numeric("unit_price", { precision: 10, scale: 2 }),
  vatRate:     numeric("vat_rate", { precision: 5, scale: 2 }).default("25.00"),
  lineTotal:   numeric("line_total", { precision: 12, scale: 2 }),
  sortOrder:   integer("sort_order").default(0),
})

export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
export type InvoiceItem = typeof invoiceItems.$inferSelect
export type NewInvoiceItem = typeof invoiceItems.$inferInsert
