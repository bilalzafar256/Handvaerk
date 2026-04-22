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
  getUnbilledEntries,
} from "@/lib/db/queries/time-entries"
import { Topbar } from "@/components/shared/topbar"
import { TimeTrackingShell } from "@/components/time-tracking/time-tracking-shell"
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

  const today = startOfDay(new Date())
  let selectedDay: Date
  if (day) {
    selectedDay = startOfDay(new Date(day + "T00:00:00"))
  } else {
    const inThisWeek = today >= weekStart && today <= weekEnd
    selectedDay = inThisWeek ? today : weekStart
  }

  const prevWeekStart = addDays(weekStart, -7)
  const prevWeekEnd  = addDays(weekEnd,   -7)

  const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1)
  const monthEnd   = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0, 23, 59, 59, 999)

  const [entries, activeEntry, activeJobs, monthEntries, prevWeekEntries, unbilledEntries] =
    await Promise.all([
      getWeeklyEntries(user.id, weekStart, weekEnd),
      getActiveEntry(user.id),
      getActiveJobsForUser(user.id),
      getMonthlyEntries(user.id, monthStart, monthEnd),
      getWeeklyEntries(user.id, prevWeekStart, prevWeekEnd),
      getUnbilledEntries(user.id),
    ])

  const prevWeekMinutes = prevWeekEntries
    .filter(e => e.durationMinutes)
    .reduce((s, e) => s + (e.durationMinutes ?? 0), 0)

  const jobOptions = activeJobs.map(j => ({
    id: j.id,
    title: j.title,
    customer: { name: j.customer.name },
  }))

  return (
    <div className="flex flex-col h-full min-h-0">
      <Topbar title="Time tracking" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <TimeTrackingShell
          entries={entries}
          prevWeekMinutes={prevWeekMinutes}
          unbilledEntries={unbilledEntries}
          activeEntry={activeEntry as Parameters<typeof TimeTrackingShell>[0]["activeEntry"]}
          activeJobs={jobOptions}
          monthEntries={monthEntries}
          weekStart={weekStart}
          monthStart={monthStart}
          selectedDay={selectedDay}
          selectedDayISO={toISO(selectedDay)}
          hourlyRate={user.hourlyRate ?? null}
        />
      </div>
    </div>
  )
}
