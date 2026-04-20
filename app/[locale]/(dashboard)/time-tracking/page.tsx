import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getWeeklyEntries, getActiveEntry } from "@/lib/db/queries/time-entries"
import { Topbar } from "@/components/shared/topbar"
import { WeeklyTimesheet } from "@/components/time-tracking/weekly-timesheet"
import { ClockPanel } from "@/components/time-tracking/clock-panel"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Time tracking | Håndværk Pro" }
export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ week?: string }> }

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function TimeTrackingPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { week } = await searchParams
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const weekStart = week ? (() => {
    const d = new Date(week + "T00:00:00")
    return startOfWeek(d)
  })() : startOfWeek(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [entries, activeEntry] = await Promise.all([
    getWeeklyEntries(user.id, weekStart, weekEnd),
    getActiveEntry(user.id),
  ])

  return (
    <>
      <Topbar title="Time tracking" />
      <main className="pt-4 pb-24 md:pb-10 px-4 lg:px-6 space-y-5">
        <div className="pt-4">
          <h1 className="text-[22px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Time tracking
          </h1>
        </div>

        {/* Active timer indicator */}
        {activeEntry && (
          <ClockPanel
            jobId={activeEntry.jobId}
            activeEntry={activeEntry}
            isThisJobActive={true}
          />
        )}

        <WeeklyTimesheet entries={entries as Parameters<typeof WeeklyTimesheet>[0]["entries"]} weekStart={weekStart} />
      </main>
    </>
  )
}
