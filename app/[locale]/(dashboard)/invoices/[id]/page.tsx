import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getInvoiceById } from "@/lib/db/queries/invoices"
import { Topbar } from "@/components/shared/topbar"
import { InvoiceDetail } from "@/components/invoices/invoice-detail"
import { Link } from "@/i18n/navigation"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string; id: string }> }

export default async function InvoiceDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const invoice = await getInvoiceById(id, user.id)
  if (!invoice) notFound()

  return (
    <>
      <Topbar
        title={invoice.invoiceNumber}
        action={
          <Link
            href="/invoices"
            className="flex items-center gap-1 text-sm h-8 px-2 rounded-lg transition-colors hover:bg-[var(--accent)] cursor-pointer"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        }
      />
      <div>
        <InvoiceDetail invoice={invoice} user={user} />
      </div>
    </>
  )
}
