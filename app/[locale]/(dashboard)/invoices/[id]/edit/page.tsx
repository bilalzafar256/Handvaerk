import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getInvoiceById } from "@/lib/db/queries/invoices"
import { getCustomersByUser } from "@/lib/db/queries/customers"
import { Topbar } from "@/components/shared/topbar"
import { InvoiceForm } from "@/components/forms/invoice-form"
import { Link } from "@/i18n/navigation"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string; id: string }> }

export default async function EditInvoicePage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const [invoice, customers] = await Promise.all([
    getInvoiceById(id, user.id),
    getCustomersByUser(user.id),
  ])

  if (!invoice) notFound()

  return (
    <>
      <Topbar
        title="Edit Invoice"
        action={
          <Link
            href={`/invoices/${id}`}
            className="flex items-center gap-1 text-sm h-9 px-2 rounded-[--radius-sm] transition-colors duration-150 cursor-pointer"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        }
      />
      <div className="pt-14">
        <div className="pt-6">
          <InvoiceForm invoice={invoice} customers={customers} />
        </div>
      </div>
    </>
  )
}
