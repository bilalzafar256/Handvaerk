# Feature: Quote Builder

## Purpose
Build itemized quotes with labour/material/fixed/travel line items, send to customers via email with a public shareable link, and allow customers to accept/reject without logging in. Accepted quotes convert to invoices in one tap.

---

## Key Files
| File | Role |
|---|---|
| `lib/db/schema/quotes.ts` | Schema: `quotes`, `quote_items`, `quote_templates`, `materials_catalog` |
| `lib/db/queries/quotes.ts` | DB operations |
| `lib/actions/quotes.ts` | Server Actions |
| `components/forms/quote-form.tsx` | Create/edit form |
| `components/quotes/quote-detail.tsx` | Detail view |
| `components/quotes/quote-list.tsx` | List view |
| `components/quotes/public-quote-view.tsx` | Customer-facing public view |
| `components/shared/line-item-builder.tsx` | Shared line item UI (quotes + invoices) |
| `app/[locale]/q/[token]/page.tsx` | Public quote accept/reject page |

---

## Quote Number Format

`TIL-0001` — sequential per user. Counter: `countAllQuotesEver(userId)` (includes soft-deleted).

---

## Status Flow

```
draft → sent → accepted | rejected | expired | merged
```

State timestamps:
- `sentAt` — set on `updateQuoteStatusAction` with status=`sent` or `sendQuoteEmailAction`
- `acceptedAt` — set on `acceptQuoteByTokenAction`
- `rejectedAt` — set on `rejectQuoteByTokenAction`

---

## Shareable Public Link

- `shareToken`: 48-char cryptographic hex token (`randomBytes(24).toString("hex")`)
- URL: `/en/q/[token]` → `app/[locale]/q/[token]/page.tsx`
- This page is public (no auth) — shows `public-quote-view.tsx`
- Customer actions: Accept → `acceptQuoteByTokenAction(token)` / Reject → `rejectQuoteByTokenAction(token)`
- Expiry check: if `quote.validUntil < today` → throws `"This quote has expired"`

---

## Email Flow

`sendQuoteEmailAction(quoteId)`:
1. Validates user owns quote, customer has email
2. Builds share URL: `${NEXT_PUBLIC_APP_URL}/en/q/${quote.shareToken}` — **requires `NEXT_PUBLIC_APP_URL` env var**
3. Sends via Resend with `QuoteSentEmail` template
4. Updates `quote.status = "sent"`, `sentAt = now()`

Accept/Reject callbacks send non-blocking confirmation emails:
- Accept → `QuoteAcceptedEmail` to customer
- Reject → `QuoteRejectedEmail` to customer

---

## Line Item Pricing Model

For quotes:
```
line_total = qty × unitPrice × (1 + markupPercent/100) × (1 - lineDiscountPercent/100)
           OR
line_total = qty × unitPrice × (1 + markupPercent/100) - lineDiscountFixed
```

Header discount applies after line subtotal sum:
```
if discountType = "percent": subtotal -= subtotal × (discountValue/100)
if discountType = "fixed":   subtotal -= min(discountValue, subtotal)
```

VAT: `vat = subtotal × 0.25`

---

## Materials Catalog Autocomplete

- `materialsCatalog` table: per-user saved materials with `defaultPrice`, `defaultMarkup`, `defaultUnit`
- In `LineItemBuilder`: when `itemType === "material"` and description length ≥ 2, calls `searchMaterials(query)` prop (backed by `/api/materials/search`)
- Selecting a material auto-fills `unitPrice` and `markupPercent` from catalog defaults
- New materials are upserted via `upsertMaterialAction` — first-time use adds to catalog automatically [INFERRED from `upsertMaterial` in quotes action]

---

## Quote Templates

- Save any quote's items as a named template: `saveQuoteAsTemplateAction(quoteId, name)`
- Templates stored as JSONB snapshot of `quote.items` in `quote_templates.items`
- Loading a template pre-fills the quote form's items array
- Delete: `deleteTemplateAction(id)`

---

## Merge Quotes

`mergeQuotesAction(ids: string[])`:
1. Validates all quotes belong to same user
2. Validates all quotes share the same `customerId` — different customers = error
3. Creates new quote with combined items (all items from all source quotes, re-indexed sort order)
4. Merges notes: deduplicates and joins with `---` separator
5. Sets source quotes: `status = "merged"`, `mergedInto = newQuote.id`

---

## Edge Cases / Gotchas

1. **Public quote accept: no auth check.** Anyone with the token URL can accept/reject. Token is 48 hex chars = 96 bits entropy — practically unguessable but not revocable.
2. **Expired quote check** uses date comparison of `validUntil` string: `new Date(quote.validUntil) < new Date(new Date().toDateString())`. The inner `toDateString()` call normalizes to midnight UTC. Subtle edge case at end of day in non-UTC timezones.
3. **Markup baked out at invoice creation.** `markupPercent` on `quote_items` is NOT carried to `invoice_items`. The markup is applied to compute `unitPrice` on the invoice item. After this, markup is invisible on the invoice.
4. **`NEXT_PUBLIC_APP_URL` not in `.env.example`** — email share links will be broken in production if this is not set.
5. **Merge creates a new draft** — it does NOT auto-send or change status of originals to deleted. Originals remain visible with `status = "merged"`.

---

→ Related: `features/INVOICES.md`, `features/JOBS.md`, `codebase/SHARED.md`, `architecture/DATABASE.md`
