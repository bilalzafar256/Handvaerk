import { auth } from "@clerk/nextjs/server"
import { renderToStream } from "@react-pdf/renderer"
import { getInvoiceById } from "@/lib/db/queries/invoices"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { InvoicePdf } from "@/components/pdf/invoice-pdf"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response("Unauthorized", { status: 401 })

  const { id } = await params

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) return new Response("User not found", { status: 404 })

  const invoice = await getInvoiceById(id, user.id)
  if (!invoice) return new Response("Not found", { status: 404 })

  const stream = await renderToStream(
    <InvoicePdf
      invoiceNumber={invoice.invoiceNumber}
      issueDate={invoice.issueDate}
      dueDate={invoice.dueDate}
      isCreditNote={invoice.isCreditNote ?? false}
      company={{
        name:     user.companyName ?? "",
        address:  user.addressLine1 ?? "",
        city:     `${user.addressZip ?? ""} ${user.addressCity ?? ""}`.trim(),
        cvr:      user.cvrNumber ?? "",
        logoUrl:  user.logoUrl ?? undefined,
      }}
      customer={{
        name:    invoice.customer.name,
        address: invoice.customer.addressLine1 ?? "",
        city:    `${invoice.customer.addressZip ?? ""} ${invoice.customer.addressCity ?? ""}`.trim(),
        ean:     invoice.customer.eanNumber ?? undefined,
      }}
      lineItems={invoice.items.map(item => ({
        description: item.description,
        quantity:    parseFloat(item.quantity ?? "1"),
        unitPrice:   parseFloat(item.unitPrice ?? "0"),
      }))}
      notes={invoice.notes ?? undefined}
      bankAccount={invoice.bankAccount ?? undefined}
      mobilepayNumber={invoice.mobilepayNumber ?? undefined}
    />
  )

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="faktura-${invoice.invoiceNumber}.pdf"`,
    },
  })
}
