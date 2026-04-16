import { db } from "@/lib/db"
import { jobs, customers, quotes, invoices } from "@/lib/db/schema"
import { eq, and, isNull, notInArray, count, desc, sum, gte, lt } from "drizzle-orm"

export async function getOverviewStats(userId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [
    customerCountResult,
    activeJobsResult,
    allJobCountsResult,
    recentJobsResult,
    openQuotesResult,
    pendingInvoicesResult,
    paidThisMonthResult,
  ] = await Promise.all([
    // Total customers
    db
      .select({ value: count() })
      .from(customers)
      .where(and(eq(customers.userId, userId), isNull(customers.deletedAt))),

    // Active jobs (not paid/invoiced)
    db
      .select({ value: count() })
      .from(jobs)
      .where(
        and(
          eq(jobs.userId, userId),
          isNull(jobs.deletedAt),
          notInArray(jobs.status, ["paid", "invoiced"])
        )
      ),

    // Count jobs by status
    db
      .select({ status: jobs.status, value: count() })
      .from(jobs)
      .where(and(eq(jobs.userId, userId), isNull(jobs.deletedAt)))
      .groupBy(jobs.status),

    // 5 most recent jobs
    db.query.jobs.findMany({
      where: and(eq(jobs.userId, userId), isNull(jobs.deletedAt)),
      orderBy: [desc(jobs.createdAt)],
      limit: 5,
      with: { customer: true },
    }),

    // Open quotes (draft + sent)
    db
      .select({ value: count() })
      .from(quotes)
      .where(
        and(
          eq(quotes.userId, userId),
          isNull(quotes.deletedAt),
          notInArray(quotes.status, ["accepted", "rejected", "expired"])
        )
      ),

    // Pending invoices (sent + viewed + overdue) — total amount
    db
      .select({ value: count(), total: sum(invoices.totalInclVat) })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          isNull(invoices.deletedAt),
          notInArray(invoices.status, ["paid", "draft"])
        )
      ),

    // Paid this month
    db
      .select({ total: sum(invoices.totalInclVat) })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          isNull(invoices.deletedAt),
          eq(invoices.status, "paid"),
          gte(invoices.paidAt, startOfMonth),
          lt(invoices.paidAt, endOfMonth)
        )
      ),
  ])

  const statusCounts = Object.fromEntries(
    allJobCountsResult.map((r) => [r.status, Number(r.value)])
  )

  return {
    customerCount: Number(customerCountResult[0]?.value ?? 0),
    activeJobCount: Number(activeJobsResult[0]?.value ?? 0),
    statusCounts: {
      new:         statusCounts["new"] ?? 0,
      scheduled:   statusCounts["scheduled"] ?? 0,
      in_progress: statusCounts["in_progress"] ?? 0,
      done:        statusCounts["done"] ?? 0,
      invoiced:    statusCounts["invoiced"] ?? 0,
      paid:        statusCounts["paid"] ?? 0,
    },
    recentJobs: recentJobsResult,
    openQuoteCount: Number(openQuotesResult[0]?.value ?? 0),
    pendingInvoiceCount: Number(pendingInvoicesResult[0]?.value ?? 0),
    pendingInvoiceTotal: parseFloat(pendingInvoicesResult[0]?.total ?? "0") || 0,
    paidThisMonth: parseFloat(paidThisMonthResult[0]?.total ?? "0") || 0,
  }
}
