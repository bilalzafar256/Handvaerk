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
import { Users, Briefcase, ChevronRight, FileText, Receipt, TrendingUp, Clock } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"
import { StatusBadge } from "@/components/jobs/status-changer"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export default async function OverviewPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Overview")

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const stats = await getOverviewStats(user.id)

  const firstName = user.companyName?.split(" ")[0] ?? "there"

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

      <div className="pt-14 pb-24 px-4 space-y-6">
        {/* Greeting */}
        <div className="pt-5">
          <p
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {t("greeting", { name: firstName })}
          </p>
          <p
            className="text-sm mt-0.5"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
          >
            {t("greetingSub")}
          </p>
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Users}
            label={t("statsCustomers")}
            value={stats.customerCount}
            href="/customers"
            color="blue"
          />
          <StatCard
            icon={Briefcase}
            label={t("statsActiveJobs")}
            value={stats.activeJobCount}
            href="/jobs"
            color="amber"
          />
          <StatCard
            icon={FileText}
            label="Open quotes"
            value={stats.openQuoteCount}
            href="/quotes"
            color="progress"
          />
          <StatCard
            icon={Receipt}
            label="Pending invoices"
            value={stats.pendingInvoiceCount}
            href="/invoices"
            color="green"
          />
        </div>

        {/* Financial summary row */}
        {(stats.pendingInvoiceTotal > 0 || stats.paidThisMonth > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-[--radius-lg] p-4 flex flex-col gap-2"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
                  Outstanding
                </p>
              </div>
              <p className="text-xl font-bold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                {formatDKK(stats.pendingInvoiceTotal)}
              </p>
            </div>
            <div
              className="rounded-[--radius-lg] p-4 flex flex-col gap-2"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
                  Paid this month
                </p>
              </div>
              <p className="text-xl font-bold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                {formatDKK(stats.paidThisMonth)}
              </p>
            </div>
          </div>
        )}

        {/* Status breakdown */}
        {stats.activeJobCount > 0 && (
          <section
            className="rounded-[--radius-lg] border overflow-hidden"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
              >
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
                    <span
                      className="text-sm font-semibold"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
                    >
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
            className="rounded-[--radius-lg] border overflow-hidden"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
              >
                {t("recentJobs")}
              </p>
              <Link
                href="/jobs"
                className="text-xs font-medium transition-colors duration-150"
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

        {/* Empty state — no data yet */}
        {stats.customerCount === 0 && stats.activeJobCount === 0 && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div
              className="w-16 h-16 rounded-[--radius-xl] flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-light)" }}
            >
              <Briefcase className="w-8 h-8" style={{ color: "var(--primary)" }} />
            </div>
            <div className="space-y-1">
              <p
                className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                {t("emptyTitle")}
              </p>
              <p
                className="text-sm max-w-[260px]"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
              >
                {t("emptyDescription")}
              </p>
            </div>
            <Link
              href="/customers/new"
              className="flex items-center gap-2 h-11 px-5 rounded-[--radius-md] text-sm font-medium transition-all duration-200 active:scale-[0.98]"
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
      </div>
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  href: string
  color: "blue" | "amber" | "progress" | "green"
}) {
  const styles = {
    blue:     { bg: "oklch(0.93 0.04 240)", text: "oklch(0.35 0.14 240)", iconBg: "oklch(0.88 0.06 240)" },
    amber:    { bg: "var(--amber-100)",    text: "var(--amber-800)",      iconBg: "var(--amber-200)" },
    progress: { bg: "var(--amber-100)",    text: "var(--amber-800)",      iconBg: "var(--amber-200)" },
    green:    { bg: "oklch(0.93 0.06 145)", text: "oklch(0.32 0.14 145)", iconBg: "oklch(0.86 0.09 145)" },
  }[color]

  return (
    <Link
      href={href}
      className="rounded-[--radius-lg] p-4 flex flex-col gap-3 transition-opacity duration-150 active:opacity-80"
      style={{ backgroundColor: styles.bg, border: "none" }}
    >
      <div
        className="w-9 h-9 rounded-[--radius-sm] flex items-center justify-center"
        style={{ backgroundColor: styles.iconBg }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: styles.text }} />
      </div>
      <div>
        <p
          className="text-3xl font-bold leading-none"
          style={{ fontFamily: "var(--font-display)", color: styles.text }}
        >
          {value}
        </p>
        <p
          className="text-xs font-medium mt-1"
          style={{ fontFamily: "var(--font-body)", color: styles.text, opacity: 0.75 }}
        >
          {label}
        </p>
      </div>
    </Link>
  )
}

function RecentJobRow({ job }: { job: Job & { customer: Customer } }) {
  return (
    <li>
      <Link
        href={`/jobs/${job.id}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[--background-subtle]"
      >
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
          >
            {job.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p
              className="text-xs truncate"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
            >
              {job.customer.name}
            </p>
            <span style={{ color: "var(--text-tertiary)" }}>·</span>
            <p
              className="text-xs flex-shrink-0"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
            >
              #{job.jobNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={job.status as Parameters<typeof StatusBadge>[0]["status"]} />
          <ChevronRight className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
        </div>
      </Link>
    </li>
  )
}

// Inline clock icon for scheduled date hint
function _ClockHint({ date }: { date: string | null }) {
  if (!date) return null
  return (
    <div className="flex items-center gap-1">
      <Clock className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
      <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
        {new Date(date).toLocaleDateString("en-DK", { day: "numeric", month: "short" })}
      </p>
    </div>
  )
}
