# Backend

## Request Lifecycle

Every mutation from the UI follows this exact path:

```
Client component calls Server Action
  → "use server" directive marks it as server-only
  → auth() from @clerk/nextjs/server — throws if not signed in
  → applyRateLimit(clerkId) — optional but required by CLAUDE.md rule
  → zod.parse(data) — validates and strips unknown fields
  → getDbUser(clerkId) — resolves Clerk ID to internal users.id
  → Business logic
  → Drizzle query
  → revalidatePath(...)
  → Return value or redirect()
```

---

## Server Action Pattern

**Every Server Action must:**

```ts
"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const schema = z.object({ ... })

async function getDbUser(clerkId: string) {
  return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
}

async function applyRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { rateLimiter } = await import("@/lib/upstash")
    const { success } = await rateLimiter.limit(clerkId)
    if (!success) throw new Error("Rate limit exceeded. Try again in a moment.")
  }
}

export async function myAction(data: unknown) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  await applyRateLimit(clerkId)
  const validated = schema.parse(data)
  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")
  // ... business logic
}
```

Note: `applyRateLimit` and `getDbUser` are duplicated in each action file. [INFERRED: deliberate — keeps actions self-contained, avoids cross-file import for functions with side effects]

---

## Server Actions by Domain

| File | Actions |
|---|---|
| `lib/actions/jobs.ts` | `createJobAction`, `updateJobAction`, `updateJobNotesAction`, `updateJobStatusAction`, `deleteJobAction`, `addJobPhotoAction`, `deleteJobPhotoAction` |
| `lib/actions/quotes.ts` | `createQuoteAction`, `updateQuoteAction`, `updateQuoteStatusAction`, `deleteQuoteAction`, `acceptQuoteByTokenAction`, `rejectQuoteByTokenAction`, `sendQuoteEmailAction`, `saveQuoteAsTemplateAction`, `deleteTemplateAction`, `mergeQuotesAction`, `upsertMaterialAction` |
| `lib/actions/invoices.ts` | `createInvoiceAction`, `createInvoiceFromJobAction`, `createInvoiceFromQuoteAction`, `updateInvoiceAction`, `deleteInvoiceAction`, `sendInvoiceAction`, `markInvoicePaidAction`, `createCreditNoteAction`, `markOverdueAction`, `mergeInvoicesAction` |
| `lib/actions/customers.ts` | `createCustomerAction`, `updateCustomerAction`, `deleteCustomerAction` [INFERRED from schema] |
| `lib/actions/profile.ts` | Profile/company update actions |
| `lib/actions/bank-accounts.ts` | `createBankAccountAction`, `updateBankAccountAction`, `deleteBankAccountAction`, `setDefaultBankAccountAction` [INFERRED] |
| `lib/actions/notifications.ts` | `getNotificationsAction`, `markNotificationReadAction`, `markAllNotificationsReadAction`, `clearAllNotificationsAction` |
| `lib/actions/ai-job-recording.ts` | `createAiRecordingAction`, `getAiRecordingAction` [INFERRED] |

---

## API Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/webhooks/clerk` | POST | svix signature | Clerk user.created/deleted → users table sync |
| `/api/inngest` | GET/POST | Inngest signing | Background function receiver |
| `/api/cvr` | GET | Clerk `auth()` + rate limit | Proxy to cvrapi.dk — 400ms debounced |
| `/api/upload` | POST | Clerk `auth()` | Vercel Blob token for logo uploads (5MB, images only) |
| `/api/upload/jobs` | POST | Clerk `auth()` | Vercel Blob token for job photos (10MB, images + HEIC) |
| `/api/invoices/[id]/pdf` | GET | [INFERRED: Clerk] | Stream invoice PDF |
| `/api/quotes/[id]/pdf` | GET | [INFERRED: Clerk] | Stream quote PDF |
| `/api/materials/search` | GET | [INFERRED: Clerk] | Materials catalog autocomplete search |

---

## DB Query Layer

**Pattern:** One file per domain under `lib/db/queries/`. Each file exports typed functions that wrap Drizzle queries. Actions import from here — never write Drizzle queries directly in action files.

```
lib/db/queries/
├── jobs.ts          createJob, updateJob, softDeleteJob, getJobById, countActiveJobs, countAllJobsEver, addJobPhoto, deleteJobPhoto
├── quotes.ts        createQuote, updateQuote, softDeleteQuote, getQuoteById, getQuoteByToken, countAllQuotesEver, replaceQuoteItems, createTemplate, deleteTemplate, upsertMaterial
├── invoices.ts      createInvoice, updateInvoice, softDeleteInvoice, getInvoiceById, getInvoiceByQuote, countAllInvoicesEver, replaceInvoiceItems, markOverdueInvoices
├── customers.ts     [customer queries]
├── bank-accounts.ts getDefaultBankAccount, and CRUD
├── ai-recordings.ts [ai recording queries]
├── notifications.ts createNotification, getNotifications, markRead, markAllRead, clearAll
└── overview.ts      Dashboard aggregate queries
```

---

## Auth Architecture

**Clerk handles sessions.** The internal `users` table is a mirror of Clerk users with additional business fields.

**Two-layer resolution:**
1. `auth()` from Clerk → `userId` (Clerk's ID string, e.g., `user_abc123`)
2. `getDbUser(clerkId)` → internal `users` row (UUID primary key)

All DB queries use the internal `users.id` (UUID), never the Clerk string ID.

**Fallback on missing webhook:** `lib/auth/index.ts` — if `getDbUser` finds no row (webhook missed), it calls `currentUser()` from Clerk and creates the row on demand with `onConflictDoNothing()`.

**Dashboard access gate** (`app/[locale]/(dashboard)/layout.tsx`):
```
auth() → redirect /sign-in if no session
getDbUser() → redirect /profile/setup if user.companyName is null
```

---

## Error Handling

**Server Actions:** throw `new Error("message")` — Next.js surfaces these as unhandled errors unless caught in the client component.  
**Client pattern:** wrap action calls in `try/catch`, use `toast.error(err.message)`.  
**API routes:** return `NextResponse.json({ error: "..." }, { status: 4xx })`.  
**Email/Inngest failures:** wrapped in `try/catch` with no rethrow — documented as non-fatal (see `sendInvoiceAction`, `markInvoicePaidAction`).

---

## Financial Calculation Logic

**Location:** `lib/actions/invoices.ts` — `calcTotals()` and `applyLineDiscount()`  
**Also:** `lib/utils/vat.ts` — pure functions `calcVat()`, `calcInclVat()`, `calcExVat()`

Order of operations for invoice totals:
1. Per-line: `(qty × unitPrice) × (1 - lineDiscount)`
2. Sum all lines = `subtotalExVat`
3. Apply header discount to `subtotalExVat`
4. `vatAmount = subtotalExVat × 0.25`
5. `totalInclVat = subtotalExVat + vatAmount`

For quote→invoice conversion (`createInvoiceFromQuoteAction`): markup% is applied at conversion time and baked into `unitPrice` on invoice items — markup is NOT stored on invoice_items.

---

## Webhook Security

**Clerk webhook** (`app/api/webhooks/clerk/route.ts`): verified via svix library using `CLERK_WEBHOOK_SECRET`. Checks `svix-id`, `svix-timestamp`, `svix-signature` headers. Returns 400 if missing or invalid.

---

→ Related: `architecture/OVERVIEW.md`, `codebase/FRONTEND.md`, `architecture/DATABASE.md`
