import { db } from "@/lib/db"
import { timeEntries, jobs } from "@/lib/db/schema"
import { eq, and, isNull, isNotNull, gte, lte, sum, count, desc, notInArray } from "drizzle-orm"
import type { NewTimeEntry } from "@/lib/db/schema/time-entries"

export async function getActiveEntry(userId: string) {
  return db.query.timeEntries.findFirst({
    where: and(
      eq(timeEntries.userId, userId),
      isNull(timeEntries.endedAt),
      isNull(timeEntries.deletedAt),
    ),
    with: { job: { with: { customer: true } } },
  })
}

export async function getEntriesByJob(jobId: string, userId: string) {
  return db.query.timeEntries.findMany({
    where: and(
      eq(timeEntries.jobId, jobId),
      eq(timeEntries.userId, userId),
      isNull(timeEntries.deletedAt),
    ),
    orderBy: [desc(timeEntries.startedAt)],
    with: { billedToQuote: true, billedToInvoice: true },
  })
}

export async function getWeeklyEntries(userId: string, weekStart: Date, weekEnd: Date) {
  return db.query.timeEntries.findMany({
    where: and(
      eq(timeEntries.userId, userId),
      isNull(timeEntries.deletedAt),
      gte(timeEntries.startedAt, weekStart),
      lte(timeEntries.startedAt, weekEnd),
    ),
    orderBy: [desc(timeEntries.startedAt)],
    with: { job: { with: { customer: true } } },
  })
}

export async function getBillingStatusForJob(jobId: string, userId: string) {
  const entries = await db
    .select({
      durationMinutes: timeEntries.durationMinutes,
      isBillable: timeEntries.isBillable,
      billedToQuoteId: timeEntries.billedToQuoteId,
      billedToInvoiceId: timeEntries.billedToInvoiceId,
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.jobId, jobId),
        eq(timeEntries.userId, userId),
        isNull(timeEntries.deletedAt),
        isNotNull(timeEntries.endedAt),
        eq(timeEntries.isBillable, true),
      )
    )

  let totalBillableMinutes = 0
  const billedToQuote: Record<string, number> = {}
  const billedToInvoice: Record<string, number> = {}

  for (const e of entries) {
    const mins = e.durationMinutes ?? 0
    totalBillableMinutes += mins
    if (e.billedToQuoteId) {
      billedToQuote[e.billedToQuoteId] = (billedToQuote[e.billedToQuoteId] ?? 0) + mins
    }
    if (e.billedToInvoiceId) {
      billedToInvoice[e.billedToInvoiceId] = (billedToInvoice[e.billedToInvoiceId] ?? 0) + mins
    }
  }

  const alreadyBilledMinutes = Object.values(billedToQuote).reduce((s, n) => s + n, 0)
    + Object.values(billedToInvoice).reduce((s, n) => s + n, 0)

  return {
    totalBillableMinutes,
    unbilledMinutes: totalBillableMinutes - alreadyBilledMinutes,
    billedToQuote,    // quoteId → minutes
    billedToInvoice,  // invoiceId → minutes
  }
}

export async function getTotalBillableMinutes(jobId: string, userId: string) {
  const result = await db
    .select({ total: sum(timeEntries.durationMinutes) })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.jobId, jobId),
        eq(timeEntries.userId, userId),
        isNull(timeEntries.deletedAt),
        isNotNull(timeEntries.endedAt),
        eq(timeEntries.isBillable, true),
      )
    )
  return Number(result[0]?.total ?? 0)
}

export async function countTimeEntries(userId: string) {
  const result = await db
    .select({ total: count() })
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.deletedAt)))
  return Number(result[0]?.total ?? 0)
}

export async function createTimeEntry(data: NewTimeEntry) {
  const [row] = await db.insert(timeEntries).values(data).returning()
  return row
}

export async function updateTimeEntry(id: string, userId: string, data: Partial<NewTimeEntry>) {
  await db
    .update(timeEntries)
    .set(data)
    .where(and(eq(timeEntries.id, id), eq(timeEntries.userId, userId)))
}

export async function softDeleteTimeEntry(id: string, userId: string) {
  await db
    .update(timeEntries)
    .set({ deletedAt: new Date() })
    .where(and(eq(timeEntries.id, id), eq(timeEntries.userId, userId)))
}

export async function markEntriesAsBilledToQuote(jobId: string, userId: string, quoteId: string) {
  await db
    .update(timeEntries)
    .set({ billedToQuoteId: quoteId })
    .where(
      and(
        eq(timeEntries.jobId, jobId),
        eq(timeEntries.userId, userId),
        isNull(timeEntries.deletedAt),
        isNotNull(timeEntries.endedAt),
        eq(timeEntries.isBillable, true),
      )
    )
}

export async function markEntriesAsBilledToInvoice(jobId: string, userId: string, invoiceId: string) {
  await db
    .update(timeEntries)
    .set({ billedToInvoiceId: invoiceId })
    .where(
      and(
        eq(timeEntries.jobId, jobId),
        eq(timeEntries.userId, userId),
        isNull(timeEntries.deletedAt),
        isNotNull(timeEntries.endedAt),
        eq(timeEntries.isBillable, true),
      )
    )
}

export async function getMonthlyEntries(userId: string, monthStart: Date, monthEnd: Date) {
  return db
    .select({
      startedAt: timeEntries.startedAt,
      durationMinutes: timeEntries.durationMinutes,
      isBillable: timeEntries.isBillable,
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        isNull(timeEntries.deletedAt),
        isNotNull(timeEntries.endedAt),
        gte(timeEntries.startedAt, monthStart),
        lte(timeEntries.startedAt, monthEnd),
      )
    )
}

const ACTIVE_JOB_STATUSES = ["new", "scheduled", "in_progress"] as const

export async function getActiveJobsForUser(userId: string) {
  return db.query.jobs.findMany({
    where: and(
      eq(jobs.userId, userId),
      isNull(jobs.deletedAt),
      notInArray(jobs.status, ["done", "invoiced", "paid"]),
    ),
    with: { customer: true },
    orderBy: [desc(jobs.createdAt)],
  })
}
