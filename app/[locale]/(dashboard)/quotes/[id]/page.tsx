import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getQuoteById } from "@/lib/db/queries/quotes"
import { getInvoiceByQuote } from "@/lib/db/queries/invoices"
import { Topbar } from "@/components/shared/topbar"
import { QuoteDetail } from "@/components/quotes/quote-detail"
import { Link } from "@/i18n/navigation"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string; id: string }> }

export default async function QuoteDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const [quote, linkedInvoice] = await Promise.all([
    getQuoteById(id, user.id),
    getInvoiceByQuote(id, user.id),
  ])
  if (!quote) notFound()

  return (
    <>
      <Topbar
        title={quote.quoteNumber}
        action={
          <Link
            href="/quotes"
            className="flex items-center gap-1 text-sm h-9 px-2 rounded-[--radius-sm] transition-colors duration-150 cursor-pointer"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        }
      />
      <div className="pt-14">
        <QuoteDetail quote={quote} user={user} linkedInvoice={linkedInvoice ?? null} />
      </div>
    </>
  )
}
