# SKILL: Next.js 15 — App Router Patterns
> Source: https://nextjs.org/docs | https://nextjs.org/llms.txt
> Version: Next.js 15 with React 19

---

## PROJECT-SPECIFIC RULES
- ALWAYS use App Router. Never use Pages Router.
- ALWAYS use Server Components by default. Add `"use client"` only when needed.
- ALWAYS use Server Actions for mutations (not API routes from the client).
- Route groups: `(auth)` and `(dashboard)` separate layouts.

---

## FILE CONVENTIONS

```
app/
  layout.tsx          → Root layout (Clerk provider, fonts, globals)
  page.tsx            → Landing page
  (auth)/
    layout.tsx        → Auth layout (no nav)
    sign-in/page.tsx
    sign-up/page.tsx
  (dashboard)/
    layout.tsx        → Dashboard layout (sidebar/bottom nav)
    overview/page.tsx
    jobs/
      page.tsx        → Job list (Server Component, fetch on server)
      [id]/page.tsx   → Job detail
      new/page.tsx    → Create job form (can be client component)
```

---

## SERVER COMPONENTS (default)

```tsx
// app/(dashboard)/jobs/page.tsx
// No "use client" — runs on server
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { jobs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function JobsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Fetch on server — no loading spinner, no useEffect
  const userJobs = await db.query.jobs.findMany({
    where: eq(jobs.userId, userId),
    orderBy: desc(jobs.createdAt),
  })

  return <JobList jobs={userJobs} />
}
```

---

## SERVER ACTIONS (for mutations)

```tsx
// lib/actions/jobs.ts
"use server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { jobs } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createJobSchema = z.object({
  title: z.string().min(1),
  customerId: z.string().uuid(),
  description: z.string().optional(),
})

export async function createJob(formData: z.infer<typeof createJobSchema>) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = createJobSchema.parse(formData)

  await db.insert(jobs).values({
    userId,          // ALWAYS include userId
    ...validated,
    jobNumber: await generateJobNumber(userId),
  })

  revalidatePath("/jobs")
}
```

---

## CLIENT COMPONENTS (when needed)

Add `"use client"` ONLY for:
- Event handlers (onClick, onChange)
- React state (useState, useReducer)
- Browser APIs (camera, speech)
- Real-time updates

```tsx
// components/forms/job-form.tsx
"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createJob } from "@/lib/actions/jobs"

export function JobForm() {
  const form = useForm({ resolver: zodResolver(createJobSchema) })

  return (
    <form action={createJob}>  {/* Server Action as form action */}
      ...
    </form>
  )
}
```

---

## ROUTE HANDLERS (API routes — for webhooks only)

```tsx
// app/api/webhooks/clerk/route.ts
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  // Verify Clerk webhook signature
  // Sync user to DB
}
```

Use route handlers for: webhooks, Inngest handler, third-party callbacks.
Do NOT use route handlers for regular data fetching — use Server Components.

---

## MIDDLEWARE

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
}
```

---

## METADATA

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: { template: "%s | Håndværk Pro", default: "Håndværk Pro" },
  description: "Job management for Danish tradespeople",
}
```

---

## LOADING AND ERROR

```
app/(dashboard)/jobs/
  page.tsx        → Main page
  loading.tsx     → Skeleton shown while page.tsx loads (Suspense)
  error.tsx       → Error boundary for this route
```

```tsx
// app/(dashboard)/jobs/loading.tsx
export default function Loading() {
  return <JobListSkeleton />  // matches real layout
}
```

---

## IMAGE OPTIMIZATION

```tsx
import Image from "next/image"
// Always use next/image, never <img>
<Image src={logoUrl} alt="Logo" width={120} height={40} />
```

---

## ENVIRONMENT VARIABLES

```typescript
// Access server-side env vars
process.env.DATABASE_URL          // Server only
process.env.CLERK_SECRET_KEY      // Server only

// Access client-side env vars (must be prefixed NEXT_PUBLIC_)
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```
