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

## CVR Smart Lookup (F-1106)

When creating or editing a customer (or in company profile form), user can enter a CVR number or company name. The `useCvrSearch` hook:
1. Debounces 400ms after input
2. Calls `GET /api/cvr?q={query}`
3. API proxies to `https://cvrapi.dk/api?search={q}&country=dk`
4. Returns: `{ name, cvr, address, zip, city }`
5. UI shows a suggestion banner — user taps to auto-fill form fields

**Rate limited:** `/api/cvr` uses `rateLimiter.limit(userId)`.  
**Next.js cache:** `revalidate: 300` (5 minutes) on the fetch to cvrapi.dk.

---

## Customer Fields

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | |
| `phone` | No | Rendered as `tel:` link in UI |
| `email` | No | Used for sending quotes/invoices |
| `addressLine1` | No | |
| `addressCity` | No | |
| `addressZip` | No | |
| `cvrNumber` | No | Business customers — B2B |
| `eanNumber` | No | NemHandel/PEPPOL for public sector billing — carried to invoices |
| `notes` | No | Internal notes — not shown to customer |
| `isFavorite` | No | Bookmark flag |

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
