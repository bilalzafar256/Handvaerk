# Feature: Job Management

## Purpose
Core entity of the app. A job represents a tradesperson's work engagement with a customer — from scheduling through completion and invoicing.

---

## Key Files
| File | Role |
|---|---|
| `lib/db/schema/jobs.ts` | Schema: `jobs`, `jobPhotos` |
| `lib/db/queries/jobs.ts` | All DB operations |
| `lib/actions/jobs.ts` | Server Actions |
| `app/[locale]/(dashboard)/jobs/` | All job pages |
| `components/jobs/` | All job UI components |
| `components/forms/job-form.tsx` | Create/edit form |

---

## Status Flow

```
new → scheduled → in_progress → done → invoiced → paid
```

- `done`: `completedDate` is auto-set to current date (`lib/actions/jobs.ts:138`)
- `invoiced`: auto-set when `createInvoiceFromJobAction` is called
- `paid`: terminal state — counts against free tier limit (it doesn't — see below)

**Free tier gate:** `countActiveJobs` counts jobs where status is NOT in the explicitly-excluded set. The gate fires at 10 active jobs (`FREE_TIER_JOB_LIMIT = 10` in `lib/actions/jobs.ts:21`). This gate only runs for `user.tier === "free"`.

---

## Job Number Generation

Sequential per user, NOT per customer. Counter uses `countAllJobsEver(userId)` which counts including soft-deleted jobs. Format: plain integer string `"1"`, `"2"`, etc. — **not padded, not per-customer**.

**[KNOWN ISSUE]:** `docs/FEATURES.md:149` comments "Should be starting as JOB-0001 for every new customer" — this is planned but not implemented.

---

## Photo Upload

1. Client calls Vercel Blob client-side upload via token from `POST /api/upload/jobs`
2. On upload complete: client calls `addJobPhotoAction(jobId, fileUrl, caption?)`
3. DB: row inserted in `job_photos` table
4. Limits: 10MB per file, JPEG/PNG/WebP/HEIC
5. Storage: Vercel Blob — permanent (not GDPR-purged)

---

## Job Form Fields

| Field | Type | Validation |
|---|---|---|
| `customerId` | uuid | required |
| `title` | string | min 1 |
| `description` | string | optional |
| `jobType` | enum | `service \| project \| recurring` |
| `status` | enum | `new \| scheduled \| in_progress \| done \| invoiced \| paid` |
| `scheduledDate` | date string | optional |
| `endDate` | date string | optional |
| `notes` | string | optional (internal) |

---

## Inline Notes

`components/jobs/inline-notes.tsx` — allows updating `jobs.notes` inline on the detail page without navigating to the edit form. Calls `updateJobNotesAction`.

---

## Status Changer

`components/jobs/status-changer.tsx` — status transition UI on job detail page. Calls `updateJobStatusAction`. Validates against allowed statuses server-side.

---

## Job Detail Page — Customer Panel

The right-column customer card on the job detail page (`app/[locale]/(dashboard)/jobs/[id]/page.tsx`) shows:
- Customer name + phone → links to `/customers/[id]`
- Google Maps link (conditional) — built from `addressLine1 + addressZip + addressCity`, opens `maps.google.com/?q=<address>` in a new tab. Only shown if the customer has at least one address field.

`getJobById` fetches `with: { customer: true }` so all customer address fields are available on the job page.

---

## Edge Cases / Gotchas

1. **Soft delete + active count:** `countActiveJobs` must exclude soft-deleted jobs AND jobs with terminal statuses.
2. **Free tier check is on CREATE only** — no enforcement if you change tier mid-life.
3. **completedDate is a date field (not timestamp)** — uses `new Date().toISOString().split("T")[0]` format.
4. **Job number is per-user sequential** — if a user deletes job #3, the next job is #N+1 where N includes deleted, so gaps can exist.
5. **Photo deletion:** `deleteJobPhotoAction` does NOT delete from Vercel Blob — only removes the DB row. Blob files persist indefinitely even after photo deletion. [INFERRED: needs Blob cleanup or it's treated as orphaned storage]

---

---

## Job Activity Timeline (F-2000–F-2005)

A chronological, day-grouped audit trail showing every meaningful action taken on a job.

**New table:** `job_events`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `jobId` | uuid fk → jobs | |
| `userId` | uuid fk → users | |
| `eventType` | text | see event types in FEATURES.md Phase 20 |
| `metadata` | jsonb | event-specific payload (tag, duration, status values, etc.) |
| `createdAt` | timestamp | |

Append-only — never soft-delete. Row inserted by `insertJobEvent()` helper called at the end of each relevant Server Action.

**Key query:** `getJobTimeline(jobId, userId)` in `lib/db/queries/job-events.ts`
- Fetches real `job_events` rows
- Builds synthetic events from `createdAt` on `job_photos`, `job_tasks`, `time_entries`, linked `quotes`, linked `invoices`
- Real event beats synthetic duplicate (matched by type + timestamp proximity)
- Returns `Array<{ date: string; events: TimelineEvent[] }>` grouped by local date, descending

**Component:** `components/jobs/job-timeline.tsx`

**Access points:**
1. "Timeline" Card at the bottom of the job detail left column (`app/[locale]/(dashboard)/jobs/[id]/page.tsx`)
2. `/timeline` global page — searchable job combobox, URL param `?job=[id]`, server-side data load

---

→ Related: `features/INVOICES.md`, `features/QUOTES.md`, `features/AI_RECORDING.md`, `architecture/DATABASE.md`
