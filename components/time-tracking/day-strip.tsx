"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "@/i18n/navigation"

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfWeek(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  r.setDate(r.getDate() + (day === 0 ? -6 : 1 - day))
  r.setHours(0, 0, 0, 0)
  return r
}

function fmtDur(minutes: number): string {
  if (!minutes) return ""
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m}m`
  if (!m) return `${h}h`
  return `${h}h ${m}m`
}

export interface DayStripEntry {
  startedAt: Date | string
  durationMinutes: number | null
  isBillable: boolean | null
}

interface DayStripProps {
  entries: DayStripEntry[]
  weekStart: Date
  selectedDay: string
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"]

export function DayStrip({ entries, weekStart, selectedDay }: DayStripProps) {
  const router = useRouter()
  const today = toISO(new Date())
  const isCurrentWeek = toISO(weekStart) === toISO(startOfWeek(new Date()))

  const dayMap: Record<string, { mins: number; billable: number }> = {}
  for (const e of entries) {
    if (!e.durationMinutes) continue
    const k = toISO(new Date(e.startedAt))
    if (!dayMap[k]) dayMap[k] = { mins: 0, billable: 0 }
    dayMap[k].mins += e.durationMinutes
    if (e.isBillable) dayMap[k].billable += e.durationMinutes
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const maxMins = Math.max(...days.map(d => dayMap[toISO(d)]?.mins ?? 0), 1)
  const weekTotal = days.reduce((s, d) => s + (dayMap[toISO(d)]?.mins ?? 0), 0)

  function goToDay(day: Date) {
    router.push(`/time-tracking?week=${toISO(weekStart)}&day=${toISO(day)}`)
  }

  function navWeek(dir: -1 | 1) {
    const newWeek = addDays(weekStart, dir * 7)
    // When going back, land on the last day; going forward, land on Monday
    const landDay = dir === -1 ? addDays(newWeek, 6) : newWeek
    router.push(`/time-tracking?week=${toISO(newWeek)}&day=${toISO(landDay)}`)
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
      {/* Week nav header */}
      <div
        className="flex items-center justify-between px-4 h-11 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
      >
        <div className="flex items-center gap-1.5">
          <NavBtn onClick={() => navWeek(-1)}><ChevronLeft className="w-3.5 h-3.5" /></NavBtn>
          <span
            className="text-sm font-semibold text-center"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", minWidth: 124 }}
          >
            {isCurrentWeek
              ? "This week"
              : `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(weekStart, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
          </span>
          <NavBtn onClick={() => navWeek(1)} disabled={isCurrentWeek}><ChevronRight className="w-3.5 h-3.5" /></NavBtn>
        </div>
        {weekTotal > 0 && (
          <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
            {fmtDur(weekTotal)} this week
          </span>
        )}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const iso = toISO(day)
          const data = dayMap[iso]
          const isSelected = iso === selectedDay
          const isToday = iso === today
          const pct = data ? Math.min((data.mins / maxMins) * 100, 100) : 0

          return (
            <button
              key={iso}
              onClick={() => goToDay(day)}
              className="flex flex-col items-center py-2.5 gap-1 transition-colors border-r last:border-r-0"
              style={{
                backgroundColor: isSelected ? "oklch(0.97 0.04 58)" : undefined,
                borderColor: "var(--border)",
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-subtle)" }}
              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "" }}
            >
              <span
                className="text-[9px] font-semibold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-body)", color: isSelected || isToday ? "var(--primary)" : "var(--text-tertiary)" }}
              >
                {DAYS[i]}
              </span>

              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: isToday ? "var(--primary)" : "transparent" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    fontWeight: isToday || isSelected ? 700 : 400,
                    color: isToday
                      ? "var(--primary-foreground)"
                      : isSelected
                      ? "var(--primary)"
                      : "var(--text-primary)",
                  }}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="w-6 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                {pct > 0 && (
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isSelected
                        ? "var(--primary)"
                        : data?.billable
                        ? "oklch(0.76 0.17 58)"
                        : "var(--text-tertiary)",
                    }}
                  />
                )}
              </div>

              {/* Duration label */}
              <span
                className="text-[10px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: isSelected ? "var(--primary)" : "var(--text-tertiary)",
                  opacity: data ? 1 : 0,
                  minHeight: "1em",
                }}
              >
                {fmtDur(data?.mins ?? 0)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function NavBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-6 h-6 flex items-center justify-center rounded-md border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
      onMouseEnter={e =>
        !(e.currentTarget as HTMLButtonElement).disabled &&
        ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-subtle)")
      }
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
    >
      {children}
    </button>
  )
}
