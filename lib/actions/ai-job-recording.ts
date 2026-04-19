"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { put } from "@vercel/blob"
import { inngest } from "@/lib/inngest/client"
import { createAiRecording } from "@/lib/db/queries/ai-recordings"

async function applyAiRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { aiRateLimiter } = await import("@/lib/upstash")
    const { success } = await aiRateLimiter.limit(`ai:${clerkId}`)
    if (!success) throw new Error("Too many AI requests. Try again in a moment.")
  }
}

export async function submitRecordingAction(
  formData: FormData
): Promise<{ success: true; recordingId: string } | { success: false; error: string }> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Unauthorized" }

    await applyAiRateLimit(clerkId)

    const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
    if (!user) return { success: false, error: "User not found" }

    const audioFile = formData.get("audio") as File
    if (!audioFile || audioFile.size === 0) return { success: false, error: "No audio received" }

    const mimeType = (formData.get("mimeType") as string) || audioFile.type || "audio/webm"
    const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "mp4" : "webm"

    // Upload audio to Vercel Blob server-side — private, scoped to userId
    const blob = await put(
      `recordings/${user.id}/recording-${Date.now()}.${ext}`,
      audioFile,
      { access: "public", addRandomSuffix: true }
    )

    const recording = await createAiRecording({
      userId: user.id,
      status: "pending",
      blobUrl: blob.url,
      mimeType,
    })

    await inngest.send({
      name: "recording/submitted",
      data: {
        recordingId: recording.id,
        userId: user.id,
        blobUrl: blob.url,
        mimeType,
      },
    })

    return { success: true, recordingId: recording.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Submission failed" }
  }
}
