import { relations } from "drizzle-orm"
import { users } from "./users"
import { customers } from "./customers"
import { jobs, jobPhotos } from "./jobs"

export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  jobs: many(jobs),
}))

export const customersRelations = relations(customers, ({ one }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
}))

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, { fields: [jobs.userId], references: [users.id] }),
  customer: one(customers, { fields: [jobs.customerId], references: [customers.id] }),
  photos: many(jobPhotos),
}))

export const jobPhotosRelations = relations(jobPhotos, ({ one }) => ({
  job: one(jobs, { fields: [jobPhotos.jobId], references: [jobs.id] }),
}))
