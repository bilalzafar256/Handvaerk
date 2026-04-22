import { db } from "@/lib/db"
import { jobs, invoices, quotes } from "@/lib/db/schema"
import { and, eq, gte, isNull, lte, notInArray, or } from "drizzle-orm"

const JOB_COLUMNS = {
  id: true,
  title: true,
  jobNumber: true,
  status: true,
  scheduledDate: true,
  endDate: true,
  customerId: true,
  jobType: true,
} as const

export async function getCalendarJobs(userId: string, from: string, to: string) {
  return db.query.jobs.findMany({
    where: and(
      eq(jobs.userId, userId),
      isNull(jobs.deletedAt),
      or(
        and(gte(jobs.scheduledDate, from), lte(jobs.scheduledDate, to)),
        and(gte(jobs.endDate, from), lte(jobs.endDate, to)),
        // Jobs that span the range (started before, end after)
        and(lte(jobs.scheduledDate, to), gte(jobs.endDate, from))
      )
    ),
    columns: JOB_COLUMNS,
    with: { customer: { columns: { id: true, name: true } } },
  })
}

export async function getCalendarInvoices(userId: string, from: string, to: string) {
  return db.query.invoices.findMany({
    where: and(
      eq(invoices.userId, userId),
      isNull(invoices.deletedAt),
      gte(invoices.dueDate, from),
      lte(invoices.dueDate, to),
      notInArray(invoices.status as never, ["paid", "merged"]),
      eq(invoices.isCreditNote, false)
    ),
    columns: {
      id: true,
      invoiceNumber: true,
      status: true,
      dueDate: true,
      customerId: true,
      totalInclVat: true,
    },
    with: { customer: { columns: { id: true, name: true } } },
  })
}

export async function getCalendarQuotes(userId: string, from: string, to: string) {
  return db.query.quotes.findMany({
    where: and(
      eq(quotes.userId, userId),
      isNull(quotes.deletedAt),
      gte(quotes.validUntil, from),
      lte(quotes.validUntil, to),
      eq(quotes.status, "sent")
    ),
    columns: {
      id: true,
      quoteNumber: true,
      status: true,
      validUntil: true,
      customerId: true,
    },
    with: { customer: { columns: { id: true, name: true } } },
  })
}

export async function getUnscheduledJobs(userId: string) {
  return db.query.jobs.findMany({
    where: and(
      eq(jobs.userId, userId),
      isNull(jobs.deletedAt),
      isNull(jobs.scheduledDate),
      notInArray(jobs.status as never, ["done", "invoiced", "paid"])
    ),
    columns: JOB_COLUMNS,
    with: { customer: { columns: { id: true, name: true } } },
    orderBy: (j, { desc }) => [desc(j.createdAt)],
  })
}
