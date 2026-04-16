import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getQuotesByUser } from "@/lib/db/queries/quotes"
import { Topbar } from "@/components/shared/topbar"
import { QuoteList } from "@/components/quotes/quote-list"
import { Link } from "@/i18n/navigation"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata() {
  return { title: "Quotes | Håndværk Pro" }
}

export default async function QuotesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const quotes = await getQuotesByUser(user.id)

  return (
    <>
      <Topbar
        title="Quotes"
        action={
          <Link
            href="/quotes/new"
            className="flex items-center gap-1.5 h-9 px-3 rounded-[--radius-sm] text-sm font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            <Plus className="w-4 h-4" />
            New quote
          </Link>
        }
      />
      <div className="pt-14">
        <QuoteList quotes={quotes} />
      </div>
    </>
  )
}
