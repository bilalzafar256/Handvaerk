# Feature: AI Job Site Recording

## Purpose
Tradesperson records a voice note or uploads an audio file from a job site. AI pipeline transcribes, extracts structured job/customer/quote data, then presents an editable review form. User confirms → creates job + optional quote draft in one flow.

---

## Key Files
| File | Role |
|---|---|
| `lib/db/schema/ai-recordings.ts` | Schema: `ai_recordings` |
| `lib/db/queries/ai-recordings.ts` | DB operations |
| `lib/actions/ai-job-recording.ts` | Server Actions: create recording, get status |
| `lib/inngest/process-job-recording.ts` | 5-step Inngest background function |
| `lib/ai/operations/extract-job-from-audio.ts` | AI operations: transcribe + extract |
| `lib/ai/schemas/recording-result.ts` | Zod schema + `ExtractedJobRecord` type |
| `lib/ai/providers/groq.ts` | Groq client factory |
| `lib/ai/client.ts` | Gemini client (fallback, currently unused) |
| `app/[locale]/(dashboard)/jobs/record/page.tsx` | Entry point: record or upload |
| `app/[locale]/(dashboard)/jobs/record/[id]/page.tsx` | Status polling + review UI |
| `components/ai/voice-recorder.tsx` | Live recording component |
| `components/ai/audio-file-upload.tsx` | File upload component |
| `components/ai/record-tabs.tsx` | Tab switcher: Record vs Upload |
| `components/ai/recording-status-view.tsx` | Processing status display |
| `components/ai/job-recording-flow.tsx` | Review + confirm form |

---

## Full Pipeline

```
1. User records via browser MediaRecorder API (voice-recorder.tsx)
   OR uploads file (audio-file-upload.tsx)
   → Supported formats: WebM, MP4/M4A, MP3, OGG, WAV, AIFF

2. Client-side upload to Vercel Blob via token from POST /api/upload/jobs
   → Returns blobUrl

3. createAiRecordingAction(blobUrl, mimeType)
   → INSERT ai_recordings (status: "pending", blobUrl, mimeType)
   → inngest.send({ name: "recording/submitted", data: { recordingId, userId, blobUrl, mimeType } })
   → Returns { id: recordingId }

4. Client redirects to /jobs/record/[recordingId]
   → Page polls getAiRecordingAction(recordingId) until status ≠ "pending"/"processing"

5. [Inngest: process-job-recording] — 5 steps:

   Step 1: mark-processing
   → UPDATE ai_recordings SET status="processing", inngestRunId=runId

   Step 2: ai-extract (all sub-stages in one Inngest step — retried as unit)
     2a: ai-extract:fetch-blob → fetch(blobUrl) → arrayBuffer → base64
     2b: ai-extract:groq-transcribe → groqTranscribe(base64, mimeType) → transcript string
     2c: ai-extract:groq-extract → groqExtractFromText(transcript) → ExtractedJobRecord

   Step 3: save-result
   → UPDATE ai_recordings SET status="ready", extractedData=extracted, currentStep="save-result"

   Step 4: create-notifications
   → For each extracted entity (customer, job, quote):
     INSERT notifications (type: ai_customer_found | ai_job_found | ai_quote_found)

   Step 5: cleanup-blob (GDPR)
   → del(blobUrl) via @vercel/blob
   → UPDATE ai_recordings SET blobUrl="", currentStep="done"

6. Page detects status="ready" → shows JobRecordingFlow review component

7. User reviews + edits extracted data
   → "Create job + draft quote": createJobAction + createQuoteAction
   → "Create job only": createJobAction
   → Redirect to /jobs/[jobId]
```

---

## AI Models Used

| Stage | Provider | Model | Purpose |
|---|---|---|---|
| Transcription | Groq | `whisper-large-v3-turbo` | Audio → text |
| Extraction | Groq | `llama-3.3-70b-versatile` | Text → structured JSON |
| Fallback (inactive) | Google | Gemini Flash | Was primary before Groq pipeline — still in codebase |

**Extraction prompt** (`lib/ai/operations/extract-job-from-audio.ts:4`):
- Instructs model to handle Danish and English
- Returns JSON matching `ExtractedJobRecord` schema
- System prompt includes Danish trade market rate context
- Temperature: 0.1 (deterministic extraction)
- Response format: `{ type: "json_object" }` (Groq structured output)

---

## `ExtractedJobRecord` Schema

```ts
{
  customer: { name: string; phone?: string; email?: string; address?: string }
  job: {
    title: string;
    description: string;
    jobType: "service" | "project" | "recurring";
    scheduledDate?: string;  // YYYY-MM-DD
    notes: string;
    materials: string[];
  }
  quote: {
    items: Array<{
      description: string;
      qty: number;
      unitPrice: number;     // DKK, AI-estimated from Danish market rates
      type: "labour" | "material" | "fixed" | "travel";
    }>;
    notes?: string;
  }
}
```

---

## GDPR Audio Handling

Audio files are **never stored permanently**:
1. Uploaded to Vercel Blob (temporary)
2. Inngest Step 5 calls `del(blobUrl)` after processing
3. `ai_recordings.blob_url` set to `""` after deletion
4. `ai_recordings.extracted_data` (JSONB) retains the extracted text — not raw audio

---

## Notification Types

| `type` | Trigger | Icon | Body example |
|---|---|---|---|
| `ai_customer_found` | Customer in extraction | User icon | `"Lars Nielsen · 4512 3456"` |
| `ai_job_found` | Job title in extraction | Briefcase icon | `"Bathroom renovation · project"` |
| `ai_quote_found` | Quote items present | FileText icon | `"3 items · Est. DKK 4,500"` |

---

## Rate Limiting

AI recording submission uses `aiRateLimiter` (10 requests / 60 seconds per user).

---

## Audio Format Detection

In `groqTranscribe()`, MIME type is mapped to file extension:
```
audio/mp4 or audio/m4a → "mp4"
audio/ogg               → "ogg"
audio/wav               → "wav"
audio/mpeg or audio/mp3 → "mp3"
default                 → "webm"
```
Note: AIFF is in the upload allowed types (`audio/aiff`) but maps to `"webm"` by the fallback — may cause Groq Whisper to reject it or produce poor transcription.

---

## Error Recovery

- `errorStep` and `errorMessage` fields on `ai_recordings` pinpoint which Inngest step failed
- Inngest retries the whole function up to 2 times on failure
- Steps 3–5 are separate Inngest steps — if step 2 (ai-extract) fails twice, step 3+ won't run
- Failed recordings: `status = "failed"`, user must re-record

---

## Edge Cases / Gotchas

1. **AIFF uploads to Groq** — file extension maps to `"webm"` which may fail. AIFF is in the allowed MIME list but is a macOS-only format.
2. **Blank `blobUrl` after cleanup** — when UI polls a recording with `status = "ready"`, `blobUrl = ""`. Don't attempt to display or re-fetch it.
3. **AI price estimates are hallucinated** — the extraction prompt asks the model to estimate DKK prices "based on Danish market rates." These are AI guesses, not real prices. The review step exists specifically to let users correct these.
4. **`inngest_run_id` is set during step 1** (not at event submission). If Inngest never processes the event, `inngest_run_id` stays null.
5. **Polling mechanism** — the review page polls every N seconds. The poll interval is [UNKNOWN — defined in `app/[locale]/(dashboard)/jobs/record/[id]/page.tsx` — not read].

---

→ Related: `features/JOBS.md`, `features/QUOTES.md`, `architecture/INFRASTRUCTURE.md`
