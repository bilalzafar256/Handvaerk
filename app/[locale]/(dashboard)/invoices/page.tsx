import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getInvoicesByUser } from "@/lib/db/queries/invoices"
import { Topbar } from "@/components/shared/topbar"
import { InvoiceList } from "@/components/invoices/invoice-list"
import { Link } from "@/i18n/navigation"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata() {
  return { title: "Invoices | Håndværk Pro" }
}

export default async function InvoicesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const invoices = await getInvoicesByUser(user.id)

  return (
    <>
      <Topbar
        title="Invoices"
        action={
          <Link
            href="/invoices/new"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-[var(--primary)] hover:bg-[var(--amber-600)] transition-colors active:scale-[0.98] cursor-pointer"
            style={{ color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            <Plus className="w-4 h-4" />
            New invoice
          </Link>
        }
      />
      <div>
        <InvoiceList invoices={invoices} />
      </div>
    </>
  )
}
