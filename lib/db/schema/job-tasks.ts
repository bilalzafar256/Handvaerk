import { pgTable, uuid, text, boolean, integer, timestamp } from "drizzle-orm/pg-core"
import { jobs } from "./jobs"
import { users } from "./users"

export const jobTasks = pgTable("job_tasks", {
  id:          uuid("id").primaryKey().defaultRandom(),
  jobId:       uuid("job_id").notNull().references(() => jobs.id),
  userId:      uuid("user_id").notNull().references(() => users.id),
  text:        text("text").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  sortOrder:   integer("sort_order").notNull().default(0),
  createdAt:   timestamp("created_at").defaultNow(),
})

export type JobTask = typeof jobTasks.$inferSelect
export type NewJobTask = typeof jobTasks.$inferInsert
