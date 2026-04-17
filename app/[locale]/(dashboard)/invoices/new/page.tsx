import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getCustomersByUser } from "@/lib/db/queries/customers"
import { getQuotesByUser } from "@/lib/db/queries/quotes"
import { Topbar } from "@/components/shared/topbar"
import { InvoiceForm } from "@/components/forms/invoice-form"
import { Link } from "@/i18n/navigation"
import { ChevronLeft } from "lucide-react"

type Props = {
  params: Promise<{ locale: string }>
  searchParams?: Promise<Record<string, string>>
}

export async function generateMetadata() {
  return { title: "New Invoice | Håndværk Pro" }
}

export default async function NewInvoicePage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const sp = await searchParams
  const defaultJobId      = sp?.jobId
  const defaultCustomerId = sp?.customerId

  const [customers, allQuotes] = await Promise.all([
    getCustomersByUser(user.id),
    getQuotesByUser(user.id),
  ])

  // Group quotes by customerId for the invoice form picker
  const quotesByCustomer = allQuotes.reduce<Record<string, typeof allQuotes>>((acc, q) => {
    if (!acc[q.customerId]) acc[q.customerId] = []
    acc[q.customerId].push(q)
    return acc
  }, {})

  return (
    <>
      <Topbar
        title="New Invoice"
        action={
          <Link
            href={defaultJobId ? `/jobs/${defaultJobId}` : "/invoices"}
            className="flex items-center gap-1 text-sm h-8 px-2 rounded-lg transition-colors hover:bg-[var(--accent)] cursor-pointer"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        }
      />
      <div className="pt-2">
        <InvoiceForm
          customers={customers}
          quotesByCustomer={quotesByCustomer}
          defaultJobId={defaultJobId}
          defaultCustomerId={defaultCustomerId}
        />
      </div>
    </>
  )
}
