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
| 2 | Customer Management | 10 | 9 | 1 | 0 |
| 3 | Job Management | 11 | 11 | 0 | 0 |
| 4 | Quote Builder | 15 | 15 | 0 | 0 |
| 5 | Invoice Engine | 14 | 14 | 0 | 0 |
| 6 | Quote & Invoice Enhancements | 8 | 8 | 0 | 0 |
| 7 | Bank Details & Profile | 5 | 5 | 0 | 0 |
| 8 | Merge Documents | 3 | 3 | 0 | 0 |
| 9 | Reporting | 8 | 0 | 0 | 8 |
| 10 | Email Notifications | 4 | 4 | 0 | 0 |
| 11 | AI Intelligence Layer | 9 | 2 | 0 | 7 |
| 12 | Dashboard & Tier Gates | 8 | 3 | 4 | 1 |
| 13 | Compliance Pre-GoLive | 11 | 0 | 0 | 11 |
| 14 | Growth, Retention & Compliance | 10 | 0 | 0 | 10 |
| 15 | Time Tracking | 9 | 0 | 0 | 9 |
| 16 | E-conomic Integration | 8 | 0 | 0 | 8 |

**Overall:** ~97 complete / ~153 total · Phases 0–8, 10 shipped · Phases 9, 13, 14, 15, 16 not started

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
| F-207 | "Owes money" badge | `[x]` | `[~]` | BE done; FE still stubbed at 0 — needs wiring to real invoice totals |
| F-208 | CVR number field | `[x]` | `[x]` | |
| F-209 | Notes field per customer | `[x]` | `[x]` | Internal notes |

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

---

## PHASE 12 — Dashboard & Tier Gates

→ Schema: `project-context/architecture/DATABASE.md` (`lib/db/queries/overview.ts` has all queries)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1200 | Dashboard: outstanding amount | `[x]` | `[~]` | Query in `overview.ts`; StatCards still shows stub data |
| F-1201 | Dashboard: active jobs count | `[x]` | `[~]` | Query in `overview.ts`; StatCards still shows stub data |
| F-1202 | Dashboard: overdue invoices | `[x]` | `[~]` | Query in `overview.ts`; CriticalZone still shows stub data |
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
| F-1302 | EAN number on customer form | `[ ]` | `[ ]` | `customers.eanNumber` exists in DB; UI field not exposed yet |
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
| F-1406 | Flat-rate pricebook | `[ ]` | `[ ]` | Pre-priced service catalog; one-click add to quote |
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
| F-3113 | Enhanced `/time-tracking` page | `[x]` | `[x]` | Timer zone, `DayStrip` (week nav + day selector), `DayView` (visual hour timeline + entry cards), month calendar, inline entry edit, unbilled nudge. Day-centric navigation: `?week=` + `?day=` params. Timezone bug fixed (local ISO dates instead of UTC). |

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

→ Feature details: `project-context/features/` (JOBS, QUOTES, INVOICES, CUSTOMERS, AI_RECORDING, AUTH_PROFILE)
→ Database schema: `project-context/architecture/DATABASE.md`
→ Known issues: `project-context/context/KNOWN_ISSUES.md`
