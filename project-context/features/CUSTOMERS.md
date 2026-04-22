# Feature: Customer Management

## Purpose
Customer directory for tradespeople. Each customer is owned by a user (full data isolation). Customers link to all jobs, quotes, and invoices.

---

## Key Files
| File | Role |
|---|---|
| `lib/db/schema/customers.ts` | Schema |
| `lib/db/queries/customers.ts` | DB operations |
| `lib/actions/customers.ts` | Server Actions |
| `components/forms/customer-form.tsx` | Create/edit form |
| `components/customers/customer-list.tsx` | List view |
| `components/customers/customer-detail-actions.tsx` | Detail page actions |
| `hooks/use-cvr-search.ts` | CVR lookup hook |
| `app/api/cvr/route.ts` | CVR proxy API |

---

## Business Card Scan (F-1109)

When tapping "New Customer", users see a two-option entry screen before the form:
- **Fill in manually** → proceeds to `CustomerForm` as before
- **Scan business card** → file picker → POST to `/api/business-card` → form opens pre-filled

**API route:** `POST /api/business-card`  
**Body:** `{ imageBase64: string, mimeType: string }`  
**Response:** `{ name?, phone?, email?, addressLine1?, addressCity?, addressZip?, cvrNumber? }`  
**Rate limited:** uses `rateLimiter.limit(userId)`.

**AI model:** `meta-llama/llama-4-scout-17b-16e-instruct` via Groq (free tier, vision-capable). Logic in `lib/ai/operations/extract-business-card.ts`.

**Key files:**
- `components/customers/new-customer-entry.tsx` — choice screen + scan flow
- `lib/ai/operations/extract-business-card.ts` — Groq vision call
- `app/api/business-card/route.ts` — API route
- `components/forms/customer-form.tsx` — accepts `initialValues` prop for pre-fill

Image is never stored — sent as base64, processed, discarded. All extracted fields are editable before saving.

---

## CVR Smart Lookup + Entity Detection (F-1106 / F-211)

When creating or editing a customer (or in company profile form), user can enter a CVR number or company name. The `useCvrSearch` hook:
1. Debounces 400ms after input
2. Calls `GET /api/cvr?q={query}`
3. API proxies to `https://cvrapi.dk/api?search={q}&country=dk`
4. Returns: `{ name, cvr, address, zip, city, companyType }` — `companyType` maps to `data.type` from cvrapi.dk (e.g. `"Aktieselskab"`, `"Komm"`, `"Region"`)
5. UI shows a suggestion banner — user taps "Fill" to auto-fill form fields

**Rate limited:** `/api/cvr` uses `rateLimiter.limit(userId)`.  
**Next.js cache:** `revalidate: 300` (5 minutes) on the fetch to cvrapi.dk.

### Entity Type Detection

`detectEntityType(name, companyType?)` in `components/forms/customer-form.tsx` classifies each CVR result:
- **`"public"`** — name contains a keyword from `PUBLIC_KEYWORDS` (`kommune`, `region`, `sygehus`, `folkeskole`, `gymnasium`, etc.) OR `companyType` includes `komm`, `region`, `staten`, or `stat`
- **`"business"`** — `companyType` includes a legal form suffix (`a/s`, `aps`, `i/s`, `k/s`, `ivs`, `p/s`, `selskab`, `virksomhed`)
- **`"unknown"`** — neither signal fires

### CVR Suggestion Banner

The banner appears when `cvrResult !== null && nameValue !== cvrResult.name` (i.e. the API found a result that differs from what the user typed). Banner content:
- Entity type badge: emerald "Public sector" pill or violet "Business" pill
- Company name · CVR number · City
- "Fill" button — populates name, CVR, address, zip, city
- For public sector: a green info row: "EAN number required for digital e-invoicing to this entity"

### EAN Prompt for Public Sector

When a public-sector entity is detected, the EAN field highlights with a green ring and a "Public sector — add EAN for e-invoicing" banner above the input. This fires in two cases:
1. **Fill button clicked** on a public-sector CVR result → `setShowEanPrompt(true)` + auto-focus EAN field
2. **Edit page load** — `showEanPrompt` is initialized via a lazy `useState` initializer that checks the existing customer's name on mount: if `detectEntityType(name) === "public"` and no `eanNumber` is already saved → prompt shown immediately

**No EAN auto-lookup:** NemHandel API requires client-certificate authentication (no free public search endpoint). EAN is entered manually. `eanapi.dk` integration deferred (requires paid API key).

---

## Customer Fields

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | |
| `contactPerson` | No | Named billing contact for B2B customers; shown in Contact card on detail page |
| `phone` | No | Rendered as `tel:` link in UI |
| `secondPhone` | No | Site contact vs billing contact; also rendered as `tel:` link |
| `email` | No | Used for sending quotes/invoices |
| `addressLine1` | No | Combined with zip+city into `addressLine`; shown with Google Maps link |
| `addressCity` | No | |
| `addressZip` | No | |
| `country` | No | Default "DK"; shown in Address card when non-DK |
| `cvrNumber` | No | Business customers — B2B; shows **B2B** badge in customer list |
| `eanNumber` | No | NemHandel/PEPPOL for public sector billing — carried to invoices; shows **EAN** badge |
| `notes` | No | Internal notes — not shown to customer |
| `paymentTermsDays` | No | Default 14; auto-fills due date on one-tap invoice creation (job→invoice, quote→invoice) |
| `preferredLanguage` | No | `"da"` (default) or `"en"`; stored for future PDF language switching |
| `vatExempt` | No | If true: one-tap quote→invoice zeroes all line item vatRate; InvoiceForm shows banner |
| `isFavorite` | No | Shows filled amber star icon next to name in customer list |

---

## Customer List Badges

Displayed in both list and grid views. All computed server-side via two extra queries in `customers/page.tsx`.

| Badge | Condition | Style | Query source |
|---|---|---|---|
| ⭐ (star icon) | `isFavorite = true` | Filled amber star | Schema field, no extra query |
| **Overdue** | `overdueCount > 0` | Red-orange (status-overdue tokens) | `getCustomerInvoiceStatuses` — overdue invoices only |
| **Owes** | `unpaidCount > 0` | Warm amber | `getCustomerInvoiceStatuses` — sent + viewed invoices only |
| **Active** | `activeJobCount > 0` | Amber (status-progress tokens) | `getActiveJobsByCustomer` — new/scheduled/in_progress jobs |
| **B2B** | `cvrNumber` present | Muted slate | Schema field, no extra query |
| **EAN** | `eanNumber` present | Teal | Schema field, no extra query |

`getCustomerInvoiceStatuses` replaces the old `getOutstandingByCustomer` call — it splits outstanding invoices into `unpaid` (sent/viewed) and `overdue` buckets in a single query.

---

## Customer Detail — Invoice Figures

The invoice panel on the customer detail page (`app/[locale]/(dashboard)/customers/[id]/page.tsx`) shows financial figures computed from `customerInvoices` (already fetched):

| Figure | Condition | Display |
|---|---|---|
| **Outstanding** | Sum of `totalInclVat` for `sent` + `viewed` + `overdue` invoices | Large monospace number above the invoice list |
| **Overdue** | Sum of `totalInclVat` for `overdue` invoices only | Shown alongside Outstanding in red when non-zero |

When overdue invoices exist, the summary area has a faint red background. Each overdue invoice row in the list gets a red left border (`3px solid`) and a light red row background — computed purely client-side from the already-fetched invoice data, no extra DB query.

---

## Google Maps Integration

Three locations in the customer flow link to `https://maps.google.com/?q=${encodeURIComponent(addressLine)}`:

| Location | How it appears |
|---|---|
| Customer list — list row | MapPin icon-only button in the row actions area |
| Customer list — grid card | "Maps" text button in the card action bar |
| Customer detail page | Amber "Maps" `<a>` button inline in the address `ContactRow` |
| Job detail page — customer panel | Amber "Maps" `<a>` link below the customer card |

`addressLine` is computed as `[addressLine1, addressZip, addressCity].filter(Boolean).join(", ")`. The link is only rendered when at least one address part is non-empty.

---

## Soft Delete

`deletedAt` timestamp — all list queries must include `isNull(customers.deletedAt)`.  
Deleting a customer does NOT cascade-delete their jobs/quotes/invoices (FK references kept intact). Those records remain accessible via direct URL.

---

## Relations

```
users ←→ customers (one user → many customers)
customers ←→ jobs (one customer → many jobs)
customers ←→ quotes (one customer → many quotes)
customers ←→ invoices (one customer → many invoices)
```

---

## Edge Cases / Gotchas

1. **EAN number flow:** `customer.ean_number` is NOT validated as a valid EAN-13 barcode. It's a free-text field. On invoice creation from quote, it's copied as-is.
2. **Phone `tel:` links** — Danish mobile numbers are 8 digits. No formatting is applied before rendering the `tel:` link.
3. **`isFavorite` has no list filter** — the flag exists in the schema but filtering/sorting by favorites is [UNKNOWN — not confirmed implemented in customer-list queries].
4. **Customer notes** — internal only. The public quote view and invoice PDFs do NOT show `customer.notes`.

---

→ Related: `features/JOBS.md`, `features/QUOTES.md`, `features/INVOICES.md`, `architecture/DATABASE.md`
