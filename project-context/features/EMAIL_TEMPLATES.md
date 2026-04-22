# Feature: Email Template Manager

## Purpose

Let tradespeople customise every outbound email — subject line, body, header image, and attachment behaviour — using click-to-insert `[[variable]]` placeholders. Currently all emails use hardcoded Resend templates. This replaces them with per-user, per-type overrides, falling back to the hardcoded templates when no custom template is saved.

---

## Email Types Covered

| Key | Triggered by | Current hardcoded template |
|---|---|---|
| `invoice_sent` | `sendInvoiceAction` | `InvoiceSentEmail` |
| `invoice_reminder_1` | Inngest `invoice-reminder.ts` | `PaymentReminderEmail` |
| `invoice_reminder_2` | Inngest `invoice-reminder.ts` | `PaymentReminderEmail` |
| `invoice_paid` | `markInvoicePaidAction` | `InvoicePaidThankyouEmail` |
| `quote_sent` | `sendQuoteAction` | `QuoteSentEmail` |
| `quote_accepted` | `acceptQuoteByTokenAction` | `QuoteAcceptedEmail` |
| `quote_rejected` | `rejectQuoteByTokenAction` | `QuoteRejectedEmail` |

---

## Variable Placeholders

Variables use the `[[snake_case_name]]` syntax. At send time the renderer performs a simple global string-replace — no templating engine needed.

### Universal (available in all templates)

| Variable | Resolved from |
|---|---|
| `[[company_name]]` | `users.companyName` |
| `[[company_phone]]` | `users.phone` |
| `[[company_address]]` | `users.companyAddress + companyCity` |
| `[[customer_name]]` | `customers.name` |
| `[[customer_email]]` | `customers.email` |
| `[[current_date]]` | Today, formatted `DD. MMMM YYYY` |

### Invoice templates (`invoice_sent`, `invoice_reminder_1`, `invoice_reminder_2`, `invoice_paid`)

| Variable | Resolved from |
|---|---|
| `[[invoice_number]]` | `invoices.invoiceNumber` (e.g. `FAK-0042`) |
| `[[invoice_amount]]` | `formatDKK(invoices.totalInclVat)` |
| `[[invoice_due_date]]` | `invoices.dueDate` formatted `DD. MMMM YYYY` |
| `[[payment_details]]` | Bank reg/account or MobilePay number |
| `[[mobilepay_number]]` | `users.mobilepayNumber` (omitted if null) |

### Quote templates (`quote_sent`, `quote_accepted`, `quote_rejected`)

| Variable | Resolved from |
|---|---|
| `[[quote_number]]` | `quotes.quoteNumber` |
| `[[quote_amount]]` | `formatDKK(quotes.totalInclVat)` |
| `[[quote_valid_until]]` | `quotes.validUntil` formatted `DD. MMMM YYYY` |
| `[[quote_link]]` | Full shareable URL: `APP_URL/quotes/[id]?token=[shareToken]` |
| `[[job_description]]` | `jobs.description` (first 200 chars) |

### Review template (`invoice_paid` only)

| Variable | Resolved from |
|---|---|
| `[[google_review_link]]` | `users.googleReviewUrl` (omitted if null) |

---

## Database Schema

New table: `email_templates`

```
id                uuid          PK
userId            text          FK → users.clerkId, NOT NULL
emailType         text          one of the 7 keys above, NOT NULL
subject           text          max 200 chars, NOT NULL
body              text          HTML string (from editor), NOT NULL
headerImageUrl    text          nullable — Vercel Blob URL for top banner image
includeAttachment boolean       default true — attaches PDF where applicable
isActive          boolean       default true
createdAt         timestamp     NOT NULL default now()
updatedAt         timestamp     NOT NULL
deletedAt         timestamp     nullable (soft delete)

UNIQUE (userId, emailType)
```

**Attachment rules:** `includeAttachment` only applies to templates that currently attach a PDF: `invoice_sent`, `invoice_reminder_1`, `invoice_reminder_2`, `quote_sent`. The field is stored for all types but ignored for templates that never attach a file.

---

## Architecture

### Send-time resolution

In every email-sending path, before calling the hardcoded template:

```
getActiveEmailTemplate(userId, emailType)
  → if null: use existing hardcoded template (no change)
  → if found:
      subject = substituteVariables(template.subject, vars)
      body    = substituteVariables(template.body, vars)
      if template.headerImageUrl: prepend image block to body
      if template.includeAttachment: attach PDF (existing logic)
      send via Resend with custom subject + HTML body
```

`substituteVariables(str, vars)` is a pure function: replace every `[[key]]` with `vars[key] ?? ''`.

### Server Actions

| Action | Description |
|---|---|
| `getEmailTemplatesAction()` | Returns all 7 template rows for the current user (with nulls for unconfigured types — client shows "Using default") |
| `upsertEmailTemplateAction(data)` | Create or update one template (Zod-validated) |
| `deleteEmailTemplateAction(emailType)` | Soft-deletes the template → falls back to default |
| `sendTestEmailAction(emailType)` | Renders template with sample data → sends to user's own email |

All actions: `applyRateLimit`, Zod input parsing, `userId` from `auth()`.

### Key Files

| File | Role |
|---|---|
| `lib/db/schema/email-templates.ts` | Drizzle schema for `email_templates` |
| `lib/db/queries/email-templates.ts` | `getActiveEmailTemplate`, `getUserEmailTemplates` |
| `lib/actions/email-templates.ts` | Server Actions |
| `lib/email/substitute-variables.ts` | Pure `substituteVariables(str, vars)` function |
| `lib/email/resolve-template-vars.ts` | Fetch and assemble the `vars` map for each email type |
| `components/email-templates/template-list.tsx` | List of all 7 types with status badges |
| `components/email-templates/template-editor.tsx` | Subject field + body editor + variable picker + image upload + attachment toggle |
| `app/[locale]/(app)/profile/email-templates/page.tsx` | Route (nested under `/profile`) |

---

## UI Design

### Page: `/profile/email-templates`

- Nested under the Profile section (new tab alongside bank details, reminders, Google review)
- List of 7 email type cards in a vertical stack
- Each card shows:
  - Email type label ("Invoice Sent", "Payment Reminder 1", etc.)
  - Triggered-by note ("Sent when you email an invoice to a customer")
  - Status badge: **Customised** (primary) or **Using default** (muted)
  - Edit button → opens editor (same page, slide-in panel or navigates to sub-route)

### Editor

Split into two tabs: **Edit** and **Preview**.

**Edit tab:**
- Subject line input (single line, shows char count, `[[variables]]` highlighted inline)
- Body editor: rich textarea with basic formatting (bold, italic, link). Not a full WYSIWYG — a contenteditable div with a small toolbar. Variables appear as teal chips within the text.
- Variable picker sidebar (right side on desktop, collapsible drawer on mobile):
  - Groups: Universal / Invoice / Quote / Review
  - Only relevant groups shown for the selected email type
  - Click any variable → inserts `[[variable_name]]` at cursor position
- Header image section: upload or drag-drop (Vercel Blob, same pattern as logo upload). Shows preview. Remove button. Supported formats: JPG, PNG, max 2 MB.
- Attachment toggle: checkbox "Include PDF attachment" (only shown for applicable types).
- Actions: **Save**, **Send test email**, **Reset to default** (destructive, requires confirm).

**Preview tab:**
- Renders the template with sample placeholder values (not real DB data — static samples like "Jens Hansen", "FAK-0042", "3.500,00 kr").
- Shows exactly what the customer will see: header image (if set), body text with variables substituted, footer.

### Empty state

When no custom template is saved for a type, the Edit tab loads pre-filled with the current default template content (pulled from the hardcoded email component as a fallback string constant) so the user has a starting point.

---

## Fallback Behaviour

If a user has no template for a given `emailType`:
- Existing hardcoded Resend template is used unchanged
- No DB query overhead — `getActiveEmailTemplate` returns `null` immediately
- No visible change to current email behaviour

This guarantees zero regression for users who never touch the feature.

---

## Free Tier vs Pro

| Tier | Access |
|---|---|
| Free | Can customise subject line only; body editor locked behind upgrade prompt |
| Pro | Full access: subject + body + header image + attachment toggle |

---

## Migrations

Run `npx drizzle-kit generate` after adding `lib/db/schema/email-templates.ts`. Never hand-edit the migration or `_journal.json`.

---

## Variable Substitution — Implementation Notes

- Unresolved variables (e.g. `[[google_review_link]]` when URL is not set) are replaced with `''` not left as `[[...]]`.
- Variables are case-sensitive — always lowercase with underscores.
- No nested variables or logic — purely string replacement.
- `substituteVariables` must sanitize HTML special chars in variable values to prevent XSS when inserted into the HTML body (e.g. `&` → `&amp;`, `<` → `&lt;`).

---

## Edge Cases

1. **Reminder templates:** `invoice_reminder_1` and `invoice_reminder_2` are separate types so the second reminder can have escalating tone if the user chooses.
2. **Quote accepted/rejected templates:** These are sent to the **user** (tradesperson), not the customer. Make this explicit in the UI.
3. **`quote_sent` attachment:** The PDF quote is always attached when `includeAttachment = true`; there is no quote PDF route equivalent to invoice PDF — check that quote PDF generation is stable before wiring.
4. **Long bodies:** No hard limit on body length, but Resend has a 10 MB payload cap — image attachments + body together must stay under that.

---

→ Related: `features/INVOICES.md`, `features/QUOTES.md`, `architecture/DATABASE.md`, `codebase/BACKEND.md`
