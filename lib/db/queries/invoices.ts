import { db } from "@/lib/db"
import { invoices, invoiceItems } from "@/lib/db/schema"
import { eq, and, isNull, desc, count, lt, ne, isNotNull, sum } from "drizzle-orm"
import type { NewInvoice, NewInvoiceItem } from "@/lib/db/schema/invoices"

export async function getInvoicesByUser(userId: string) {
  return db.query.invoices.findMany({
    where: and(eq(invoices.userId, userId), isNull(invoices.deletedAt)),
    orderBy: [desc(invoices.createdAt)],
    with: { customer: true, items: true },
  })
}

export async function getInvoiceByQuote(quoteId: string, userId: string) {
  return db.query.invoices.findFirst({
    where: and(eq(invoices.quoteId, quoteId), eq(invoices.userId, userId), isNull(invoices.deletedAt)),
  })
}

export async function getInvoicesByJob(jobId: string, userId: string) {
  return db.query.invoices.findMany({
    where: and(eq(invoices.jobId, jobId), eq(invoices.userId, userId), isNull(invoices.deletedAt)),
    orderBy: [desc(invoices.createdAt)],
    with: { customer: true },
  })
}

export async function getInvoiceById(id: string, userId: string) {
  return db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.userId, userId), isNull(invoices.deletedAt)),
    with: { customer: true, job: true, quote: true, items: true },
  })
}

export async function createInvoice(data: NewInvoice) {
  const [invoice] = await db.insert(invoices).values(data).returning()
  return invoice
}

export async function updateInvoice(
  id: string,
  userId: string,
  data: Partial<Omit<NewInvoice, "id" | "userId" | "createdAt">>
) {
  const [updated] = await db
    .update(invoices)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
    .returning()
  return updated
}

export async function softDeleteInvoice(id: string, userId: string) {
  await db
    .update(invoices)
    .set({ deletedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
}

export async function countAllInvoicesEver(userId: string) {
  const result = await db
    .select({ value: count() })
    .from(invoices)
    .where(eq(invoices.userId, userId))
  return Number(result[0]?.value ?? 0)
}

export async function replaceInvoiceItems(invoiceId: string, items: Omit<NewInvoiceItem, "invoiceId">[]) {
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId))
  if (items.length === 0) return []
  return db.insert(invoiceItems).values(items.map(item => ({ ...item, invoiceId }))).returning()
}

// Mark overdue: set status='overdue' for sent invoices past due date
export async function markOverdueInvoices(userId: string) {
  const today = new Date().toISOString().split("T")[0]
  await db
    .update(invoices)
    .set({ status: "overdue", updatedAt: new Date() })
    .where(
      and(
        eq(invoices.userId, userId),
        eq(invoices.status, "sent"),
        isNull(invoices.paidAt),
        isNull(invoices.deletedAt),
        lt(invoices.dueDate, today)
      )
    )
}

// Dashboard stats
export async function getOutstandingAmount(userId: string) {
  const result = await db
    .select({ total: sum(invoices.totalInclVat) })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        isNull(invoices.deletedAt),
        isNull(invoices.paidAt),
        ne(invoices.status, "draft")
      )
    )
  return parseFloat(result[0]?.total ?? "0")
}

export async function getOverdueInvoices(userId: string) {
  return db.query.invoices.findMany({
    where: and(
      eq(invoices.userId, userId),
      eq(invoices.status, "overdue"),
      isNull(invoices.deletedAt)
    ),
    with: { customer: true },
  })
}

export async function getThisMonthBilled(userId: string) {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  // Use a raw-ish approach via Drizzle's between — we'll use gte/lte
  const { gte, lte } = await import("drizzle-orm")
  const result = await db
    .select({ total: sum(invoices.totalInclVat) })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        isNull(invoices.deletedAt),
        ne(invoices.status, "draft"),
        gte(invoices.issueDate, firstDay),
        lte(invoices.issueDate, lastDay)
      )
    )
  return parseFloat(result[0]?.total ?? "0")
}
