import { auth } from "@clerk/nextjs/server"
import { renderToStream } from "@react-pdf/renderer"
import { getQuoteById } from "@/lib/db/queries/quotes"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { QuotePdf } from "@/components/pdf/quote-pdf"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response("Unauthorized", { status: 401 })

  const { id } = await params

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) return new Response("User not found", { status: 404 })

  const quote = await getQuoteById(id, user.id)
  if (!quote) return new Response("Not found", { status: 404 })

  const quoteDate = quote.createdAt
    ? new Date(quote.createdAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0]

  const stream = await renderToStream(
    <QuotePdf
      quoteNumber={quote.quoteNumber}
      quoteDate={quoteDate}
      validUntil={quote.validUntil ?? undefined}
      company={{
        name:     user.companyName ?? "",
        address:  user.addressLine1 ?? "",
        city:     `${user.addressZip ?? ""} ${user.addressCity ?? ""}`.trim(),
        cvr:      user.cvrNumber ?? "",
        logoUrl:  user.logoUrl ?? undefined,
      }}
      customer={{
        name:    quote.customer.name,
        address: quote.customer.addressLine1 ?? "",
        city:    `${quote.customer.addressZip ?? ""} ${quote.customer.addressCity ?? ""}`.trim(),
      }}
      lineItems={quote.items.map(item => ({
        description:   item.description,
        quantity:      parseFloat(item.quantity ?? "1"),
        unitPrice:     parseFloat(item.unitPrice ?? "0"),
        markupPercent: parseFloat(item.markupPercent ?? "0"),
      }))}
      notes={quote.notes ?? undefined}
      discountType={quote.discountType ?? undefined}
      discountValue={parseFloat(quote.discountValue ?? "0")}
    />
  )

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="tilbud-${quote.quoteNumber}.pdf"`,
    },
  })
}
