import { pgTable, uuid, text, date, timestamp, numeric } from "drizzle-orm/pg-core"
import { users } from "./users"
import { customers } from "./customers"

export const jobs = pgTable("jobs", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          uuid("user_id").notNull().references(() => users.id),
  customerId:      uuid("customer_id").notNull().references(() => customers.id),
  jobNumber:       text("job_number").notNull(),
  title:           text("title").notNull(),
  description:     text("description"),
  jobType:         text("job_type").default("service"),  // 'service' | 'project' | 'recurring'
  status:          text("status").default("new"),         // new | scheduled | in_progress | done | invoiced | paid
  priority:        text("priority").default("normal"),    // low | normal | high | urgent (F-1801)
  scheduledDate:   date("scheduled_date"),
  endDate:         date("end_date"),         // expected completion / deadline
  completedDate:   date("completed_date"),
  estimatedHours:  numeric("estimated_hours", { precision: 6, scale: 2 }), // F-1802
  locationAddress: text("location_address"), // F-1800
  locationZip:     text("location_zip"),     // F-1800
  locationCity:    text("location_city"),    // F-1800
  tags:            text("tags"),             // F-1805: comma-separated
  notes:           text("notes"),
  createdAt:       timestamp("created_at").defaultNow(),
  updatedAt:       timestamp("updated_at").defaultNow(),
  deletedAt:       timestamp("deleted_at"),
})

export const jobPhotos = pgTable("job_photos", {
  id:        uuid("id").primaryKey().defaultRandom(),
  jobId:     uuid("job_id").notNull().references(() => jobs.id),
  fileUrl:   text("file_url").notNull(),
  caption:   text("caption"),
  tag:       text("tag"), // F-1804: before | during | after | document
  createdAt: timestamp("created_at").defaultNow(),
})

export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert
export type JobPhoto = typeof jobPhotos.$inferSelect
export type NewJobPhoto = typeof jobPhotos.$inferInsert
