# Håndværk Pro — Feature Tracking

> Status key: `[x]` Complete · `[~]` In progress · `[ ]` Not started · `[-]` Deferred · `[!]` Blocked · `N/A` Not applicable
> **BE** = Backend (schema, action, query) · **FE** = Frontend (page, component, form)
> Rule: every feature ships BE + FE together. Never mark `[x]` with only one side done.

---

## STATUS DASHBOARD

| Phase | Name | Total | Done | In Progress | Not Started |
|---|---|---|---|---|---|
| 0 | Foundation | 20 | 17 | 0 | 3 |
| 1 | Auth & User Profile | 10 | 6 | 0 | 4 |
| 2 | Customer Management | 13 | 13 | 0 | 0 |
| 3 | Job Management | 11 | 11 | 0 | 0 |
| 4 | Quote Builder | 15 | 15 | 0 | 0 |
| 5 | Invoice Engine | 14 | 14 | 0 | 0 |
| 6 | Quote & Invoice Enhancements | 8 | 8 | 0 | 0 |
| 7 | Bank Details & Profile | 5 | 5 | 0 | 0 |
| 8 | Merge Documents | 3 | 3 | 0 | 0 |
| 9 | Reporting | 8 | 0 | 0 | 8 |
| 10 | Email Notifications | 4 | 4 | 0 | 0 |
| 11 | AI Intelligence Layer | 10 | 3 | 0 | 7 |
| 12 | Dashboard & Tier Gates | 8 | 3 | 4 | 1 |
| 13 | Compliance Pre-GoLive | 11 | 1 | 0 | 10 |
| 14 | Growth, Retention & Compliance | 10 | 1 | 0 | 9 |
| 15 | Time Tracking | 9 | 0 | 0 | 9 |
| 16 | E-conomic Integration | 8 | 0 | 0 | 8 |
| 17 | Calendar | 5 | 5 | 0 | 0 |
| 18 | Jobs Revamp | 6 | 6 | 0 | 0 |
| 19 | Email Template Manager | 7 | 0 | 0 | 7 |
| 20 | Job Activity Timeline | 6 | 0 | 0 | 6 |

**Overall:** ~114 complete / ~180 total · Phases 0–8, 10, 17, 18 shipped · Phases 9, 15, 16, 19, 20 not started · Phases 13, 14 partially started

---

## PHASE 0 — Foundation

→ No detailed feature doc (infrastructure only)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-000 | Next.js 15 project init | `[x]` | `[x]` | App Router, TypeScript strict |
| F-001 | Vercel deployment pipeline | `[ ]` | `[ ]` | main → prod, branches → preview |
| F-002 | Neon DB provisioned (EU Frankfurt) | `[x]` | `N/A` | |
| F-003 | Drizzle ORM + first migration | `[x]` | `N/A` | `0000_dapper_exodus.sql` applied |
| F-004 | Clerk auth configured | `[x]` | `[x]` | Middleware, layout, sign-in/sign-up pages |
| F-005 | Upstash Redis connected | `[x]` | `N/A` | `rateLimiter` + `strictRateLimiter` exported |
| F-006 | Inngest connected | `[x]` | `N/A` | Client + test function + route handler |
| F-007 | next-intl configured | `[x]` | `[x]` | Routing, request, navigation, en + da |
| F-008 | Motion (Framer Motion v12) | `N/A` | `[x]` | Installed, used in Phase 1+ |
| F-009 | shadcn/ui initialized | `N/A` | `[x]` | `components.json`, button/form/card/etc. |
| F-010 | Aceternity UI components | `N/A` | `[ ]` | Copy when needed |
| F-011 | Tailwind CSS v4 + design system | `N/A` | `[x]` | CSS vars, dark mode, design tokens in `globals.css` |
| F-012 | Zustand UI store | `N/A` | `[x]` | Modal + sidebar state in `stores/ui-store.ts` |
| F-013 | React Hook Form + Zod setup | `N/A` | `[x]` | `form.tsx` base component, resolvers installed |
| F-014 | Sentry error tracking | `[ ]` | `[ ]` | Install `@sentry/nextjs` when DSN is ready |
| F-015 | Vercel Analytics + PostHog | `[x]` | `[x]` | Analytics + `PostHogProvider` wired in layout |
| F-016 | Resend email connected | `[x]` | `N/A` | `lib/email/client.ts` ready |
| F-017 | `.env.example` documented | `[x]` | `[x]` | All keys present |
| F-018 | Tier gate component | `[x]` | `[x]` | `components/shared/tier-gate.tsx` |
| F-019 | `da.json` placeholder | `N/A` | `[x]` | All i18n keys present, values `""` |

---

## PHASE 1 — Authentication & User Profile

→ Detailed: `project-context/features/AUTH_PROFILE.md`
→ Schema: `project-context/architecture/DATABASE.md` (users table)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-100 | Sign-up: phone OTP | `[ ]` | `[ ]` | Clerk-hosted |
| F-101 | Sign-up: email OTP | `[ ]` | `[ ]` | Clerk-hosted |
| F-102 | Sign-in: phone OTP | `[ ]` | `[ ]` | Clerk-hosted |
| F-103 | Sign-in: email OTP | `[ ]` | `[ ]` | Clerk-hosted |
| F-104 | Clerk webhook → users table sync | `[x]` | `N/A` | `app/api/webhooks/clerk/route.ts` |
| F-105 | Company profile form | `[x]` | `[x]` | Name, CVR, address, hourly rate |
| F-106 | Logo upload | `[x]` | `[x]` | Vercel Blob client-side → `users.logoUrl` |
| F-107 | Profile completion gate | `[x]` | `[x]` | Redirect to `/profile/setup` if `companyName` null |
| F-108 | Default tier: free | `[x]` | `N/A` | Set on user creation |
| F-109 | Session management | `[x]` | `[x]` | Clerk handles; test refresh |

---

## PHASE 2 — Customer Management

→ Detailed: `project-context/features/CUSTOMERS.md`
→ Schema: `project-context/architecture/DATABASE.md` (customers table)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-200 | Customer DB schema | `[x]` | `N/A` | Soft delete, `eanNumber`, `isFavorite` |
| F-201 | Customer list page | `[x]` | `[x]` | Search + filter |
| F-202 | Customer detail page | `[x]` | `[x]` | Info + linked records |
| F-203 | Create customer form | `[x]` | `[x]` | Zod validation |
| F-204 | Edit customer form | `[x]` | `[x]` | |
| F-205 | Delete customer (soft) | `[x]` | `[x]` | `deletedAt` timestamp |
| F-206 | Quick-dial from app | `N/A` | `[x]` | `tel:` link on phone number |
| F-207 | Customer badges: Overdue, Owes, Active, B2B, EAN | `[x]` | `[x]` | Split Overdue (red) + Owes (orange) + Active (cobalt) + B2B (violet) + EAN (emerald) + isFavorite star; computed via `getCustomerInvoiceStatuses` + `getActiveJobsByCustomer` |
| F-208 | CVR number field | `[x]` | `[x]` | |
| F-209 | Notes field per customer | `[x]` | `[x]` | Internal notes |
| F-210 | Google Maps links on customer pages | `N/A` | `[x]` | Maps button on list rows/cards, customer detail address card, and job detail customer panel |
| F-211 | CVR banner entity detection + EAN prompt | `[x]` | `[x]` | Detects public sector vs business via name keywords + `companyType`; EAN field highlights and auto-focuses for public entities; edit-page lazy init |
| F-212 | Extended customer fields | `[x]` | `[x]` | `contactPerson`, `secondPhone`, `country`, `paymentTermsDays` (auto-fills invoice due date), `preferredLanguage`, `vatExempt` (zeroes VAT on quote→invoice) |

---

## PHASE 3 — Job Management

→ Detailed: `project-context/features/JOBS.md`
→ Schema: `project-context/architecture/DATABASE.md` (jobs, job_photos tables)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-300 | Job DB schema | `[x]` | `N/A` | |
| F-301 | Create job form | `[x]` | `[x]` | Customer picker, description, date |
| F-302 | Voice input for description | `N/A` | `[x]` | Web Speech API (da-DK) |
| F-303 | Job detail page | `[x]` | `[x]` | Full info, status changer |
| F-304 | Status change | `[x]` | `[x]` | `new→scheduled→in_progress→done→invoiced→paid` |
| F-305 | Job notes | `[x]` | `[x]` | Internal, not shown to customer |
| F-306 | Photo upload per job | `[x]` | `[x]` | Before/after; Vercel Blob |
| F-307 | Free tier gate: 10 active jobs | `[x]` | `[x]` | Active = status not `paid` or `invoiced` |
| F-308 | Edit job | `[x]` | `[x]` | |
| F-309 | Delete job (soft) | `[x]` | `[x]` | |
| F-310 | Job type field | `[x]` | `[x]` | `service` / `project` / `recurring` |

---

## PHASE 4 — Quote Builder

→ Detailed: `project-context/features/QUOTES.md`
→ Schema: `project-context/architecture/DATABASE.md` (quotes, quote_items, quote_templates, materials_catalog)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-400 | Quote DB schema | `[x]` | `N/A` | |
| F-401 | Quote line items: labour | `[x]` | `[x]` | hours × rate |
| F-402 | Quote line items: materials | `[x]` | `[x]` | qty × unit price × markup% |
| F-403 | Quote line items: fixed price | `[x]` | `[x]` | Flat fee |
| F-404 | Quote line items: travel fee | `[x]` | `[x]` | Optional toggle |
| F-405 | VAT (25% moms) auto-calc | `[x]` | `[x]` | All items |
| F-406 | Customer discount field | `[x]` | `[x]` | % or fixed amount |
| F-407 | Validity date field | `[x]` | `[x]` | "Valid for 14 days" |
| F-408 | Quote PDF generation | `[x]` | `[x]` | `@react-pdf/renderer` |
| F-409 | Send quote by email | `[x]` | `[x]` | Resend + PDF attachment |
| F-410 | Shareable quote link | `[x]` | `[x]` | `shareToken` in URL |
| F-411 | Customer accept/reject | `[x]` | `[x]` | Token-based (no auth); job auto-created on accept |
| F-412 | Save as template | `[x]` | `[x]` | Reusable quote templates |
| F-413 | Materials autocomplete | `[x]` | `[x]` | From user's `materials_catalog` |
| F-414 | Quote status flow | `[x]` | `[x]` | `draft→sent→accepted→rejected→expired` |

---

## PHASE 5 — Invoice Engine

→ Detailed: `project-context/features/INVOICES.md`
→ Schema: `project-context/architecture/DATABASE.md` (invoices, invoice_items)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-500 | Invoice DB schema | `[x]` | `N/A` | NemHandel fields included |
| F-501 | One-tap: job → invoice | `[x]` | `[x]` | Pre-filled from quote |
| F-502 | Invoice number (sequential) | `[x]` | `N/A` | `FAK-XXXX` per user; legally required |
| F-503 | Moms layout (legal DK format) | `[x]` | `[x]` | ex.moms + moms + incl.moms |
| F-504 | Invoice PDF (branded) | `[x]` | `[x]` | `@react-pdf/renderer` |
| F-505 | Send by email (Resend) | `[x]` | `[x]` | PDF + HTML email |
| F-506 | Payment info on invoice | `[x]` | `[x]` | Bank account OR MobilePay ref (static) |
| F-507 | MobilePay payment link field | `[x]` | `[x]` | Stubbed — shows "coming soon" |
| F-508 | Invoice status tracking | `[x]` | `[x]` | `draft→sent→viewed→paid→overdue` |
| F-509 | Inngest: reminder email +8 days | `[x]` | `N/A` | If unpaid |
| F-510 | Inngest: reminder email +15 days | `[x]` | `N/A` | Second reminder |
| F-511 | Credit note (Kreditnota) | `[x]` | `[x]` | One-click from sent invoice; `KRE-XXXX` numbering |
| F-512 | Mark as paid (manual) | `[x]` | `[x]` | User confirms payment received |
| F-513 | Overdue flag | `[x]` | `[x]` | Manual trigger; no automated cron yet (KI-007) |

---

## PHASE 6 — Quote & Invoice Enhancements

→ Schema changes: `project-context/architecture/DATABASE.md` (discount columns on quote_items, invoice_items)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-600 | Default `valid_until` = today + 15 days | `[x]` | `[x]` | Auto-fill on new quote/invoice |
| F-601 | Per-line-item discount (% or fixed) | `[x]` | `[x]` | `discount_type` + `discount_value` on `quote_items` + `invoice_items` |
| F-602 | Carry discount quote → invoice | `[x]` | `[x]` | Header + per-line discounts copied |
| F-603 | Duplicate invoice guard | `[x]` | `[x]` | Modal: "View existing" or "Create new anyway" |
| F-604 | Action buttons at top of detail pages | `N/A` | `[x]` | Sticky action bar + overflow menu |
| F-605 | Inline actions on quotes list | `[x]` | `[x]` | Row-level ⋯: Edit, Send, Create Invoice, PDF, Copy link, Template, Delete |
| F-606 | Inline actions on invoices list | `[x]` | `[x]` | Row-level ⋯: Edit, Send, Mark Paid, PDF, Credit Note, Delete |
| F-607 | Landing page hero animation fix | `N/A` | `[x]` | Removed character-splitting spans that broke gradient background-clip |

---

## PHASE 7 — Bank Details & Profile Enhancements

→ Detailed: `project-context/features/AUTH_PROFILE.md`
→ Schema: `project-context/architecture/DATABASE.md` (bank_accounts table)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-700 | Bank accounts DB schema | `[x]` | `N/A` | `bank_name`, `reg_number`, `account_number`, `is_default` |
| F-701 | Profile: bank details management UI | `[x]` | `[x]` | Add/edit/delete; star to set default |
| F-702 | Profile: MobilePay number management | `[x]` | `[x]` | Store alongside bank details |
| F-703 | Pre-load default bank details into invoices | `[x]` | `[x]` | Auto-fill on create invoice |
| F-704 | Bank details + MobilePay on invoice PDF | `[x]` | `[x]` | Payment details section in PDF |

---

## PHASE 8 — Merge Documents

→ Detailed: `project-context/features/QUOTES.md`, `project-context/features/INVOICES.md`
→ Schema: `project-context/architecture/DATABASE.md` (`merged_into` columns)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-800 | Merge quotes | `[x]` | `[x]` | 2+ quotes for same customer → new merged quote; originals set to `merged` |
| F-801 | Merge invoices | `[x]` | `[x]` | 2+ invoices for same customer → new merged invoice |
| F-802 | Merge conflict UX | `N/A` | `[x]` | Warn if header discounts differ; preview totals before confirm |

---

## PHASE 9 — Reporting

→ Schema: `project-context/architecture/DATABASE.md` (expenses table, reporting indexes — not yet created)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-900 | Reports page scaffold | `[ ]` | `[ ]` | `/reports` route; tab nav: Revenue / Customer / Job / Expense |
| F-901 | Period filter component | `[ ]` | `[ ]` | This month / Last month / Quarter / Year / Custom range |
| F-902 | Revenue report | `[ ]` | `[ ]` | Total billed, VAT collected, paid vs outstanding, avg invoice value |
| F-903 | Customer report | `[ ]` | `[ ]` | Revenue by customer, outstanding, jobs, avg payment time |
| F-904 | Job report | `[ ]` | `[ ]` | Jobs by status, completed this month, avg job value, by type |
| F-905 | Expenses DB schema + logging UI | `[ ]` | `[ ]` | New `expenses` table; create/edit/delete with category, amount, VAT, receipt |
| F-906 | Expense report | `[ ]` | `[ ]` | By period, by category, input VAT for SKAT offset, profit estimate |
| F-907 | SKAT moms quarterly summary | `[ ]` | `[ ]` | Q1–Q4: output VAT − input VAT = net owed |

---

## PHASE 10 — Email Notifications & Customer Communication

→ Detailed: `project-context/features/INVOICES.md`, `project-context/features/QUOTES.md`

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1000 | Quote accepted → thank-you email | `[x]` | `N/A` | Triggered by `acceptQuoteByTokenAction` |
| F-1001 | Quote rejected → "help us improve" email | `[x]` | `N/A` | Triggered by `rejectQuoteByTokenAction` |
| F-1002 | Invoice paid → thank-you + review request | `[x]` | `N/A` | Triggered by `markInvoicePaidAction`; includes `google_review_url` if set |
| F-1003 | Google review URL on profile | `[x]` | `[x]` | `users.googleReviewUrl`; `components/profile/google-review-section.tsx` |

---

## PHASE 11 — AI Intelligence Layer

→ Detailed: `project-context/features/AI_RECORDING.md`

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1100 | Photo → Quote draft | `[ ]` | `[ ]` | Snap site photo → Claude Vision → pre-filled quote draft |
| F-1101 | Job site recording → full job record | `[x]` | `[x]` | Voice/file upload → Groq Whisper + LLaMA 3.3 → Inngest pipeline |
| F-1102 | Dynamic pricing intelligence | `[ ]` | `[ ]` | Analyse quote history → suggest price for new quote |
| F-1103 | Customer risk profiling | `[ ]` | `[ ]` | Non-blocking hint: late payment history shown on job/invoice create |
| F-1104 | Auto job handover report | `[ ]` | `[ ]` | After `done`: AI uses notes + photos → PDF handover doc |
| F-1105 | Cash flow forecast | `[ ]` | `[ ]` | 30/60/90 day projection from outstanding quotes + history |
| F-1106 | CVR smart lookup | `[x]` | `[x]` | Debounced proxy to `cvrapi.dk`; auto-fills name/CVR/address in CustomerForm + ProfileForm |
| F-1107 | AI response drafts | `[ ]` | `[ ]` | Quote unseen 7+ days → AI drafts follow-up matching user's tone |
| F-1108 | Job clustering & insights | `[ ]` | `[ ]` | Auto-tag jobs; "Bathroom renos: avg 3.1 days, 24.200 kr" insight card |
| F-1109 | Business card scan → customer auto-fill | `[x]` | `[x]` | New customer entry screen; upload card image → Groq `meta-llama/llama-4-scout-17b-16e-instruct` (vision) → pre-filled CustomerForm |

---

## PHASE 12 — Dashboard & Tier Gates

→ Schema: `project-context/architecture/DATABASE.md` (`lib/db/queries/overview.ts` has all queries)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1200 | Dashboard: outstanding amount | `[x]` | `[~]` | Query in `overview.ts`; StatCards still shows stub data |
| F-1201 | Dashboard: active jobs count | `[x]` | `[~]` | Query in `overview.ts`; StatCards still shows stub data |
| F-1202 | Dashboard: overdue invoices | `[x]` | `[x]` | CriticalZone wired to real data; dismissible per-item via localStorage |
| F-1203 | Dashboard: this month billed | `[x]` | `[~]` | Query in `overview.ts`; StatCards still shows stub data |
| F-1204 | Free tier: 10 active jobs gate | `[x]` | `[x]` | Delivered in Phase 3 as F-307 |
| F-1205 | Upgrade prompt UI | `N/A` | `[ ]` | "Coming soon — MobilePay" |
| F-1206 | Beta launch: 20 users | `N/A` | `N/A` | Network outreach — not a code task |
| F-1207 | Reporting DB queries ready | `[x]` | `N/A` | `lib/db/queries/overview.ts` covers all dashboard stats |

---

## PHASE 13 — Compliance Pre-GoLive

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1300 | SKAT moms summary page | `[ ]` | `[ ]` | Quarterly export (not SKAT API) |
| F-1301 | Moms period calculation | `[ ]` | `[ ]` | Q1/Q2/Q3/Q4 totals |
| F-1302 | EAN number on customer form | `[x]` | `[x]` | `eanNumber` wired to form + Server Actions; public sector auto-detected and prompted |
| F-1303 | OIOUBL invoice export | `[ ]` | `[ ]` | XML format for public sector |
| F-1304 | GDPR: user data export | `[ ]` | `[ ]` | JSON download of all user data |
| F-1305 | GDPR: account deletion | `[ ]` | `[ ]` | Soft delete → hard delete 30 days |
| F-1306 | Privacy policy page | `N/A` | `[ ]` | Static legal page |
| F-1307 | Cookie consent | `N/A` | `[ ]` | For analytics cookies |
| F-1308 | Terms of service page | `N/A` | `[ ]` | Static |
| F-1309 | Rate limiting: all API routes | `[ ]` | `N/A` | Upstash audit (KI-008) |
| F-1310 | Security: Zod on all endpoints | `[ ]` | `N/A` | Audit all routes |

---

## PHASE 14 — Growth, Retention & Compliance

> Market differentiators unavailable in Ordrestyring.dk, Minuba, Apacta, Billy, Dinero.

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1400 | Native two-way SMS from job cards | `[ ]` | `[ ]` | GatewayAPI stubbed in stack |
| F-1401 | Auto Google review request on paid | `[ ]` | `[ ]` | Inngest job 24h after invoice paid → SMS/email with `google_review_url` |
| F-1402 | Online booking link | `[ ]` | `[ ]` | `/book/[handle]` → customer picks date → job draft auto-created |
| F-1403 | Customer self-service portal | `[ ]` | `[ ]` | `/portal/[customerId]` → quotes, invoices, accept/reject; no login |
| F-1404 | Real-time job profitability tracking | `[ ]` | `[ ]` | Material cost vs billed per job; margin % display |
| F-1405 | Service agreements & recurring invoices | `[ ]` | `[ ]` | Inngest auto-generates job + invoice on schedule |
| F-1406 | Flat-rate pricebook | `[x]` | `[x]` | Full catalog: CRUD, 9-field schema (unit, costPrice, sku, category, supplierName, defaultMarkupPercent, defaultQuantity, notes, isFavourite), filters (status/type/favourites), star-pin. Quote picker integration pending. |
| F-1407 | KLS compliance module | `[ ]` | `[ ]` | Quality log PDF for authorized VVS/electrical work |
| F-1408 | E-boks invoice delivery | `[ ]` | `[ ]` | e-Boks Business API for public sector customers |
| F-1409 | APV workplace safety documentation | `[ ]` | `[ ]` | Per-job APV checklist PDF; required by Arbejdstilsynet |

---

## FEATURES DELIBERATELY EXCLUDED FROM MVP

| Feature | Why Excluded | Earliest Phase |
|---|---|---|
| MobilePay Erhverv payment links | Requires MobilePay Erhverv API approval; regulatory exposure | 8+ |
| Bank sync / Open Banking | Requires PSD2 license or partnership (Aiia, Nordigen) | 8+ |
| SKAT moms API filing | Requires SKAT developer access; wrong filing = legal liability | 8+ |
| Native iOS / Android app | PWA covers mobile; 3–4 months extra; App Store approval | 10+ |
| Payroll (løn) | Separate compliance layer (ATP, holiday, pension); Finanstilsynet | 11+ |
| Annual report generation | Accountant's legal responsibility — not a software feature | Never |
| GPS / location tracking | Solo tradespeople feel surveilled; churn trigger | 10+ (team only) |
| Inventory management | Full stock logic + supplier integration; not a job management need | 8+ |
| Multi-currency | Denmark uses DKK; no MVP demand | 10+ |
| Supplier price list integration | Requires supplier API agreements (KlarPris-style) | 8+ |
| Accountant portal | Separate auth flow; high-value retention but post-launch | 8+ |
| Team features (Hold tier) | Multi-user, job assignment, team dashboard; build single-user first | 8+ |

---

---

## PHASE 15 — Time Tracking

→ Detailed: `project-context/WORK_TO_DO.md` (Phase 31)
→ Schema: new `time_entries` table — see WORK_TO_DO.md for columns

**Competitive context:** Direct gap vs Minuba, Apacta, Ordrestyring.dk — all have time tracking. Required for tradespeople who charge by the hour and need to log on-site time from mobile.

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-3100 | Time entries DB schema | `[x]` | `N/A` | `lib/db/schema/time-entries.ts` — migration 0012 |
| F-3101 | Clock in/out on job detail | `[x]` | `[x]` | `ClockPanel` + `clockInAction` / `clockOutAction` |
| F-3102 | Manual time entry form | `[x]` | `[x]` | `ManualEntryForm` + `createManualEntryAction` |
| F-3103 | Time log list per job | `[x]` | `[x]` | `TimeEntryList` + `TimeLogPanel` on job detail page |
| F-3104 | Weekly timesheet view | `[x]` | `[x]` | `/time-tracking` route + `WeeklyTimesheet` with week nav |
| F-3105 | Convert billable hours → invoice line item | `[x]` | `[x]` | `addBillableHoursToLineItemAction` + `AddToDocumentModal` |
| F-3106 | Billable vs non-billable toggle | `[x]` | `[x]` | `isBillable` field in form + filter in billing queries |
| F-3107 | Time summary per customer (reporting) | `[-]` | `[-]` | Deferred — feeds into customer report (Phase 9) |
| F-3108 | Free tier gate: 50 entries max | `[x]` | `[x]` | `countTimeEntries` checked in `clockInAction` |
| F-3109 | Clock button on jobs list | `[x]` | `[x]` | Play/Stop inline on `JobRow` + `JobCard` |
| F-3110 | QuickTimerCard on dashboard | `[x]` | `[x]` | `components/dashboard/quick-timer-card.tsx` |
| F-3111 | Already-billed safety indicator | `[x]` | `[x]` | `billedToQuoteId`/`billedToInvoiceId` + warning badge in modal |
| F-3112 | Status-based access control | `[x]` | `[x]` | Clock-in/manual entry blocked for done/invoiced/paid jobs; add-to-document blocked for rejected/expired quotes and paid invoices |
| F-3113 | Enhanced `/time-tracking` page | `[x]` | `[x]` | **Rebuilt as 3-zone shell** (mirrors calendar layout): `StatsSidebar` (desktop left, 200px — total/billable/earnings/delta vs prev week/per-job breakdown bars), `TimeTrackingShell` (layout server component), `TimerHero` (idle shows big 00:00 + quick-start chips; active shows 48px elapsed clock + Live badge + shadow-accent clock-out CTA; stale-timer recovery unchanged), `WeekBars` (7-column vertical bar chart — billable amber at base, non-billable gray above, selected day highlighted), `DayView` (visual hour timeline + entry cards, unchanged), `MonthCalendar` (heat-map dots, unchanged), `UnbilledPanel` (desktop right, 220px — lists unbilled billable entries from past 30 days with est. kr per entry + total). New DB query: `getUnbilledEntries`. Deleted orphaned components: `timer-zone.tsx`, `day-strip.tsx`, `weekly-summary-bar.tsx`. |

---

## PHASE 16 — E-conomic / Accounting Integration

→ Detailed: `project-context/WORK_TO_DO.md` (Phase 32)
→ Schema changes: `users`, `invoices`, `customers`, `expenses` — see WORK_TO_DO.md for columns

**Competitive context:** Direct gap vs Minuba and Apacta — both integrate with e-conomic. Without this, any buyer whose accountant uses e-conomic faces a procurement blocker. One-way sync only (Håndværk Pro → e-conomic).

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-3200 | E-conomic OAuth connection flow | `[ ]` | `[ ]` | Profile settings; OAuth2 redirect + callback |
| F-3201 | Store + refresh OAuth tokens | `[ ]` | `N/A` | Tokens encrypted at rest; auto-refresh |
| F-3202 | Sync invoices to e-conomic | `[ ]` | `[ ]` | Auto on "paid"; manual trigger on invoice detail |
| F-3203 | Sync customers to e-conomic | `[ ]` | `[ ]` | Auto on create/update via Inngest |
| F-3204 | Sync expenses to e-conomic | `[ ]` | `[ ]` | Auto on create via Inngest |
| F-3205 | Connection status in profile settings | `[ ]` | `[ ]` | Connected / disconnected indicator + disconnect button |
| F-3206 | Sync status badges on list pages | `[ ]` | `[ ]` | "synced" / "error" badge on invoice + customer rows |
| F-3207 | Sync error handling + retry | `[ ]` | `N/A` | Inngest: 3 retries, exponential backoff; error stored on record |

---

## PHASE 17 — Calendar

→ Components: `components/calendar/` (`calendar-shell.tsx`, `calendar-filters.tsx`, `timeline-view.tsx`, `event-chip.tsx`, `event-popover.tsx`, `unscheduled-panel.tsx`, `types.ts`, `rbc.css`)
→ Server action: `lib/actions/calendar.ts`
→ DB queries: `lib/db/queries/calendar.ts`

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1700 | Calendar data server action | `[x]` | `N/A` | `getCalendarDataAction(from, to)` — parallel fetch of jobs, invoice due dates, expiring quotes, unscheduled jobs |
| F-1701 | Month / Week / Day / Agenda views | `[x]` | `[x]` | react-big-calendar 1.19.4; custom event chips with status colours; click-to-open detail modal |
| F-1702 | Timeline (Gantt) view | `[x]` | `[x]` | Horizontal bar chart; sticky job column; month+day header; today line; weekend shading; auto-scroll to today |
| F-1703 | Sidebar filters + mini-calendar | `N/A` | `[x]` | 196px collapsible sidebar; entity toggles (Jobs/Invoices/Quotes); job status chips; mini date navigator |
| F-1704 | Unscheduled jobs panel | `[x]` | `[x]` | Collapsible right panel listing jobs without a `scheduledDate`; links to job detail |
| F-1705 | Full-height layout + fullscreen toggle | `N/A` | `[x]` | Page container uses `calc(100dvh - 3.5rem)` (fixes `h-full` collapse against `min-h-screen` parent). `Maximize2`/`Minimize2` button in toolbar toggles `isFullscreen` state; when on, shell gets `position: fixed; inset: 0; z-index: 50` — overlays sidebar, topbar, and everything. |

---

## PHASE 18 — Jobs Revamp

> Competitor-informed upgrades to the Jobs feature. Research baseline: Jobber (property address, site forms), Ordrestyring (QA checklists), Minuba (budget monitoring), Apacta (photo documentation folders), Simpro (estimated vs actual).
> Explicitly excluded: GPS employee tracking (churn trigger), embedded maps (API billing), customer signature capture (post-MVP).

→ Schema: `lib/db/schema/jobs.ts` (Phases A–C, F), new `job_tasks` table (Phase D), `job_photos.tag` column (Phase E)
→ Actions: `lib/actions/jobs.ts` (A–C, E, F), new `lib/actions/job-tasks.ts` (D)
→ Components: `components/forms/job-form.tsx`, `components/jobs/`, `components/time-tracking/time-log-panel.tsx`

### Phase A — Job Site Location

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1800 | Job site location fields | `[x]` | `[x]` | Add `locationAddress`, `locationZip`, `locationCity` (all nullable text) to `jobs` table. Form: collapsible "Different site address?" toggle, hidden by default. Detail: "Site location" card in right column — uses job address if set, falls back to customer address for the Maps link. Jobs list: `MapPin` icon on rows with a custom location. |

### Phase B — Priority

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1801 | Job priority field | `[x]` | `[x]` | Add `priority text default 'normal'` (`low \| normal \| high \| urgent`) to `jobs` table. New `PriorityBadge` component (colour-coded pill, same style as `StatusBadge`: urgent=red, high=amber, normal=blue, low=muted). Badge on job list rows/cards and detail page header. Priority filter dropdown on jobs list alongside existing status filter. |

### Phase C — Estimated Hours

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1802 | Estimated hours per job | `[x]` | `[x]` | Add `estimatedHours numeric(6,2)` (nullable) to `jobs` table. Number input (`step="0.5"`) on the form before Notes. In `TimeLogPanel`: progress bar showing "X hrs logged · Y hrs estimated"; bar turns red when logged > estimated. |

> **Migration note:** Phases A, B, C all touch only `jobs.ts` — edit all three before running `npx drizzle-kit generate` to produce a single migration.

### Phase D — Job Site Checklists

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1803 | Job site checklists | `[x]` | `[x]` | New `job_tasks` table: `id (uuid pk), jobId (fk), userId (fk), text, isCompleted (bool default false), sortOrder (int default 0), createdAt`. Hard delete (no soft delete). Relations in `relations.ts`. Three Server Actions in `lib/actions/job-tasks.ts`: `createJobTaskAction`, `updateJobTaskAction`, `deleteJobTaskAction`. New `components/jobs/job-checklist.tsx`: inline checklist on detail page between Notes and Photos — tap to check off, add/delete ad-hoc tasks, optimistic updates. `getJobById` updated to `with: { tasks: true }`. No templates in v1. |

### Phase E — Photo Tagging

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1804 | Job photo tagging | `[x]` | `[x]` | Add `tag text` (nullable, `before \| during \| after \| document`) to `job_photos` table. Upload flow: after file selection, show 4 tag buttons + "Skip". Photo grid: filter chips (All / Before / During / After / Documents); each tile shows tag badge. Existing photos with `null` tag appear under "All" only. |

### Phase F — Job Tags / Categories

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1805 | Job free-form tags | `[x]` | `[x]` | Add `tags text` (nullable, comma-separated) to `jobs` table. New `components/jobs/tag-input.tsx`: chip input, Enter or comma to add. Tags shown as pill chips on detail header and list rows. "Tags" filter dropdown on jobs list (options derived from all jobs' tags). Normalize empty string to `null` in the action. |

---

## PHASE 19 — Email Template Manager

→ Detailed: `project-context/features/EMAIL_TEMPLATES.md`
→ Schema: new `email_templates` table — see EMAIL_TEMPLATES.md for columns

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1900 | `email_templates` DB schema + migration | `[ ]` | `N/A` | Drizzle schema, `npx drizzle-kit generate` |
| F-1901 | Server Actions: upsert / delete / list | `[ ]` | `N/A` | `getEmailTemplatesAction`, `upsertEmailTemplateAction`, `deleteEmailTemplateAction` — all rate-limited + Zod |
| F-1902 | Send-time template resolver | `[ ]` | `N/A` | `substituteVariables()` pure fn + `resolveTemplateVars()` per email type; wired into all 7 send paths |
| F-1903 | Test email action | `[ ]` | `N/A` | `sendTestEmailAction(emailType)` — renders with sample data, sends to user's own email |
| F-1904 | Template list page (`/profile/email-templates`) | `[ ]` | `[ ]` | 7 type cards, Customised / Using default badges, Edit button per type |
| F-1905 | Template editor — Edit tab | `[ ]` | `[ ]` | Subject input, body contenteditable + toolbar, variable picker sidebar, header image upload (Vercel Blob), attachment toggle |
| F-1906 | Template editor — Preview tab + tier gate | `[ ]` | `[ ]` | Live preview with sample values substituted; free tier: subject only, body editor behind upgrade prompt |

---

---

## PHASE 20 — Job Activity Timeline

→ Detailed: `project-context/features/JOBS.md` (Timeline section)
→ Schema: new `job_events` table — see JOBS.md for columns
→ Components: `components/jobs/job-timeline.tsx`
→ Routes: `app/[locale]/(dashboard)/timeline/page.tsx`

A per-job "work diary" grouped by day — answers "what did I do on this job on Tuesday?" by aggregating status changes, note edits, photo uploads, checklist activity, time entries, quotes, and invoices into a chronological feed.

**Event types** fired from Server Actions:

| Event type | Fired from | Metadata |
|---|---|---|
| `job_created` | `createJobAction` | `{ title, status }` |
| `status_changed` | `updateJobStatusAction` | `{ from, to }` |
| `note_updated` | `updateJobNotesAction` | `{ preview }` (first 80 chars) |
| `photo_added` | `addJobPhotoAction` | `{ tag, caption, fileUrl }` |
| `photo_deleted` | `deleteJobPhotoAction` | `{ caption }` |
| `task_added` | `createJobTaskAction` | `{ text }` |
| `task_completed` | `updateJobTaskAction` (isCompleted=true) | `{ text }` |
| `task_uncompleted` | `updateJobTaskAction` (isCompleted=false) | `{ text }` |
| `time_started` | `clockInAction` | `{}` |
| `time_stopped` | `clockOutAction` | `{ durationMinutes }` |
| `manual_time_added` | `createManualEntryAction` | `{ durationMinutes, note }` |

**Synthetic fallback:** For existing records without a matching real event, derive events from `createdAt` on `job_photos`, `job_tasks`, `time_entries`, `quotes`, `invoices`. Real events always win over synthetic duplicates.

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-2000 | `job_events` DB schema + migration | `[ ]` | `N/A` | `lib/db/schema/job-events.ts`. Columns: `id (uuid pk)`, `jobId (fk)`, `userId (fk)`, `eventType text`, `metadata jsonb`, `createdAt`. Append-only — no soft delete. |
| F-2001 | `insertJobEvent()` helper + Server Action wiring | `[ ]` | `N/A` | Shared helper in `lib/db/queries/job-events.ts`. Wire into: `createJobAction`, `updateJobStatusAction`, `updateJobNotesAction`, `addJobPhotoAction`, `deleteJobPhotoAction`, `createJobTaskAction`, `updateJobTaskAction`, `clockInAction`, `clockOutAction`, `createManualEntryAction` |
| F-2002 | `getJobTimeline()` query | `[ ]` | `N/A` | Fetches real `job_events` + builds synthetic events from existing `createdAt` columns. Merges (real wins on duplicate), sorts `createdAt DESC`, groups by local date. Returns `Array<{ date: string; events: TimelineEvent[] }>`. |
| F-2003 | `JobTimeline` component | `N/A` | `[ ]` | `components/jobs/job-timeline.tsx`. Day headers: "Today" / "Yesterday" / `Mon 20 Apr`. Event row: `HH:MM` pill · icon · description · optional chip (duration, photo tag, status arrow `→`). Icon colors: photos=green, clock=blue, status=amber, notes=purple, tasks=muted, docs=cobalt. Empty state with prompt card. |
| F-2004 | Timeline card on job detail page | `[ ]` | `[ ]` | New "Timeline" Card at bottom of left column in `app/[locale]/(dashboard)/jobs/[id]/page.tsx`. Fetch `getJobTimeline(id, userId)` in the existing parallel Promise.all. |
| F-2005 | `/timeline` global page | `[ ]` | `[ ]` | `app/[locale]/(dashboard)/timeline/page.tsx`. Searchable combobox: job number + title + customer name. URL param `?job=[id]` drives server-side load. No job selected → illustrated prompt card. |

---

→ Feature details: `project-context/features/` (JOBS, QUOTES, INVOICES, CUSTOMERS, AI_RECORDING, AUTH_PROFILE, EMAIL_TEMPLATES)
→ Database schema: `project-context/architecture/DATABASE.md`
→ Known issues: `project-context/context/KNOWN_ISSUES.md`
