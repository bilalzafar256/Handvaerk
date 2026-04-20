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

| Function ID | Trigger event | Retry | Steps |
|---|---|---|---|
| `process-job-recording` | `recording/submitted` | 2 | 5: mark-processing → ai-extract → save-result → create-notifications → cleanup-blob |
| `invoice-reminder` | `invoice/sent` | default | 3: wait-for-payment-8d → send-first-reminder → wait-7d → send-second-reminder |
| `hello-world` | `test/hello.world` | default | 1: test only |

**Registered at:** `app/api/inngest/route.ts`  
**Functions exported from:** `lib/inngest/functions.ts` (only `helloWorld` exported — `processJobRecording` and `invoiceReminder` in their own files and must be registered)  
**[KNOWN ISSUE: `lib/inngest/functions.ts` only exports `helloWorld`. `processJobRecording` and `invoiceReminder` are defined in separate files. Verify all three are imported in the Inngest route handler.]**

## Rate Limiters

Defined in `lib/upstash/index.ts`. Three tiers:

| Limiter | Window | Limit | Prefix | Used for |
|---|---|---|---|---|
| `rateLimiter` | 10 seconds | 20 requests | `haandvaerk:ratelimit` | All Server Actions, standard API routes |
| `strictRateLimiter` | 60 seconds | 5 requests | `haandvaerk:ratelimit:strict` | Defined but not explicitly called anywhere [INFERRED: intended for auth/sensitive ops] |
| `aiRateLimiter` | 60 seconds | 10 requests | `haandvaerk:ratelimit:ai` | AI recording submission actions |

**Upstash rate limiting is conditional** — `applyRateLimit()` in actions checks `process.env.UPSTASH_REDIS_REST_URL` before instantiating the limiter, so it degrades gracefully in local dev if Redis is not configured.

## Cron Jobs

**[UNKNOWN — no cron jobs configured]**  
`markOverdueAction` in `lib/actions/invoices.ts` marks overdue invoices but must be called manually or from a UI button. No automated daily cron exists.

## Secrets Management

All secrets in `.env` (not committed). `.env.example` documents all required keys.  
`NEXT_PUBLIC_APP_URL` is used in quote email links (`sendQuoteEmailAction`) but is **missing from `.env.example`** — this will cause broken share links in email if not set.

---

→ Related: `architecture/OVERVIEW.md`, `context/KNOWN_ISSUES.md`
