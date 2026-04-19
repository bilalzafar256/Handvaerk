import { pgTable, text, uuid, jsonb, timestamp } from "drizzle-orm/pg-core"
import { users } from "./users"

export const aiRecordings = pgTable("ai_recordings", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // pending → processing → ready | failed
  status:        text("status").notNull().default("pending"),
  blobUrl:       text("blob_url").notNull(),
  mimeType:      text("mime_type").notNull().default("audio/webm"),
  extractedData: jsonb("extracted_data"),
  // last step that ran — updated before each sub-stage so failures are pinpointed
  currentStep:   text("current_step"),
  // set when a sub-stage throws before fallback kicks in
  errorStep:     text("error_step"),
  errorMessage:  text("error_message"),
  inngestRunId:  text("inngest_run_id"),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type AiRecording = typeof aiRecordings.$inferSelect
export type NewAiRecording = typeof aiRecordings.$inferInsert
