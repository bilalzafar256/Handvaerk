import { db } from "@/lib/db"
import { jobs, customers, quotes, invoices } from "@/lib/db/schema"
import { eq, and, isNull, notInArray, count, desc, asc, sum, gte, lt, inArray } from "drizzle-orm"

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

// ── Stat cards ────────────────────────────────────────────────────────────────

export async function getStatCardData(userId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const startOfMonthStr = startOfMonth.toISOString().slice(0, 10)

  const [activeJobs, outstanding, paidThisMonth, paidLastMonth, revenueThisMonth] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(jobs)
        .where(and(eq(jobs.userId, userId), isNull(jobs.deletedAt), notInArray(jobs.status, ["paid"]))),

      db
        .select({ total: sum(invoices.totalInclVat), cnt: count() })
        .from(invoices)
        .where(
          and(
            eq(invoices.userId, userId),
            isNull(invoices.deletedAt),
            notInArray(invoices.status, ["paid", "draft", "merged"])
          )
        ),

      db
        .select({ total: sum(invoices.totalInclVat) })
        .from(invoices)
        .where(
          and(
            eq(invoices.userId, userId),
            isNull(invoices.deletedAt),
            eq(invoices.status, "paid"),
            gte(invoices.paidAt, startOfMonth)
          )
        ),

      db
        .select({ total: sum(invoices.totalInclVat) })
        .from(invoices)
        .where(
          and(
            eq(invoices.userId, userId),
            isNull(invoices.deletedAt),
            eq(invoices.status, "paid"),
            gte(invoices.paidAt, startOfLastMonth),
            lt(invoices.paidAt, startOfMonth)
          )
        ),

      db
        .select({ total: sum(invoices.totalInclVat) })
        .from(invoices)
        .where(
          and(
            eq(invoices.userId, userId),
            isNull(invoices.deletedAt),
            notInArray(invoices.status, ["draft"]),
            gte(invoices.issueDate, startOfMonthStr)
          )
        ),
    ])

  const paidThisMonthVal = parseFloat(paidThisMonth[0]?.total ?? "0") || 0
  const paidLastMonthVal = parseFloat(paidLastMonth[0]?.total ?? "0") || 0
  const paidDelta =
    paidLastMonthVal > 0
      ? Math.round(((paidThisMonthVal - paidLastMonthVal) / paidLastMonthVal) * 100)
      : null

  return {
    revenueThisMonth: parseFloat(revenueThisMonth[0]?.total ?? "0") || 0,
    activeJobs: Number(activeJobs[0]?.value ?? 0),
    outstandingTotal: parseFloat(outstanding[0]?.total ?? "0") || 0,
    outstandingCount: Number(outstanding[0]?.cnt ?? 0),
    paidThisMonth: paidThisMonthVal,
    paidDelta,
  }
}

export type StatCardData = Awaited<ReturnType<typeof getStatCardData>>

// ── Monthly revenue (last 6 months) ───────────────────────────────────────────

export async function getMonthlyRevenue(userId: string) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      label: d.toLocaleString("en-GB", { month: "short" }),
      start: d,
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    }
  })

  const rows = await Promise.all(
    months.map(({ start, end }) =>
      db
        .select({ total: sum(invoices.totalInclVat) })
        .from(invoices)
        .where(
          and(
            eq(invoices.userId, userId),
            isNull(invoices.deletedAt),
            eq(invoices.status, "paid"),
            gte(invoices.paidAt, start),
            lt(invoices.paidAt, end)
          )
        )
    )
  )

  return months.map((m, i) => ({
    label: m.label,
    value: parseFloat(rows[i][0]?.total ?? "0") || 0,
  }))
}

// ── Critical zone ─────────────────────────────────────────────────────────────

export async function getOverdueInvoices(userId: string) {
  const rows = await db.query.invoices.findMany({
    where: and(eq(invoices.userId, userId), isNull(invoices.deletedAt), eq(invoices.status, "overdue")),
    orderBy: [asc(invoices.dueDate)],
    limit: 5,
    with: { customer: true },
  })

  const today = new Date()
  return rows.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customer.name,
    amount: parseFloat(inv.totalInclVat ?? "0") || 0,
    daysOverdue: Math.max(0, Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / 86_400_000)),
  }))
}

export type OverdueItem = Awaited<ReturnType<typeof getOverdueInvoices>>[number]

// F-207: unpaid invoice count per customer (for "Owes money" badge)
export async function getOutstandingByCustomer(userId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ customerId: invoices.customerId, cnt: count() })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        isNull(invoices.deletedAt),
        inArray(invoices.status, ["sent", "viewed", "overdue"])
      )
    )
    .groupBy(invoices.customerId)
  return Object.fromEntries(rows.map(r => [r.customerId, Number(r.cnt)]))
}

// ── Today's jobs ──────────────────────────────────────────────────────────────

export async function getTodayJobs(userId: string) {
  const todayStr = new Date().toISOString().slice(0, 10)
  return db.query.jobs.findMany({
    where: and(eq(jobs.userId, userId), isNull(jobs.deletedAt), eq(jobs.scheduledDate, todayStr)),
    orderBy: [asc(jobs.createdAt)],
    limit: 10,
    with: { customer: true },
  })
}

export type TodayJob = Awaited<ReturnType<typeof getTodayJobs>>[number]

// ── Activity feed ─────────────────────────────────────────────────────────────

export type ActivityEvent = {
  id: string
  type: "invoice_sent" | "invoice_paid" | "job_done" | "customer_added" | "quote_sent" | "quote_accepted"
  label: string
  sub: string
  timestamp: Date
  amount?: number
}

export async function getRecentActivity(userId: string): Promise<ActivityEvent[]> {
  const cutoff = new Date(Date.now() - 30 * 86_400_000)

  const [sentInvoices, paidInvoices, completedJobs, newCustomers, actedQuotes] = await Promise.all([
    db.query.invoices.findMany({
      where: and(
        eq(invoices.userId, userId),
        isNull(invoices.deletedAt),
        notInArray(invoices.status, ["paid", "draft"]),
        gte(invoices.sentAt, cutoff)
      ),
      orderBy: [desc(invoices.sentAt)],
      limit: 4,
      with: { customer: true },
    }),

    db.query.invoices.findMany({
      where: and(
        eq(invoices.userId, userId),
        isNull(invoices.deletedAt),
        eq(invoices.status, "paid"),
        gte(invoices.paidAt, cutoff)
      ),
      orderBy: [desc(invoices.paidAt)],
      limit: 4,
      with: { customer: true },
    }),

    db.query.jobs.findMany({
      where: and(
        eq(jobs.userId, userId),
        isNull(jobs.deletedAt),
        notInArray(jobs.status, ["new", "scheduled", "in_progress"]),
        gte(jobs.updatedAt, cutoff)
      ),
      orderBy: [desc(jobs.updatedAt)],
      limit: 4,
      with: { customer: true },
    }),

    db.query.customers.findMany({
      where: and(eq(customers.userId, userId), isNull(customers.deletedAt), gte(customers.createdAt, cutoff)),
      orderBy: [desc(customers.createdAt)],
      limit: 3,
    }),

    db.query.quotes.findMany({
      where: and(
        eq(quotes.userId, userId),
        isNull(quotes.deletedAt),
        notInArray(quotes.status, ["draft", "expired"]),
        gte(quotes.sentAt, cutoff)
      ),
      orderBy: [desc(quotes.sentAt)],
      limit: 4,
      with: { customer: true },
    }),
  ])

  const events: ActivityEvent[] = []

  for (const inv of sentInvoices) {
    if (!inv.sentAt) continue
    events.push({
      id: `inv-sent-${inv.id}`,
      type: "invoice_sent",
      label: `Invoice ${inv.invoiceNumber} sent`,
      sub: inv.customer.name,
      timestamp: inv.sentAt,
    })
  }

  for (const inv of paidInvoices) {
    if (!inv.paidAt) continue
    events.push({
      id: `inv-paid-${inv.id}`,
      type: "invoice_paid",
      label: `Invoice ${inv.invoiceNumber} paid`,
      sub: inv.customer.name,
      timestamp: inv.paidAt,
      amount: parseFloat(inv.totalInclVat ?? "0") || undefined,
    })
  }

  for (const job of completedJobs) {
    events.push({
      id: `job-${job.id}`,
      type: "job_done",
      label: `Job marked ${job.status}`,
      sub: `${job.title} · ${job.customer.name}`,
      timestamp: job.updatedAt ?? new Date(),
    })
  }

  for (const c of newCustomers) {
    events.push({
      id: `cust-${c.id}`,
      type: "customer_added",
      label: "New customer added",
      sub: c.name,
      timestamp: c.createdAt ?? new Date(),
    })
  }

  for (const q of actedQuotes) {
    const ts = q.acceptedAt ?? q.sentAt
    if (!ts) continue
    events.push({
      id: `quote-${q.id}`,
      type: q.acceptedAt ? "quote_accepted" : "quote_sent",
      label: q.acceptedAt ? `Quote ${q.quoteNumber} accepted` : `Quote ${q.quoteNumber} sent`,
      sub: q.customer.name,
      timestamp: ts,
    })
  }

  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  return events.slice(0, 8)
}
