import { setRequestLocale, getTranslations } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getCustomersByUser } from "@/lib/db/queries/customers"
import { Topbar } from "@/components/shared/topbar"
import { JobForm } from "@/components/forms/job-form"
import { Link } from "@/i18n/navigation"
import { ChevronLeft } from "lucide-react"

type Props = {
  params: Promise<{ locale: string }>
  searchParams?: Promise<Record<string, string>>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "JobForm" })
  return { title: t("newTitle") + " | Håndværk Pro" }
}

export default async function NewJobPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("JobForm")

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const sp = await searchParams
  const defaultCustomerId = sp?.customerId

  const customers = await getCustomersByUser(user.id)

  return (
    <>
      <Topbar
        title={t("newTitle")}
        action={
          <Link
            href={defaultCustomerId ? `/customers/${defaultCustomerId}` : "/jobs"}
            className="flex items-center gap-1 text-sm h-8 px-2 rounded-lg transition-colors hover:bg-[var(--accent)] cursor-pointer"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        }
      />
      <div className="pt-2">
        <JobForm customers={customers} defaultCustomerId={defaultCustomerId} />
      </div>
    </>
  )
}
