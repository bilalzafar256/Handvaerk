# Known Issues & Tech Debt

## Critical / Security

### KI-001: `NEXT_PUBLIC_APP_URL` missing from `.env.example`
**Location:** `lib/actions/quotes.ts:252`  
**Impact:** Quote share link in emails points to `undefined/en/q/[token]` in production if not set.  
**Fix:** Add `NEXT_PUBLIC_APP_URL=https://your-domain.com` to `.env.example`.

### KI-002: User deletion webhook is incomplete
**Location:** `app/api/webhooks/clerk/route.ts:48-52`  
**Impact:** When a user deletes their Clerk account, `user.deleted` webhook fires but only updates `users.updatedAt`. The `users` row and ALL associated data (customers, jobs, quotes, invoices, photos) persist indefinitely. GDPR requires "right to be forgotten."  
**Fix:** Implement cascade soft-delete on `user.deleted` event, or schedule a hard-delete job.

### KI-003: Photo deletion doesn't clean up Vercel Blob
**Location:** `lib/actions/jobs.ts:176-181` — `deleteJobPhotoAction`  
**Impact:** Blob files persist forever after UI deletion. Accumulates storage costs over time.  
**Fix:** Call `del(photo.fileUrl)` from `@vercel/blob` before removing the DB row.

---

## Data / Logic

### KI-004: Tier limit constant mismatch
**Locations:**  
- `lib/utils/tier.ts:4` — `TIER_LIMITS.free.activeJobs = 3`  
- `lib/actions/jobs.ts:21` — `FREE_TIER_JOB_LIMIT = 10`  
**Impact:** `canCreateJob()` utility function uses 3, but the actual enforced limit in the action is 10. Any code using `canCreateJob()` has the wrong limit.  
**Fix:** Unify to one constant. Update `tier.ts` to `activeJobs: 10` or use `TIER_LIMITS` in actions.

### KI-005: Job number format deviation from spec
**Location:** `lib/actions/jobs.ts:67-68`  
**Spec** (`docs/FEATURES.md:149`): "Should be starting as JOB-0001 for every new customer"  
**Actual:** Plain integer string `"1"`, `"2"` — sequential per user, not per customer, not padded.  
**Impact:** Customer-facing job numbers are ugly and not what was specified.  
**Fix:** Change to `JOB-${String(total + 1).padStart(4, "0")}` if per-user, or implement per-customer counter if per-customer is required.

### KI-006: `paymentTermsDays` default inconsistency
**Location:** `lib/actions/invoices.ts`  
**Values:**
- `createInvoiceAction`: `paymentTermsDays: 14` (line 134)
- `createInvoiceFromJobAction`: `paymentTermsDays: 14` (line 199)
- `createInvoiceFromQuoteAction`: `paymentTermsDays: 15` (line 285)
**Impact:** Users get different default payment terms depending on how they create an invoice.

### KI-007: Overdue detection requires manual trigger
**Location:** `lib/actions/invoices.ts:573` — `markOverdueAction`  
**Impact:** No automated cron marks invoices overdue. Invoices with past `due_date` remain `sent` until a user triggers this action manually.  
**Fix:** Add an Inngest scheduled function or Vercel Cron to call `markOverdueInvoices` daily for all users.

### KI-008: `strictRateLimiter` and `aiRateLimiter` defined but inconsistently used
**Location:** `lib/upstash/index.ts`  
**Impact:** `strictRateLimiter` is never imported in any action (grep shows no usage). `aiRateLimiter` exists but may not be wired to AI actions.  
**Fix:** Audit which actions use which limiter.

---

## Infrastructure

### KI-009: Missing DB migration snapshots (0005–0010)
**Location:** `drizzle/migrations/meta/`  
**Actual snapshots:** 0000–0004, 0011  
**Missing:** 0005, 0006, 0007, 0008, 0009, 0010  
**Impact:** Running `npx drizzle-kit generate` may produce incorrect diffs because the baseline snapshot used for diffing is the 0011 snapshot, skipping intermediate ones.  
**Risk:** Future migrations may attempt to recreate columns that already exist, or miss columns that were added in missing migrations.

### KI-010: Inngest function registration
**Location:** `lib/inngest/functions.ts` exports only `helloWorld`  
**Issue:** `processJobRecording` (`lib/inngest/process-job-recording.ts`) and `invoiceReminder` (`lib/inngest/invoice-reminder.ts`) are in separate files. Verify these are imported and registered in `app/api/inngest/route.ts`.  
**If not registered:** Background jobs never execute — recordings stay `pending`, reminders never send.

### KI-011: `EMAIL_FROM` uses sandbox domain
**Location:** `lib/email/client.ts:4`  
**Value:** `"Håndværk Pro <onboarding@resend.dev>"`  
**Impact:** Emails in production come from `onboarding@resend.dev` — a Resend sandbox address. Customers will see this as the sender. Not professional, potentially marked as spam.  
**Fix:** Verify a custom domain in Resend and update `EMAIL_FROM`.

### KI-012: No CI/CD pipeline configured
**Impact:** No automated tests, no lint checks on PR, no automated deployment validation.

---

## UX / Frontend

### KI-013: Dashboard stat cards use stub data
**Location:** `components/dashboard/stat-cards.tsx` and `components/dashboard/critical-zone.tsx`  
**Status** (`docs/FEATURES.md`): F-1200 through F-1203 marked `[~]` — backend queries exist in `lib/db/queries/overview.ts` but frontend components still show stub/hardcoded data.  
**Fix:** Wire `overview.ts` queries to the dashboard components.

### KI-014: `"Owes money"` badge on customer list is stubbed
**Location:** `docs/FEATURES.md:100` — F-207 marked `[~]`  
"Still stubbed at 0 — wire to real invoice totals"

### KI-015: AIFF audio maps to `"webm"` extension for Groq
**Location:** `lib/ai/operations/extract-job-from-audio.ts:57`  
**Impact:** AIFF files uploaded for AI recording are sent to Groq as `recording.webm` which is incorrect. Groq Whisper may reject or produce poor transcription.  
**Fix:** Add AIFF MIME type detection: `mimeType.includes("aiff") ? "aiff"`.

---

## Planned (Not Yet Built — High Priority)

These are in `FEATURES.md` with `[ ]` status but affect core functionality:

| Issue | Phase | Feature code |
|---|---|---|
| No automated overdue flagging | 9 | — |
| No GDPR data export | 14 | F-1304 |
| No account deletion flow | 14 | F-1305 |
| Rate limiting audit incomplete | 14 | F-1309, F-1310 |
| EAN number on customer form (UI) | 14 | F-1302 |
| Reports page not built | 9 | F-900 through F-907 |
| Danish translations not filled | — | All `da.json` values are `""` |

---

→ Related: `context/DECISIONS.md`, `architecture/INFRASTRUCTURE.md`, `architecture/DATABASE.md`
