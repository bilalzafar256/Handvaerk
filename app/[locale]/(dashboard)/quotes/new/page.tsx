import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getCustomersByUser } from "@/lib/db/queries/customers"
import { getJobsByUser } from "@/lib/db/queries/jobs"
import { getTemplatesByUser } from "@/lib/db/queries/quotes"
import { Topbar } from "@/components/shared/topbar"
import { QuoteForm } from "@/components/forms/quote-form"
import { Link } from "@/i18n/navigation"
import { ChevronLeft } from "lucide-react"

type Props = {
  params: Promise<{ locale: string }>
  searchParams?: Promise<Record<string, string>>
}

export async function generateMetadata() {
  return { title: "New Quote | Håndværk Pro" }
}

export default async function NewQuotePage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const sp = await searchParams
  const defaultJobId      = sp?.jobId
  const defaultCustomerId = sp?.customerId

  const [customers, jobs, templates] = await Promise.all([
    getCustomersByUser(user.id),
    getJobsByUser(user.id),
    getTemplatesByUser(user.id),
  ])

  return (
    <>
      <Topbar
        title="New Quote"
        action={
          <Link
            href={defaultJobId ? `/jobs/${defaultJobId}` : "/quotes"}
            className="flex items-center gap-1 text-sm h-9 px-2 rounded-[--radius-sm] transition-colors duration-150 cursor-pointer"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        }
      />
      <div className="pt-14">
        <div className="pt-6">
          <QuoteForm
            customers={customers}
            jobs={jobs}
            templates={templates}
            defaultJobId={defaultJobId}
            defaultCustomerId={defaultCustomerId}
          />
        </div>
      </div>
    </>
  )
}
