import { pgTable, uuid, text, date, timestamp } from "drizzle-orm/pg-core"
import { users } from "./users"
import { customers } from "./customers"

export const jobs = pgTable("jobs", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").notNull().references(() => users.id),
  customerId:    uuid("customer_id").notNull().references(() => customers.id),
  jobNumber:     text("job_number").notNull(),
  title:         text("title").notNull(),
  description:   text("description"),
  jobType:       text("job_type").default("service"),  // 'service' | 'project' | 'recurring'
  status:        text("status").default("new"),         // new | scheduled | in_progress | done | invoiced | paid
  scheduledDate: date("scheduled_date"),
  endDate:       date("end_date"),         // expected completion / deadline
  completedDate: date("completed_date"),
  notes:         text("notes"),
  createdAt:     timestamp("created_at").defaultNow(),
  updatedAt:     timestamp("updated_at").defaultNow(),
  deletedAt:     timestamp("deleted_at"),
})

export const jobPhotos = pgTable("job_photos", {
  id:        uuid("id").primaryKey().defaultRandom(),
  jobId:     uuid("job_id").notNull().references(() => jobs.id),
  fileUrl:   text("file_url").notNull(),
  caption:   text("caption"),
  createdAt: timestamp("created_at").defaultNow(),
})

export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert
export type JobPhoto = typeof jobPhotos.$inferSelect
export type NewJobPhoto = typeof jobPhotos.$inferInsert
