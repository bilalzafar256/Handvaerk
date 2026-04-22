"use client"

import { useState, useCallback } from "react"
import { CalendarDays, List, AlignLeft, BarChart2, ChevronLeft, ChevronRight } from "lucide-react"
import { getCalendarDataAction, type CalendarData } from "@/lib/actions/calendar"
import { UnscheduledPanel } from "./unscheduled-panel"

type ViewType = "month" | "week" | "day" | "timeline" | "agenda"

const VIEWS: { key: ViewType; label: string; icon: React.ElementType }[] = [
  { key: "month",    label: "Month",    icon: CalendarDays },
  { key: "week",     label: "Week",     icon: BarChart2 },
  { key: "day",      label: "Day",      icon: AlignLeft },
  { key: "timeline", label: "Timeline", icon: List },
  { key: "agenda",   label: "Agenda",   icon: List },
]

function formatMonthLabel(from: string) {
  const d = new Date(from + "T00:00:00")
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}

function shiftMonth(from: string, delta: number): { from: string; to: string } {
  const d = new Date(from + "T00:00:00")
  d.setMonth(d.getMonth() + delta)
  const year = d.getFullYear()
  const month = d.getMonth()
  const newFrom = new Date(year, month, 1)
  const newTo = new Date(year, month + 1, 0)
  return {
    from: newFrom.toISOString().split("T")[0],
    to: newTo.toISOString().split("T")[0],
  }
}

function todayRange(): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  }
}

interface CalendarShellProps {
  initialData: CalendarData
  initialFrom: string
  initialTo: string
}

export function CalendarShell({ initialData, initialFrom, initialTo }: CalendarShellProps) {
  const [view, setView] = useState<ViewType>("month")
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [data, setData] = useState<CalendarData>(initialData)
  const [loading, setLoading] = useState(false)

  const fetchRange = useCallback(async (newFrom: string, newTo: string) => {
    setLoading(true)
    try {
      const result = await getCalendarDataAction(newFrom, newTo)
      setData(result)
      setFrom(newFrom)
      setTo(newTo)
    } finally {
      setLoading(false)
    }
  }, [])

  const goToToday = () => {
    const r = todayRange()
    fetchRange(r.from, r.to)
  }

  const navigate = (delta: number) => {
    const r = shiftMonth(from, delta)
    fetchRange(r.from, r.to)
  }

  const totalEvents = data.jobs.length + data.invoiceDueDates.length + data.quotesExpiring.length

  return (
    <div className="flex h-full min-h-0" style={{ fontFamily: "var(--font-body)" }}>
      {/* Main column */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Calendar header */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0 flex-wrap gap-y-2"
          style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
        >
          {/* Date navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-120 cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background-subtle)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-120 cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background-subtle)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2
            className="text-[15px] font-semibold min-w-[160px]"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {formatMonthLabel(from)}
          </h2>

          <button
            onClick={goToToday}
            className="h-7 px-3 rounded-md text-[12px] font-medium border transition-colors duration-120 cursor-pointer"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background-subtle)"
              ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
              ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"
            }}
          >
            Today
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Entity counts */}
          <div className="hidden sm:flex items-center gap-3 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
            {totalEvents > 0 && (
              <>
                {data.jobs.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--status-scheduled-bg)" }} />
                    {data.jobs.length} job{data.jobs.length !== 1 ? "s" : ""}
                  </span>
                )}
                {data.invoiceDueDates.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--status-overdue-bg)" }} />
                    {data.invoiceDueDates.length} invoice{data.invoiceDueDates.length !== 1 ? "s" : ""}
                  </span>
                )}
                {data.quotesExpiring.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--accent-light)" }} />
                    {data.quotesExpiring.length} quote{data.quotesExpiring.length !== 1 ? "s" : ""}
                  </span>
                )}
              </>
            )}
          </div>

          {/* View switcher */}
          <div
            className="flex items-center rounded-lg p-0.5 gap-0.5"
            style={{ backgroundColor: "var(--background-subtle)" }}
          >
            {VIEWS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className="h-6 px-2.5 rounded-md text-[12px] font-medium transition-all duration-120 cursor-pointer"
                style={{
                  backgroundColor: view === key ? "var(--surface)" : "transparent",
                  color: view === key ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: view === key ? "var(--shadow-xs)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar body */}
        <div className="flex-1 min-h-0 overflow-auto relative">
          {loading && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{ backgroundColor: "oklch(1 0 0 / 60%)" }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--primary) transparent var(--primary) var(--primary)" }}
              />
            </div>
          )}

          <CalendarBody view={view} data={data} from={from} to={to} />
        </div>
      </div>

      {/* Unscheduled panel */}
      <UnscheduledPanel jobs={data.unscheduledJobs} />
    </div>
  )
}

function CalendarBody({
  view,
  data,
  from,
}: {
  view: ViewType
  data: CalendarData
  from: string
  to: string
}) {
  if (view === "month") {
    return <MonthViewPlaceholder data={data} from={from} />
  }

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center">
        <p className="text-[14px] font-medium" style={{ color: "var(--text-secondary)" }}>
          {view.charAt(0).toUpperCase() + view.slice(1)} view
        </p>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>
          Coming in Phase {view === "agenda" ? "4" : view === "timeline" ? "5" : "3"}
        </p>
      </div>
    </div>
  )
}

function MonthViewPlaceholder({ data, from }: { data: CalendarData; from: string }) {
  const d = new Date(from + "T00:00:00")
  const year = d.getFullYear()
  const month = d.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split("T")[0]

  // Pad so week starts Monday (0=Mon..6=Sun)
  const startOffset = (firstDay + 6) % 7

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  function eventsForDay(day: number) {
    const ds = dateStr(day)
    const jobs = data.jobs.filter(
      j => j.scheduledDate === ds || (j.scheduledDate && j.endDate && j.scheduledDate <= ds && j.endDate >= ds)
    )
    const invoices = data.invoiceDueDates.filter(i => i.dueDate === ds)
    const quotes = data.quotesExpiring.filter(q => q.validUntil === ds)
    return { jobs, invoices, quotes }
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Day name headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {dayNames.map(name => (
          <div
            key={name}
            className="text-center text-[11px] font-semibold py-1.5 uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        className="flex-1 grid grid-cols-7 gap-px"
        style={{ backgroundColor: "var(--border)" }}
      >
        {cells.map((day, i) => {
          if (!day) {
            return (
              <div key={`empty-${i}`} style={{ backgroundColor: "var(--background-subtle)" }} />
            )
          }

          const ds = dateStr(day)
          const isToday = ds === today
          const { jobs, invoices, quotes } = eventsForDay(day)
          const totalCount = jobs.length + invoices.length + quotes.length

          return (
            <div
              key={ds}
              className="p-1.5 flex flex-col gap-1 min-h-[80px]"
              style={{ backgroundColor: "var(--surface)" }}
            >
              {/* Day number */}
              <div className="flex items-center">
                <span
                  className="text-[12px] font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                  style={{
                    color: isToday ? "var(--accent-foreground-brand)" : "var(--text-secondary)",
                    backgroundColor: isToday ? "var(--primary)" : "transparent",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {day}
                </span>
              </div>

              {/* Events — up to 3 */}
              <div className="flex flex-col gap-0.5 flex-1 min-h-0">
                {jobs.slice(0, 2).map(job => (
                  <a
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate block"
                    style={{
                      backgroundColor: `var(--status-${job.status}-bg)`,
                      color: `var(--status-${job.status}-text)`,
                    }}
                    title={`${job.title} — ${job.customer?.name}`}
                  >
                    {job.title}
                  </a>
                ))}
                {invoices.slice(0, jobs.length < 2 ? 1 : 0).map(inv => (
                  <a
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate block"
                    style={{
                      backgroundColor: inv.status === "overdue" ? "var(--status-overdue-bg)" : "var(--accent-light)",
                      color: inv.status === "overdue" ? "var(--status-overdue-text)" : "var(--primary)",
                    }}
                    title={`${inv.invoiceNumber} due — ${inv.customer?.name}`}
                  >
                    {inv.invoiceNumber}
                  </a>
                ))}
                {totalCount > 2 && (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    +{totalCount - 2} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
