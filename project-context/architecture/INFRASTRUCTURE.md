# Infrastructure

## Hosting

| Service | Platform | Notes |
|---|---|---|
| Next.js app | Vercel | `/.vercel/project.json` present — project already linked |
| Database | Neon serverless PostgreSQL | Accessed via `@neondatabase/serverless` + `drizzle-orm/neon-http` |
| File storage | Vercel Blob | Logos, job photos, AI audio (transient) |
| Redis | Upstash | Rate limiting only — no caching layer yet |
| Background jobs | Inngest | Self-hosted functions, cloud orchestration |
| Email delivery | Resend | Transactional only |

## Build & Deploy Pipeline

**[UNKNOWN — no GitHub Actions or CI/CD config files found]**

Inferred from `.vercel/` presence:
- Vercel CLI used for deployment
- `npm run build` → `next build`
- `npm run dev` → `next dev` (local)
- `npm run start` → `next start` (production server)

## Drizzle Migration Workflow

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Interactive schema browser
npx drizzle-kit studio
```

Config: `drizzle.config.ts` (root)

## Seed / Clear Scripts

| Script | Command | Purpose |
|---|---|---|
| `scripts/seed.ts` | `npx tsx scripts/seed.ts` | Seed development data |
| `scripts/clear-seed.ts` | `npx tsx scripts/clear-seed.ts` | Remove seeded data |
| `scripts/migrate-notifications.ts` | `npx tsx scripts/migrate-notifications.ts` | One-time notification migration |

## Background Workers (Inngest Functions)

| Function ID | Trigger | Retry | Steps |
|---|---|---|---|
| `process-job-recording` | `recording/submitted` | 2 | 5: mark-processing → ai-extract → save-result → create-notifications → cleanup-blob |
| `invoice-reminder` | `invoice/sent` | default | 2: sleepUntil(dueDate+reminder1Days) → send-first-reminder → sleepUntil(dueDate+reminder2Days) → send-second-reminder |
| `mark-overdue-invoices` | `cron: 0 6 * * *` (daily 6am UTC) | default | 1: mark-overdue |
| `hard-delete-user` | `user/deleted` | default | 3: wait-30d → delete-blobs → hard-delete-data |
| `hello-world` | `test/hello.world` | default | 1: test only |

**Registered at:** `app/api/inngest/route.ts`  
**Each function lives in its own file under `lib/inngest/`.**

## Rate Limiters

Defined in `lib/upstash/index.ts`. Three tiers:

| Limiter | Window | Limit | Prefix | Used for |
|---|---|---|---|---|
| `rateLimiter` | 10 seconds | 20 requests | `haandvaerk:ratelimit` | All Server Actions, standard API routes |
| `strictRateLimiter` | 60 seconds | 5 requests | `haandvaerk:ratelimit:strict` | Destructive mutations: `deleteJobAction`, `deleteInvoiceAction`, `deleteCustomerAction`, `createCreditNoteAction`, `mergeInvoicesAction`, `exportUserDataAction`, `initiateAccountDeletionAction` |
| `aiRateLimiter` | 60 seconds | 10 requests | `haandvaerk:ratelimit:ai` | AI actions: `submitRecordingAction` |

**Upstash rate limiting is conditional** — `applyRateLimit()` in actions checks `process.env.UPSTASH_REDIS_REST_URL` before instantiating the limiter, so it degrades gracefully in local dev if Redis is not configured.

## Cron Jobs

| Cron | Schedule | File | Purpose |
|---|---|---|---|
| `mark-overdue-invoices` | Daily at 6am UTC (`0 6 * * *`) | `lib/inngest/overdue-invoices.ts` | Marks all `sent`/`viewed` invoices with `due_date < today` as `overdue` for all users |

## Secrets Management

All secrets in `.env` (not committed). `.env.example` documents all required keys including `NEXT_PUBLIC_APP_URL` (used in quote email share links).

---

→ Related: `architecture/OVERVIEW.md`, `context/KNOWN_ISSUES.md`
