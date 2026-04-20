import { setRequestLocale, getTranslations } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getJobsByUser } from "@/lib/db/queries/jobs"
import { getActiveEntry } from "@/lib/db/queries/time-entries"
import { Topbar } from "@/components/shared/topbar"
import { JobList } from "@/components/jobs/job-list"
import { Link } from "@/i18n/navigation"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Jobs" })
  return { title: t("pageTitle") }
}

export default async function JobsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("Jobs")

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const [jobs, activeEntry] = await Promise.all([
    getJobsByUser(user.id),
    getActiveEntry(user.id),
  ])

  return (
    <>
      <Topbar
        title={t("title")}
        action={
          <Link
            href="/jobs/new"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-[var(--primary)] hover:bg-[var(--amber-600)] transition-colors active:scale-[0.98] cursor-pointer"
            style={{ color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            <Plus className="w-4 h-4" />
            {t("newJob")}
          </Link>
        }
      />
      <div>
        <JobList jobs={jobs} activeJobId={activeEntry?.jobId} activeEntryId={activeEntry?.id} />
      </div>
    </>
  )
}
