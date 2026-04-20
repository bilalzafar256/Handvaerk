import { db } from "@/lib/db"
import { invoices, invoiceItems, quotes, quoteItems } from "@/lib/db/schema"
import { eq, and, isNull, sum } from "drizzle-orm"

export async function getJobProfitability(jobId: string, userId: string) {
  const [invoiceRevenue, acceptedQuotes] = await Promise.all([
    db
      .select({ total: sum(invoiceItems.lineTotal) })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .where(
        and(
          eq(invoices.jobId, jobId),
          eq(invoices.userId, userId),
          isNull(invoices.deletedAt),
          eq(invoices.isCreditNote, false),
        )
      ),
    db.query.quotes.findMany({
      where: and(
        eq(quotes.jobId, jobId),
        eq(quotes.userId, userId),
        eq(quotes.status, "accepted"),
        isNull(quotes.deletedAt),
      ),
      with: { items: true },
    }),
  ])

  let quotedExVat = 0
  for (const q of acceptedQuotes) {
    for (const item of q.items) {
      const qty = parseFloat(item.quantity ?? "1")
      const price = parseFloat(item.unitPrice ?? "0")
      const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
      const gross = qty * price * markup
      const dv = parseFloat(item.discountValue ?? "0")
      if (item.discountType === "percent") {
        quotedExVat += gross * (1 - dv / 100)
      } else if (item.discountType === "fixed") {
        quotedExVat += Math.max(0, gross - dv)
      } else {
        quotedExVat += gross
      }
    }
  }

  const invoicedExVat = Number(invoiceRevenue[0]?.total ?? 0)

  return {
    invoicedExVat,
    quotedExVat,
    hasData: invoiceRevenue[0]?.total !== null || acceptedQuotes.length > 0,
  }
}
