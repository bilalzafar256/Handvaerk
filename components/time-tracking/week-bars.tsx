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

function fmtCompact(minutes: number): string {
  if (!minutes) return ""
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m}m`
  if (!m) return `${h}h`
  return `${h}h`
}

function fmtFull(minutes: number): string {
  if (!minutes) return "0h"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!m) return `${h}h`
  return `${h}h ${m}m`
}

export interface WeekBarsEntry {
  startedAt: Date | string
  durationMinutes: number | null
  isBillable: boolean | null
}

interface WeekBarsProps {
  entries: WeekBarsEntry[]
  weekStart: Date
  selectedDay: string
}

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"]
const BAR_MAX_H = 64

export function WeekBars({ entries, weekStart, selectedDay }: WeekBarsProps) {
  const router = useRouter()
  const today = toISO(new Date())
  const isCurrentWeek = toISO(weekStart) === toISO(startOfWeek(new Date()))

  const dayMap: Record<string, { total: number; billable: number }> = {}
  for (const e of entries) {
    if (!e.durationMinutes) continue
    const k = toISO(new Date(e.startedAt))
    if (!dayMap[k]) dayMap[k] = { total: 0, billable: 0 }
    dayMap[k].total += e.durationMinutes
    if (e.isBillable) dayMap[k].billable += e.durationMinutes
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const maxMins = Math.max(...days.map(d => dayMap[toISO(d)]?.total ?? 0), 1)
  const weekTotal = days.reduce((s, d) => s + (dayMap[toISO(d)]?.total ?? 0), 0)
  const weekBillable = days.reduce((s, d) => s + (dayMap[toISO(d)]?.billable ?? 0), 0)

  function goToDay(day: Date) {
    router.push(`/time-tracking?week=${toISO(weekStart)}&day=${toISO(day)}`)
  }

  function navWeek(dir: -1 | 1) {
    const newWeek = addDays(weekStart, dir * 7)
    const landDay = dir === -1 ? addDays(newWeek, 6) : newWeek
    router.push(`/time-tracking?week=${toISO(newWeek)}&day=${toISO(landDay)}`)
  }

  const weekLabel = isCurrentWeek
    ? "This week"
    : `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(weekStart, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-11 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
      >
        <div className="flex items-center gap-1.5">
          <NavBtn onClick={() => navWeek(-1)}><ChevronLeft className="w-3.5 h-3.5" /></NavBtn>
          <span
            className="text-sm font-semibold text-center"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", minWidth: 120, display: "inline-block" }}
          >
            {weekLabel}
          </span>
          <NavBtn onClick={() => navWeek(1)} disabled={isCurrentWeek}><ChevronRight className="w-3.5 h-3.5" /></NavBtn>
        </div>

        {weekTotal > 0 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--primary)", fontWeight: 600 }}>{fmtFull(weekBillable)}</span>
            <span style={{ color: "var(--text-tertiary)" }}>/</span>
            <span style={{ color: "var(--text-secondary)" }}>{fmtFull(weekTotal)}</span>
          </div>
        )}
      </div>

      {/* Bar chart grid */}
      <div className="grid grid-cols-7 px-2 pt-3 pb-3 gap-x-1">
        {days.map((day, i) => {
          const iso = toISO(day)
          const data = dayMap[iso]
          const isSelected = iso === selectedDay
          const isToday = iso === today

          const totalH = data ? Math.round((data.total / maxMins) * BAR_MAX_H) : 0
          const billableH = data && data.total > 0 ? Math.round((data.billable / data.total) * totalH) : 0
          const nonBillableH = totalH - billableH

          return (
            <button
              key={iso}
              onClick={() => goToDay(day)}
              className="flex flex-col items-center gap-1.5 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: isSelected ? "oklch(0.97 0.04 58)" : undefined }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-subtle)" }}
              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "" }}
            >
              {/* Day letter */}
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  fontFamily: "var(--font-body)",
                  color: isSelected || isToday ? "var(--primary)" : "var(--text-tertiary)",
                }}
              >
                {DAY_LETTERS[i]}
              </span>

              {/* Day number */}
              <div
                className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0"
                style={{ backgroundColor: isToday ? "var(--primary)" : "transparent" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
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

              {/* Vertical bar */}
              <div
                className="w-5 rounded-md overflow-hidden flex flex-col justify-end"
                style={{ height: BAR_MAX_H, backgroundColor: "var(--background-subtle)" }}
              >
                {totalH > 0 && (
                  <div style={{ height: totalH, width: "100%", display: "flex", flexDirection: "column" }}>
                    {nonBillableH > 0 && (
                      <div style={{ height: nonBillableH, width: "100%", backgroundColor: "var(--border-strong)" }} />
                    )}
                    {billableH > 0 && (
                      <div
                        style={{
                          height: billableH,
                          width: "100%",
                          backgroundColor: isSelected ? "var(--primary)" : "oklch(0.76 0.17 58)",
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Duration label */}
              <span
                className="text-[10px] leading-tight"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: isSelected ? "var(--primary)" : "var(--text-tertiary)",
                  opacity: data ? 1 : 0,
                  minHeight: "1em",
                }}
              >
                {fmtCompact(data?.total ?? 0)}
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
