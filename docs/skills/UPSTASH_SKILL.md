# SKILL: Upstash Redis — Rate Limiting & Caching
> Source: https://upstash.com/docs/redis | https://upstash.com/docs/redis/sdks/ratelimit
> Version: @upstash/redis ^1.34, @upstash/ratelimit ^2

---

## PROJECT-SPECIFIC RULES
- Use Upstash for: rate limiting on all API routes, caching expensive DB queries.
- NEVER use Upstash for session storage — Clerk handles sessions.
- Rate limit all public-facing API routes and all mutation Server Actions.

---

## SETUP

### Environment variables
```env
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### Client setup
```typescript
// lib/upstash/index.ts
import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

export const redis = Redis.fromEnv()

// General API rate limiter: 20 requests per 10 seconds per user
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: true,
  prefix: "haandvaerk:ratelimit",
})

// Strict limiter for auth/sensitive routes: 5 per minute
export const strictRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "haandvaerk:ratelimit:strict",
})
```

---

## RATE LIMITING IN SERVER ACTIONS

```typescript
// lib/actions/jobs.ts
"use server"
import { auth } from "@clerk/nextjs/server"
import { rateLimiter } from "@/lib/upstash"

export async function createJob(data: NewJob) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // Rate limit by userId
  const { success, limit, remaining } = await rateLimiter.limit(userId)
  if (!success) {
    throw new Error(`Rate limit exceeded. Try again in a moment.`)
  }

  // proceed with DB insert...
}
```

---

## RATE LIMITING IN API ROUTES

```typescript
// app/api/invoices/route.ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { rateLimiter } from "@/lib/upstash"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { success } = await rateLimiter.limit(userId)
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  // proceed...
}
```

---

## CACHING EXPENSIVE QUERIES

```typescript
// lib/upstash/cache.ts
import { redis } from "./index"

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key)
  if (cached !== null) return cached

  // Cache miss — fetch and store
  const data = await fetcher()
  await redis.setex(key, ttlSeconds, JSON.stringify(data))
  return data
}

// Invalidate cache
export async function invalidateCache(key: string) {
  await redis.del(key)
}
```

### Usage
```typescript
// Cache dashboard stats for 30 seconds (they don't need to be real-time)
const stats = await getCached(
  `dashboard:${userId}`,
  () => getDashboardStats(userId),
  30
)

// After creating an invoice, invalidate the dashboard cache
await invalidateCache(`dashboard:${userId}`)
```

---

## CACHE KEY PATTERNS

Use consistent, namespaced cache keys:
```
haandvaerk:dashboard:{userId}          → Dashboard stats
haandvaerk:jobs:{userId}               → Job list
haandvaerk:customers:{userId}          → Customer list
haandvaerk:invoice:{invoiceId}         → Single invoice
haandvaerk:ratelimit:{userId}          → Auto-managed by Ratelimit
```
