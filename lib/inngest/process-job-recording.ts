import { inngest } from "./client"
import { db } from "@/lib/db"
import { aiRecordings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  groqTranscribe,
  groqExtractFromText,
} from "@/lib/ai"
import type { ExtractedJobRecord } from "@/lib/ai"

type EventData = {
  recordingId: string
  userId: string
  blobUrl: string
  mimeType: string
}

async function setStep(id: string, step: string) {
  await db
    .update(aiRecordings)
    .set({ currentStep: step, updatedAt: new Date() })
    .where(eq(aiRecordings.id, id))
}


export const processJobRecording = inngest.createFunction(
  {
    id: "process-job-recording",
    triggers: [{ event: "recording/submitted" }],
    retries: 2,
  },
  async ({
    event,
    step,
    runId,
  }: {
    event: { data: EventData }
    step: {
      run: <T>(id: string, fn: () => Promise<T>) => Promise<T>
    }
    runId: string
  }) => {
    const { recordingId, blobUrl, mimeType } = event.data

    // ── Step 1: mark processing ──────────────────────────────────────────────
    await step.run("mark-processing", async () => {
      await db
        .update(aiRecordings)
        .set({ status: "processing", inngestRunId: runId, currentStep: "mark-processing", updatedAt: new Date() })
        .where(eq(aiRecordings.id, recordingId))
    })

    // ── Step 2: fetch audio + extract (primary → fallback) ───────────────────
    //   All sub-stages run inside one step so Inngest retries the whole
    //   extraction unit. currentStep + errorStep in DB pinpoint exact failures.
    const extracted = await step.run("ai-extract", async (): Promise<ExtractedJobRecord> => {
      // 2a: fetch audio from Vercel Blob
      await setStep(recordingId, "ai-extract:fetch-blob")
      const response = await fetch(blobUrl)
      if (!response.ok) throw new Error(`Blob fetch failed: ${response.status} ${response.statusText}`)
      const buffer = await response.arrayBuffer()
      const audioBase64 = Buffer.from(buffer).toString("base64")

      // 2b: Groq Whisper transcription
      await setStep(recordingId, "ai-extract:groq-transcribe")
      const transcript = await groqTranscribe(audioBase64, mimeType)

      // 2c: Groq LLaMA JSON extraction
      await setStep(recordingId, "ai-extract:groq-extract")
      const result = await groqExtractFromText(transcript)
      return result
    })

    // ── Step 3: save extracted data ──────────────────────────────────────────
    await step.run("save-result", async () => {
      await db
        .update(aiRecordings)
        .set({
          status: "ready",
          extractedData: extracted as Record<string, unknown>,
          currentStep: "save-result",
          errorStep: null,
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(aiRecordings.id, recordingId))
    })

    // ── Step 4: notify user — one notification per extracted entity ─────────
    await step.run("create-notifications", async () => {
      const { createNotification } = await import("@/lib/db/queries/notifications")
      const { userId } = event.data

      const promises: Promise<unknown>[] = []

      if (extracted.customer?.name) {
        const parts = [extracted.customer.name, extracted.customer.phone, extracted.customer.email].filter(Boolean)
        promises.push(createNotification({
          userId,
          type: "ai_customer_found",
          title: "Customer extracted from recording",
          body: parts.join(" · "),
          metadata: { recordingId, entityType: "customer" },
          read: false,
        }))
      }

      if (extracted.job?.title) {
        const jobType = extracted.job.jobType ? ` · ${extracted.job.jobType}` : ""
        promises.push(createNotification({
          userId,
          type: "ai_job_found",
          title: "Job extracted from recording",
          body: `${extracted.job.title}${jobType}`,
          metadata: { recordingId, entityType: "job" },
          read: false,
        }))
      }

      if (extracted.quote?.items?.length > 0) {
        const itemCount = extracted.quote.items.length
        const total = extracted.quote.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
        promises.push(createNotification({
          userId,
          type: "ai_quote_found",
          title: "Quote items extracted from recording",
          body: `${itemCount} item${itemCount !== 1 ? "s" : ""} · Est. DKK ${Math.round(total).toLocaleString("en")}`,
          metadata: { recordingId, entityType: "quote" },
          read: false,
        }))
      }

      await Promise.all(promises)
    })

    // ── Step 5: delete blob (GDPR — audio is never stored permanently) ───────
    await step.run("cleanup-blob", async () => {
      await setStep(recordingId, "cleanup-blob")
      const { del } = await import("@vercel/blob")
      await del(blobUrl)
      await db
        .update(aiRecordings)
        .set({ currentStep: "done", blobUrl: "", updatedAt: new Date() })
        .where(eq(aiRecordings.id, recordingId))
    })

    return { recordingId, status: "ready" }
  }
)
