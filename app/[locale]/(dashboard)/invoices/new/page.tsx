import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getCustomersByUser } from "@/lib/db/queries/customers"
import { Topbar } from "@/components/shared/topbar"
import { InvoiceForm } from "@/components/forms/invoice-form"
import { Link } from "@/i18n/navigation"
import { ChevronLeft } from "lucide-react"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata() {
  return { title: "New Invoice | Håndværk Pro" }
}

export default async function NewInvoicePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const customers = await getCustomersByUser(user.id)

  return (
    <>
      <Topbar
        title="New Invoice"
        action={
          <Link
            href="/invoices"
            className="flex items-center gap-1 text-sm h-9 px-2 rounded-[--radius-sm] transition-colors duration-150 cursor-pointer"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        }
      />
      <div className="pt-14">
        <div className="pt-6">
          <InvoiceForm customers={customers} />
        </div>
      </div>
    </>
  )
}
