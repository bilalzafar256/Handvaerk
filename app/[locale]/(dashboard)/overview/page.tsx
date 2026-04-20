
import { CriticalZone } from "@/components/dashboard/critical-zone"
import { StatCards } from "@/components/dashboard/stat-cards"
import { TodayJobs } from "@/components/dashboard/today-jobs"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { setRequestLocale, getTranslations } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  getOverviewStats,
  getStatCardData,
  getOverdueInvoices,
  getTodayJobs,
  getRecentActivity,
  getMonthlyRevenue,
} from "@/lib/db/queries/overview"
import { getReadyRecordingsForUser } from "@/lib/db/queries/ai-recordings"
import { getActiveEntry, getActiveJobsForUser } from "@/lib/db/queries/time-entries"
import { QuickTimerCard } from "@/components/dashboard/quick-timer-card"
import { Topbar } from "@/components/shared/topbar"
import { Link } from "@/i18n/navigation"
import { Briefcase, ChevronRight, Mic } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"
import { StatusBadge } from "@/components/jobs/status-changer"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

function getGreetingKey(): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  const hour = new Date().getHours()
  if (hour < 12) return "greetingMorning"
  if (hour < 17) return "greetingAfternoon"
  return "greetingEvening"
}

const STATUS_BAR_COLOR: Record<string, string> = {
  new:         "oklch(0.45 0.18 200)",
  scheduled:   "oklch(0.45 0.16 240)",
  in_progress: "oklch(0.65 0.20 60)",
  done:        "oklch(0.45 0.14 290)",
  invoiced:    "oklch(0.52 0.18 50)",
  paid:        "oklch(0.45 0.18 145)",
}

export default async function OverviewPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Overview")

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const [stats, statCardData, overdueInvoices, todayJobsList, activityItems, readyRecordings, monthlyRevenue, activeEntry, activeJobs] =
    await Promise.all([
      getOverviewStats(user.id),
      getStatCardData(user.id),
      getOverdueInvoices(user.id),
      getTodayJobs(user.id),
      getRecentActivity(user.id),
      getReadyRecordingsForUser(user.id),
      getMonthlyRevenue(user.id),
      getActiveEntry(user.id),
      getActiveJobsForUser(user.id),
    ])

  const firstName = user.companyName?.split(" ")[0] ?? "der"
  const greetingKey = getGreetingKey()

  const todayJobCount = stats.statusCounts.in_progress + stats.statusCounts.scheduled
  const pendingQuotes = stats.openQuoteCount

  const summaryParts: string[] = []
  if (todayJobCount > 0) summaryParts.push(t("summaryJobsToday", { count: todayJobCount }))
  if (pendingQuotes > 0) summaryParts.push(t("summaryPendingQuotes", { count: pendingQuotes }))
  const summary = summaryParts.length > 0 ? summaryParts.join(" · ") + "." : t("summaryQuiet")

  const totalJobCount = Object.values(stats.statusCounts).reduce((s, n) => s + n, 0)
  const pipelineStages = [
    { key: "new",         label: "New",         count: stats.statusCounts.new },
    { key: "scheduled",   label: "Scheduled",   count: stats.statusCounts.scheduled },
    { key: "in_progress", label: "In progress", count: stats.statusCounts.in_progress },
    { key: "done",        label: "Done",        count: stats.statusCounts.done },
    { key: "invoiced",    label: "Invoiced",    count: stats.statusCounts.invoiced },
    { key: "paid",        label: "Paid",        count: stats.statusCounts.paid },
  ].filter(s => s.count > 0)

  const revenueMax = Math.max(...monthlyRevenue.map(m => m.value), 1)
  const revenue6mTotal = monthlyRevenue.reduce((s, m) => s + m.value, 0)

  return (
    <>
      <Topbar title={t("title")} />

      <main className="pt-4 pb-24 md:pb-10 px-4 lg:px-6 space-y-5">

        {/* Greeting */}
        <div className="pt-4">
          <h1
            className="text-[22px] font-bold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            {t(greetingKey)}, {firstName}.
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}
          >
            {summary}
          </p>
        </div>

        {/* Quick timer */}
        <QuickTimerCard activeEntry={activeEntry ?? null} jobs={activeJobs} />

        {/* Ready recordings banner */}
        {readyRecordings.length > 0 && (
          <Link
            href={`/jobs/record/${readyRecordings[0].id}`}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 active:scale-[0.99]"
            style={{ backgroundColor: "oklch(0.97 0.03 145)", borderColor: "oklch(0.82 0.12 145)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "oklch(0.90 0.08 145)" }}
            >
              <Mic className="w-4 h-4" style={{ color: "oklch(0.32 0.14 145)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)", color: "oklch(0.28 0.14 145)" }}>
                {readyRecordings.length === 1
                  ? "1 recording ready to review"
                  : `${readyRecordings.length} recordings ready to review`}
              </p>
              <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "oklch(0.40 0.10 145)" }}>
                AI has finished processing — tap to confirm and create job
              </p>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.40 0.10 145)" }} />
          </Link>
        )}

        {/* Record job quick action */}
        <Link
          href="/jobs/record"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-150 active:scale-[0.99]"
          style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-accent)" }}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
            <Mic className="w-4 h-4" style={{ color: "var(--primary-foreground)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)", color: "var(--primary-foreground)" }}>
              Record job
            </p>
            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--primary-foreground)", opacity: 0.75 }}>
              AI extracts customer, job & quote from conversation
            </p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary-foreground)", opacity: 0.6 }} />
        </Link>

        {/* Critical zone */}
        <CriticalZone overdue={overdueInvoices} />

        {/* 6 stat cards */}
        <StatCards
          data={statCardData}
          openQuoteCount={stats.openQuoteCount}
          customerCount={stats.customerCount}
        />

        {/* Revenue trend — last 6 months */}
        <section
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="px-5 py-3.5 border-b flex items-center justify-between"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
            >
              Revenue — last 6 months
            </p>
            {revenue6mTotal > 0 && (
              <p
                className="text-xs font-medium"
                style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
              >
                {formatDKK(revenue6mTotal)} paid
              </p>
            )}
          </div>
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-end gap-2 h-[96px]">
              {monthlyRevenue.map((m, i) => {
                const pct = revenueMax > 0 ? (m.value / revenueMax) * 100 : 0
                const isCurrent = i === monthlyRevenue.length - 1
                const opacity = 0.2 + (i / 5) * 0.8
                return (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                    <div className="flex-1 w-full flex items-end">
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: m.value > 0 ? `${Math.max(pct, 4)}%` : "3px",
                          backgroundColor: "var(--primary)",
                          opacity: isCurrent ? 1 : opacity,
                        }}
                      />
                    </div>
                    <p
                      className="text-[10px] leading-none"
                      style={{
                        color: isCurrent ? "var(--foreground)" : "var(--muted-foreground)",
                        fontFamily: "var(--font-body)",
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      {m.label}
                    </p>
                  </div>
                )
              })}
            </div>
            {revenue6mTotal === 0 && (
              <p
                className="text-sm text-center pt-2"
                style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
              >
                No paid invoices yet — chart will fill in as you get paid.
              </p>
            )}
          </div>
        </section>

        {/* Job pipeline */}
        {pipelineStages.length > 0 && (
          <section
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
          >
            <div
              className="px-5 py-3.5 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
              >
                Job pipeline
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
              >
                {totalJobCount} total
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {pipelineStages.map(stage => (
                <div key={stage.key} className="flex items-center gap-3">
                  <p
                    className="text-xs font-medium w-[72px] shrink-0"
                    style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
                  >
                    {stage.label}
                  </p>
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--muted)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${totalJobCount > 0 ? (stage.count / totalJobCount) * 100 : 0}%`,
                        backgroundColor: STATUS_BAR_COLOR[stage.key],
                      }}
                    />
                  </div>
                  <p
                    className="text-xs font-bold w-5 text-right shrink-0"
                    style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)" }}
                  >
                    {stage.count}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Today + Activity grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TodayJobs jobs={todayJobsList} />
          <ActivityFeed items={activityItems} />
        </div>

        {/* Recent jobs */}
        {stats.recentJobs.length > 0 && (
          <section
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}
              >
                {t("recentJobs")}
              </p>
              <Link
                href="/jobs"
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ fontFamily: "var(--font-body)", color: "var(--primary)" }}
              >
                {t("viewAll")}
              </Link>
            </div>
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {stats.recentJobs.map((job) => (
                <RecentJobRow key={job.id} job={job as Job & { customer: Customer }} />
              ))}
            </ul>
          </section>
        )}

        {/* Empty state */}
        {stats.customerCount === 0 && stats.activeJobCount === 0 && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-light)" }}
            >
              <Briefcase className="w-7 h-7" style={{ color: "var(--primary)" }} />
            </div>
            <div className="space-y-1">
              <p
                className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
              >
                {t("emptyTitle")}
              </p>
              <p
                className="text-sm max-w-[260px]"
                style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}
              >
                {t("emptyDescription")}
              </p>
            </div>
            <Link
              href="/customers/new"
              className="flex items-center gap-2 h-10 px-5 rounded-[--radius-md] text-sm font-medium transition-all duration-150 active:scale-[0.98]"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                fontFamily: "var(--font-body)",
                boxShadow: "var(--shadow-accent)",
              }}
            >
              {t("emptyCta")}
            </Link>
          </div>
        )}
      </main>
    </>
  )
}

function RecentJobRow({ job }: { job: Job & { customer: Customer } }) {
  return (
    <li>
      <Link
        href={`/jobs/${job.id}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--accent)]"
      >
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          >
            {job.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p
              className="text-xs truncate"
              style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}
            >
              {job.customer.name}
            </p>
            <span style={{ color: "var(--muted-foreground)" }}>·</span>
            <p
              className="text-xs flex-shrink-0"
              style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}
            >
              #{job.jobNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={job.status as Parameters<typeof StatusBadge>[0]["status"]} />
          <ChevronRight className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
        </div>
      </Link>
    </li>
  )
}
