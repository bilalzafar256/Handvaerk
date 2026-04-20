# Shared: Utilities, Types, and Config

## Utility Functions

### `lib/utils.ts`
```ts
cn(...inputs: ClassValue[]): string
```
Merges Tailwind classes with `clsx` + `tailwind-merge`. Used in every component.

---

### `lib/utils/currency.ts`
```ts
formatDKK(amount: number | string | null | undefined): string
```
- Formats as Danish locale currency: `1.234,56 kr.`
- Uses `Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK" })`
- Handles `null`, `undefined`, `NaN` → returns `"0,00 kr."`
- **MANDATORY:** Use this for ALL money display — never format inline

---

### `lib/utils/vat.ts`
```ts
calcVat(exVat: number): number       // exVat * 0.25
calcInclVat(exVat: number): number   // exVat * 1.25
calcExVat(inclVat: number): number   // inclVat / 1.25
```
VAT rate constant: `0.25` (25% Danish moms).

---

### `lib/utils/tier.ts`
```ts
type Tier = "free" | "solo" | "hold"

TIER_LIMITS = {
  free:  { activeJobs: 3 },   // Note: actions use FREE_TIER_JOB_LIMIT = 10 — mismatch with this constant!
  solo:  { activeJobs: Infinity },
  hold:  { activeJobs: Infinity },
}

canCreateJob(tier: Tier, activeJobCount: number): boolean
```

**⚠ INCONSISTENCY:** `TIER_LIMITS.free.activeJobs = 3` but `lib/actions/jobs.ts:21` uses `FREE_TIER_JOB_LIMIT = 10`. The action file's value is what's enforced. See `context/KNOWN_ISSUES.md`.

---

## DB Client & Auth

### `lib/db/index.ts`
Lazy Proxy singleton. Exports `db` (Proxy) and `getDb()` factory. Drizzle over Neon HTTP driver.

### `lib/auth/index.ts`
```ts
getDbUser(): Promise<User | null>
```
Resolves current Clerk session → DB user row. Creates row if missing (webhook fallback). Always call this in Server Components and Actions that need `user.id`.

---

## AI Client

### `lib/ai/client.ts`
Exports `geminiFlash` — Google Gemini Flash instance (currently unused in active pipeline).

### `lib/ai/index.ts`
Re-exports from `lib/ai/operations/extract-job-from-audio.ts`:
- `extractJobFromAudio(audioBase64, mimeType)` — convenience: transcribe + extract in one call
- `groqTranscribe(audioBase64, mimeType)` — Groq Whisper
- `groqExtractFromText(transcript)` — Groq LLaMA 3.3 70b
- `geminiExtractFromAudio(audioBase64, mimeType)` — Gemini primary (legacy, replaced by Groq pipeline)
- `geminiExtractFromText(transcript)` — Gemini text extraction (legacy)

### `lib/ai/schemas/recording-result.ts`
```ts
type ExtractedJobRecord = {
  customer: { name: string; phone?: string; email?: string; address?: string }
  job: { title: string; description: string; jobType: "service"|"project"|"recurring"; scheduledDate?: string; notes: string; materials: string[] }
  quote: { items: Array<{ description: string; qty: number; unitPrice: number; type: "labour"|"material"|"fixed"|"travel" }>; notes?: string }
}
```
Validated via Zod — LLM output is always passed through `extractedJobRecordSchema.parse()`.

---

## Email Client

### `lib/email/client.ts`
```ts
export const resend = new Resend(process.env.RESEND_API_KEY)
export const EMAIL_FROM = "Håndværk Pro <onboarding@resend.dev>"
```
**[PRODUCTION ISSUE]:** `EMAIL_FROM` uses `onboarding@resend.dev` — must be updated to a verified custom domain before launch.

---

## Inngest Client

### `lib/inngest/client.ts`
Exports `inngest` instance. Imported by all Inngest function files.

---

## Rate Limiter

### `lib/upstash/index.ts`
Exports `redis`, `rateLimiter`, `strictRateLimiter`, `aiRateLimiter`. See `architecture/INFRASTRUCTURE.md` for limits.

---

## Shared Types (Drizzle inferred)

All types are inferred via Drizzle's `$inferSelect` / `$inferInsert`:

```ts
// From lib/db/schema/users.ts
type User    = typeof users.$inferSelect
type NewUser = typeof users.$inferInsert

// From lib/db/schema/customers.ts
type Customer    = typeof customers.$inferSelect
type NewCustomer = typeof customers.$inferInsert

// From lib/db/schema/jobs.ts
type Job      = typeof jobs.$inferSelect
type NewJob   = typeof jobs.$inferInsert
type JobPhoto = typeof jobPhotos.$inferSelect

// From lib/db/schema/quotes.ts
type Quote            = typeof quotes.$inferSelect
type QuoteItem        = typeof quoteItems.$inferSelect
type QuoteTemplate    = typeof quoteTemplates.$inferSelect
type MaterialCatalogItem = typeof materialsCatalog.$inferSelect

// From lib/db/schema/invoices.ts
type Invoice     = typeof invoices.$inferSelect
type InvoiceItem = typeof invoiceItems.$inferSelect

// From lib/db/schema/bank-accounts.ts
type BankAccount = typeof bankAccounts.$inferSelect

// From lib/db/schema/ai-recordings.ts
type AiRecording = typeof aiRecordings.$inferSelect

// From lib/db/schema/notifications.ts
type Notification = typeof notifications.$inferSelect
```

---

## Form Data Types (Zod-inferred from actions)

```ts
// lib/actions/jobs.ts
type JobFormData = {
  customerId: string (uuid)
  title: string
  description?: string
  jobType: "service" | "project" | "recurring"
  status: "new" | "scheduled" | "in_progress" | "done" | "invoiced" | "paid"
  scheduledDate?: string
  endDate?: string
  notes?: string
}

// lib/actions/quotes.ts — lineItemSchema
type LineItemFormData = {
  itemType: "labour" | "material" | "fixed" | "travel"
  description: string
  quantity?: string
  unitPrice?: string
  markupPercent?: string
  discountType?: "percent" | "fixed"
  discountValue?: string
  vatRate: string (default "25.00")
  sortOrder: number (default 0)
}

// lib/actions/quotes.ts
type QuoteFormData = {
  customerId: string (uuid)
  jobId?: string (uuid)
  validUntil?: string
  discountType?: "percent" | "fixed"
  discountValue?: string
  notes?: string
  internalNotes?: string
  items: LineItemFormData[]
}

// lib/actions/invoices.ts
type InvoiceFormData = {
  customerId: string (uuid)
  jobId?: string
  quoteId?: string
  dueDate: string
  paymentTermsDays: number (default 14)
  bankAccount?: string
  mobilepayNumber?: string
  notes?: string
  items: (LineItemFormData without markupPercent + with lineTotal?)[]
}
```

---

## i18n

Translation namespaces (known):
- `Sidebar` — nav labels, signOut, settingsSection, profile
- `BottomNav` — overview, jobs, invoices, profile
- Others: [UNKNOWN — needs manual fill by reading all useTranslations() calls]

Files: `messages/en.json`, `messages/da.json`

---

## LineItem Component Type

```ts
// components/shared/line-item-builder.tsx
type ItemType = "labour" | "material" | "fixed" | "travel"

interface LineItem {
  id: string           // client-side UUID only — not stored
  itemType: ItemType
  description: string
  quantity: string
  unitPrice: string
  markupPercent?: string
  discountType?: "percent" | "fixed" | ""
  discountValue?: string
  vatRate: string
  sortOrder: number
}
```

---

## CVR Search Hook

```ts
// hooks/use-cvr-search.ts
useCvrSearch(query: string): { result: CvrResult | null; loading: boolean }

type CvrResult = {
  name: string; cvr: string; address: string; zip: string; city: string
}
```
Debounced 400ms. Calls `/api/cvr?q=...`. Used in `CustomerForm` and `CompanyProfileForm`.

---

→ Related: `codebase/FRONTEND.md`, `codebase/BACKEND.md`, `architecture/DATABASE.md`
