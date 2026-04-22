"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────
export interface FilterState {
  showJobs:      boolean
  showInvoices:  boolean
  showQuotes:    boolean
  jobStatuses:   string[]  // empty = all statuses shown
}

export const DEFAULT_FILTERS: FilterState = {
  showJobs:     true,
  showInvoices: true,
  showQuotes:   true,
  jobStatuses:  [],
}

const JOB_STATUSES: { key: string; label: string; cssKey: string }[] = [
  { key: "new",         label: "New",         cssKey: "new" },
  { key: "scheduled",   label: "Scheduled",   cssKey: "scheduled" },
  { key: "in_progress", label: "In progress", cssKey: "progress" },
  { key: "done",        label: "Done",        cssKey: "done" },
  { key: "invoiced",    label: "Invoiced",    cssKey: "invoiced" },
  { key: "paid",        label: "Paid",        cssKey: "paid" },
]

// ── Mini calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({
  currentDate,
  onDateSelect,
  onMonthShift,
}: {
  currentDate:   Date
  onDateSelect:  (d: Date) => void
  onMonthShift:  (delta: number) => void
}) {
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const todayStr     = new Date().toISOString().split("T")[0]
  const selectedStr  = currentDate.toISOString().split("T")[0]

  const firstDow   = (new Date(year, month, 1).getDay() + 6) % 7  // 0 = Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function ds(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onMonthShift(-1)}
          className="w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors duration-120"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background-subtle)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
        >
          <ChevronLeft className="w-3 h-3" />
        </button>

        <span
          className="text-[11px] font-semibold"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
        >
          {currentDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
        </span>

        <button
          onClick={() => onMonthShift(1)}
          className="w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors duration-120"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background-subtle)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-semibold"
            style={{ color: i >= 5 ? "var(--text-tertiary)" : "var(--text-tertiary)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-px">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="aspect-square" />

          const dateStr  = ds(day)
          const isToday  = dateStr === todayStr
          const isSel    = dateStr === selectedStr && !isToday
          const dow      = (firstDow + day - 1) % 7  // 0=Mon
          const isWeekend = dow >= 5

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(new Date(dateStr + "T00:00:00"))}
              className="aspect-square flex items-center justify-center rounded-full text-[10px] font-medium cursor-pointer transition-colors duration-120"
              style={{
                fontFamily:      "var(--font-mono)",
                backgroundColor: isToday
                  ? "var(--primary)"
                  : isSel
                  ? "var(--background-subtle)"
                  : "transparent",
                color: isToday
                  ? "oklch(0.10 0.005 52)"
                  : isWeekend
                  ? "var(--text-tertiary)"
                  : "var(--text-secondary)",
                fontWeight: isToday || isSel ? 700 : 400,
              }}
              onMouseEnter={e => {
                if (!isToday) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background-subtle)"
              }}
              onMouseLeave={e => {
                if (!isToday && !isSel) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Filter sidebar ─────────────────────────────────────────────────────────────
interface CalendarFiltersProps {
  filters:      FilterState
  onChange:     (f: FilterState) => void
  currentDate:  Date
  onDateSelect: (d: Date) => void
  onMonthShift: (delta: number) => void
}

export function CalendarFilters({
  filters,
  onChange,
  currentDate,
  onDateSelect,
  onMonthShift,
}: CalendarFiltersProps) {

  function toggle(key: keyof Pick<FilterState, "showJobs" | "showInvoices" | "showQuotes">) {
    onChange({ ...filters, [key]: !filters[key] })
  }

  function toggleStatus(status: string) {
    const cur = filters.jobStatuses
    onChange({
      ...filters,
      jobStatuses: cur.includes(status)
        ? cur.filter(s => s !== status)
        : [...cur, status],
    })
  }

  const entityRows: { key: keyof Pick<FilterState, "showJobs"|"showInvoices"|"showQuotes">; label: string; color: string }[] = [
    { key: "showJobs",     label: "Jobs",     color: "var(--status-scheduled-border)" },
    { key: "showInvoices", label: "Invoices", color: "oklch(0.72 0.10 240)" },
    { key: "showQuotes",   label: "Quotes",   color: "oklch(0.82 0.11 58)" },
  ]

  return (
    <div
      className="flex flex-col gap-0 overflow-y-auto flex-shrink-0 hidden md:flex"
      style={{
        width: 196,
        borderRight: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      {/* Mini calendar */}
      <div className="p-3 pb-2">
        <MiniCalendar
          currentDate={currentDate}
          onDateSelect={onDateSelect}
          onMonthShift={onMonthShift}
        />
      </div>

      <div style={{ height: 1, backgroundColor: "var(--border)" }} />

      {/* Entity toggles */}
      <div className="p-3">
        <p
          className="text-[10px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
        >
          Show
        </p>

        {entityRows.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className="w-full flex items-center gap-2.5 py-1.5 px-1 rounded-md text-left cursor-pointer transition-colors duration-120"
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background-subtle)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
          >
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{
                backgroundColor: filters[key] ? color : "transparent",
                border:          `2px solid ${color}`,
                transition:      "background 120ms",
              }}
            />
            <span
              className="text-[12px]"
              style={{
                fontFamily: "var(--font-body)",
                color: filters[key] ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Job status filters */}
      {filters.showJobs && (
        <>
          <div style={{ height: 1, backgroundColor: "var(--border)" }} />
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
              >
                Job status
              </p>
              {filters.jobStatuses.length > 0 && (
                <button
                  onClick={() => onChange({ ...filters, jobStatuses: [] })}
                  className="text-[10px] font-medium cursor-pointer"
                  style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
                >
                  All
                </button>
              )}
            </div>

            <div className="flex flex-col gap-px">
              {JOB_STATUSES.map(({ key, label, cssKey }) => {
                const active = filters.jobStatuses.length === 0 || filters.jobStatuses.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggleStatus(key)}
                    className="flex items-center gap-2 py-1.5 px-1 rounded-md text-left cursor-pointer transition-colors duration-120"
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background-subtle)"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-120"
                      style={{
                        backgroundColor: `var(--status-${cssKey}-border)`,
                        opacity: active ? 1 : 0.3,
                      }}
                    />
                    <span
                      className="text-[11px]"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                      }}
                    >
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
