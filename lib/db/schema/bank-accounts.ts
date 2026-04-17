import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core"
import { users } from "./users"

export const bankAccounts = pgTable("bank_accounts", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").notNull().references(() => users.id),
  bankName:      text("bank_name"),
  regNumber:     text("reg_number").notNull(),
  accountNumber: text("account_number").notNull(),
  isDefault:     boolean("is_default").default(false),
  createdAt:     timestamp("created_at").defaultNow(),
  updatedAt:     timestamp("updated_at").defaultNow(),
})

export type BankAccount = typeof bankAccounts.$inferSelect
export type NewBankAccount = typeof bankAccounts.$inferInsert
