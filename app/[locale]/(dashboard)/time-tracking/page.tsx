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
import { TimerZone } from "@/components/time-tracking/timer-zone"
import { DayStrip } from "@/components/time-tracking/day-strip"
import { DayView } from "@/components/time-tracking/day-view"
import { MonthCalendar } from "@/components/time-tracking/month-calendar"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Time tracking | Håndværk Pro" }
export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ week?: string; day?: string }>
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
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
  const { week, day } = await searchParams
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

  // Determine selected day
  const today = startOfDay(new Date())
  let selectedDay: Date
  if (day) {
    selectedDay = startOfDay(new Date(day + "T00:00:00"))
  } else {
    const todayTime = today.getTime()
    const inThisWeek = todayTime >= weekStart.getTime() && todayTime <= weekEnd.getTime()
    selectedDay = inThisWeek ? today : weekStart
  }

  const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1)
  const monthEnd = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0, 23, 59, 59, 999)

  const [entries, activeEntry, activeJobs, monthEntries] = await Promise.all([
    getWeeklyEntries(user.id, weekStart, weekEnd),
    getActiveEntry(user.id),
    getActiveJobsForUser(user.id),
    getMonthlyEntries(user.id, monthStart, monthEnd),
  ])

  // Weekly unbilled nudge
  const unbilledMinutes = entries
    .filter(e => e.endedAt && e.isBillable && !e.billedToQuoteId && !e.billedToInvoiceId)
    .reduce((s, e) => s + (e.durationMinutes ?? 0), 0)

  const jobOptions = activeJobs.map(j => ({
    id: j.id,
    title: j.title,
    customer: { name: j.customer.name },
  }))

  const selectedDayISO = toISO(selectedDay)

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

        {/* 1. Active timer */}
        <TimerZone
          activeEntry={activeEntry as Parameters<typeof TimerZone>[0]["activeEntry"]}
          jobs={jobOptions}
        />

        {/* 2. Week strip with day selector */}
        <DayStrip
          entries={entries}
          weekStart={weekStart}
          selectedDay={selectedDayISO}
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

        {/* 4. Day view — timeline + entry list */}
        <DayView
          entries={entries as Parameters<typeof DayView>[0]["entries"]}
          selectedDay={selectedDay}
          activeJobs={jobOptions}
          hourlyRate={user.hourlyRate ?? null}
        />

        {/* 5. Month calendar */}
        <MonthCalendar
          entries={monthEntries}
          weekStart={weekStart}
          monthStart={monthStart}
          selectedDay={selectedDayISO}
        />
      </main>
    </>
  )
}
