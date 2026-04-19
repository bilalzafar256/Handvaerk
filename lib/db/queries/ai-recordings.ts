import { db } from "@/lib/db"
import { aiRecordings } from "@/lib/db/schema"
import { eq, and, desc, ne } from "drizzle-orm"
import type { NewAiRecording } from "@/lib/db/schema/ai-recordings"

export async function createAiRecording(data: Omit<NewAiRecording, "id" | "createdAt" | "updatedAt">) {
  const [row] = await db.insert(aiRecordings).values(data).returning()
  return row
}

export async function getAiRecordingById(id: string, userId: string) {
  return db.query.aiRecordings.findFirst({
    where: and(eq(aiRecordings.id, id), eq(aiRecordings.userId, userId)),
  })
}

export async function getReadyRecordingsForUser(userId: string) {
  return db.query.aiRecordings.findMany({
    where: and(eq(aiRecordings.userId, userId), eq(aiRecordings.status, "ready")),
    orderBy: [desc(aiRecordings.createdAt)],
  })
}

// All recordings that have not been dismissed — shown in dashboard notifications
export async function getActiveRecordingsForUser(userId: string) {
  return db.query.aiRecordings.findMany({
    where: and(eq(aiRecordings.userId, userId), ne(aiRecordings.status, "dismissed")),
    orderBy: [desc(aiRecordings.createdAt)],
  })
}

export async function updateAiRecording(
  id: string,
  data: Partial<Pick<NewAiRecording, "status" | "currentStep" | "errorStep" | "errorMessage" | "extractedData" | "inngestRunId">>
) {
  await db
    .update(aiRecordings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(aiRecordings.id, id))
}
