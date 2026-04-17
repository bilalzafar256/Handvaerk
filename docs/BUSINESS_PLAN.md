# Håndværk Pro — Business Plan & Project Overview
> Version 1.0 | For Claude Code & Development Reference

---

## 1. THE PROBLEM

A Danish electrician named Klaus gets up at 6am, drives a van, works with his hands all day, invoices from memory at 9pm on his phone while watching TV — and loses 3–4 hours a week to admin he hates.

He is NOT a typical SaaS buyer. He doesn't care about "workflow optimization." He cares about **getting paid faster and doing less paperwork**.

Generic accounting tools like Billy and Dinero give him an invoice form. They don't understand how he works. They start at step 4 of his process. His day actually looks like:

```
Get job → Visit site → Quote verbally → Do work → Try to remember what parts he used → Invoice (maybe) → Chase payment
```

No Danish-localized, trade-specific job management tool exists for this person. Global tools (Tradify, ServiceM8) are not localized for Danish tax, Danish language, or Danish payment methods. Enterprise tools (IT-Effect / Business Central) cost 10x too much and target 20-person firms.

**The gap:** A Danish-language, Danish-tax-aware job management tool for solo and small (1–5 person) trade businesses.

---

## 2. THE PRODUCT

**Håndværk Pro** is a mobile-first web application for Danish tradespeople (håndværkere) — primarily electricians (elektrikere), plumbers (VVS), carpenters (tømrere), painters (malere), and general contractors.

It covers the full job lifecycle:

```
Customer → Quote → Job → Invoice → Payment
```

One tool. No switching between Billy, a Notes app, WhatsApp, and memory.

**Primary target user:**
- Solo operator or 1–4 person team
- Annual revenue: 300,000 – 2,000,000 DKK
- Trades: El, VVS, Tømrer, Maler, Murer
- Tech comfort: medium — uses iPhone daily, comfortable with apps but not with "software"

---

## 3. BUSINESS MODEL

### Subscription Tiers

| Tier | Price/mo | Users | Jobs | Target |
|---|---|---|---|---|
| **Gratis** | 0 DKK | 1 | 3 active | Validation + hook |
| **Solo** | 149 DKK | 1 | Unlimited | 1-person operation |
| **Hold** | 299 DKK | Up to 5 | Unlimited | Small team |

> **Current development scope:** Free tier only. All tier infrastructure and gating logic built from day one, but Solo and Hold features not unlocked until Phase 11.

### Payment Method
All subscription billing via **MobilePay** (Denmark's dominant payment platform).
- MobilePay Erhverv for business subscriptions
- Implementation deferred — infrastructure and references added to code from Phase 5 onward
- No Stripe, no card-only flows in the Danish market MVP

### Unit Economics

| Metric | Target |
|---|---|
| CAC (Customer Acquisition Cost) | < 500 DKK |
| Average subscription (blended) | ~180 DKK/mo |
| LTV (24-month avg) | ~4,320 DKK |
| LTV:CAC ratio | > 8x |
| Churn target | < 5%/mo |

### Path to 100,000 DKK/mo MRR

```
Scenario A (Solo-heavy):   ~670 Solo users × 149 DKK = 99,830 DKK ✅
Scenario B (Mixed):        400 Solo + 130 Hold       = 98,470 DKK ✅
Scenario C (Fast growth):  Mix reached in 14–18 months post-launch
```

Break-even on infrastructure (≈1,500 DKK/mo): **11 paying users.**

---

## 4. TECH STACK

> Quick-reference table in `CONTEXT.md`. Full rationale below.

### Core Decision: Web-first PWA, Mobile-ready architecture

**Scale target:** 100–2,000 users. Every tool chosen must stay cheap at 100 users and not require a rewrite at 2,000.

### Full Stack

| Layer | Tool | Reason |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Full-stack, Vercel-native, RSC for performance |
| **Hosting** | Vercel Pro | Edge network, DK region, zero-config deploy |
| **Database** | Neon (serverless PostgreSQL) | Serverless, scales to 0, generous free tier, DK-friendly pricing |
| **ORM** | Drizzle ORM | Type-safe, SQL-first, pairs perfectly with Neon |
| **Auth** | Clerk | EU data residency, phone OTP + email OTP, GDPR-ready |
| **Cache / Rate Limit** | Upstash Redis | Serverless Redis, Vercel integration, free tier generous |
| **Background Jobs** | Inngest | Event-driven, serverless functions, invoice reminders |
| **Email** | Resend | 3,000 free/mo, cheap thereafter, beautiful HTML emails |
| **SMS** | GatewayAPI | Danish provider, best DK delivery, pay-per-SMS |
| **Animation** | Motion (Framer Motion v11) | Best-in-class, React-native, performant |
| **UI Components** | shadcn/ui + Aceternity UI | shadcn as base, Aceternity for premium components |
| **Styling** | Tailwind CSS v4 | Utility-first, consistent design system |
| **State Management** | Zustand | Lightweight, no boilerplate, mobile-friendly |
| **Forms** | React Hook Form + Zod | Type-safe validation, excellent mobile UX |
| **i18n** | next-intl | Next.js native, English now, Danish-ready from day one |
| **PDF Generation** | @react-pdf/renderer | React components → professional PDF invoices |
| **Monitoring** | Sentry | Error tracking, free tier covers MVP |
| **Analytics** | Vercel Analytics + PostHog | Privacy-first, no cookie banners needed |
| **Payments (future)** | MobilePay Erhverv | Danish market standard — deferred, not built in MVP |

### Why Neon over Supabase
Supabase has its own ORM/SDK which conflicts with Drizzle usage patterns. Neon is pure PostgreSQL with no SDK lock-in — pair it cleanly with Drizzle. At 1,000 users, Neon Pro is ~$20–50/mo. Supabase Pro is $25/mo but charges for compute regardless of traffic.

### Why Clerk over Auth.js
Requirement: phone number + email, both with OTP verification. Clerk supports this natively with zero custom code. EU data residency option. GDPR-compliant. Auth.js requires building custom OTP flows.

### Infrastructure Cost at Different Scales

| Users | Est. Monthly Cost |
|---|---|
| 0–50 (development) | ~$0 (all free tiers) |
| 50–200 | ~$45 (Vercel Pro + Neon Launch) |
| 200–1,000 | ~$120 (Vercel Pro + Neon Scale + Upstash) |
| 1,000–2,000 | ~$250 (upgrade tiers, not rewrite) |

---

## 5. PROJECT STRUCTURE

> Top-level overview in `CONTEXT.md`. Full file-level structure below.

```
haandvaerk-pro/
│
├── app/                              // Next.js 15 App Router
│   ├── (auth)/                       // Auth route group (no dashboard shell)
│   │   ├── sign-in/
│   │   │   └── page.tsx              // Clerk SignIn component
│   │   └── sign-up/
│   │       └── page.tsx              // Clerk SignUp component
│   │
│   ├── (dashboard)/                  // Protected route group
│   │   ├── layout.tsx                // Dashboard shell + nav
│   │   ├── page.tsx                  // Redirect → /overview
│   │   ├── overview/
│   │   │   └── page.tsx              // Main dashboard (Overblik)
│   │   ├── jobs/
│   │   │   ├── page.tsx              // Jobs list
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          // Single job detail
│   │   │   └── new/
│   │   │       └── page.tsx          // Create job form
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── quotes/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── expenses/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx              // Reporting dashboard (Phase 5+)
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/                          // API route handlers
│   │   ├── webhooks/
│   │   │   └── clerk/route.ts        // Clerk user sync webhook
│   │   ├── jobs/route.ts
│   │   ├── customers/route.ts
│   │   ├── quotes/route.ts
│   │   ├── invoices/route.ts
│   │   └── inngest/route.ts          // Inngest background jobs handler
│   │
│   ├── layout.tsx                    // Root layout (Clerk provider, fonts)
│   ├── globals.css                   // Tailwind + CSS variables
│   └── page.tsx                      // Landing page / marketing
│
├── components/
│   ├── ui/                           // shadcn/ui base components (auto-generated)
│   ├── aceternity/                   // Aceternity UI components
│   ├── forms/                        // Form components per feature
│   │   ├── job-form.tsx
│   │   ├── quote-form.tsx
│   │   ├── invoice-form.tsx
│   │   └── customer-form.tsx
│   ├── dashboard/                    // Dashboard-specific components
│   │   ├── stats-card.tsx
│   │   ├── job-status-badge.tsx
│   │   └── revenue-summary.tsx
│   ├── pdf/                          // PDF templates
│   │   ├── invoice-pdf.tsx
│   │   └── quote-pdf.tsx
│   └── shared/                       // Reusable across features
│       ├── page-header.tsx
│       ├── empty-state.tsx
│       ├── loading-skeleton.tsx
│       └── tier-gate.tsx             // Component that gates features by plan
│
├── lib/
│   ├── db/
│   │   ├── schema/                   // Drizzle schema files (one per domain)
│   │   │   ├── users.ts
│   │   │   ├── customers.ts
│   │   │   ├── jobs.ts
│   │   │   ├── quotes.ts
│   │   │   ├── invoices.ts
│   │   │   ├── expenses.ts
│   │   │   ├── materials.ts
│   │   │   └── index.ts              // Re-exports all schemas
│   │   ├── queries/                  // Typed query functions
│   │   │   ├── jobs.ts
│   │   │   ├── invoices.ts
│   │   │   └── customers.ts
│   │   └── index.ts                  // Neon + Drizzle client
│   ├── auth/
│   │   └── index.ts                  // Clerk helpers + middleware utils
│   ├── email/
│   │   ├── templates/                // Resend email templates (React)
│   │   │   ├── invoice-email.tsx
│   │   │   └── reminder-email.tsx
│   │   └── index.ts                  // Resend client + send functions
│   ├── sms/
│   │   └── index.ts                  // GatewayAPI client (stubbed in MVP)
│   ├── inngest/
│   │   ├── client.ts                 // Inngest client instance
│   │   └── functions/
│   │       ├── invoice-reminder.ts   // Auto-reminder after due date
│   │       └── user-sync.ts          // Sync Clerk user → DB
│   ├── upstash/
│   │   └── index.ts                  // Redis client for rate limiting + caching
│   ├── mobilepay/
│   │   └── index.ts                  // MobilePay stub — not implemented, referenced only
│   └── utils/
│       ├── currency.ts               // Danish number formatting (1.234,56 kr)
│       ├── dates.ts                  // date-fns with da locale
│       ├── vat.ts                    // 25% moms calculation helpers
│       └── tier.ts                   // Plan tier checking logic
│
├── hooks/
│   ├── use-jobs.ts
│   ├── use-customers.ts
│   └── use-tier.ts                   // Current user plan hook
│
├── stores/                           // Zustand global stores
│   ├── ui-store.ts                   // UI state (modals, sidebars)
│   └── job-store.ts                  // Optimistic job updates
│
├── messages/                         // next-intl translations
│   ├── en.json                       // English (active)
│   └── da.json                       // Danish (placeholder, all keys present, empty values)
│
├── middleware.ts                     // Clerk auth + i18n middleware
│
├── drizzle/
│   └── migrations/                   // Auto-generated migration files
│
├── docs/
│   ├── BUSINESS_PLAN.md              // ← You are here
│   ├── CONTEXT.md                    // Docs map, skills map, phase checklist
│   ├── FEATURES.md
│   ├── REPORTING.md
│   ├── GDPR.md
│   ├── CLAUDE_CODE_SKILLS.md
│   ├── MOBILE_DESIGN.md
│   └── skills/
│       ├── NEXTJS_SKILL.md
│       ├── DRIZZLE_SKILL.md
│       ├── CLERK_SKILL.md
│       ├── UPSTASH_SKILL.md
│       ├── INNGEST_SKILL.md
│       └── SHADCN_SKILL.md
│
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── middleware.ts
├── .env.local
├── .env.example
└── package.json
```

---

## 6. PRODUCT PHASES

### Phase 0 — Foundation & Infrastructure
**Goal:** Zero-to-deployed. Full tech stack running, auth working, i18n wired, DB connected, animations available. Ready to write product features.

**Deliverables:**
- Next.js 15 project initialized with App Router
- Vercel project created, `main` branch auto-deploys
- Neon database provisioned (EU region — Frankfurt)
- Drizzle ORM connected + first migration run
- Clerk configured: phone OTP + email OTP only (no social login)
- Clerk webhook → syncs user to `users` table in DB
- Upstash Redis connected (rate limiting on API routes)
- Inngest connected + test function deployed
- next-intl configured: `en.json` active, `da.json` stubbed with all keys
- Motion (Framer Motion v11) installed + test animation working
- shadcn/ui initialized with theme variables
- Aceternity UI: selected components copied in
- Tailwind CSS v4 configured with design tokens
- Zustand store: basic UI store working
- React Hook Form + Zod: test form with validation
- Sentry connected (error tracking in prod)
- Vercel Analytics enabled
- PostHog connected (free tier)
- `tier-gate.tsx` component: renders children only if user has required plan
- All env variables documented in `.env.example`
- `da.json` has every i18n key as placeholder (empty string values)
- Resend account connected, test email sends

**All libraries to install in Phase 0:**
```bash
# Framework
next@15 react@19 react-dom@19 typescript

# Database
@neondatabase/serverless drizzle-orm drizzle-kit pg

# Auth
@clerk/nextjs

# Cache
@upstash/redis @upstash/ratelimit

# Background jobs
inngest

# Email
resend react-email @react-email/components

# SMS (stub, not used yet)
# gatewayapi (added Phase 4+)

# i18n
next-intl

# Animation
motion

# UI
tailwindcss @tailwindcss/forms
# shadcn/ui via CLI: npx shadcn@latest init
# Aceternity via copy-paste from ui.aceternity.com

# State
zustand

# Forms
react-hook-form zod @hookform/resolvers

# PDF
@react-pdf/renderer

# Utilities
date-fns clsx tailwind-merge lucide-react

# Monitoring
@sentry/nextjs

# Analytics
@vercel/analytics @vercel/speed-insights
posthog-js posthog-node
```

---

### Phase 1 — Authentication & User Profile
**Goal:** A user can sign up, verify by phone or email OTP, complete their company profile, and be correctly identified in the DB.

**Deliverables:**
- Sign-up flow: phone OTP OR email OTP (Clerk)
- Sign-in flow: same methods
- Clerk webhook handler: creates `users` row on first sign-up
- Company profile form: company name, CVR number, address, default hourly rate, logo upload (Supabase Storage → Neon file ref)
- Tier assigned: `free` by default
- Profile completion check: if incomplete, redirect to profile setup
- All auth strings in `en.json` (i18n from day one)

---

### Phase 2 — Customer Management
**Goal:** A user can create, view, edit, and delete customers. Foundation for jobs and invoices.

**Deliverables:**
- Customer DB schema: `id, user_id, name, phone, email, address, cvr (business), notes, created_at`
- Customer list page: search + filter
- Customer detail page: full info + linked jobs/invoices (empty for now)
- Create/edit customer form
- Free tier gate: unlimited customers (no cap on customers on any tier)
- i18n: all labels in `en.json`

---

### Phase 3 — Job Management
**Goal:** Full job lifecycle management. A user can create a job, track its status, add notes and photos, and mark it complete.

**Deliverables:**
- Job DB schema (see FEATURES.md for full schema)
- Job status flow: `new → scheduled → in_progress → done → invoiced → paid`
- Create job form: customer picker, description (with voice input button), scheduled date
- Job detail page: status changer, notes, photo upload
- Photo upload: stored in Neon file reference (actual file in Vercel Blob or similar)
- Free tier gate: max 3 active jobs (status not `paid`)
- Tier gate component shown prominently when limit reached, prompts upgrade

---

### Phase 4 — Quote Builder
**Goal:** A user can create a professional quote, send it to a customer as a PDF, and convert it to a job with one tap.

**Deliverables:**
- Quote DB schema (see FEATURES.md)
- Quote line items: labour hours × rate, materials (name + qty + unit price + markup%), fixed-price lines, travel fee
- VAT (25% moms) auto-calculated on all items
- Quote PDF generation via `@react-pdf/renderer` — professional branded output
- Send via email (Resend) with PDF attachment
- Shareable link: customer can accept/reject in browser
- On acceptance: quote status → `accepted`, job auto-created
- Saved templates: user can save a quote as a reusable template
- Materials saved to user's personal materials list (autocomplete next time)

---

### Phase 5 — Invoice Engine
**Goal:** One-tap invoice generation from a completed job. Send, track, remind.

**Deliverables:**
- Invoice DB schema — **NemHandel/PEPPOL fields included at schema level** (EAN number on customer, OIOUBL format fields stored, not yet exposed in UI)
- Invoice number: sequential, per-user, legally required
- Pre-fill from quote line items (editable before sending)
- Danish moms layout: subtotal ex. moms + moms amount + total incl. moms
- Invoice PDF: branded, correct Danish legal format
- Send via email (Resend): PDF attachment + HTML email with summary
- Payment info on invoice: bank account OR MobilePay reference (static, not a payment link yet)
- MobilePay Erhverv: **referenced in invoice model and UI as future payment link field** — stubbed, not functional
- Status tracking: `draft → sent → viewed → paid → overdue`
- Inngest function: reminder email at +8 days if unpaid, second at +15 days
- Credit note generation (Kreditnota): one-click from any sent invoice

---

### Phase 6 — Quote & Invoice Enhancements ✅
**Goal:** Polish the core quote/invoice flow with quality-of-life improvements.

**Deliverables:**
- Default `valid_until` = today + 15 days on new quotes; default `due_date` = today + 15 on invoices
- Per-line-item discounts (% or fixed) — new columns on `quote_items` and `invoice_items`; migration 0005 applied
- Discount carry-over when converting quote → invoice
- Duplicate invoice guard — modal: "View existing" or "Create new anyway"
- Compact sticky action bar + ⋯ overflow menu on quote/invoice detail pages
- Row-level ⋯ menus on quotes and invoices list pages
- Landing page hero gradient fix

---

### Phase 7 — Bank Details & Profile Enhancements
**Goal:** Real payment information on invoices.

**Deliverables:**
- `bank_accounts` table: `bank_name`, `reg_number`, `account_number`, `is_default`, per user
- Profile UI: add/edit/delete bank accounts; star to set default
- Profile UI: MobilePay business number management
- Auto-fill default bank + MobilePay details when creating a new invoice
- Bank details + MobilePay section on invoice PDF

---

### Phase 8 — Merge Documents
**Goal:** Combine multiple quotes or invoices for the same customer.

**Deliverables:**
- Merge two or more quotes → single consolidated quote
- Merge two or more invoices → single consolidated invoice
- Merge conflict detection and resolution UX

---

### Phase 9 — Email Notifications & Customer Communication
**Goal:** Automated customer-facing emails for key events.

**Deliverables:**
- Quote accepted/rejected notification email to business owner
- Invoice paid thank-you email to customer + Google review request
- `google_review_url` field on user profile

---

### Phase 10 — AI Features
**Goal:** Intelligent automation to save time and reduce errors. Full spec in `docs/AI_FEATURES.md`.

**Deliverables:**
- Business card OCR → auto-create customer
- Smart quote suggestions based on job history
- Payment risk scoring on invoices
- Voice-to-quote via speech input

---

### Phase 11 — Dashboard, Free Tier Launch & Tier Gates
**Goal:** Working dashboard. Free tier live. All tier gates enforced. Ready for real users.

**Deliverables:**
- Dashboard (Overblik): outstanding amount, active jobs count, overdue invoices count, this month's billed total
- All Free tier limits enforced (10 active jobs)
- Solo + Hold tier plans defined in DB and code — not yet purchasable, but all gating logic works
- MobilePay subscription payment: **referenced, not built** — UI shows "coming soon" on upgrade flow
- `tier-gate.tsx` shown on all capped features
- Reporting foundation: all DB queries that power reporting are written (see REPORTING.md)
- Beta launch: 20 users from network
- Sentry, PostHog, Vercel Analytics all collecting data

---

### Phase 12 — Compliance Pre-GoLive
**Goal:** Everything required before a public commercial launch.

**Deliverables:**
- **SKAT Moms Integration:** Quarterly moms (VAT) summary page — not API-connected yet, but structured export. Must be completed before public go-live.
- **NemHandel/PEPPOL UI:** EAN number field exposed on customer form. OIOUBL invoice format generation available as export. Enables invoicing to public sector clients (municipalities, schools).
- **GDPR Tooling:** User data export (JSON), user data deletion (soft delete → hard delete after 30 days), privacy policy page, cookie consent. Full spec in `GDPR.md`.
- **Terms of Service + Privacy Policy pages** (static, legal text)
- Security audit: rate limiting on all API routes (Upstash), input validation (Zod on all endpoints), SQL injection impossible (Drizzle parameterized queries)

---

## 7. REGULATORY ROADMAP

> These are not MVP features. They are known future obligations. Database schemas are designed from Phase 5 onward to accommodate them without breaking changes.

### SKAT Moms (VAT Filing API)
Direct integration with SKAT TastSelv API for quarterly moms reporting. One-click VAT submission from the app. **This is the single biggest retention driver** — if Klaus files moms in 2 clicks, he never leaves. Must be completed before broad public launch (Phase 12 minimum viable compliance, full integration later).

### NemHandel / PEPPOL (E-Invoicing)
Denmark's public e-invoicing infrastructure. Required for invoicing municipalities, schools, hospitals, and all public-sector clients. Many håndværkere do public work. EAN number field and OIOUBL invoice format are baked into the invoice schema from Phase 5, UI exposed in Phase 12.

### Bogføringsloven (Danish Bookkeeping Act)
From 2026, sole proprietorships with turnover > 300,000 DKK must use an approved digital bookkeeping system. Requirements: digital receipt storage (5-year retention), audit trail on all transactions, secure backup. Our Neon DB with full `created_at/updated_at/deleted_at` audit columns and Vercel Blob receipt storage satisfies this architecturally. Certification application is a business/legal process (not code).

---

## 8. THE ONE THING

> *This is the remark that governs every product decision.*

A Danish electrician named Klaus gets up at 6am. He drives a van all day. He works with his hands. He is good at his job. But he feels like a hustler, not a professional — because his paperwork is a mess, his invoicing is late, and he doesn't really know if he made money this month.

**The moment Klaus sends his first invoice from Håndværk Pro — with his own logo, his company name, clean moms breakdown, formatted perfectly — and it takes him 45 seconds — he feels like a professional.**

Not a guy with an app. A business owner who has his shit together.

That feeling — **pride, confidence, control** — is what we are selling.

Every feature, every UI decision, every line of copy runs through one question: *Does this make Klaus feel more like a professional, or less?*

Price, integrations, APIs: all secondary. Build for that feeling first.