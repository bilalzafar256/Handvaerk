"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useRouter } from "@/i18n/navigation"

function toISO(d: Date) {
  return d.toISOString().split("T")[0]
}

function mondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

export interface MonthEntry {
  startedAt: Date | string
  durationMinutes: number | null
  isBillable: boolean | null
}

interface MonthCalendarProps {
  entries: MonthEntry[]
  weekStart: Date
  monthStart: Date
}

const DAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"]

export function MonthCalendar({ entries, weekStart, monthStart }: MonthCalendarProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const today = toISO(new Date())
  const currentWeekISO = toISO(weekStart)

  // Build per-day summary
  const dayMap: Record<string, { mins: number; hasBillable: boolean }> = {}
  for (const e of entries) {
    const key = toISO(new Date(e.startedAt))
    if (!dayMap[key]) dayMap[key] = { mins: 0, hasBillable: false }
    dayMap[key].mins += e.durationMinutes ?? 0
    if (e.isBillable) dayMap[key].hasBillable = true
  }

  // Build calendar days (Monday-first)
  const year  = monthStart.getFullYear()
  const month = monthStart.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const firstWeekday = monthStart.getDay() // 0=Sun
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1

  const cells: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => new Date(year, month, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function navigateToDay(day: Date) {
    router.push(`/time-tracking?week=${toISO(mondayOfWeek(day))}`)
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
      >
        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          {monthStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-150"
          style={{ color: "var(--text-tertiary)", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
        />
      </button>

      {!collapsed && (
        <div className="px-3 py-3">
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((h, i) => (
              <div key={i} className="text-center py-0.5">
                <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
                  {h}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />

              const iso = toISO(day)
              const data = dayMap[iso]
              const isToday = iso === today
              const weekISO = toISO(mondayOfWeek(day))
              const isInCurrentWeek = weekISO === currentWeekISO

              let dotColor = "transparent"
              if (data) {
                if (data.hasBillable) {
                  const h = data.mins / 60
                  dotColor = h >= 6 ? "var(--primary)" : h >= 3 ? "oklch(0.76 0.17 58)" : "oklch(0.87 0.11 58)"
                } else {
                  dotColor = "var(--border-strong)"
                }
              }

              return (
                <button
                  key={iso}
                  onClick={() => navigateToDay(day)}
                  className="flex flex-col items-center py-1.5 rounded-lg transition-colors"
                  style={{ backgroundColor: isInCurrentWeek ? "oklch(0.97 0.03 58)" : undefined }}
                  onMouseEnter={e => {
                    if (!isInCurrentWeek) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-subtle)"
                  }}
                  onMouseLeave={e => {
                    if (!isInCurrentWeek) (e.currentTarget as HTMLElement).style.backgroundColor = ""
                  }}
                >
                  <span
                    className="text-xs leading-tight"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: isToday ? "var(--primary)" : "var(--text-primary)",
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {day.getDate()}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: dotColor }} />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
