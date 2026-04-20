# Håndværk Pro

Mobile-first job management SaaS for Danish tradespeople. Covers the full workflow from customer to quote to job to invoice — with Danish tax (moms), localization, and payment methods built in.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4, shadcn/ui, Framer Motion |
| Auth | Clerk (phone OTP + email OTP) |
| Database | Neon (serverless PostgreSQL, EU Frankfurt) |
| ORM | Drizzle ORM |
| Background jobs | Inngest |
| Rate limiting | Upstash Redis |
| Email | Resend |
| File storage | Vercel Blob |
| PDF generation | @react-pdf/renderer |
| AI | Groq (Whisper transcription), Google Gemini |
| i18n | next-intl |
| Analytics | PostHog, Vercel Analytics |
| Error tracking | Sentry |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Neon database (EU Frankfurt recommended)
- Clerk app (EU data residency)
- Upstash Redis instance
- Inngest account
- Resend API key
- Vercel Blob store

### Setup

```bash
git clone <repo>
cd handvaerk-pro
npm install
cp .env.example .env.local
# Fill in all env vars (see table below)
npm run dev
```

App runs at `http://localhost:3000`. Auth redirects to `/en/overview` after sign-in.

### Environment Variables

| Variable | Service |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk |
| `CLERK_SECRET_KEY` | Clerk |
| `CLERK_WEBHOOK_SECRET` | Clerk user sync |
| `UPSTASH_REDIS_REST_URL` | Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash |
| `INNGEST_EVENT_KEY` | Inngest |
| `INNGEST_SIGNING_KEY` | Inngest |
| `RESEND_API_KEY` | Resend |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |
| `GOOGLE_AI_API_KEY` | Gemini Vision |
| `GROQ_API_KEY` | Groq Whisper |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry (optional) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog (optional) |

### Database

Migrations are managed by Drizzle. **Never create migration files by hand** — always run:

```bash
npx drizzle-kit generate   # generate migration from schema changes
npx drizzle-kit push       # apply to Neon
```

Schemas live in `lib/db/schema/*.ts`.

---

## Scripts

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm start       # Start production server
npm run lint    # Run ESLint
```

---

## Project Structure

```
app/                  # Next.js App Router (pages, layouts, API routes)
components/           # React components (ui/, forms/, dashboard/, pdf/)
lib/                  # Core libraries (db/, auth/, email/, utils/)
hooks/                # Custom React hooks
stores/               # Zustand global state
messages/             # i18n translations (en.json, da.json)
drizzle/              # Auto-generated migrations
docs/                 # Project documentation and feature specs
```

---

## Key Features

**Customer Management** — Customer database with CVR/EAN fields for NemHandel invoicing.

**Job Management** — Status flow: `new → scheduled → in_progress → done → invoiced → paid`. Before/after photo uploads, job type categorization.

**Quote Builder** — Line items for labour, materials, fixed price, and travel. 25% VAT auto-calculated, customer discounts, PDF generation, shareable accept/reject link, quote templates.

**Invoice Engine** — One-tap quote-to-invoice conversion, sequential numbering, Danish moms layout, PDF email delivery, auto-reminders at +8 and +15 days, credit notes, MobilePay and bank transfer payment info.

**AI Layer** — Upload a job-site voice recording → Groq Whisper transcribes → LLaMA 3.3 extracts job details → auto-creates a job record.

**Tier System** — Free (limited active jobs), Solo and Pro tiers infrastructure-ready; gating via `lib/utils/tier.ts`.

---

## Architecture Notes

- **App Router only** — no Pages Router.
- All DB queries filtered by `userId` from `auth()` server-side.
- Soft deletes via `isNull(table.deletedAt)` on all queries.
- All mutations via Server Actions (no API routes for mutations).
- All Server Actions and API routes rate-limited via Upstash.
- Money formatted via `formatDKK()` from `lib/utils/currency.ts`.
- Client-passed `userId` is never trusted — always from `auth()`.

---

## Deployment

Hosted on Vercel. `main` → production, feature branches → preview deployments.

- Database: Neon EU Frankfurt
- Auth: Clerk EU data residency
- Rate limiting / caching: Upstash Redis
- Background jobs: Inngest
- File storage: Vercel Blob
