import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
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
import { getOverviewStats } from "@/lib/db/queries/overview"
import { Topbar } from "@/components/shared/topbar"
import { Link } from "@/i18n/navigation"
import { Users, Briefcase, FileText, Receipt, TrendingUp, ChevronRight } from "lucide-react"
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

export default async function OverviewPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Overview")

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const stats = await getOverviewStats(user.id)
  const firstName = user.companyName?.split(" ")[0] ?? "der"
  const greetingKey = getGreetingKey()

  const todayJobCount = stats.statusCounts.in_progress + stats.statusCounts.scheduled
  const pendingQuotes = stats.openQuoteCount

  const summaryParts: string[] = []
  if (todayJobCount > 0) summaryParts.push(t("summaryJobsToday", { count: todayJobCount }))
  if (pendingQuotes > 0) summaryParts.push(t("summaryPendingQuotes", { count: pendingQuotes }))
  const summary = summaryParts.length > 0 ? summaryParts.join(" · ") + "." : t("summaryQuiet")

  return (
    <>
      <Topbar title={t("title")} />

      <main className="pt-16 pb-24 md:pb-10 px-4 md:px-6 max-w-5xl mx-auto space-y-5">

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

        {/* Critical zone */}
        <Suspense fallback={<Skeleton className="h-14 w-full rounded-xl" />}>
          <CriticalZone />
        </Suspense>

        {/* Stat cards */}
        <Suspense
          fallback={
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          }
        >
          <StatCards />
        </Suspense>

        {/* Quick stat tiles */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={Briefcase} label={t("statsActiveJobs")} value={stats.activeJobCount} href="/jobs" variant="amber" />
          <StatTile icon={Users} label={t("statsCustomers")} value={stats.customerCount} href="/customers" variant="blue" />
          <StatTile icon={FileText} label={t("statOpenQuotes")} value={stats.openQuoteCount} href="/quotes" variant="default" />
          <StatTile icon={Receipt} label={t("statPendingInvoices")} value={stats.pendingInvoiceCount} href="/invoices" variant="green" />
        </div>

        {/* Financial summary */}
        {(stats.pendingInvoiceTotal > 0 || stats.paidThisMonth > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <FinanceTile label={t("financeOutstanding")} value={formatDKK(stats.pendingInvoiceTotal)} icon={<Receipt className="w-4 h-4" />} alert={stats.pendingInvoiceTotal > 0} />
            <FinanceTile label={t("financePaidThisMonth")} value={formatDKK(stats.paidThisMonth)} icon={<TrendingUp className="w-4 h-4" />} />
          </div>
        )}

        {/* Today + Activity grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Suspense fallback={<Skeleton className="h-56 rounded-xl" />}>
            <TodayJobs />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-56 rounded-xl" />}>
            <ActivityFeed />
          </Suspense>
        </div>

        {/* Status breakdown */}
        {stats.activeJobCount > 0 && (
          <section
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                {t("jobsByStatus")}
              </p>
            </div>
            <div className="px-4 py-3 flex flex-wrap gap-3">
              {(
                [
                  ["new", stats.statusCounts.new],
                  ["scheduled", stats.statusCounts.scheduled],
                  ["in_progress", stats.statusCounts.in_progress],
                  ["done", stats.statusCounts.done],
                  ["invoiced", stats.statusCounts.invoiced],
                  ["paid", stats.statusCounts.paid],
                ] as const
              )
                .filter(([, n]) => n > 0)
                .map(([status, n]) => (
                  <div key={status} className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    <span className="text-sm font-semibold"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                      {n}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}

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
              <p className="text-xs font-semibold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                {t("recentJobs")}
              </p>
              <Link href="/jobs"
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ fontFamily: "var(--font-body)", color: "var(--primary)" }}>
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-light)" }}>
              <Briefcase className="w-7 h-7" style={{ color: "var(--primary)" }} />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                {t("emptyTitle")}
              </p>
              <p className="text-sm max-w-[260px]"
                style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                {t("emptyDescription")}
              </p>
            </div>
            <Link href="/customers/new"
              className="flex items-center gap-2 h-10 px-5 rounded-[--radius-md] text-sm font-medium transition-all duration-150 active:scale-[0.98]"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                fontFamily: "var(--font-body)",
                boxShadow: "var(--shadow-accent)",
              }}>
              {t("emptyCta")}
            </Link>
          </div>
        )}
      </main>
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon, label, value, href, variant,
}: {
  icon: React.ElementType; label: string; value: number; href: string; variant: "amber" | "blue" | "green" | "default"
}) {
  const colors = {
    amber:   { bg: "var(--amber-100)", text: "var(--amber-800)",                iconBg: "var(--amber-200)" },
    blue:    { bg: "oklch(0.93 0.04 240)", text: "oklch(0.35 0.14 240)",         iconBg: "oklch(0.88 0.06 240)" },
    green:   { bg: "oklch(0.93 0.06 145)", text: "oklch(0.32 0.14 145)",         iconBg: "oklch(0.86 0.09 145)" },
    default: { bg: "var(--muted)",          text: "var(--foreground)",            iconBg: "var(--border)" },
  }[variant]

  return (
    <Link href={href}
      className="rounded-xl p-4 flex flex-col gap-2.5 transition-opacity active:opacity-75"
      style={{ backgroundColor: colors.bg }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: colors.iconBg }}>
        <Icon className="w-4 h-4" style={{ color: colors.text }} />
      </div>
      <div>
        <p className="text-3xl font-bold leading-none"
          style={{ fontFamily: "var(--font-display)", color: colors.text }}>
          {value}
        </p>
        <p className="text-xs font-medium mt-1"
          style={{ fontFamily: "var(--font-body)", color: colors.text, opacity: 0.75 }}>
          {label}
        </p>
      </div>
    </Link>
  )
}

function FinanceTile({
  label, value, icon, alert,
}: {
  label: string; value: string; icon: React.ReactNode; alert?: boolean
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: alert ? "var(--destructive)" : "var(--muted-foreground)" }}>{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
          {label}
        </p>
      </div>
      <p className="text-xl font-bold leading-none"
        style={{
          fontFamily: "var(--font-mono)",
          color: alert ? "var(--destructive)" : "var(--foreground)",
        }}>
        {value}
      </p>
    </div>
  )
}

function RecentJobRow({ job }: { job: Job & { customer: Customer } }) {
  return (
    <li>
      <Link
        href={`/jobs/${job.id}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors duration-120 hover:bg-[--muted]"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate"
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
            {job.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs truncate"
              style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
              {job.customer.name}
            </p>
            <span style={{ color: "var(--muted-foreground)" }}>·</span>
            <p className="text-xs flex-shrink-0"
              style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
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
