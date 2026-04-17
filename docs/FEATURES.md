# Håndværk Pro — Feature Specification & Tracking
> All features, statuses, and detailed specs. Update status as development progresses.

---

## DEVELOPMENT CONVENTIONS

> **Full-stack per feature:** Every feature in progress must ship frontend (page, component, form) AND backend (schema, query, Server Action) together. Never mark a feature `[x]` with only one side done.

---

## STATUS KEY
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[-]` Deferred / Future phase
- `[!]` Blocked
- `N/A` Not applicable to this side

> **BE** = Backend (schema, server action, API, config, env)
> **FE** = Frontend (page, component, form, style, animation)

---

## PHASE 0 — Foundation

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-000 | Next.js 15 project init | `[x]` | `[x]` | App Router, TypeScript strict |
| F-001 | Vercel deployment pipeline | `[ ]` | `[ ]` | main → prod, feature branches → preview |
| F-002 | Neon DB provisioned (EU Frankfurt) | `[x]` | `N/A` | |
| F-003 | Drizzle ORM connected + first migration | `[x]` | `N/A` | `0000_dapper_exodus.sql` applied |
| F-004 | Clerk auth configured | `[x]` | `[x]` | Middleware, layout, sign-in/sign-up pages |
| F-005 | Upstash Redis connected | `[x]` | `N/A` | rateLimiter + strictRateLimiter exported |
| F-006 | Inngest connected | `[x]` | `N/A` | Client + test function + route handler |
| F-007 | next-intl configured | `[x]` | `[x]` | routing, request, navigation, en+da |
| F-008 | Motion (Framer Motion v11) | `N/A` | `[x]` | Installed, used in Phase 1+ |
| F-009 | shadcn/ui initialized | `N/A` | `[x]` | components.json, button/form/card/etc. |
| F-010 | Aceternity UI components | `N/A` | `[ ]` | Copy when needed in Phase 1+ |
| F-011 | Tailwind CSS v4 + design system | `N/A` | `[x]` | CSS vars, dark mode, design tokens |
| F-012 | Zustand UI store | `N/A` | `[x]` | Modal, sidebar state in stores/ui-store.ts |
| F-013 | React Hook Form + Zod setup | `N/A` | `[x]` | form.tsx base component, resolvers installed |
| F-014 | Sentry error tracking | `[ ]` | `[ ]` | Install `@sentry/nextjs` when DSN is ready |
| F-015 | Vercel Analytics + PostHog | `[x]` | `[x]` | Analytics + PostHogProvider wired in layout |
| F-016 | Resend email connected | `[x]` | `N/A` | lib/email/client.ts ready |
| F-017 | .env.example documented | `[x]` | `[x]` | All keys documented |
| F-018 | Tier gate component | `[x]` | `[x]` | components/shared/tier-gate.tsx |
| F-019 | da.json placeholder | `N/A` | `[x]` | All current i18n keys present, values "" |

---

## PHASE 1 — Authentication & User Profile

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-100 | Sign-up: phone OTP | `[ ]` | `[ ]` | Clerk |
| F-101 | Sign-up: email OTP | `[ ]` | `[ ]` | Clerk |
| F-102 | Sign-in: phone OTP | `[ ]` | `[ ]` | |
| F-103 | Sign-in: email OTP | `[ ]` | `[ ]` | |
| F-104 | Clerk webhook → users table sync | `[x]` | `N/A` | On first sign-up |
| F-105 | Company profile form | `[x]` | `[x]` | Name, CVR, address, hourly rate |
| F-106 | Logo upload | `[x]` | `[x]` | Vercel Blob → file ref in DB |
| F-107 | Profile completion gate | `[x]` | `[x]` | Redirect if incomplete |
| F-108 | Default tier: free | `[x]` | `N/A` | Set on user creation |
| F-109 | Session management | `[x]` | `[x]` | Clerk handles, test refresh |

### DB Schema: users
```sql
users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id        text UNIQUE NOT NULL,         -- Clerk's user ID
  email           text,
  phone           text,
  company_name    text,
  cvr_number      text,
  address_line1   text,
  address_city    text,
  address_zip     text,
  hourly_rate     numeric(10,2),
  logo_url        text,
  tier            text DEFAULT 'free',          -- 'free' | 'solo' | 'hold'
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

---

## PHASE 2 — Customer Management

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-200 | Customer DB schema | `[x]` | `N/A` | See below |
| F-201 | Customer list page | `[x]` | `[x]` | Search + filter |
| F-202 | Customer detail page | `[x]` | `[x]` | Info + linked records |
| F-203 | Create customer form | `[x]` | `[x]` | Validation via Zod |
| F-204 | Edit customer form | `[x]` | `[x]` | |
| F-205 | Delete customer (soft) | `[x]` | `[x]` | `deleted_at` timestamp |
| F-206 | Quick-dial from app | `N/A` | `[x]` | `tel:` link on phone number |
| F-207 | "Owes money" badge | `[x]` | `[~]` | Still stubbed at 0 — wire to real invoice totals (Phase 5 complete, badge not yet updated) |
| F-208 | CVR number field | `[x]` | `[x]` | For business customers / EAN future |
| F-209 | Notes field per customer | `[x]` | `[x]` | Internal notes |

### DB Schema: customers
```sql
customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  name            text NOT NULL,
  phone           text,
  email           text,
  address_line1   text,
  address_city    text,
  address_zip     text,
  cvr_number      text,                         -- business customers
  ean_number      text,                         -- NemHandel/PEPPOL (Phase 7)
  notes           text,
  is_favorite     boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz                   -- soft delete
)
```

---

## PHASE 3 — Job Management

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-300 | Job DB schema | `[x]` | `N/A` | See below |
| F-301 | Create job form | `[x]` | `[x]` | Customer picker, description, date |
| F-302 | Voice input for description | `N/A` | `[x]` | Web Speech API (da-DK) |
| F-303 | Job detail page | `[x]` | `[x]` | Full info, status changer |
| F-304 | Status change | `[x]` | `[x]` | new→scheduled→in_progress→done→invoiced→paid |
| F-305 | Job notes | `[x]` | `[x]` | Internal, not shown to customer |
| F-306 | Photo upload per job | `[x]` | `[x]` | Before/after, stored in Vercel Blob |
| F-307 | Free tier gate: 10 active jobs | `[x]` | `[x]` | Status not 'paid' or 'invoiced' |
| F-308 | Edit job | `[x]` | `[x]` | |
| F-309 | Delete job (soft) | `[x]` | `[x]` | |
| F-310 | Job type field | `[x]` | `[x]` | service / project / recurring |

### DB Schema: jobs
```sql
jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  customer_id     uuid NOT NULL REFERENCES customers(id),
  job_number      text NOT NULL,                -- Auto-generated: #1042 Should be starting as JOB-0001 for every new customer means each customer should have a seperate starting point for job number.
  title           text NOT NULL,
  description     text,
  job_type        text DEFAULT 'service',       -- 'service' | 'project' | 'recurring'
  status          text DEFAULT 'new',           -- see flow above
  scheduled_date  date,
  completed_date  date,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
)

job_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid NOT NULL REFERENCES jobs(id),
  file_url        text NOT NULL,
  caption         text,
  created_at      timestamptz DEFAULT now()
)
```

---

## PHASE 4 — Quote Builder

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-400 | Quote DB schema | `[x]` | `N/A` | See below |
| F-401 | Quote line items: labour | `[x]` | `[x]` | hours × rate |
| F-402 | Quote line items: materials | `[x]` | `[x]` | qty × unit price × markup% |
| F-403 | Quote line items: fixed price | `[x]` | `[x]` | Flat fee for a task |
| F-404 | Quote line items: travel fee | `[x]` | `[x]` | Optional toggle |
| F-405 | VAT (25% moms) auto-calc | `[x]` | `[x]` | On all items |
| F-406 | Customer discount field | `[x]` | `[x]` | % or fixed amount |
| F-407 | Validity date field | `[x]` | `[x]` | "Valid for 14 days" |
| F-408 | Quote PDF generation | `[x]` | `[x]` | @react-pdf/renderer |
| F-409 | Send quote by email | `[x]` | `[x]` | Resend + PDF attachment |
| F-410 | Shareable quote link | `[x]` | `[x]` | Customer accepts in browser |
| F-411 | Customer accept/reject | `[x]` | `[x]` | Status update + job auto-created |
| F-412 | Save as template | `[x]` | `[x]` | Reusable quote templates |
| F-413 | Materials autocomplete | `[x]` | `[x]` | From user's saved materials list |
| F-414 | Quote status flow | `[x]` | `[x]` | draft→sent→accepted→rejected→expired |

### DB Schema: quotes + quote_items
```sql
quotes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  job_id          uuid REFERENCES jobs(id),
  customer_id     uuid NOT NULL REFERENCES customers(id),
  quote_number    text NOT NULL,
  status          text DEFAULT 'draft',
  valid_until     date,
  discount_type   text,                         -- 'percent' | 'fixed'
  discount_value  numeric(10,2),
  notes           text,                         -- shown to customer
  internal_notes  text,
  accepted_at     timestamptz,
  rejected_at     timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)

quote_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id        uuid NOT NULL REFERENCES quotes(id),
  item_type       text NOT NULL,                -- 'labour' | 'material' | 'fixed' | 'travel'
  description     text NOT NULL,
  quantity        numeric(10,2),
  unit_price      numeric(10,2),
  markup_percent  numeric(5,2),
  vat_rate        numeric(5,2) DEFAULT 25.00,
  sort_order      int DEFAULT 0,
  created_at      timestamptz DEFAULT now()
)

quote_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  name            text NOT NULL,
  items           jsonb,                        -- snapshot of line items
  created_at      timestamptz DEFAULT now()
)

materials_catalog (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  name            text NOT NULL,
  default_unit    text,
  default_price   numeric(10,2),
  default_markup  numeric(5,2),
  created_at      timestamptz DEFAULT now()
)
```

---

## PHASE 5 — Invoice Engine

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-500 | Invoice DB schema | `[x]` | `N/A` | NemHandel fields included |
| F-501 | One-tap: job → invoice | `[x]` | `[x]` | Pre-filled from quote |
| F-502 | Invoice number (sequential) | `[x]` | `N/A` | Per user, legally required |
| F-503 | Moms layout (legal DK format) | `[x]` | `[x]` | ex.moms + moms + incl.moms |
| F-504 | Invoice PDF (branded) | `[x]` | `[x]` | @react-pdf/renderer |
| F-505 | Send by email (Resend) | `[x]` | `[x]` | PDF + HTML email |
| F-506 | Payment info on invoice | `[x]` | `[x]` | Bank account OR MobilePay ref (static) |
| F-507 | MobilePay payment link field | `[x]` | `[x]` | Stubbed — shows "coming soon" |
| F-508 | Invoice status tracking | `[x]` | `[x]` | draft→sent→viewed→paid→overdue |
| F-509 | Inngest: reminder email +8 days | `[x]` | `N/A` | If unpaid |
| F-510 | Inngest: reminder email +15 days | `[x]` | `N/A` | Second reminder |
| F-511 | Credit note (Kreditnota) | `[x]` | `[x]` | One-click from sent invoice |
| F-512 | Mark as paid (manual) | `[x]` | `[x]` | User confirms payment received |
| F-513 | Overdue flag | `[x]` | `[x]` | Auto-set after due date passes |

### DB Schema: invoices + invoice_items
```sql
invoices (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id),
  job_id              uuid REFERENCES jobs(id),
  customer_id         uuid NOT NULL REFERENCES customers(id),
  quote_id            uuid REFERENCES quotes(id),
  invoice_number      text NOT NULL,
  status              text DEFAULT 'draft',
  issue_date          date NOT NULL DEFAULT CURRENT_DATE,
  due_date            date NOT NULL,
  payment_terms_days  int DEFAULT 14,

  -- Financial
  subtotal_ex_vat     numeric(12,2),
  vat_amount          numeric(12,2),
  total_incl_vat      numeric(12,2),
  discount_amount     numeric(12,2) DEFAULT 0,

  -- Payment info
  bank_account        text,
  mobilepay_number    text,                     -- static reference, not a payment link
  mobilepay_link      text,                     -- future: MobilePay Erhverv payment link

  -- NemHandel / PEPPOL fields (Phase 7 UI, but stored from Phase 5)
  ean_number          text,                     -- from customer.ean_number
  oioubl_format       boolean DEFAULT false,    -- flag for PEPPOL export
  peppol_id           text,

  -- Meta
  notes               text,
  paid_at             timestamptz,
  sent_at             timestamptz,
  viewed_at           timestamptz,
  reminder_1_sent_at  timestamptz,
  reminder_2_sent_at  timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  deleted_at          timestamptz
)

invoice_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid NOT NULL REFERENCES invoices(id),
  item_type       text NOT NULL,
  description     text NOT NULL,
  quantity        numeric(10,2),
  unit_price      numeric(10,2),
  vat_rate        numeric(5,2) DEFAULT 25.00,
  line_total      numeric(12,2),
  sort_order      int DEFAULT 0
)
```

---

## PHASE 6 — Quote & Invoice Enhancements

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-600 | Default `valid_until` = today + 15 days | `[ ]` | `[ ]` | Auto-fill on new quote and invoice creation forms |
| F-601 | Per-line-item discount (% or fixed) | `[ ]` | `[ ]` | New `discount_type` + `discount_value` columns on `quote_items` and `invoice_items`; line total = (qty × unit_price × markup) − discount |
| F-602 | Carry discount quote → invoice | `[ ]` | `[ ]` | When generating invoice from accepted quote, copy header discount AND per-line discounts exactly |
| F-603 | Duplicate invoice guard | `[ ]` | `[ ]` | If an invoice already exists for the same quote_id, show modal: "View existing" or "Create new anyway" |
| F-604 | Action buttons at top of detail pages | `N/A` | `[ ]` | Replace bottom stacked button list with a compact sticky action bar at the top of quote/invoice detail pages (PDF, Send, Edit, Delete, etc.) |
| F-605 | Inline actions on quotes list page | `[ ]` | `[ ]` | Row-level action menu (⋯) on quotes list: Edit, Delete, Create Invoice, Download PDF, Save as Template, Send, Copy shareable link |
| F-606 | Inline actions on invoices list page | `[ ]` | `[ ]` | Row-level action menu (⋯) on invoices list: Edit, Delete, Download PDF, Send, Mark as Paid, Create Credit Note |
| F-607 | Landing page hero animation fix | `N/A` | `[ ]` | Fix broken animated word in hero ("Your invoice in ___." — rotating word not rendering) |

### DB Schema changes (migration required)
```sql
-- Add to quote_items
ALTER TABLE quote_items ADD COLUMN discount_type text;        -- 'percent' | 'fixed' | null
ALTER TABLE quote_items ADD COLUMN discount_value numeric(10,2);

-- Add to invoice_items
ALTER TABLE invoice_items ADD COLUMN discount_type text;
ALTER TABLE invoice_items ADD COLUMN discount_value numeric(10,2);
```

---

## PHASE 7 — Bank Details & Profile Enhancements

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-700 | Bank accounts DB schema | `[ ]` | `N/A` | New `bank_accounts` table: `bank_name`, `reg_number`, `account_number`, `is_default`, per user |
| F-701 | Profile: bank details management UI | `[ ]` | `[ ]` | Add/edit/delete bank accounts on profile page; star icon to set default |
| F-702 | Profile: MobilePay number management | `[ ]` | `[ ]` | Store MobilePay business number alongside bank details; mark as preferred payment method |
| F-703 | Pre-load default bank details into new invoices | `[ ]` | `[ ]` | When creating invoice, auto-fill `bank_account` + `mobilepay_number` from user's default |
| F-704 | Bank details + MobilePay on invoice PDF | `[ ]` | `[ ]` | Display payment details section in PDF with bank reg/account and/or MobilePay number |

### DB Schema: bank_accounts
```sql
bank_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  bank_name       text,
  reg_number      text NOT NULL,
  account_number  text NOT NULL,
  is_default      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

---

## PHASE 8 — Merge Documents

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-800 | Merge quotes | `[ ]` | `[ ]` | Select 2+ quotes for the same customer → creates a new merged quote combining all line items; originals kept but status set to `merged` |
| F-801 | Merge invoices | `[ ]` | `[ ]` | Select 2+ invoices for the same customer → creates new merged invoice; originals kept with `merged` status |
| F-802 | Merge conflict UX | `N/A` | `[ ]` | Warn if header discounts differ across merged docs; show preview of merged totals before confirming |

### DB Schema changes
```sql
-- Add to quotes
ALTER TABLE quotes ADD COLUMN merged_into uuid REFERENCES quotes(id);

-- Add to invoices
ALTER TABLE invoices ADD COLUMN merged_into uuid REFERENCES invoices(id);

-- Add 'merged' to status flows for both tables
```

---

## PHASE 9 — Email Notifications & Customer Communication

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-900 | Quote accepted → thank-you email to customer | `[ ]` | `N/A` | Triggered by customer accept action on shareable quote link; Resend template |
| F-901 | Quote rejected → "help us improve" email | `[ ]` | `N/A` | Triggered by customer reject action; email asks for feedback |
| F-902 | Invoice paid → thank-you email + review request | `[ ]` | `N/A` | Triggered on "Mark as paid"; includes Google review link if configured |
| F-903 | Google review URL on profile | `[ ]` | `[ ]` | New `google_review_url` field on users table; input on profile page |

### DB Schema changes
```sql
ALTER TABLE users ADD COLUMN google_review_url text;
```

---

## PHASE 10 — AI Features

> Full spec in `docs/AI_FEATURES.md`

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1000 | Business card → customer (OCR) | `[ ]` | `[ ]` | Upload image → Claude vision extracts name/company/phone/email/address → pre-fills customer form |
| F-1001 | Smart quote suggestions | `[ ]` | `[ ]` | Based on job description, suggest line items from past quotes |
| F-1002 | Payment risk scoring | `[ ]` | `[ ]` | Predict overdue likelihood based on customer history |
| F-1003 | Voice-to-quote | `[ ]` | `[ ]` | Dictate a job description → AI drafts quote line items |
| F-1004 | Auto line-item categorization | `[ ]` | `[ ]` | Classify pasted or dictated items into labour/material/fixed/travel |
| F-1005 | Customer sentiment flag | `[ ]` | `[ ]` | Flag negative tone in customer notes or email history |

---

## PHASE 11 — Dashboard, Free Tier Launch & Tier Gates
> (Previously Phase 6)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1100 | Dashboard: outstanding amount | `[x]` | `[~]` | Query in overview.ts; StatCards component uses stub data |
| F-1101 | Dashboard: active jobs count | `[x]` | `[~]` | Query in overview.ts; StatCards component uses stub data |
| F-1102 | Dashboard: overdue invoices | `[x]` | `[~]` | Query in overview.ts; CriticalZone component uses stub data |
| F-1103 | Dashboard: this month billed | `[x]` | `[~]` | Query in overview.ts; StatCards component uses stub data |
| F-1104 | Free tier: 10 active jobs gate | `[x]` | `[x]` | Done in Phase 3 as F-307 |
| F-1105 | Upgrade prompt UI | `N/A` | `[ ]` | "Coming soon — MobilePay" |
| F-1106 | Beta launch: 20 users | `N/A` | `N/A` | Network outreach |
| F-1107 | Reporting DB queries ready | `[x]` | `N/A` | lib/db/queries/overview.ts covers all dashboard stats |

---

## PHASE 12 — Compliance Pre-GoLive
> (Previously Phase 7)

| # | Feature | BE | FE | Notes |
|---|---|---|---|---|
| F-1200 | SKAT moms summary page | `[ ]` | `[ ]` | Quarterly export, not API yet |
| F-1201 | Moms period calculation | `[ ]` | `[ ]` | Q1/Q2/Q3/Q4 totals |
| F-1202 | EAN number on customer form | `[ ]` | `[ ]` | NemHandel field exposed |
| F-1203 | OIOUBL invoice export | `[ ]` | `[ ]` | XML format for public sector |
| F-1204 | GDPR: user data export | `[ ]` | `[ ]` | JSON download of all user data |
| F-1205 | GDPR: account deletion | `[ ]` | `[ ]` | Soft delete → hard delete 30 days |
| F-1206 | Privacy policy page | `N/A` | `[ ]` | Static legal page |
| F-1207 | Cookie consent | `N/A` | `[ ]` | For analytics cookies |
| F-1208 | Terms of service page | `N/A` | `[ ]` | Static |
| F-1209 | Rate limiting: all API routes | `[ ]` | `N/A` | Upstash |
| F-1210 | Security: Zod on all endpoints | `[ ]` | `N/A` | Audit all routes |

---

## FEATURES DELIBERATELY EXCLUDED FROM MVP

These features were evaluated and explicitly deferred. Do not build these until the specified phase.

| Feature | Why Excluded | When | Risk of premature build |
|---|---|---|---|
| **MobilePay Erhverv payment links** | Requires MobilePay Erhverv API approval (business process, not just code). Payments require Finanstilsynet awareness. | Phase 8+ | Regulatory exposure if mishandled |
| **Bank sync / Open Banking** | Requires PSD2 license or partnership with a licensed provider (Aiia, Nordigen). Multi-week integration. | Phase 8+ | High complexity, license dependency |
| **SKAT moms API filing** | Direct TastSelv API integration requires SKAT developer access approval. Structural export covers pre-launch need. | Phase 8+ | Wrong moms filing = legal liability for users |
| **Native iOS app** | PWA covers mobile use case. Native adds 3–4 months, separate build pipeline, App Store approval. | Phase 9+ | Wasted effort if web PWA is sufficient |
| **Native Android app** | Same as iOS. | Phase 9+ | Same |
| **Payroll (løn)** | Entirely separate compliance layer (ATP, holiday pay, pension). Would require Finanstilsynet consideration. | Phase 10+ | Accidental compliance violation |
| **Annual report generation** | Accountant's legal responsibility. Not a software feature, a liability. | Never (core) | Legal exposure |
| **GPS / location tracking** | Solo tradespeople feel surveilled. Team version possible but trust-destroys for solo users. | Phase 9 (team only) | Churn trigger |
| **Inventory management** | Full stock management requires warehouse logic, supplier integration, reorder alerts. Not a job-management need. | Phase 8+ | Scope creep |
| **AI auto-categorization** | Requires enough user data to train on. Premature without usage patterns. | Phase 8+ | Bad AI = distrust |
| **Multi-currency** | Denmark uses DKK. EUR occasionally on export jobs. No demand in MVP market. | Phase 9+ | Unnecessary complexity |
| **Supplier price list integration** | KlarPris-style integration requires supplier API agreements. | Phase 8+ | Business development dependency |
| **Customer portal** | Customers viewing their own history. Nice-to-have, not a pain point for Klaus. | Phase 8+ | Build for Klaus, not his customers |
| **Recurring job automation** | Automatically creates jobs on a schedule. Useful for service contracts but not MVP scope. | Phase 7+ | Scheduling complexity |
| **Multi-language (Danish)** | Infrastructure ready from Phase 0. Danish strings written when product is stable. | Phase 8 | Translating a moving target |
| **Accountant portal** | Shared read-only view for accountants. High-value retention feature but requires separate auth flow. | Phase 8+ | Auth complexity |
| **Team features (Hold tier)** | Multi-user, job assignment, team dashboard. Requires significant additional logic. | Phase 8+ | Build single-user right first |
