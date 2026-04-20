# SKILL: Drizzle ORM + Neon PostgreSQL
> Source: https://orm.drizzle.team/docs | https://neon.tech/docs
> Version: drizzle-orm ^0.38, @neondatabase/serverless

---

## PROJECT-SPECIFIC RULES
- ALWAYS filter queries by `userId` — never return data without this filter.
- ALWAYS use `deleted_at IS NULL` on tables with soft delete.
- NEVER use raw SQL strings. Always use Drizzle query builder.
- Schema files live in `/lib/db/schema/`. One file per domain.
- All DB queries live in `/lib/db/queries/`. One file per domain.
- **NEVER manually create migration files or edit `_journal.json` by hand.** Always use `npx drizzle-kit generate` — it creates both the `.sql` file AND the `meta/XXXX_snapshot.json`. Missing snapshots corrupt future diffs. If a snapshot is missing, the next generate will produce an incorrect or empty migration.

---

## DB CLIENT SETUP

```typescript
// lib/db/index.ts
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

---

## SCHEMA DEFINITION

```typescript
// lib/db/schema/jobs.ts
import { pgTable, uuid, text, date, timestamp, boolean } from "drizzle-orm/pg-core"
import { users } from "./users"
import { customers } from "./customers"

export const jobs = pgTable("jobs", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").notNull().references(() => users.id),
  customerId:    uuid("customer_id").notNull().references(() => customers.id),
  jobNumber:     text("job_number").notNull(),
  title:         text("title").notNull(),
  description:   text("description"),
  status:        text("status").default("new"),
  scheduledDate: date("scheduled_date"),
  createdAt:     timestamp("created_at").defaultNow(),
  updatedAt:     timestamp("updated_at").defaultNow(),
  deletedAt:     timestamp("deleted_at"),  // soft delete
})

// Export type for TypeScript inference
export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert
```

---

## QUERIES

### Select all (with soft delete filter)
```typescript
import { db } from "@/lib/db"
import { jobs } from "@/lib/db/schema"
import { eq, isNull, desc } from "drizzle-orm"

export async function getJobsByUser(userId: string) {
  return db.query.jobs.findMany({
    where: (jobs, { eq, isNull, and }) =>
      and(eq(jobs.userId, userId), isNull(jobs.deletedAt)),
    orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
    with: {
      customer: true,  // eager load related customer
    },
  })
}
```

### Select one
```typescript
export async function getJobById(id: string, userId: string) {
  return db.query.jobs.findFirst({
    where: (jobs, { eq, and, isNull }) =>
      and(eq(jobs.id, id), eq(jobs.userId, userId), isNull(jobs.deletedAt)),
    with: { customer: true },
  })
}
```

### Insert
```typescript
export async function createJob(data: NewJob) {
  const [job] = await db.insert(jobs).values(data).returning()
  return job
}
```

### Update
```typescript
import { eq, and } from "drizzle-orm"

export async function updateJobStatus(
  id: string,
  userId: string,
  status: string
) {
  const [updated] = await db
    .update(jobs)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
    .returning()
  return updated
}
```

### Soft delete
```typescript
export async function deleteJob(id: string, userId: string) {
  await db
    .update(jobs)
    .set({ deletedAt: new Date() })
    .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
}
```

---

## RELATIONS (for WITH queries)

```typescript
// lib/db/schema/relations.ts
import { relations } from "drizzle-orm"
import { users } from "./users"
import { jobs } from "./jobs"
import { customers } from "./customers"
import { invoices } from "./invoices"

export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
  customers: many(customers),
  invoices: many(invoices),
}))

export const jobsRelations = relations(jobs, ({ one }) => ({
  user: one(users, { fields: [jobs.userId], references: [users.id] }),
  customer: one(customers, { fields: [jobs.customerId], references: [customers.id] }),
}))
```

---

## MIGRATIONS

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations to DB
npx drizzle-kit migrate

# Open Drizzle Studio (DB browser)
npx drizzle-kit studio
```

### drizzle.config.ts
```typescript
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

---

## AGGREGATIONS (for reports)

```typescript
import { sum, count, avg } from "drizzle-orm"

export async function getMonthlyRevenue(userId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const result = await db
    .select({
      total: sum(invoices.totalInclVat),
      count: count(),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        gte(invoices.issueDate, startDate),
        lte(invoices.issueDate, endDate),
        ne(invoices.status, "draft")
      )
    )
  return result[0]
}
```

---

## NUMERIC COLUMNS (money)

Always use `numeric` not `float` for money:
```typescript
import { numeric } from "drizzle-orm/pg-core"

subtotalExVat: numeric("subtotal_ex_vat", { precision: 12, scale: 2 })
```

When reading numeric values from Drizzle, they come back as strings — always parse:
```typescript
const amount = parseFloat(invoice.totalInclVat ?? "0")
```
