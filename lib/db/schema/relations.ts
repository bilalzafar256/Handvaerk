import { relations } from "drizzle-orm"
import { users } from "./users"
import { customers } from "./customers"

export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
}))

export const customersRelations = relations(customers, ({ one }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
}))
