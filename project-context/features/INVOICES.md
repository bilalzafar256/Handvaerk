# Feature: Invoice Engine

## Purpose
Generate legally compliant Danish invoices with proper moms layout, send by email with PDF attachment, automate payment reminders via Inngest, and track payment status.

---

## Key Files
| File | Role |
|---|---|
| `lib/db/schema/invoices.ts` | Schema: `invoices`, `invoice_items` |
| `lib/db/queries/invoices.ts` | DB operations |
| `lib/actions/invoices.ts` | All invoice Server Actions |
| `lib/inngest/invoice-reminder.ts` | Inngest function: payment reminders |
| `lib/pdf/generate-invoice.tsx` | PDF buffer generation |
| `components/pdf/invoice-pdf.tsx` | PDF React template |
| `components/forms/invoice-form.tsx` | Create/edit form |
| `components/invoices/invoice-list.tsx` | List view |
| `components/invoices/invoice-detail.tsx` | Detail view |
| `app/api/invoices/[id]/pdf/route.tsx` | PDF download endpoint |

---

## Invoice Number Formats

| Type | Format | Example |
|---|---|---|
| Standard invoice | `FAK-XXXX` | `FAK-0042` |
| Credit note | `KRE-XXXX` | `KRE-0001` |
| Counter source | `countAllInvoicesEver(userId)` | Includes all statuses + soft-deleted |

---

## Status Flow

```
draft → sent → viewed → paid
                      → overdue (auto-set when due_date passes)
```

Additional terminal state: `merged` (source invoices after merge).

Timestamps tracked: `sentAt`, `viewedAt`, `paidAt`, `reminder1SentAt`, `reminder2SentAt`.

---

## Three Creation Paths

### 1. From scratch
`createInvoiceAction(data)` — standard form.

### 2. From Job (`createInvoiceFromJobAction(jobId)`)
- Pre-fills customer, copies job description as notes
- Creates empty invoice (no line items) — redirects to edit
- Auto-sets job `status → "invoiced"`
- Pre-fills bank account from user's default bank account

### 3. From Accepted Quote (`createInvoiceFromQuoteAction(quoteId, force?)`)
- Duplicate guard: if non-deleted invoice already exists for this `quoteId`, returns `{ existingInvoiceId }` (client shows modal with "View existing" / "Create new anyway")
- Copies all line items, applies markup at conversion (markup baked into unitPrice)
- Carries per-line and header discounts from quote
- Carries `customer.ean_number` to `invoice.ean_number`
- Pre-fills bank account from user's default

---

## Email + PDF Flow

`sendInvoiceAction(id)`:
1. Generates PDF buffer via `generateInvoicePdfBuffer()` from `lib/pdf/generate-invoice.tsx`
2. Sends email via Resend with `InvoiceSentEmail` template + PDF attachment
3. Attachment filename: `faktura-FAK-0042.pdf`
4. Updates `status → "sent"`, `sentAt = now()`
5. Sends Inngest event `"invoice/sent"` to trigger reminder workflow (non-blocking, wrapped in try/catch)

**Auto-resend on edit:** `updateInvoiceAction` fetches the current status before saving. If the invoice is `"sent"`, `"viewed"`, or `"overdue"`, it calls `sendInvoiceAction` automatically after saving — the customer receives an updated PDF with no manual step required. This also re-triggers the Inngest reminder workflow from the new `sentAt`. Invoices in `draft`, `paid`, or `merged` status are not auto-resent.

---

## Payment Reminder Workflow (Inngest)

**Function:** `lib/inngest/invoice-reminder.ts`  
**Trigger:** `"invoice/sent"`  
**Timing:** Anchored to `due_date`, not sent date. Days are read from `users.invoice_reminder_1_days` and `users.invoice_reminder_2_days` (defaults: 3 and 7).

Timeline:
```
invoice/sent event
  ↓
  step.sleepUntil(dueDate + reminder1Days)
  ↓
    check invoice is still unpaid in DB — if paid, skip
    send PaymentReminderEmail (reminder #1)
    db.update reminder1SentAt
  ↓
  step.sleepUntil(dueDate + reminder2Days)
  ↓
    check invoice still unpaid in DB — if paid, skip
    send PaymentReminderEmail (reminder #2)
    db.update reminder2SentAt
```

Both sleeps use absolute dates (`step.sleepUntil`), so if the due date is already past when the invoice is sent, reminder #1 fires immediately. Each reminder checks the DB for `paidAt IS NULL` before sending — no separate cancellation event needed.

---

## Post-Payment Flow

`markInvoicePaidAction(id)`:
1. Sets `status → "paid"`, `paidAt = now()`
2. Sends `"invoice/paid"` Inngest event (cancels pending reminders)
3. Sends `InvoicePaidThankyouEmail` to customer (non-blocking)
   - Includes `googleReviewUrl` if set on user profile

---

## Credit Notes

`createCreditNoteAction(originalInvoiceId)`:
- Number format: `KRE-XXXX`
- Negates all amounts: `subtotalExVat`, `vatAmount`, `totalInclVat` all multiplied by -1
- Line items: `unitPrice` negated, `lineTotal` negated
- Sets `isCreditNote = true`, `originalInvoiceId = original.id`
- Redirects to `/invoices/[creditNoteId]`

---

## Merge Invoices

`mergeInvoicesAction(ids)`:
- Same constraints as quote merge: all invoices must share same `customerId`
- Combines all line items
- Picks bank info from first invoice that has it
- Sets originals: `status = "merged"`, `mergedInto = newInvoice.id`

---

## NemHandel / PEPPOL Fields

Stored on invoices but UI not yet fully implemented (Phase 14):
- `eanNumber` — copied from `customer.ean_number`
- `oioubl` — boolean flag for PEPPOL XML export format
- `peppolId` — PEPPOL network identifier

---

## MobilePay

`mobilepayNumber` field on invoices (and users) — displays a static payment reference. NOT a payment link. MobilePay Erhverv API integration is explicitly deferred and stubbed.

---

## Overdue Detection

Two paths:

**Automated (cron):** `lib/inngest/overdue-invoices.ts` — `markOverdueInvoicesCron` runs daily at 06:00 UTC via Inngest cron (`"0 6 * * *"`). Calls `markAllOverdueInvoices()` which updates all `sent`/`viewed` invoices across all users where `due_date < today`.

**Manual (per-user):** `markOverdueAction()` server action — calls `markOverdueInvoices(userId)` for the current user only. Same condition, scoped to one user.

## Configurable Reminder Settings

Users can configure reminder timing on the Profile page (`/profile`) — Invoice reminders section. Two inputs:
- **First reminder** — days after due date (default 3)
- **Second reminder** — days after due date (default 7, must be greater than first)

Saved via `updateInvoiceRemindersAction` in `lib/actions/profile.ts` → stored in `users.invoice_reminder_1_days` / `users.invoice_reminder_2_days`. Applied to all future sent invoices (already-running Inngest jobs use the settings captured at send time).

---

## PDF Generation

`lib/pdf/generate-invoice.tsx` + `components/pdf/invoice-pdf.tsx` using `@react-pdf/renderer`.

Key data passed to PDF:
- Sender: `companyName`, `companyAddress`, `companyCity`, `companyCvr`, `companyLogoUrl`
- Recipient: `customerName`, `customerAddress`, `customerCity`, `customerEan`
- Items: `description`, `quantity`, `unitPrice`
- Totals: `subtotalExVat`, `vatAmount`, `totalInclVat`
- Payment: `bankAccount` (format: `"Reg. XXXX | Konto XXXXXXXX"`), `mobilepayNumber`

PDF available for download at: `GET /api/invoices/[id]/pdf`

---

## Edge Cases / Gotchas

1. **calcTotals recalculates on updateInvoiceAction** — if you change line items and save, totals are recomputed from the submitted items (not stored lineTotal). The stored `lineTotal` on invoice_items is the pre-save value.
2. **`discountAmount` on invoice header** — set by `calcTotals()` but only when a header discount is present. There is NO header discount field on `InvoiceFormData` (different from quote). Header discounts only arrive via `createInvoiceFromQuoteAction`. Direct invoice creation has no header discount UI.
3. **`paymentTermsDays` default inconsistency:** `createInvoiceAction` defaults to 14, `createInvoiceFromJobAction` uses 15, `createInvoiceFromQuoteAction` uses 15. Inconsistent.
4. **`NEXT_PUBLIC_APP_URL` missing from `.env.example`** — not needed for invoices but needed for quote share links.
5. **Inngest non-fatal pattern** — if Inngest `send()` fails (e.g., INNGEST_EVENT_KEY not set), the invoice is still sent and status updated. Reminders simply won't be scheduled. No user-visible error.

---

→ Related: `features/QUOTES.md`, `features/JOBS.md`, `architecture/INFRASTRUCTURE.md`, `architecture/DATABASE.md`
