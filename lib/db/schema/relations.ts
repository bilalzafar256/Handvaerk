import { relations } from "drizzle-orm"
import { users } from "./users"
import { customers } from "./customers"
import { jobs, jobPhotos } from "./jobs"
import { quotes, quoteItems, quoteTemplates, materialsCatalog } from "./quotes"
import { invoices, invoiceItems } from "./invoices"
import { bankAccounts } from "./bank-accounts"
import { notifications } from "./notifications"
import { timeEntries } from "./time-entries"
import { pricebookItems } from "./pricebook"

export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  jobs: many(jobs),
  quotes: many(quotes),
  quoteTemplates: many(quoteTemplates),
  materialsCatalog: many(materialsCatalog),
  invoices: many(invoices),
  bankAccounts: many(bankAccounts),
  notifications: many(notifications),
  pricebookItems: many(pricebookItems),
}))

export const pricebookItemsRelations = relations(pricebookItems, ({ one }) => ({
  user: one(users, { fields: [pricebookItems.userId], references: [users.id] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}))

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  quotes: many(quotes),
  invoices: many(invoices),
}))

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, { fields: [jobs.userId], references: [users.id] }),
  customer: one(customers, { fields: [jobs.customerId], references: [customers.id] }),
  photos: many(jobPhotos),
  quotes: many(quotes),
  invoices: many(invoices),
  timeEntries: many(timeEntries),
}))

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, { fields: [timeEntries.userId], references: [users.id] }),
  job: one(jobs, { fields: [timeEntries.jobId], references: [jobs.id] }),
  billedToQuote: one(quotes, { fields: [timeEntries.billedToQuoteId], references: [quotes.id] }),
  billedToInvoice: one(invoices, { fields: [timeEntries.billedToInvoiceId], references: [invoices.id] }),
}))

export const jobPhotosRelations = relations(jobPhotos, ({ one }) => ({
  job: one(jobs, { fields: [jobPhotos.jobId], references: [jobs.id] }),
}))

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  user: one(users, { fields: [quotes.userId], references: [users.id] }),
  customer: one(customers, { fields: [quotes.customerId], references: [customers.id] }),
  job: one(jobs, { fields: [quotes.jobId], references: [jobs.id] }),
  items: many(quoteItems),
  invoices: many(invoices),
}))

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, { fields: [quoteItems.quoteId], references: [quotes.id] }),
}))

export const quoteTemplatesRelations = relations(quoteTemplates, ({ one }) => ({
  user: one(users, { fields: [quoteTemplates.userId], references: [users.id] }),
}))

export const materialsCatalogRelations = relations(materialsCatalog, ({ one }) => ({
  user: one(users, { fields: [materialsCatalog.userId], references: [users.id] }),
}))

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  job: one(jobs, { fields: [invoices.jobId], references: [jobs.id] }),
  quote: one(quotes, { fields: [invoices.quoteId], references: [quotes.id] }),
  items: many(invoiceItems),
}))

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
}))

export const bankAccountsRelations = relations(bankAccounts, ({ one }) => ({
  user: one(users, { fields: [bankAccounts.userId], references: [users.id] }),
}))
