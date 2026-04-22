# Håndværk Pro — Development Bible

> **Purpose:** Single source of truth for all remaining development work. Phases are ordered by dependency and risk, not urgency. No release pressure — build it right.

---

## Current State (as of 2026-04-21)

| Status | Count | Notes |
|---|---|---|
| Phases fully shipped | 1, 2, 4, 7, 8, 15, 20, 22, 31 | Bug fixes, dashboard, onboarding, compliance, GDPR, AI follow-up drafts, pricebook, job profitability, time tracking |
| Partially shipped | 11, 12 | AI pipeline + dashboard — backend done, FE stubs remain |
| Not started | 9, 13, 14 | Reporting, compliance, growth |
| Active known issues | 4 | KI-005 (pending), KI-009 (needs drizzle run), KI-011 (email domain), KI-012 (deferred Phase 3) |

**Core feature coverage:** Customer → Job → Quote → Invoice → Email → AI recording. The foundation is solid. Everything ahead is polish, intelligence, compliance, and growth.

---

## Phase Roadmap at a Glance

| Phase | Name | Priority | Complexity |
|---|---|---|---|
| 1 | Bug Fixes & Tech Debt | Critical | Low |
| 2 | Dashboard — Wire Live Data | High | Low |
| 3 | CI/CD & Infrastructure Hardening | High | Medium |
| 4 | Auth & Onboarding Polish | Medium | Low |
| 5 | Reporting — Revenue & Customers | High | Medium |
| 6 | Reporting — Expenses & SKAT | High | Medium |
| 7 | Compliance Foundation | High | Medium |
| 8 | GDPR & Legal Pages | High | Low |
| 9 | Rate Limiting & Security Audit | High | Low |
| 10 | Danish Translation (da.json) | Medium | Low |
| 11 | AI — Photo to Quote Draft | Medium | High |
| 12 | AI — Dynamic Pricing Intelligence | Medium | High |
| 13 | AI — Customer Risk Profiling | Medium | Medium |
| 14 | AI — Automated Job Handover Report | Medium | Medium |
| 15 | AI — Follow-up Response Drafts | Low | Medium |
| 16 | AI — Cash Flow Forecast | Low | High |
| 17 | AI — Job Clustering & Insights | Low | High |
| 18 | Growth — Online Booking Page | Medium | High |
| 19 | Growth — Customer Self-Service Portal | Medium | High |
| 20 | Growth — Flat-rate Pricebook | Medium | Medium |
| 21 | Growth — Service Agreements & Recurring | Medium | High |
| 22 | Growth — Real-time Job Profitability | Medium | Medium |
| 23 | Growth — SMS & Auto Review Requests | Low | High |
| 24 | Compliance — OIOUBL & NemHandel | Low | High |
| 25 | Compliance — KLS & APV Docs | Low | Medium |
| 26 | PWA & Mobile Polish | Medium | Medium |
| 27 | Performance & Database Optimization | Medium | Medium |
| 28 | Accountant Portal | Low | High |
| 29 | Team Features (Hold Tier) | Low | Very High |
| 30 | MobilePay Erhverv Integration | Low | High |
| 31 | Time Tracking | **High** | Medium |
| 32 | E-conomic / Accounting Integration | **High** | High |
| 33 | Email Template Manager | Medium | Medium |
| 34 | Jobs Revamp | **High** | Medium |
| 35 | Job Activity Timeline | Medium | Medium |

---

## Phase 1 — Bug Fixes & Tech Debt

**Goal:** Clear all 15 known issues before building anything new. These are real risks — data leaks, wrong limits, broken UX.

**Rules:** Fix bugs surgically. Don't refactor surrounding code. Don't introduce new abstractions.

### Remaining (4 open)

| Issue | File | Status |
|---|---|---|
| KI-005: Job number format `"1"` instead of `JOB-0001` | `lib/actions/jobs.ts:67` | Pending — existing records stay as plain integers |
| KI-009: Missing DB migration snapshots 0005–0010 | `drizzle/migrations/meta/` | Needs `npx drizzle-kit generate` run by developer |
| KI-011: EMAIL_FROM uses sandbox domain | `lib/email/client.ts:4` | Needs Resend custom domain verification |
| KI-012: No CI/CD pipeline | — | Deferred to Phase 3 |

**Resolved (11/15):** KI-001, KI-002, KI-003, KI-004, KI-006, KI-007, KI-008, KI-010, KI-013, KI-014, KI-015

---

## Phase 2 — Dashboard — Wire Live Data

**Goal:** Replace every hardcoded/stub value in the dashboard with real DB queries. The queries already exist in `lib/db/queries/overview.ts` — this is purely a wiring task.

| Feature | Component | Query to wire |
|---|---|---|
| F-1200: Outstanding amount | `components/dashboard/stat-cards.tsx` | `getOutstandingAmount(userId)` |
| F-1201: Active jobs count | `components/dashboard/stat-cards.tsx` | `getActiveJobsCount(userId)` |
| F-1202: Overdue invoices | `components/dashboard/critical-zone.tsx` | `getOverdueInvoices(userId)` |
| F-1203: This month billed | `components/dashboard/stat-cards.tsx` | `getThisMonthBilled(userId)` |

**Also wire:** F-207 "Owes money" badge — covered in KI-014 above.

**Success criteria:** Dashboard loads with real numbers. No hardcoded values remain. Skeletons shown while loading. Empty states handled gracefully.

---

## Phase 3 — CI/CD & Infrastructure Hardening

**Goal:** Never merge broken code. Automate quality checks. Get error tracking live.

### 3.1 — GitHub Actions Pipeline (F-001, KI-012)

- On every PR: `npm run lint`, `npx tsc --noEmit`, `npm run build`
- On merge to `main`: trigger Vercel production deploy
- Add branch preview deploys for all feature branches
- File: `.github/workflows/ci.yml`

### 3.2 — Sentry Error Tracking (F-014)

- Install `@sentry/nextjs`
- Add DSN to env vars and `.env.example`
- Configure source maps upload in CI
- Wire to `app/global-error.tsx`
- Set up a Sentry alert for new error types

### 3.3 — Vercel Deployment Pipeline (F-001)

- Confirm `main` → production, feature branches → preview
- Add `NEXT_PUBLIC_APP_URL` to Vercel environment variables (fixes KI-001)
- Set up custom domain

**Success criteria:** A deliberate syntax error in a PR fails CI. Sentry dashboard shows events from production. Production URL resolves with correct env vars.

---

## Phase 4 — Auth & Onboarding Polish

**Goal:** Clean, smooth first-run experience. Clerk flows work correctly. Profile gate is airtight.

| Feature | Notes |
|---|---|
| F-100: Sign-up phone OTP | Clerk-hosted. Verify UI matches design system |
| F-101: Sign-up email OTP | Clerk-hosted |
| F-102: Sign-in phone OTP | Clerk-hosted |
| F-103: Sign-in email OTP | Clerk-hosted |
| Profile completion gate | Verify redirect chain: new user → webhook → `/profile/setup` → overview |
| Onboarding checklist | Optional: small "setup steps" card on first dashboard load (connect bank, add first customer, etc.) |

**Success criteria:** New user can sign up via phone or email, complete profile, and land on dashboard without any broken redirect. Profile gate blocks dashboard access until `companyName` is set.

---

## Phase 5 — Reporting — Revenue & Customers

**Goal:** Build the `/reports` route with the two most business-critical reports. Tradespeople care most about money in and money owed.

### Schema additions needed

- Add database indexes on `invoices.createdAt`, `invoices.userId`, `invoices.status` for reporting query performance
- Run `npx drizzle-kit generate` after schema changes

### Features

| Feature | Description |
|---|---|
| F-900: Reports page scaffold | `/reports` route with tab nav: Revenue / Customer / Job / Expense. Period filter component in header |
| F-901: Period filter component | Reusable: This month / Last month / Q1–Q4 / This year / Custom date range. Shared across all report tabs |
| F-902: Revenue report | Total billed (ex. VAT), VAT collected, paid vs outstanding, avg invoice value, month-over-month sparkline |
| F-903: Customer report | Revenue per customer, outstanding balance, job count, avg payment time in days |

**UI guidance:** Read `UI_DESIGN_SYSTEM.md` before writing JSX. Use card-based layout consistent with dashboard. Charts via a lightweight library (recharts is already fine if installed, otherwise use native SVG for simplicity).

**Success criteria:** Reports page loads with real data. Period filter updates all numbers reactively. Empty state shown for new users. All values formatted via `formatDKK()`.

---

## Phase 6 — Reporting — Expenses & SKAT

**Goal:** Complete the reporting module with expense tracking and SKAT moms summary — directly useful for quarterly VAT filing.

### Schema additions needed

- New `expenses` table: `id`, `userId`, `date`, `category` (enum: materials, tools, vehicle, subcontractor, other), `description`, `amount` (cents), `vatAmount` (cents), `receiptUrl`, `createdAt`, `deletedAt`
- Run `npx drizzle-kit generate`

### Features

| Feature | Description |
|---|---|
| F-905: Expenses DB schema + logging UI | CRUD for expenses. Category picker, amount, VAT amount, optional receipt upload via Vercel Blob |
| F-906: Expense report | Period summary by category, total input VAT (for SKAT offset), estimated profit (billed − expenses) |
| F-907: SKAT moms quarterly summary | Q1–Q4 breakdown: output VAT (from invoices) − input VAT (from expenses) = net VAT owed. Export as PDF. NOT API filing — just a clean summary the user hands to their accountant |
| F-1300: SKAT moms summary page | Dedicated `/reports/moms` page with quarterly grid view |
| F-1301: Moms period calculation | Q1=Jan–Mar, Q2=Apr–Jun, Q3=Jul–Sep, Q4=Oct–Dec. Current quarter highlighted |
| F-904: Job report | Jobs by status, completed this month, avg job value, revenue by job type (service/project/recurring) |

**Success criteria:** Expenses can be logged with receipts. SKAT quarterly summary matches manual calculation. PDF export produces a clean document.

---

## Phase 7 — Compliance Foundation

**Goal:** Expose fields and flows required by Danish law and B2B invoicing standards.

| Feature | Description |
|---|---|
| F-1302: EAN number on customer form | `customers.eanNumber` already exists in DB — add the input field to `CustomerForm`, validate 13-digit EAN format |
| F-1303: OIOUBL invoice export | Generate OIOUBL XML from invoice data. Required for invoicing public sector Danish customers. Use a template string approach — no external library needed for this spec |
| F-1309: Rate limiting audit | Ensure every Server Action and API route calls `applyRateLimit`. Grep audit: `grep -r "applyRateLimit" lib/actions` — any file missing it needs wiring |
| F-1310: Zod validation audit | Every Server Action parameter must be parsed through a Zod schema before use. Audit and add where missing |

**Success criteria:** EAN field visible and validated in customer form. OIOUBL XML output passes schema validation for a sample invoice. Rate limiting grep shows 100% coverage.

---

## Phase 8 — GDPR & Legal Pages

**Goal:** Meet Danish GDPR requirements. These are legal obligations, not nice-to-haves.

| Feature | Description |
|---|---|
| F-1304: GDPR data export | User can request a JSON download of all their data: profile, customers, jobs, quotes, invoices, expenses |
| F-1305: Account deletion flow | User initiates deletion → 30-day grace period → Inngest hard-deletes all data. Clerk account deleted immediately. Confirmation email sent |
| KI-002 (revisit) | Ensure `user.deleted` webhook cascade is wired to the same hard-delete path |
| F-1306: Privacy policy page | Static `/privacy` page. Write in plain language. Include: data collected, retention periods, third-party processors (Clerk, Neon, Vercel, Resend, Groq, PostHog) |
| F-1307: Cookie consent | Minimal banner for analytics cookies (PostHog). Store consent in localStorage. Show on first visit only |
| F-1308: Terms of service page | Static `/terms` page. Covers: service description, payment, limitations, user responsibilities |

**Implementation notes:**
- Legal pages are static — no DB, no auth required. `app/[locale]/(public)/privacy/page.tsx`
- Data export should be a Server Action returning a JSON blob download, rate-limited strictly
- Account deletion needs a confirmation modal with "type your email to confirm" UX

**Success criteria:** Data export produces a complete JSON file in under 5 seconds. Account deletion grace period is logged in DB. Legal pages are accessible without login.

---

## Phase 9 — Rate Limiting & Security Audit

**Goal:** Full coverage of Upstash rate limiting and Zod input validation across all endpoints.

### Audit checklist

- [ ] Grep all Server Actions in `lib/actions/` — every one must call `applyRateLimit(clerkId)` as its first line
- [ ] Identify AI actions — switch from `rateLimiter` to `aiRateLimiter` (currently unused per KI-008)
- [ ] Identify high-risk mutations (delete, merge, credit note) — switch to `strictRateLimiter`
- [ ] Grep all API routes — every `POST`/`PUT`/`DELETE` route must call rate limiter
- [ ] Audit all Server Action inputs — every param must pass through a Zod schema
- [ ] Add `Content-Security-Policy` headers in `next.config.js`
- [ ] Verify `CLERK_WEBHOOK_SECRET` validation is present on webhook routes

**Success criteria:** `strictRateLimiter` has active import references. `aiRateLimiter` is used in all AI actions. Zod parse is the first operation on all user-supplied data in Server Actions.

---

## Phase 10 — Danish Translation

**Goal:** Fill all `da.json` values so Danish users get a native experience.

**Current state:** Every i18n key in `messages/da.json` has value `""`. The app silently falls back to English.

### Process

1. Extract all keys from `messages/en.json` that have non-empty English values
2. For each key, provide a professional Danish translation appropriate for the tradesperson context
3. Run through the app in Danish locale to validate rendering (no overflow, correct gender/plurals)
4. Pay special attention to: legal terms (moms, faktura, kreditnota, debitor), trade-specific language (opgave, tilbud), and UI actions (gem, slet, opret, send)

**Notes:**
- Danish has grammatical gender — use definite/indefinite article correctly (et/en)
- "Quote" = "Tilbud", "Invoice" = "Faktura", "Job" = "Opgave", "Customer" = "Kunde"
- Use `tu` (du) form throughout — Danish professional apps are informal

**Success criteria:** App loads fully in Danish. No empty strings visible in UI. No English words showing in da locale.

---

## Phase 11 — AI — Photo to Quote Draft

**Goal:** User snaps a photo of a job site → AI analyzes what work is needed → pre-filled quote draft.

**Architecture:**
```
User uploads photo on /jobs/[id]/quote/new
  → Vercel Blob upload (existing pattern)
  → Server Action: analyzeJobPhotoAction(blobUrl, jobId)
  → Claude Vision API (claude-sonnet-4-6) — prompt: "analyze this job site photo, identify work needed, estimate materials"
  → Returns: { description, suggestedItems: [{ type, description, quantity, unit }] }
  → Pre-populate quote line items in QuoteBuilder form
  → User reviews, adjusts, saves
```

**Key decisions to confirm before implementing:**
- Which Claude model? `claude-sonnet-4-6` (vision capable, fast)
- Where does the photo UI live? On the quote creation page, not a separate route
- Do we store the AI analysis? Yes — in `quotes.aiSourceData` JSONB column (add to schema)

**Schema change:** Add `aiSourceData JSONB` to `quotes` table. Run `npx drizzle-kit generate`.

**Success criteria:** Upload a job site photo → quote draft appears with plausible line items within 10 seconds. User can edit all items. No quote is auto-saved — user must confirm.

---

## Phase 12 — AI — Dynamic Pricing Intelligence

**Goal:** When creating a new quote, show the user what they've charged for similar work in the past — so they price confidently.

**Architecture:**
```
User opens new quote for a job
  → Server Action: getPricingSuggestionsAction(jobDescription, userId)
  → Query: last 20 accepted quotes for this user
  → Groq LLaMA 3.3 70b: compare job description to historical quotes → find similar
  → Return: { avgRate, minRate, maxRate, similarQuotes: [...] }
  → Show subtle hint card below quote form: "Similar jobs: avg 4.200 kr"
```

**UI:** Non-intrusive. A collapsed card below the form. User can ignore it. Never auto-fills — only suggests.

**Rate limiting:** Use `aiRateLimiter` (10/60s). Cache suggestions in Upstash for 5 minutes per user.

**Success criteria:** Hint card appears within 3 seconds of opening a new quote. Similar quotes are genuinely relevant. Suggestion matches human intuition on test data.

---

## Phase 13 — AI — Customer Risk Profiling

**Goal:** Surface a non-blocking hint when creating a job or invoice for a customer with a history of late payment.

**Architecture:**
```
createJobAction / createInvoiceAction receives customerId
  → getCustomerPaymentHistory(customerId, userId)
  → if avgDaysLate > 14: return { riskLevel: "high", avgDaysLate }
  → Client receives hint alongside created record
  → Small toast/badge: "Note: this customer has paid late on average 21 days"
```

**This is a hint, not a blocker.** User can always proceed. No AI model needed — pure DB analytics.

**Schema:** No changes. Use existing `invoices` table with `paidAt` vs `dueDate` comparison.

**Success criteria:** A customer with 3+ late invoices shows the risk hint on next job/invoice creation. New customers with no history show nothing.

---

## Phase 14 — AI — Automated Job Handover Report

**Goal:** After a job is marked `done`, offer to generate a PDF handover document from job notes and photos.

**Architecture:**
```
Job status changes to "done"
  → Optional prompt: "Generate handover report?"
  → Server Action: generateHandoverReportAction(jobId)
  → Fetch job: notes, photos, customer info, job description
  → Groq LLaMA 3.3 70b: structure notes into professional handover format
  → @react-pdf/renderer: render to PDF (same pattern as invoice/quote PDFs)
  → Store URL in jobs.handoverReportUrl
  → User can download or email to customer
```

**Schema change:** Add `handoverReportUrl TEXT` to `jobs` table. Run `npx drizzle-kit generate`.

**Success criteria:** Handover PDF generates in under 15 seconds. Document is professional, structured, uses job notes and photo count. Customer and job details correct.

---

## Phase 15 — AI — Follow-up Response Drafts

**Goal:** Quote has been sent but not opened/responded to in 7+ days → AI drafts a follow-up message in the user's tone.

**Architecture:**
```
Inngest cron: daily scan of quotes with status "sent" and sentAt < 7 days ago
  → For each: fetch quote + user's recent email body (tone analysis)
  → Groq LLaMA: generate follow-up draft
  → Store in quotes.followUpDraft
  → Create notification: "Draft follow-up ready for [Customer Name]"
  → User reviews in notification center → can send or dismiss
```

**Never auto-sends.** Draft only. User must explicitly click Send.

**Success criteria:** Draft appears in notification center after 7 days of no response. Tone matches 2-3 samples of the user's previous emails. User can edit before sending.

---

## Phase 16 — AI — Cash Flow Forecast

**Goal:** 30/60/90-day cash flow projection based on outstanding quotes and invoice history.

**Architecture:**
```
/reports/cashflow page
  → Server Action: getCashFlowForecastAction(userId)
  → Data inputs:
      - Outstanding quotes (probability-weighted by conversion history)
      - Sent invoices (weighted by avg payment delay per customer)
      - Recurring jobs (if any)
  → Groq or pure calculation: model monthly in/out
  → Return: { next30: DKK, next60: DKK, next90: DKK, assumptions: [...] }
  → Render as chart + assumptions list
```

**This is probabilistic, not accounting.** Must show clear disclaimer: "Estimate — not financial advice."

**Success criteria:** Forecast updates when invoices are paid or quotes accepted. Assumptions are legible to a non-technical user.

---

## Phase 17 — AI — Job Clustering & Insights

**Goal:** Auto-tag jobs by type, surface pattern insights ("Bathroom renos average 3.1 days and 24.200 kr for you").

**Architecture:**
```
Background Inngest function: weekly re-clustering
  → Fetch all completed jobs for user
  → Groq LLaMA: cluster by description similarity → assign tags
  → Store tags in jobs.aiTags (TEXT[] column)
  → Compute stats per cluster: avgDuration, avgValue, count
  → Store in users.jobInsights JSONB
  → Dashboard shows "Your insights" card
```

**Schema changes:** `jobs.aiTags TEXT[]`, `users.jobInsights JSONB`. Run `npx drizzle-kit generate`.

**Success criteria:** After 10+ completed jobs, at least 2 clusters appear. Stats match manual calculation on test data. Insights card visible on dashboard (not reports).

---

## Phase 18 — Growth — Online Booking Page

**Goal:** Each tradesperson gets a public `/book/[handle]` page where customers can request a job.

**Architecture:**
```
User sets their public handle in profile (e.g., "jens-vvs")
  → Public page: /book/jens-vvs (no auth, server-rendered)
  → Form: name, phone, description, preferred date
  → Submit → createBookingRequestAction → insert into new `booking_requests` table
  → Inngest: notify tradesperson via email + in-app notification
  → Tradesperson reviews, accepts → converts to job
```

**Schema:** New `booking_requests` table: `id`, `userId` (tradesperson), `customerName`, `phone`, `email`, `description`, `preferredDate`, `status` (pending/accepted/rejected), `createdAt`.

**Success criteria:** Public booking page loads without auth. Submission creates DB record. Tradesperson receives email notification within 30 seconds. One-click "accept → create job" flow works.

---

## Phase 19 — Growth — Customer Self-Service Portal

**Goal:** Customers can view their quotes and invoices, and accept/reject quotes — all without creating an account.

**Architecture:**
```
New route: /portal/[customerId]?token=[accessToken]
  → Token in users.portalToken (UUID, 90-day TTL)
  → Tradesperson shares link from customer detail page
  → Portal shows: pending quotes, sent invoices, job history
  → Accept/Reject quote buttons (reuse existing token-based action)
  → Invoice download (existing PDF route)
```

**Schema change:** `users.portalTokens` or `customers.portalToken` + `portalTokenExpiresAt`. Run `npx drizzle-kit generate`.

**Security:** Token must be validated server-side. Never expose userId directly. Rate-limit portal access.

**Success criteria:** Customer can view their invoices and accept a quote via portal link. Expired tokens show "link expired" page. No auth required.

---

## Phase 20 — Growth — Flat-rate Pricebook ✅ SHIPPED

**Goal:** Tradesperson builds a catalog of pre-priced services ("Replace toilet valve — 850 kr"). One-click add to any quote or invoice.

**What's built:**
- `/pricebook` page — full CRUD (add/edit/delete inline, search, type badges)
- `pricebook_items` table: `id`, `userId`, `name`, `description`, `unitPrice`, `itemType`, `isActive`, `createdAt`, `deletedAt`
- `getPricebookAction`, `createPricebookItemAction`, `updatePricebookItemAction`, `deletePricebookItemAction` (all rate-limited, Zod-validated)
- Free tier gate: 20 items max
- **QuoteForm** — "From pricebook" button next to Line Items label → searchable dropdown → click appends line item
- **InvoiceForm** — same "From pricebook" picker
- Sidebar nav item (BookOpen icon), i18n keys, GDPR export + deletion

---

## Phase 21 — Growth — Service Agreements & Recurring Invoices

**Goal:** Tradesperson can set up a recurring job + invoice schedule (monthly boiler service, annual inspection, etc.).

**Architecture:**
```
New job type: "recurring" (already in DB as job type)
  → New `recurring_schedules` table: jobTemplateId, frequency (monthly/quarterly/annual), nextRunAt, isActive
  → Inngest cron: daily check → if nextRunAt <= today → clone job → create invoice → send
  → UI: /jobs/recurring — list active schedules, pause/resume, edit
```

**Schema:** New `recurring_schedules` table. New `jobs.recurringScheduleId` FK. Run `npx drizzle-kit generate`.

**Success criteria:** A monthly service schedule auto-generates a job + invoice on the correct date. Pause/resume works. User receives notification when invoice is auto-sent.

---

## Phase 22 — Growth — Real-time Job Profitability Tracking

**Goal:** Show the tradesperson their margin on each job — materials cost vs amount billed.

**Architecture:**
```
Job detail page: new "Profitability" card
  → Sum of quote/invoice line items typed "materials" = estimated revenue
  → Sum of expenses logged against this job = costs
  → Gross margin % = (revenue - costs) / revenue
  → Color-coded: green > 40%, amber 20–40%, red < 20%
```

**Schema change:** Add `jobId FK` to `expenses` table (nullable — expense can be general or job-specific). Run `npx drizzle-kit generate`.

**Success criteria:** Job detail shows profitability card when at least one expense and one invoice exist. Margin calculation matches manual check. No stub data.

---

## Phase 23 — Growth — SMS & Auto Google Review Requests

**Goal:** Send SMS from job cards; auto-request Google reviews 24h after invoice is marked paid.

### 23.1 — SMS (F-1400)

- Integrate GatewayAPI (already stubbed in stack decisions)
- Add `sendSmsAction(phone, message, jobId)` Server Action
- SMS button on job detail page — opens modal with pre-filled message
- Store sent messages in new `sms_log` table for audit

### 23.2 — Auto Google Review Request (F-1401)

- When `markInvoicePaidAction` fires → `inngest.send("invoice/paid")`
- Inngest: `step.sleep("24h")` → send SMS + email with `users.googleReviewUrl`
- If `googleReviewUrl` is not set → skip silently
- User can disable auto-reviews in profile settings

**Schema:** New `sms_log` table. New `users.smsAutoReviewEnabled` boolean (default true).

**Success criteria:** SMS delivered via GatewayAPI within 5 seconds. Auto review request fires 24h after payment, only if `googleReviewUrl` is set.

---

## Phase 24 — Compliance — OIOUBL & NemHandel

**Goal:** Support public sector invoicing via OIOUBL XML (required for Danish government customers).

**Architecture:**
```
Invoice detail page: "Export OIOUBL" button (visible when customer has EAN number)
  → generateOIOUBLAction(invoiceId)
  → Build XML conforming to OIOUBL BIS Billing 3.0 spec
  → Return as file download (Content-Disposition: attachment)
```

**Dependencies:** Phase 7 (EAN field on customer form) must be complete.

**Fields required in OIOUBL:**
- Seller: CVR, name, address, VAT number
- Buyer: EAN, name, address
- Line items: description, quantity, unit price, VAT rate
- Payment terms, bank account

**Success criteria:** Generated XML passes [OIOUBL validator](https://rep.oio.dk/). Invoice with EAN customer shows Export button. Invoice without EAN does not show it.

---

## Phase 25 — Compliance — KLS & APV Documentation

**Goal:** Generate compliance PDFs required by Danish law for licensed trades.

### 25.1 — KLS (F-1407)

- Quality log for authorized VVS (plumber) and electrical work
- PDF template: job details, materials used, test results, technician sign-off
- Stored per job in Vercel Blob, linked from job detail page

### 25.2 — APV Workplace Safety (F-1409)

- Per-job APV (Arbejdspladsvurdering) checklist
- Required by Arbejdstilsynet for on-site work
- PDF with: job location, hazards identified, protective measures, signature
- One-click generate from job detail page

**Schema changes:** `jobs.klsDocumentUrl TEXT`, `jobs.apvDocumentUrl TEXT`. Run `npx drizzle-kit generate`.

**Success criteria:** Both PDF types generate within 10 seconds. PDFs contain all legally required fields. Stored in Blob and accessible from job detail.

---

## Phase 26 — PWA & Mobile Polish

**Goal:** The app is already mobile-first. Make it installable and partially offline-capable.

| Task | Description |
|---|---|
| PWA manifest | `public/manifest.json` with name, icons (192px, 512px), theme color, display: standalone |
| Service worker | Register with next-pwa or custom SW. Cache: static assets + last-visited pages |
| Offline page | `/offline` fallback when no network. Show cached job list if available |
| Install prompt | Custom "Add to Home Screen" banner on mobile after 2 visits |
| iOS meta tags | `apple-mobile-web-app-capable`, status bar style, splash screens |
| Push notifications | Browser Push API for invoice reminders and booking requests (requires user opt-in) |
| Camera integration | Direct camera launch on photo upload buttons (mobile only) |

**Success criteria:** Lighthouse PWA score ≥ 90. App installable on iOS and Android. Core pages load offline using cached data.

---

## Phase 27 — Performance & Database Optimization

**Goal:** App stays fast as data grows. No N+1 queries. No unnecessary re-renders.

### Database

- Add composite indexes on high-traffic query patterns:
  - `invoices(userId, status, createdAt)`
  - `jobs(userId, status, createdAt)`
  - `quotes(userId, status, createdAt)`
  - `customers(userId, deletedAt)`
- Run `EXPLAIN ANALYZE` on the 10 most-used queries
- Add `cursor-based pagination` to list pages (customers, jobs, invoices) — replace offset pagination

### Frontend

- Audit React re-renders with React DevTools Profiler
- Add Suspense boundaries with skeletons on all data-heavy sections
- Lazy-load PDF renderer (heavy — `@react-pdf/renderer` should not be in main bundle)
- Verify no large images are loaded without `next/image`

### Caching

- Add Upstash cache layer for CVR lookup responses (already has 5min Next.js cache — verify it's working)
- Cache dashboard overview query per user with 1-minute TTL

**Success criteria:** Lighthouse Performance ≥ 90 on mobile. No query takes > 200ms on a dataset of 500 jobs. List pages load in < 1s.

---

## Phase 28 — Accountant Portal

**Goal:** Tradespeople can grant their accountant read-only access to financial data — no code sharing, proper auth.

**Architecture:**
```
New role: "accountant" (scoped access to one user's data)
  → Tradesperson invites accountant via email
  → Accountant signs up (Clerk) → linked to tradesperson account
  → Accountant dashboard: invoices, expenses, SKAT summaries — read-only
  → Cannot see jobs, quotes, customers (not their concern)
  → Separate layout /accountant/[handle]/...
```

**Schema changes:**
- New `accountant_invites` table: `id`, `userId`, `accountantEmail`, `acceptedAt`, `token`
- New `accountant_access` table: `id`, `userId`, `accountantClerkId`, `grantedAt`, `revokedAt`

**Success criteria:** Accountant can log in and view all invoices and SKAT summaries for their client. Cannot create, edit, or delete anything. Tradesperson can revoke access from their profile.

---

## Phase 29 — Team Features (Hold Tier)

**Goal:** Multiple employees under one company account. Job assignment, team calendar, shared customer list.

**This is the most complex phase.** Do not start until Phases 1–22 are complete.

### Key decisions to resolve before building

- Does each employee have their own Clerk account, or share one?
- Who owns the data — the company or the individual employee?
- How does billing work — per seat or per company?

### High-level scope

- New `teams` table as the organizational unit
- `team_members` table: teamId, clerkUserId, role (owner/member)
- All existing tables get `teamId` in addition to `userId`
- Job assignment: `jobs.assignedToUserId`
- Team calendar: aggregated view of all jobs across team members
- Team dashboard: revenue across all members, jobs by employee

**Schema changes:** Massive. Plan carefully with `npx drizzle-kit generate` at each step.

---

## Phase 30 — MobilePay Erhverv Integration

**Goal:** When MobilePay Erhverv API access is approved, replace the stub with real payment links.

**Current state:** `F-507` — stubbed, shows "coming soon". Do not touch until API approval is in hand.

### When approved

- Add `MOBILEPAY_API_KEY`, `MOBILEPAY_MERCHANT_ID` to env vars
- `createMobilePayLinkAction(invoiceId)` → calls MobilePay API → returns payment URL
- Store URL in `invoices.mobilePayUrl`
- Show QR code + link on invoice PDF and customer-facing email
- Inngest: on payment webhook → `markInvoicePaidAction` automatically

**Success criteria:** Customer scans QR code on invoice → pays via MobilePay → invoice automatically marked paid within 30 seconds.

---

## Phase 31 — Time Tracking

**Goal:** Track billable and non-billable hours per job. This is a critical competitive gap — Minuba, Apacta, and Ordrestyring all have it. Tradespeople who charge by the hour need to log time on-site from their phone, then convert those hours directly into quote/invoice line items.

**Architecture:**
```
New time panel on job detail page + /time-tracking weekly view
  → Clock in/out button (mobile-first — large tap target)
  → Manual entry: date, start time, end time, description, billable toggle
  → Per-job time log: list of entries with total hours
  → "Add to quote/invoice" button: sum billable hours × user's hourly rate → new labour line item
  → Weekly timesheet: all jobs this week, total hours per day
```

**Schema:** New `time_entries` table — migration 0012 applied.

```
time_entries: id, userId, jobId (FK), startedAt, endedAt, durationMinutes,
              description, isBillable, billedToQuoteId (FK), billedToInvoiceId (FK),
              createdAt, deletedAt
```

| Feature | BE | FE | Notes |
|---|---|---|---|
| F-3100: Time entries DB schema | `[x]` | `N/A` | `lib/db/schema/time-entries.ts` — migration 0012 |
| F-3101: Clock in/out on job detail | `[x]` | `[x]` | `ClockPanel` + `clockInAction` / `clockOutAction` |
| F-3102: Manual time entry form | `[x]` | `[x]` | `ManualEntryForm` + `createManualEntryAction` |
| F-3103: Time log list per job | `[x]` | `[x]` | `TimeEntryList` + `TimeLogPanel` on job detail page |
| F-3104: Weekly timesheet view | `[x]` | `[x]` | `/time-tracking` route + `WeeklyTimesheet` with week nav |
| F-3105: Convert billable hours → line item | `[x]` | `[x]` | `addBillableHoursToLineItemAction` + `AddToDocumentModal` |
| F-3106: Billable vs non-billable toggle | `[x]` | `[x]` | `isBillable` field in form + filter in billing queries |
| F-3107: Time summary per customer | `[ ]` | `[ ]` | Deferred to Phase 5 (customer report) |
| F-3108: Free tier gate: 50 entries max | `[x]` | `[x]` | `countTimeEntries` checked in `clockInAction` |
| F-3109: Clock button on jobs list | `[x]` | `[x]` | Play/Stop inline on `JobRow` + `JobCard` |
| F-3110: QuickTimerCard on dashboard | `[x]` | `[x]` | `components/dashboard/quick-timer-card.tsx` |
| F-3111: Already-billed safety indicator | `[x]` | `[x]` | `billedToQuoteId`/`billedToInvoiceId` + warning badge in modal |
| F-3112: Status-based access control | `[x]` | `[x]` | Clock-in + manual entry blocked for done/invoiced/paid jobs. Add-to-document blocked for rejected/expired quotes and paid invoices. Enforced in server actions + UI (ClockPanel locked state, manual button hidden, job picker filtered, start button hidden in list/card). |
| F-3113: Enhanced `/time-tracking` page | `[x]` | `[x]` | **Phase 2 rebuild — 3-zone shell layout** (mirrors calendar). `TimeTrackingShell` (server layout component). `StatsSidebar` (200px desktop left — total/billable hrs, billable % bar, est. earnings, delta vs prev week, per-job horizontal bars). `TimerHero` (48px monospace elapsed clock when live, 00:00 idle state, Live badge + shadow-accent CTA, quick-start job chips). `WeekBars` (replaces DayStrip — 64px vertical bar chart per day, billable amber at base / non-billable gray above, billable/total header). `UnbilledPanel` (220px desktop right — unbilled billable entries past 30 days, est. kr per entry, total summary strip). New query: `getUnbilledEntries`. Removed: `timer-zone.tsx`, `day-strip.tsx`, `weekly-summary-bar.tsx`. |

**Success criteria:** Tradesperson can clock in on a job from their phone in 1 tap. Weekly view shows all logged hours. Billable hours convert to a quote line item with the correct rate. Free tier gate fires at 50 entries. No time entry or billing action is possible on closed jobs or ineligible documents.

---

## Phase 32 — E-conomic / Accounting Integration

**Goal:** Sync invoices, customers, and expenses to e-conomic — Denmark's dominant accounting platform. Without this, any tradesperson whose accountant uses e-conomic (the majority) faces a procurement blocker. This is a direct competitive gap vs Minuba and Apacta.

**Scope:** One-way sync only — Håndværk Pro → e-conomic. No bidirectional sync. We push; e-conomic stores. Accountant works in e-conomic; tradesperson works in Håndværk Pro.

**Architecture:**
```
Profile settings: "Connect e-conomic" button
  → E-conomic OAuth2 flow → user grants access
  → Store access + refresh tokens encrypted in users table
  → Sync triggers:
      - Invoice: when status changes to "paid" OR manual trigger
      - Customer: on create/update
      - Expense: on create
  → Sync status per record: synced / pending / error
  → Inngest handles retries on failure (3 attempts, exponential backoff)
```

**E-conomic API notes:** REST API at `https://restapi.e-conomic.com`. Requires "AppSecretToken" (per app) + "AgreementGrantToken" (per user). Both must be present in every request header. Refresh tokens do not expire — revocation only happens if user disconnects.

**Schema changes:** Run `npx drizzle-kit generate` after each addition.

```
users: +economicAccessToken TEXT, +economicRefreshToken TEXT, +economicConnectedAt TIMESTAMP
invoices: +economicId TEXT (their invoice number in e-conomic), +economicSyncedAt TIMESTAMP
customers: +economicId TEXT, +economicSyncedAt TIMESTAMP
expenses: +economicId TEXT, +economicSyncedAt TIMESTAMP
```

| Feature | BE | FE | Notes |
|---|---|---|---|
| F-3200: E-conomic OAuth connection flow | `[ ]` | `[ ]` | Profile settings; OAuth2 redirect + callback route |
| F-3201: Store + refresh OAuth tokens | `[ ]` | `N/A` | Encrypt tokens at rest; auto-refresh before expiry |
| F-3202: Sync invoices to e-conomic | `[ ]` | `[ ]` | Auto on "paid"; manual trigger button on invoice detail |
| F-3203: Sync customers to e-conomic | `[ ]` | `[ ]` | Auto on create/update; Inngest background |
| F-3204: Sync expenses to e-conomic | `[ ]` | `[ ]` | Auto on create; Inngest background |
| F-3205: Connection status in profile | `[ ]` | `[ ]` | Connected/disconnected indicator; disconnect button |
| F-3206: Sync status badges on list pages | `[ ]` | `[ ]` | Small "synced" / "error" indicator on invoice + customer rows |
| F-3207: Sync error handling + retry | `[ ]` | `N/A` | Inngest: 3 retries, exponential backoff; error stored on record |

**Success criteria:** User connects e-conomic in < 2 minutes via OAuth. Invoice appears in e-conomic within 30 seconds of marking paid. Sync errors shown clearly with retry option. Disconnecting removes all stored tokens immediately.

---

## Phase 33 — Email Template Manager

**Goal:** Let tradespeople fully customise every outbound email — subject, body, header image, and attachment behaviour — using `[[variable]]` placeholders that resolve to real DB values at send time. Currently all emails use hardcoded Resend templates. This adds per-user overrides with a clean fallback to defaults.

**Competitive context:** Ordrestyring.dk, Minuba, and Jobber all allow email template customisation. Branded, personalised emails increase customer trust and reduce "this looks spammy" drop-off.

**Architecture:**
```
New `email_templates` table (userId + emailType UNIQUE)
  → On any email send:
      getActiveEmailTemplate(userId, emailType)
        → null  → use existing hardcoded template (zero regression)
        → found → substituteVariables(template.subject/body, vars)
                → send via Resend with custom subject + HTML body

Variable substitution: pure string replace of [[key]] → resolved value.
No templating engine — just String.replaceAll per key.
Unresolved vars resolve to '' (never left as [[...]]).
```

**7 template types:**

| Key | Triggered by |
|---|---|
| `invoice_sent` | `sendInvoiceAction` |
| `invoice_reminder_1` | Inngest `invoice-reminder.ts` (reminder #1) |
| `invoice_reminder_2` | Inngest `invoice-reminder.ts` (reminder #2) |
| `invoice_paid` | `markInvoicePaidAction` |
| `quote_sent` | `sendQuoteAction` |
| `quote_accepted` | `acceptQuoteByTokenAction` |
| `quote_rejected` | `rejectQuoteByTokenAction` |

**Available variables — see `project-context/features/EMAIL_TEMPLATES.md` for full list.**

Universal: `[[company_name]]`, `[[customer_name]]`, `[[current_date]]`, `[[company_phone]]`, `[[company_address]]`, `[[customer_email]]`

Invoice: `[[invoice_number]]`, `[[invoice_amount]]`, `[[invoice_due_date]]`, `[[payment_details]]`, `[[mobilepay_number]]`

Quote: `[[quote_number]]`, `[[quote_amount]]`, `[[quote_valid_until]]`, `[[quote_link]]`, `[[job_description]]`

Review: `[[google_review_link]]` (invoice_paid only)

**Schema:**
```
email_templates: id (uuid pk), userId (text fk), emailType (text), subject (text),
                 body (text HTML), headerImageUrl (text nullable),
                 includeAttachment (bool default true), isActive (bool default true),
                 createdAt, updatedAt, deletedAt

UNIQUE (userId, emailType)
```
Run `npx drizzle-kit generate` after adding `lib/db/schema/email-templates.ts`.

**Key files to create:**
```
lib/db/schema/email-templates.ts
lib/db/queries/email-templates.ts          — getActiveEmailTemplate, getUserEmailTemplates
lib/actions/email-templates.ts             — upsert, delete, list, sendTestEmail
lib/email/substitute-variables.ts          — pure substituteVariables(str, vars): string
lib/email/resolve-template-vars.ts         — assembles vars Record<string,string> per email type
components/email-templates/template-list.tsx
components/email-templates/template-editor.tsx
app/[locale]/(app)/profile/email-templates/page.tsx
```

**Send-path wiring — 7 existing functions to update:**
- `lib/actions/invoices.ts`: `sendInvoiceAction` → `invoice_sent`
- `lib/inngest/invoice-reminder.ts`: reminder #1 → `invoice_reminder_1`, reminder #2 → `invoice_reminder_2`
- `lib/actions/invoices.ts`: `markInvoicePaidAction` → `invoice_paid`
- `lib/actions/quotes.ts`: `sendQuoteAction` → `quote_sent`
- `lib/actions/quotes.ts`: `acceptQuoteByTokenAction` → `quote_accepted`
- `lib/actions/quotes.ts`: `rejectQuoteByTokenAction` → `quote_rejected`

**UI — `/profile/email-templates`:**
- List of 7 type cards — "Customised" (primary badge) / "Using default" (muted)
- Per-card editor: subject input + contenteditable body with mini toolbar + variable picker sidebar (click to insert at cursor) + header image upload (Vercel Blob, same pattern as logo) + attachment toggle
- Preview tab: template rendered with static sample data substituted in
- "Send test email" button → sends preview to user's own inbox within 10s
- "Reset to default" → soft-deletes the custom template, falls back to hardcoded

**Tier gate:** Free — subject line editable only. Pro — full editor (body + header image + attachment toggle).

→ Detailed spec: `project-context/features/EMAIL_TEMPLATES.md`

**Success criteria:**
- Custom `invoice_sent` template with `[[customer_name]]` + `[[invoice_number]]` substitutes correctly in delivered email.
- Missing variables render as `''`, never as `[[variable_name]]`.
- Users with no custom template receive exactly the same email as today — zero regression.
- Test email arrives within 10 seconds.
- Header image appears at the top of the email HTML when uploaded.
- PDF attachment is included or excluded per the toggle.
- Variable picker inserts at cursor in the body editor.

---

## Phase 34 — Jobs Revamp

**Goal:** Bring the Jobs feature to competitive parity with Jobber, Ordrestyring, and Minuba. Six focused additions that solve real tradesperson pain without scope creep.

**Research baseline:** Jobber (job-specific property address, site inspection checklists), Ordrestyring (QA checklists per job type), Minuba (budget vs actual monitoring), Apacta (photo documentation folders), Simpro (estimated vs actual hours).

**Excluded by design:** GPS tracking (churn trigger for solo tradespeople), embedded maps (API billing), customer signature capture (post-MVP), barcode scanning.

→ FEATURES.md tracking: Phase 18 — Jobs Revamp (F-1800 through F-1805)

---

### Phase A — Job Site Location (F-1800) `[S: 2–3 hrs]`

**Pain:** A plumber with 3 jobs for the same housing company works at 3 different addresses — the current Maps link always points to the customer's billing address.

**Schema** (all nullable text, add to `jobs` table — batch with B + C):
```
locationAddress  text("location_address")
locationZip      text("location_zip")
locationCity     text("location_city")
```

**Files to change:**
- `lib/db/schema/jobs.ts` — add 3 columns
- `lib/actions/jobs.ts` — extend `jobSchema` with optional location fields
- `components/forms/job-form.tsx` — collapsible "Different site address?" toggle; hidden by default, reveals 3 inputs
- `app/[locale]/(dashboard)/jobs/[id]/page.tsx` — "Site location" card in right column; uses job address if set, falls back to customer address for Maps link
- `components/jobs/job-list.tsx` — `MapPin` icon on rows with a custom location
- `messages/en.json` + `messages/da.json`

**Success criteria:** Job with customer in Copenhagen, work site in Aarhus → Maps link navigates to Aarhus.

---

### Phase B — Priority (F-1801) `[S: 2–3 hrs]`

**Pain:** Tradespeople with 8+ active jobs need a fast triage signal on mobile — currently all jobs look identical in the list.

**Schema** (add to `jobs` table — batch with A + C):
```
priority  text("priority").default("normal")   -- low | normal | high | urgent
```

**Files to change:**
- `lib/db/schema/jobs.ts` — add `priority`
- `lib/actions/jobs.ts` — extend `jobSchema`
- `components/forms/job-form.tsx` — `<select>` between jobType and scheduledDate
- New `components/jobs/priority-badge.tsx` — colour-coded pill (urgent=red, high=amber, normal=blue, low=muted)
- `components/jobs/job-list.tsx` — badge on rows/cards; priority filter dropdown
- `app/[locale]/(dashboard)/jobs/[id]/page.tsx` — badge in job header
- `messages/en.json` + `messages/da.json`

**Success criteria:** New jobs default to `normal`. Priority filter on list shows only selected-priority jobs. Badge visible on detail header.

---

### Phase C — Estimated Hours (F-1802) `[S: 2–3 hrs]`

**Pain:** No way to compare planned scope vs actual time logged — tradespeople are flying blind on how jobs track to estimate.

**Schema** (add to `jobs` table — batch with A + B):
```
estimatedHours  numeric("estimated_hours", { precision: 6, scale: 2 })
```

**Files to change:**
- `lib/db/schema/jobs.ts` — add `estimatedHours`
- `lib/actions/jobs.ts` — `estimatedHours: z.string().optional()`
- `components/forms/job-form.tsx` — `type="number"` input, `step="0.5"`, before Notes
- `components/time-tracking/time-log-panel.tsx` — accept `estimatedHours` prop; render progress bar; red when over estimate

**Migration note:** Edit A + B + C in `jobs.ts` together, then run one `npx drizzle-kit generate`.

**Success criteria:** Progress bar at 37.5% when 3h logged against 8h estimated. Bar turns red when over. No bar shown when `estimatedHours` is null.

---

### Phase D — Job Site Checklists (F-1803) `[M: 5–7 hrs]`

**Pain:** No task-level progress tracking. Jobber and Ordrestyring both have site inspection forms/checklists. Ours is lightweight and mobile-first — ad-hoc tasks, no templates.

**Schema** (new `job_tasks` table — separate migration):
```
id           uuid pk defaultRandom()
jobId        uuid notNull FK → jobs.id
userId       uuid notNull FK → users.id
text         text notNull
isCompleted  boolean default false notNull
sortOrder    integer default 0 notNull
createdAt    timestamp defaultNow()
```
Hard delete (no soft delete).

**Files to create:**
- `lib/db/queries/job-tasks.ts`
- `lib/actions/job-tasks.ts` — `createJobTaskAction`, `updateJobTaskAction`, `deleteJobTaskAction`
- `components/jobs/job-checklist.tsx` — inline checklist on detail page, between Notes and Photos

**Files to change:**
- `lib/db/schema/jobs.ts` — add `jobTasks` table + exports
- `lib/db/schema/relations.ts` — `jobTasksRelations`; extend `jobsRelations` and `usersRelations`
- `lib/db/queries/jobs.ts` — `getJobById` with `tasks: true`
- `app/[locale]/(dashboard)/jobs/[id]/page.tsx` — render `<JobChecklist>`
- `messages/en.json` + `messages/da.json`

**Success criteria:** Add task → row in DB. Check off → strikethrough. Delete → hard-deleted. Tasks join via `getJobById` — no extra round-trip.

---

### Phase E — Photo Tagging (F-1804) `[S: 2–3 hrs]`

**Pain:** Photos are a flat unorganised grid. Apacta uses documentation folders; Minuba emphasises photo documentation quality.

**Schema** (alter `job_photos` — separate migration):
```
tag  text("tag")   -- nullable: 'before' | 'during' | 'after' | 'document'
```

**Files to change:**
- `lib/db/schema/jobs.ts` — add `tag` to `jobPhotos`
- `lib/actions/jobs.ts` — `addJobPhotoAction(jobId, fileUrl, caption?, tag?)`
- `lib/db/queries/jobs.ts` — pass `tag` through
- `components/jobs/photo-upload.tsx` — tag selector after file selection; filter chips on grid; tag badge on each tile

**Success criteria:** Upload with "Before" stores `tag = 'before'`. Filter chip "Before" shows only before-photos. Existing `null`-tag photos appear only under "All".

---

### Phase F — Job Tags / Categories (F-1805) `[M: 4–6 hrs]`

**Pain:** `jobType` (service/project/recurring) is too coarse. Tradespeople can't group by "electrical", "warranty", "repeat-client", etc.

**Schema** (add to `jobs` — separate migration):
```
tags  text("tags")   -- nullable, comma-separated: e.g. "electrical,warranty"
```

**Files to create:**
- `components/jobs/tag-input.tsx` — chip input; Enter or comma adds; `×` removes

**Files to change:**
- `lib/db/schema/jobs.ts` — add `tags`
- `lib/actions/jobs.ts` — `tags: z.string().optional()`; normalize empty → null
- `components/forms/job-form.tsx` — `<TagInput>` at bottom of form
- `components/jobs/job-list.tsx` — "Tags" filter dropdown; pill chips on rows
- `app/[locale]/(dashboard)/jobs/[id]/page.tsx` — pill chips in header
- `messages/en.json` + `messages/da.json`

**Success criteria:** Tags "electrical,warranty" saved as comma string. 2 pill chips on detail. Tag filter on list works. Empty tags → null in DB.

---

### Migration sequencing

| Phases | What to do |
|---|---|
| A + B + C | Edit `jobs.ts` for all three, run ONE `npx drizzle-kit generate` |
| D | Separate `npx drizzle-kit generate` (new table) |
| E | Separate `npx drizzle-kit generate` (alter `job_photos`) |
| F | Separate `npx drizzle-kit generate` (alter `jobs`) |

---

## Permanently Excluded Features

These will not be built regardless of timeline:

| Feature | Reason |
|---|---|
| Annual report generation | Accountant's legal responsibility — not software |
| GPS / location tracking | Solo tradespeople feel surveilled — churn trigger |
| Multi-currency | Denmark uses DKK |
| SKAT moms API filing | Requires SKAT developer access; wrong filing = legal liability |
| Payroll (løn) | Separate compliance layer (ATP, pension, holiday); Finanstilsynet |

---

## Development Principles (Always Apply)

1. **No half-wired features.** Every phase ships BE + FE together. DB schema, Server Action, and page/component complete in the same session.
2. **English everywhere.** Code, comments, seed data, string literals — never Danish. `da.json` is the only exception.
3. **Surgical changes.** Touch only what the phase requires. Don't "improve" adjacent code.
4. **Read the design system first.** Before any new component: `project-context/design/UI_DESIGN_SYSTEM.md`.
5. **Run migrations, never hand-edit them.** Always `npx drizzle-kit generate`. Never touch `_journal.json`.
6. **Auth from server only.** `auth()` from `@clerk/nextjs/server`. Never trust client-passed `userId`.
7. **Money via `formatDKK()`.** No inline number formatting.
8. **Rate limit everything.** `applyRateLimit` at the top of every Server Action.
9. **Soft delete everywhere.** `isNull(table.deletedAt)` on all list queries.
10. **Both i18n files.** Every new key in `en.json` (with value) and `da.json` (value `""`).

---

*Last updated: 2026-04-23 — F-3113 rebuilt: time-tracking page now uses 3-zone shell layout (StatsSidebar + TimerHero + WeekBars + UnbilledPanel, mirrors calendar). Phase 33 (Email Template Manager) specced and added to roadmap. Phase 31 extended: F-3112 (status-based access control) + F-3113 (enhanced time-tracking page) added and shipped. Phase 31 original complete: time tracking fully shipped. Phase 15 complete: AI follow-up drafts (Inngest cron, Groq, quote detail card, notification bell, dismiss + send actions). Phase 20 complete: flat-rate pricebook (schema, server actions, CRUD list, /pricebook page, sidebar nav, i18n, GDPR, "From pricebook" picker in QuoteForm + InvoiceForm). Phase 22 complete: job profitability card (invoiced vs quoted revenue, wired to job detail). Phase 2 complete. Phase 1: 11/15 bugs resolved, 4 remain open (KI-005, KI-009, KI-011, KI-012).*
