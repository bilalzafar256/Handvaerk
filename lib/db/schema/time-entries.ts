import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core"
import { users } from "./users"
import { jobs } from "./jobs"
import { quotes } from "./quotes"
import { invoices } from "./invoices"

export const timeEntries = pgTable("time_entries", {
  id:                uuid("id").primaryKey().defaultRandom(),
  userId:            uuid("user_id").notNull().references(() => users.id),
  jobId:             uuid("job_id").notNull().references(() => jobs.id),
  startedAt:         timestamp("started_at").notNull(),
  endedAt:           timestamp("ended_at"),           // null = still running
  durationMinutes:   integer("duration_minutes"),     // computed on clock-out
  description:       text("description"),
  isBillable:        boolean("is_billable").default(true),
  // billing tracking — set when hours are converted to a line item
  billedToQuoteId:   uuid("billed_to_quote_id").references(() => quotes.id),
  billedToInvoiceId: uuid("billed_to_invoice_id").references(() => invoices.id),
  createdAt:         timestamp("created_at").defaultNow(),
  deletedAt:         timestamp("deleted_at"),
})

export type TimeEntry = typeof timeEntries.$inferSelect
export type NewTimeEntry = typeof timeEntries.$inferInsert
