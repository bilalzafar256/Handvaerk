import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  getWeeklyEntries,
  getActiveEntry,
  getActiveJobsForUser,
  getMonthlyEntries,
} from "@/lib/db/queries/time-entries"
import { Topbar } from "@/components/shared/topbar"
import { WeeklyTimesheet } from "@/components/time-tracking/weekly-timesheet"
import { TimerZone } from "@/components/time-tracking/timer-zone"
import { WeeklySummaryBar } from "@/components/time-tracking/weekly-summary-bar"
import { MonthCalendar } from "@/components/time-tracking/month-calendar"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Time tracking | Håndværk Pro" }
export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ week?: string }> }

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDuration(minutes: number) {
  if (minutes === 0) return "0m"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default async function TimeTrackingPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { week } = await searchParams
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const weekStart = week
    ? startOfWeek(new Date(week + "T00:00:00"))
    : startOfWeek(new Date())

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1)
  const monthEnd   = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0, 23, 59, 59, 999)

  const [entries, activeEntry, activeJobs, monthEntries] = await Promise.all([
    getWeeklyEntries(user.id, weekStart, weekEnd),
    getActiveEntry(user.id),
    getActiveJobsForUser(user.id),
    getMonthlyEntries(user.id, monthStart, monthEnd),
  ])

  const totalMinutes    = entries.filter(e => e.endedAt).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
  const billableMinutes = entries.filter(e => e.endedAt && e.isBillable).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
  const unbilledMinutes = entries
    .filter(e => e.endedAt && e.isBillable && !e.billedToQuoteId && !e.billedToInvoiceId)
    .reduce((s, e) => s + (e.durationMinutes ?? 0), 0)

  // Cast activeJobs to the shape both TimerZone and WeeklyTimesheet expect
  const jobOptions = activeJobs.map(j => ({
    id: j.id,
    title: j.title,
    customer: { name: j.customer.name },
  }))

  return (
    <>
      <Topbar title="Time tracking" />
      <main className="pt-4 pb-24 md:pb-10 px-4 lg:px-6 space-y-4">
        <div className="pt-4">
          <h1
            className="text-[22px] font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            Time tracking
          </h1>
        </div>

        {/* 1. Timer zone — clock in/out + stale recovery */}
        <TimerZone
          activeEntry={activeEntry as Parameters<typeof TimerZone>[0]["activeEntry"]}
          jobs={jobOptions}
        />

        {/* 2. Weekly stats */}
        <WeeklySummaryBar
          totalMinutes={totalMinutes}
          billableMinutes={billableMinutes}
          hourlyRate={user.hourlyRate ?? null}
        />

        {/* 3. Unbilled nudge */}
        {unbilledMinutes > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ backgroundColor: "oklch(0.97 0.04 58)", borderColor: "oklch(0.85 0.12 58)" }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />
            <p className="text-sm flex-1" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
              <span className="font-semibold">{formatDuration(unbilledMinutes)}</span> unbilled this week
            </p>
            <Link
              href="/jobs"
              className="text-sm font-medium shrink-0 transition-opacity hover:opacity-70"
              style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
            >
              View jobs →
            </Link>
          </div>
        )}

        {/* 4. Month calendar */}
        <MonthCalendar
          entries={monthEntries}
          weekStart={weekStart}
          monthStart={monthStart}
        />

        {/* 5. Weekly timesheet */}
        <WeeklyTimesheet
          entries={entries as Parameters<typeof WeeklyTimesheet>[0]["entries"]}
          weekStart={weekStart}
          activeJobs={jobOptions}
          hourlyRate={user.hourlyRate ?? null}
        />
      </main>
    </>
  )
}
