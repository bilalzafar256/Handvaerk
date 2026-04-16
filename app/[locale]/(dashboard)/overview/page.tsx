import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { Skeleton } from "@/components/ui/skeleton"
import { Topbar } from "@/components/shared/topbar"
import { CriticalZone } from "@/components/dashboard/critical-zone"
import { StatCards } from "@/components/dashboard/stat-cards"
import { TodayJobs } from "@/components/dashboard/today-jobs"
import { ActivityFeed } from "@/components/dashboard/activity-feed"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export default async function OverviewPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Overview")

  return (
    <>
      <Topbar title={t("title")} />
      <main className="pt-20 pb-24 md:pb-8 px-4 md:px-6 space-y-6 max-w-6xl mx-auto">

        {/* Zone 1 — Critical: overdue invoices or calm state */}
        <Suspense fallback={<Skeleton className="h-16 w-full rounded-xl" />}>
          <CriticalZone />
        </Suspense>

        {/* Zone 2 — Status: 4 stat cards */}
        <Suspense
          fallback={
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          }
        >
          <StatCards />
        </Suspense>

        {/* Zone 3 — Action: today's jobs + recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <TodayJobs />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <ActivityFeed />
          </Suspense>
        </div>

      </main>
    </>
  )
}
