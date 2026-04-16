import { setRequestLocale, getTranslations } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getJobById } from "@/lib/db/queries/jobs"
import { getCustomersByUser } from "@/lib/db/queries/customers"
import { Topbar } from "@/components/shared/topbar"
import { JobForm } from "@/components/forms/job-form"
import { Link } from "@/i18n/navigation"
import { ChevronLeft } from "lucide-react"

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "JobForm" })
  return { title: t("editTitle") + " | Håndværk Pro" }
}

export default async function EditJobPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const t = await getTranslations("JobForm")

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const [job, customers] = await Promise.all([
    getJobById(id, user.id),
    getCustomersByUser(user.id),
  ])
  if (!job) notFound()

  return (
    <>
      <Topbar
        title={t("editTitle")}
        action={
          <Link
            href={`/jobs/${id}`}
            className="flex items-center gap-1 text-sm h-9 px-2 rounded-[--radius-sm] transition-colors duration-150"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        }
      />
      <div className="pt-14">
        <div className="pt-6">
          <JobForm job={job} customers={customers} />
        </div>
      </div>
    </>
  )
}
