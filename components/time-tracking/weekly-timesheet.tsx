"use client"

import { useRouter } from "@/i18n/navigation"
import { ChevronLeft, ChevronRight, Clock, DollarSign } from "lucide-react"
import type { TimeEntry } from "@/lib/db/schema/time-entries"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"

type EntryWithJob = TimeEntry & { job: Job & { customer: Customer } }

function formatDuration(minutes: number) {
  if (minutes === 0) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday = start
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toISO(date: Date) {
  return date.toISOString().split("T")[0]
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface WeeklyTimesheetProps {
  entries: EntryWithJob[]
  weekStart: Date
}

export function WeeklyTimesheet({ entries, weekStart }: WeeklyTimesheetProps) {
  const router = useRouter()

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = toISO(new Date())

  const totalMinutes = entries.filter(e => e.endedAt).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
  const billableMinutes = entries.filter(e => e.endedAt && e.isBillable).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)

  function navigate(direction: -1 | 1) {
    const newWeek = addDays(weekStart, direction * 7)
    router.push(`/time-tracking?week=${toISO(newWeek)}`)
  }

  const isCurrentWeek = toISO(weekStart) === toISO(startOfWeek(new Date()))

  return (
    <div className="space-y-5">
      {/* Week nav header */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "var(--background)" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background)"}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              {isCurrentWeek ? "This week" : `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(weekStart, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
            </p>
            <button
              onClick={() => navigate(1)}
              disabled={isCurrentWeek}
              className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "var(--background)" }}
              onMouseEnter={e => !(e.currentTarget as HTMLButtonElement).disabled && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)")}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background)"}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600 }}>
                {formatDuration(totalMinutes)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontWeight: 600 }}>
                {formatDuration(billableMinutes)}
              </span>
              <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>billable</span>
            </div>
          </div>
        </div>

        {/* Day rows */}
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {weekDays.map((day, i) => {
            const dayStr = toISO(day)
            const dayEntries = entries.filter(e => toISO(new Date(e.startedAt)) === dayStr)
            const dayMinutes = dayEntries.filter(e => e.endedAt).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
            const isToday = dayStr === today
            const hasEntries = dayEntries.length > 0

            return (
              <div
                key={dayStr}
                style={{ backgroundColor: isToday ? "oklch(0.98 0.02 58)" : undefined }}
              >
                {/* Day header */}
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-[72px] shrink-0 flex items-center gap-2">
                    <p
                      className="text-xs font-semibold"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: isToday ? "var(--primary)" : "var(--muted-foreground)",
                      }}
                    >
                      {DAY_LABELS[i]}
                    </p>
                    <p
                      className="text-xs"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}
                    >
                      {day.getDate()}
                    </p>
                  </div>

                  {hasEntries ? (
                    <>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--muted)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((dayMinutes / 480) * 100, 100)}%`,
                            backgroundColor: isToday ? "var(--primary)" : "oklch(0.60 0.14 58)",
                            opacity: isToday ? 1 : 0.6,
                          }}
                        />
                      </div>
                      <p
                        className="text-xs font-semibold shrink-0 w-12 text-right"
                        style={{ fontFamily: "var(--font-mono)", color: isToday ? "var(--primary)" : "var(--foreground)" }}
                      >
                        {formatDuration(dayMinutes)}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs flex-1" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                      —
                    </p>
                  )}
                </div>

                {/* Entry details */}
                {dayEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-4 pb-2 pl-[88px]"
                  >
                    <p
                      className="text-xs flex-1 truncate"
                      style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
                    >
                      {entry.job.title}
                      {entry.description ? ` · ${entry.description}` : ""}
                    </p>
                    <p className="text-xs shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                      {formatTime(entry.startedAt)}
                      {entry.endedAt ? ` – ${formatTime(entry.endedAt)}` : " (running)"}
                    </p>
                    {!entry.isBillable && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                        non-billable
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
