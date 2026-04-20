# Database

**Engine:** Neon serverless PostgreSQL  
**ORM:** Drizzle ORM (neon-http driver)  
**Connection:** Lazy Proxy singleton — `lib/db/index.ts` — instantiates only on first use, avoids build-time crash when `DATABASE_URL` unset.  
**Schema source:** `lib/db/schema/` — one file per domain, re-exported from `lib/db/schema/index.ts`

---

## Tables

### `users`
**Source:** `lib/db/schema/users.ts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Internal DB ID |
| `clerk_id` | text UNIQUE NOT NULL | Clerk's user ID — the bridge between Clerk session and DB row |
| `email` | text | Nullable — from Clerk on creation |
| `phone` | text | Nullable |
| `company_name` | text | Required before dashboard access — enforced in `(dashboard)/layout.tsx` |
| `cvr_number` | text | Danish VAT registration number |
| `address_line1` | text | |
| `address_city` | text | |
| `address_zip` | text | |
| `hourly_rate` | numeric(10,2) | Used as default labour rate in quote builder |
| `logo_url` | text | Vercel Blob URL |
| `tier` | text DEFAULT 'free' | `'free'` \| `'solo'` \| `'hold'` — gates features |
| `mobilepay_number` | text | Pre-fills invoice payment info |
| `google_review_url` | text | Sent in post-payment thank-you email |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Key invariant:** `clerk_id` is set on row creation via Clerk webhook (`user.created`). If webhook misses, `getDbUser()` in `lib/auth/index.ts` creates the row on first server-side call as a fallback.

---

### `customers`
**Source:** `lib/db/schema/customers.ts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | Owner isolation — all queries filter by this |
| `name` | text NOT NULL | |
| `phone` | text | Rendered as `tel:` link |
| `email` | text | Used for quote/invoice emails |
| `address_line1` / `address_city` / `address_zip` | text | |
| `cvr_number` | text | Business customers — F-208 |
| `ean_number` | text | NemHandel/PEPPOL — carried to invoice.ean_number |
| `notes` | text | Internal only, not shown to customer |
| `is_favorite` | boolean DEFAULT false | |
| `deleted_at` | timestamp | Soft delete — all queries must filter `isNull(deletedAt)` |

---

### `jobs`
**Source:** `lib/db/schema/jobs.ts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `customer_id` | uuid FK → customers | |
| `job_number` | text NOT NULL | Sequential per user (e.g., "1", "2"). KNOWN ISSUE: not zero-padded, per-customer reset not implemented — see `KNOWN_ISSUES.md` |
| `title` | text NOT NULL | |
| `description` | text | |
| `job_type` | text DEFAULT 'service' | `'service'` \| `'project'` \| `'recurring'` |
| `status` | text DEFAULT 'new' | `new` → `scheduled` → `in_progress` → `done` → `invoiced` → `paid` |
| `scheduled_date` | date | |
| `end_date` | date | Expected completion / deadline |
| `completed_date` | date | Auto-set when status transitions to `done` |
| `notes` | text | Internal |
| `deleted_at` | timestamp | Soft delete |

**Free tier gate:** `countActiveJobs(userId)` counts all jobs where status NOT in `['paid', 'invoiced']` — limit is `FREE_TIER_JOB_LIMIT = 10` in `lib/actions/jobs.ts:21`.

---

### `job_photos`
**Source:** `lib/db/schema/jobs.ts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `job_id` | uuid FK → jobs | |
| `file_url` | text NOT NULL | Vercel Blob URL |
| `caption` | text | |
| `created_at` | timestamp | |

---

### `quotes`
**Source:** `lib/db/schema/quotes.ts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `job_id` | uuid FK → jobs (nullable) | Optional link |
| `customer_id` | uuid FK → customers | |
| `quote_number` | text NOT NULL | Format: `TIL-0001` (sequential per user) |
| `status` | text DEFAULT 'draft' | `draft` → `sent` → `accepted` \| `rejected` \| `expired` \| `merged` |
| `valid_until` | date | |
| `discount_type` | text | `'percent'` \| `'fixed'` — header-level discount |
| `discount_value` | numeric(10,2) | |
| `notes` | text | Shown to customer on public quote view |
| `internal_notes` | text | Not shown to customer |
| `share_token` | text | 48-char hex token for shareable URL: `/en/q/[token]` |
| `merged_into` | uuid | Set when status = `merged` — points to the new merged quote |
| `follow_up_draft` | text | AI-generated follow-up email body; null = no draft pending |
| `accepted_at` / `rejected_at` / `sent_at` | timestamp | |
| `deleted_at` | timestamp | Soft delete |

---

### `quote_items`
**Source:** `lib/db/schema/quotes.ts`

| Column | Type | Notes |
|---|---|---|
| `quote_id` | uuid FK → quotes CASCADE DELETE | Items deleted with parent quote |
| `item_type` | text NOT NULL | `'labour'` \| `'material'` \| `'fixed'` \| `'travel'` |
| `description` | text NOT NULL | |
| `quantity` | numeric(10,2) | |
| `unit_price` | numeric(10,2) | |
| `markup_percent` | numeric(5,2) | Quotes only — not present on invoice_items |
| `discount_type` | text | Per-line: `'percent'` \| `'fixed'` \| null |
| `discount_value` | numeric(10,2) | |
| `vat_rate` | numeric(5,2) DEFAULT 25.00 | Always 25% in practice |
| `sort_order` | integer DEFAULT 0 | Drag-and-drop ordering |

---

### `quote_templates`
**Source:** `lib/db/schema/quotes.ts`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid FK → users | |
| `name` | text NOT NULL | |
| `items` | jsonb | Snapshot of line items at save time |

---

### `materials_catalog`
**Source:** `lib/db/schema/quotes.ts`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid FK → users | Per-user catalog |
| `name` | text NOT NULL | Used for autocomplete in LineItemBuilder |
| `default_unit` | text | |
| `default_price` | numeric(10,2) | |
| `default_markup` | numeric(5,2) | |

---

### `invoices`
**Source:** `lib/db/schema/invoices.ts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `job_id` | uuid FK → jobs (nullable) | |
| `customer_id` | uuid FK → customers | |
| `quote_id` | uuid FK → quotes (nullable) | Set when created from quote |
| `invoice_number` | text NOT NULL | Format: `FAK-0001`; credit notes: `KRE-0001` |
| `status` | text DEFAULT 'draft' | `draft` → `sent` → `viewed` → `paid` \| `overdue` \| `merged` |
| `is_credit_note` | boolean DEFAULT false | |
| `original_invoice_id` | uuid (nullable) | Points to reversed invoice on credit notes |
| `issue_date` | date NOT NULL | |
| `due_date` | date NOT NULL | |
| `payment_terms_days` | integer DEFAULT 14 | |
| `subtotal_ex_vat` | numeric(12,2) | |
| `vat_amount` | numeric(12,2) | |
| `total_incl_vat` | numeric(12,2) | |
| `discount_amount` | numeric(12,2) DEFAULT 0 | |
| `bank_account` | text | Format: `"Reg. XXXX | Konto XXXXXXXX"` |
| `mobilepay_number` | text | Static reference (stub) |
| `mobilepay_link` | text | Future: MobilePay Erhverv API |
| `ean_number` | text | Copied from customer.ean_number on creation |
| `oioubl` | boolean DEFAULT false | PEPPOL export flag |
| `peppol_id` | text | |
| `merged_into` | uuid | Set when status = `merged` |
| `notes` | text | |
| `paid_at` / `sent_at` / `viewed_at` | timestamp | Lifecycle tracking |
| `reminder_1_sent_at` / `reminder_2_sent_at` | timestamp | Inngest reminder tracking |
| `deleted_at` | timestamp | Soft delete |

---

### `invoice_items`
**Source:** `lib/db/schema/invoices.ts`

| Column | Type | Notes |
|---|---|---|
| `invoice_id` | uuid FK → invoices CASCADE DELETE | |
| `item_type` | text NOT NULL | Same enum as quote_items |
| `description` | text NOT NULL | |
| `quantity` | numeric(10,2) | |
| `unit_price` | numeric(10,2) | |
| `discount_type` / `discount_value` | text / numeric | Per-line discount (same as quote_items) |
| `vat_rate` | numeric(5,2) DEFAULT 25.00 | |
| `line_total` | numeric(12,2) | Pre-computed and stored (qty × price × discount) |
| `sort_order` | integer DEFAULT 0 | |

**Difference from quote_items:** invoice_items store `line_total` and have NO `markup_percent`. Markup is applied during invoice creation from quote, then baked into the unit price.

---

### `bank_accounts`
**Source:** `lib/db/schema/bank-accounts.ts`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid FK → users | |
| `bank_name` | text | |
| `reg_number` | text NOT NULL | Danish bank routing number |
| `account_number` | text NOT NULL | |
| `is_default` | boolean DEFAULT false | At most one default per user |

---

### `ai_recordings`
**Source:** `lib/db/schema/ai-recordings.ts`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid FK → users CASCADE DELETE | |
| `status` | text DEFAULT 'pending' | `pending` → `processing` → `ready` \| `failed` |
| `blob_url` | text NOT NULL | Vercel Blob URL — cleared to `""` after processing (GDPR) |
| `mime_type` | text DEFAULT 'audio/webm' | |
| `extracted_data` | jsonb | Populated when status = `ready` — shape: `ExtractedJobRecord` |
| `current_step` | text | Last Inngest step that executed |
| `error_step` | text | Step that threw before fallback |
| `error_message` | text | |
| `inngest_run_id` | text | For debugging in Inngest dashboard |

---

### `time_entries`
**Source:** `lib/db/schema/time-entries.ts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | Owner isolation |
| `job_id` | uuid FK → jobs | The job being timed |
| `started_at` | timestamp NOT NULL | Written immediately on clock-in |
| `ended_at` | timestamp | NULL = timer currently running |
| `duration_minutes` | integer | Computed on clock-out: `Math.max(1, Math.round((endedAt - startedAt) / 60000))` |
| `description` | text | Optional note |
| `is_billable` | boolean DEFAULT true | Only billable entries count toward line item conversion |
| `billed_to_quote_id` | uuid FK → quotes (nullable) | Set by `addBillableHoursToLineItemAction` to track duplication |
| `billed_to_invoice_id` | uuid FK → invoices (nullable) | Same — prevents silent double-billing |
| `created_at` | timestamp | |
| `deleted_at` | timestamp | Soft delete |

**Key invariants:**
- One active entry per user enforced in `clockInAction` (checks `isNull(endedAt)` before insert)
- Free tier gate: 50 entries max, checked via `countTimeEntries(userId)` in `clockInAction`
- `billedToQuoteId` / `billedToInvoiceId` are informational — the UI warns but does not block re-billing
- GDPR: included in `exportUserDataAction` and deleted in `hardDeleteUser` step before jobs

---

### `pricebook_items`
**Source:** `lib/db/schema/pricebook.ts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | Owner isolation |
| `name` | text NOT NULL | Display name, max 120 chars (validated in action) |
| `description` | text | Optional detail |
| `unit_price` | numeric(10,2) NOT NULL | Ex. VAT, DKK |
| `item_type` | text DEFAULT 'material' | `labour` \| `material` \| `fixed` \| `travel` |
| `is_active` | boolean DEFAULT true | Soft-disable without deleting |
| `created_at` | timestamp | |
| `deleted_at` | timestamp | Soft delete |

**Key invariants:**
- Free tier gate: 20 items max, checked via `countPricebookItems(userId)` in `createPricebookItemAction`
- GDPR: included in `exportUserDataAction` and deleted in `hardDeleteUser` step

---

### `notifications`
**Source:** `lib/db/schema/notifications.ts`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid FK → users CASCADE DELETE | |
| `type` | text NOT NULL | `ai_customer_found` \| `ai_job_found` \| `ai_quote_found` \| `quote_followup_draft` |
| `title` | text NOT NULL | |
| `body` | text NOT NULL | |
| `metadata` | jsonb | `{ recordingId, entityType }` or `{ quoteId, quoteNumber }` |
| `read` | boolean DEFAULT false | |
| `read_at` | timestamp | |

---

## Soft Delete Pattern

All user-generated data tables have `deleted_at` nullable timestamp:
- `customers`, `jobs`, `quotes`, `invoices`
- Every query MUST include `isNull(table.deletedAt)` in the WHERE clause
- Drizzle syntax: `where: (t, { isNull }) => isNull(t.deletedAt)`
- **Missing this filter silently returns deleted records** — the most common bug class

## Audit/Lifecycle Fields

All core tables: `created_at`, `updated_at` (auto-set by Drizzle)  
Status transitions tracked via dedicated timestamp columns (e.g., `sentAt`, `paidAt`, `acceptedAt`)

## Migration Strategy

- Runner: `drizzle-kit` (`npx drizzle-kit generate` then `npx drizzle-kit migrate`)
- Files: `drizzle/migrations/` — `.sql` + `meta/XXXX_snapshot.json` pairs
- **NEVER create `.sql` files manually or edit `_journal.json`** — missing snapshots corrupt future schema diffs
- 15 migrations applied as of current state (0000 → 0014)
- Migration 0012 adds the `time_entries` table (Phase 31)
- Migration 0013 adds `follow_up_draft` to `quotes` (Phase 15)
- Migration 0014 adds `pricebook_items` table (Phase 20)
- Note: snapshots 0005–0010 are missing from `drizzle/migrations/meta/` — only 0000–0004 and 0011+ are present. This is a known gap. [INFERRED: migrations were manually created or snapshots were deleted]

## Indexes (planned — not yet applied)

From `docs/FEATURES.md` Phase 9, these indexes are specified but not confirmed applied:
```sql
CREATE INDEX idx_invoices_user_issue_date ON invoices(user_id, issue_date);
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status != 'paid';
CREATE INDEX idx_invoices_customer ON invoices(user_id, customer_id);
CREATE INDEX idx_jobs_customer ON jobs(user_id, customer_id);
CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);
```

---

→ Related: `architecture/OVERVIEW.md`, `codebase/BACKEND.md`, `context/KNOWN_ISSUES.md`
