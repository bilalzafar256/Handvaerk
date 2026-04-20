# Coding Standards

## File Naming

| Entity | Convention | Example |
|---|---|---|
| Pages | `page.tsx` | `app/[locale]/(dashboard)/jobs/page.tsx` |
| Layouts | `layout.tsx` | `app/[locale]/(dashboard)/layout.tsx` |
| Route handlers | `route.ts` | `app/api/cvr/route.ts` |
| Server Actions | `lib/actions/{domain}.ts` | `lib/actions/invoices.ts` |
| DB queries | `lib/db/queries/{domain}.ts` | `lib/db/queries/jobs.ts` |
| Schema files | `lib/db/schema/{domain}.ts` | `lib/db/schema/invoices.ts` |
| Components | `kebab-case.tsx` | `job-recording-flow.tsx` |
| Hooks | `use-{name}.ts` | `use-cvr-search.ts` |
| Stores | `{name}-store.ts` | `ui-store.ts` |
| Utils | `{name}.ts` | `currency.ts` |

---

## Component Patterns

### Client vs Server components
- Default: Server Component (no directive needed)
- Client: add `"use client"` at top — required for useState, useEffect, event handlers, Zustand
- Forms: all `"use client"` (react-hook-form)
- List/detail pages: Server Component fetches data, passes to Client Components

### Props convention
- Pass data down via props from Server Component to Client Component
- No prop drilling beyond 2 levels — lift to page level or use Zustand for truly global state
- Use TypeScript types from Drizzle `$inferSelect` directly as prop types

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Server Actions | `{verb}{Entity}Action` | `createJobAction`, `sendInvoiceAction` |
| DB queries | `{verb}{Entity}` | `createJob`, `getJobById`, `softDeleteJob` |
| Event handlers | `handle{Event}` | `handleSubmit`, `handleDragEnd` |
| Booleans | `is{State}` | `isActive`, `isDragging` |
| Types | PascalCase | `JobFormData`, `ExtractedJobRecord` |
| Constants | UPPER_SNAKE | `FREE_TIER_JOB_LIMIT`, `ITEM_TYPE_LABELS` |
| CSS variables | kebab-case | `--text-primary`, `--status-paid-bg` |

---

## Styling Patterns

### Rule: semantic tokens always
```tsx
// Correct
style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}

// Incorrect — don't use raw palette or arbitrary Tailwind colors
style={{ color: "#666" }}
className="text-gray-500"
```

### When to use `style={}` vs `className`
- CSS variable references → `style={}`
- Standard Tailwind utilities (spacing, flex, grid, sizing) → `className`
- Mixed: both props on same element is fine

### Hover states: inline event handlers
```tsx
// Pattern from sidebar.tsx — used throughout
onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--foreground)"}
onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"}
```

---

## Server Action Template

Every Server Action must follow this structure (no exceptions):

```ts
"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({ /* ... */ })

async function getDbUser(clerkId: string) {
  return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
}

async function applyRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { rateLimiter } = await import("@/lib/upstash")
    const { success } = await rateLimiter.limit(clerkId)
    if (!success) throw new Error("Rate limit exceeded. Try again in a moment.")
  }
}

export async function doSomethingAction(data: unknown) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  await applyRateLimit(clerkId)
  const validated = schema.parse(data)
  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")
  // ... logic
  revalidatePath("/relevant-path")
  return { id: result.id }
}
```

---

## DB Query Rules

1. **Always filter by `userId`** — every query on user-owned data must include `eq(table.userId, user.id)`
2. **Always filter soft-deleted** — `isNull(table.deletedAt)` on queries for customers, jobs, quotes, invoices
3. **Use Drizzle query builder** — `db.query.tableName.findFirst/findMany` with Drizzle's relational API, or `db.select().from()...`
4. **No raw SQL strings** — never `db.execute(sql\`...\`)`
5. **`replaceItems` pattern** — when updating quote/invoice items, delete existing rows then insert new ones (not upsert). This preserves sort order integrity.

```ts
// Correct: Drizzle query builder
const job = await db.query.jobs.findFirst({
  where: (j, { and, eq, isNull }) => and(eq(j.id, id), eq(j.userId, userId), isNull(j.deletedAt)),
  with: { customer: true, photos: true }
})

// Correct: Drizzle update
await db.update(jobs).set({ status, updatedAt: new Date() }).where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
```

---

## i18n Rules

1. Add every new user-visible string to `messages/en.json` (with English value)
2. Add same key to `messages/da.json` with value `""` (empty string placeholder)
3. Use `useTranslations("Namespace")` hook in client components
4. Use `getTranslations("Namespace")` in server components
5. Use `@/i18n/navigation` for `Link`, `useRouter`, `usePathname` — never `next/navigation` in localizable routes

---

## Money Display Rules

1. **Always `formatDKK(value)`** — never `value + " kr"` or inline Intl calls
2. Import from `@/lib/utils/currency`
3. Use `var(--font-mono)` for all displayed money values
4. VAT calculations: use `lib/utils/vat.ts` — never inline `* 1.25` or `* 0.25`

---

## Anti-Patterns

| Anti-pattern | Why | Instead |
|---|---|---|
| `className="text-amber-500"` | Color bypasses design system | `style={{ color: "var(--primary)" }}` |
| `className="bg-accent"` | `--accent` is gray, not amber | `style={{ backgroundColor: "var(--primary)" }}` for CTAs |
| Raw SQL in actions | Bypasses type safety and injection protection | Drizzle query builder |
| `userId` from client props | Can be spoofed | `auth()` server-side always |
| Inline `* 0.25` for VAT | Hardcoded rate, not single source of truth | `calcVat()` from `lib/utils/vat.ts` |
| `db.query.users.findFirst()` without `userId` filter | Returns ANY user's data | Always include `eq(users.clerkId, clerkId)` |
| Missing `isNull(deletedAt)` | Returns soft-deleted records | Required on all queries |
| API route for mutations | Bypasses revalidation, harder to type | Server Actions |
| Direct `fetch()` in components for data | Race conditions, no cache | Server Components + Server Actions |

---

→ Related: `context/DECISIONS.md`, `INDEX.md`, `codebase/BACKEND.md`
