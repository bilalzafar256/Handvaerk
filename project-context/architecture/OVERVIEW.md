# Architecture Overview

## System Map

```
Browser / Mobile PWA
       │
       ▼
 Vercel Edge Network
       │
       ├── Next.js App Router (SSR / RSC)
       │         │
       │         ├── Server Components → Drizzle → Neon (PostgreSQL)
       │         ├── Server Actions → Drizzle → Neon
       │         ├── Clerk middleware (auth + i18n routing)
       │         └── API routes
       │                   ├── /api/webhooks/clerk  → users table sync
       │                   ├── /api/inngest          → Inngest function receiver
       │                   ├── /api/cvr              → cvrapi.dk proxy (CVR lookup)
       │                   ├── /api/upload           → Vercel Blob token issuer (logos)
       │                   ├── /api/upload/jobs      → Vercel Blob token issuer (photos)
       │                   ├── /api/invoices/[id]/pdf → PDF stream
       │                   ├── /api/quotes/[id]/pdf  → PDF stream
       │                   └── /api/materials/search → materials catalog search
       │
       ├── Vercel Blob (file storage)
       │      ├── Company logos (permanent)
       │      ├── Job site photos (permanent)
       │      └── AI audio recordings (GDPR: deleted after processing)
       │
       └── External services
              ├── Clerk (auth) ←→ svix webhook → /api/webhooks/clerk
              ├── Upstash Redis (rate limiting — 3 limiters)
              ├── Inngest (background job orchestration)
              │      ├── invoice-reminder (8d + 7d after sent)
              │      └── process-job-recording (5-step audio pipeline)
              ├── Resend (transactional email — 6 templates)
              ├── Groq API (Whisper transcription + LLaMA extraction)
              ├── Google Gemini Flash (AI fallback — currently unused in pipeline)
              ├── PostHog (analytics)
              ├── Sentry (error tracking)
              └── cvrapi.dk (Danish CVR business registry lookup)
```

---

## Critical Data Flows

### Flow 1: Create Invoice from Accepted Quote
```
User clicks "Create Invoice" on accepted quote
  → createInvoiceFromQuoteAction(quoteId, force?)     [lib/actions/invoices.ts:225]
  → getQuoteById(quoteId, userId)                      [auth guard — user owns quote]
  → getInvoiceByQuote(quoteId, userId)                 [duplicate guard — returns existingInvoiceId if exists]
  → if force=false and existing → return { existingInvoiceId }  [client shows modal]
  → countAllInvoicesEver(userId)                       [sequential FAK-XXXX number]
  → getDefaultBankAccount(userId)                      [pre-fill payment info]
  → calcTotals from quote items                        [carry per-line + header discounts]
  → createInvoice(...)                                 [insert into invoices]
  → replaceInvoiceItems(invoiceId, mappedItems)        [delete + re-insert items]
  → revalidatePath("/invoices")
  → redirect to /invoices/[id]/edit
```

### Flow 2: AI Audio Recording → Job Record
```
User records voice or uploads file on /jobs/record
  → POST /api/upload/jobs                              [Vercel Blob client-side upload]
  → createAiRecordingAction(blobUrl, mimeType)         [lib/actions/ai-job-recording.ts]
  → insert aiRecordings row (status: "pending")
  → inngest.send({ name: "recording/submitted", data: { recordingId, userId, blobUrl, mimeType } })
  → [Inngest: process-job-recording function]
     Step 1: mark status "processing"
     Step 2: fetch blob → base64
             groqTranscribe(audioBase64, mimeType)     [Groq Whisper]
             groqExtractFromText(transcript)            [LLaMA 3.3 70b → ExtractedJobRecord JSON]
     Step 3: save extractedData to aiRecordings row (status: "ready")
     Step 4: create notifications (ai_customer_found, ai_job_found, ai_quote_found)
     Step 5: del(blobUrl)                              [GDPR — audio never persisted]
  → User redirected to /jobs/record/[id]
  → Page polls aiRecording status via getAiRecordingAction
  → When ready: shows JobRecordingFlow review UI
  → User edits + confirms → createJobAction + optionally createQuoteAction
```

### Flow 3: Invoice Payment Reminder (Inngest)
```
sendInvoiceAction marks status "sent"
  → inngest.send({ name: "invoice/sent", data: { invoiceId, customerEmail, dueDate, amount } })
  → [Inngest: invoice-reminder function]
     step.waitForEvent("invoice/paid", timeout: "8d")
     → if paid: return (no reminders)
     → if timeout: send first reminder email (Resend)
                   db.update reminder1SentAt
     step.sleep("7d")
     → send second reminder email (Resend)
                   db.update reminder2SentAt
markInvoicePaidAction → inngest.send({ name: "invoice/paid" }) → cancels pending steps
```

---

## External Services

| Service | Purpose | Auth mechanism | Key config |
|---|---|---|---|
| Neon | PostgreSQL database | `DATABASE_URL` connection string | EU Frankfurt region [INFERRED] |
| Clerk | Auth (email OTP + phone OTP) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | Webhooks signed via `CLERK_WEBHOOK_SECRET` (svix) |
| Upstash Redis | Rate limiting (3 limiters) | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | slidingWindow: 20/10s general, 5/60s strict, 10/60s AI |
| Inngest | Background job orchestration | `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` | Route: `/api/inngest` |
| Resend | Transactional email | `RESEND_API_KEY` | FROM: `onboarding@resend.dev` [NEEDS PROD DOMAIN] |
| Vercel Blob | File storage | `BLOB_READ_WRITE_TOKEN` | Client-side upload via token endpoint |
| Groq | AI transcription + extraction | `GROQ_API_KEY` | whisper-large-v3-turbo + llama-3.3-70b-versatile |
| Google Gemini | AI fallback (unused in pipeline) | `GOOGLE_AI_API_KEY` | gemini-flash |
| PostHog | Product analytics | `NEXT_PUBLIC_POSTHOG_KEY` | EU region: `eu.i.posthog.com` |
| Sentry | Error tracking | `NEXT_PUBLIC_SENTRY_DSN` | `SENTRY_ORG` + `SENTRY_PROJECT` + `SENTRY_AUTH_TOKEN` |
| cvrapi.dk | Danish business registry | No key | Rate-limited via Upstash; 5min Next.js cache |

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Neon connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk client |
| `CLERK_SECRET_KEY` | Yes | Clerk server |
| `CLERK_WEBHOOK_SECRET` | Yes | svix webhook verification |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | `/en/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | `/en/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | `/en/overview` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | `/en/overview` |
| `UPSTASH_REDIS_REST_URL` | Yes | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Rate limiting |
| `INNGEST_EVENT_KEY` | Yes | Send events to Inngest |
| `INNGEST_SIGNING_KEY` | Yes | Verify Inngest webhook |
| `RESEND_API_KEY` | Yes | Email sending |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Error tracking |
| `SENTRY_ORG` | Optional | Sentry source maps |
| `SENTRY_PROJECT` | Optional | Sentry source maps |
| `SENTRY_AUTH_TOKEN` | Optional | Sentry source maps |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | Analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | Default: `https://eu.i.posthog.com` |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob uploads |
| `GOOGLE_AI_API_KEY` | Optional | Gemini fallback (not in active pipeline) |
| `GROQ_API_KEY` | Yes (for AI) | Whisper + LLaMA |
| `NEXT_PUBLIC_APP_URL` | Yes (for email links) | Base URL for share links in emails — NOT in .env.example |

---

→ Related: `architecture/DATABASE.md`, `architecture/INFRASTRUCTURE.md`, `INDEX.md`
