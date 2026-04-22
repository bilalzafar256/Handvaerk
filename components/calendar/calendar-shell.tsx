"use client"

import { useState, useCallback, useMemo } from "react"
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar"
import { format, parse, startOfWeek, endOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./rbc.css"

import { ChevronLeft, ChevronRight, Maximize2, Minimize2, SlidersHorizontal } from "lucide-react"
import { getCalendarDataAction, type CalendarData } from "@/lib/actions/calendar"
import { UnscheduledPanel } from "./unscheduled-panel"
import { EventChip } from "./event-chip"
import { EventDetailModal } from "./event-popover"
import { CalendarFilters, DEFAULT_FILTERS, type FilterState } from "./calendar-filters"
import { TimelineView } from "./timeline-view"
import type { RBCEvent } from "./types"
import type { EventProps } from "react-big-calendar"

// ── Localizer ─────────────────────────────────────────────────────────────────
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { "en-US": enUS },
})

// ── View config ───────────────────────────────────────────────────────────────
type OurView = "month" | "week" | "day" | "agenda" | "timeline"

const VIEW_DEFS: { key: OurView; label: string }[] = [
  { key: "month",    label: "Month" },
  { key: "week",     label: "Week" },
  { key: "day",      label: "Day" },
  { key: "timeline", label: "Timeline" },
  { key: "agenda",   label: "Agenda" },
]

const RBC_VIEW: Partial<Record<OurView, View>> = {
  month:  "month",
  week:   "week",
  day:    "day",
  agenda: "agenda",
}

// ── Data transformation ───────────────────────────────────────────────────────
function toRBCEvents(data: CalendarData): RBCEvent[] {
  const events: RBCEvent[] = []

  for (const job of data.jobs) {
    if (!job.scheduledDate) continue
    const start = new Date(job.scheduledDate + "T00:00:00")
    const end   = job.endDate
      ? new Date(job.endDate + "T00:00:00")
      : new Date(job.scheduledDate + "T00:00:00")
    events.push({
      id: job.id, title: job.title, start, end, allDay: true,
      entityType:   "job",
      status:       job.status ?? "new",
      customerName: job.customer?.name ?? "",
      customerId:   job.customerId,
      entityId:     job.id,
      jobType:      job.jobType,
    })
  }

  for (const inv of data.invoiceDueDates) {
    const d = new Date(inv.dueDate + "T00:00:00")
    events.push({
      id: inv.id, title: inv.invoiceNumber, start: d, end: d, allDay: true,
      entityType:   "invoice",
      status:       inv.status ?? "sent",
      customerName: inv.customer?.name ?? "",
      customerId:   inv.customerId,
      entityId:     inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalInclVat:  inv.totalInclVat,
    })
  }

  for (const q of data.quotesExpiring) {
    if (!q.validUntil) continue
    const d = new Date(q.validUntil + "T00:00:00")
    events.push({
      id: q.id, title: q.quoteNumber, start: d, end: d, allDay: true,
      entityType:   "quote",
      status:       q.status ?? "sent",
      customerName: q.customer?.name ?? "",
      customerId:   q.customerId,
      entityId:     q.id,
      quoteNumber:  q.quoteNumber,
    })
  }

  return events
}

// ── Header label ──────────────────────────────────────────────────────────────
function formatLabel(date: Date, view: OurView): string {
  if (view === "week") {
    const s = startOfWeek(date, { weekStartsOn: 1 })
    const e = endOfWeek(date,   { weekStartsOn: 1 })
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()} – ${e.getDate()} ${e.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
    }
    return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", { ...opts, year: "numeric" })}`
  }
  if (view === "day") {
    return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  }
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}

// ── Date shifting ─────────────────────────────────────────────────────────────
function shift(date: Date, view: OurView, delta: number): Date {
  const d = new Date(date)
  if (view === "week") { d.setDate(d.getDate() + 7 * delta); return d }
  if (view === "day")  { d.setDate(d.getDate() + delta);      return d }
  d.setMonth(d.getMonth() + delta)
  return d
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function rangeTo(date: Date): { from: string; to: string } {
  const from = new Date(date.getFullYear(), date.getMonth() - 1, 1)
  const to   = new Date(date.getFullYear(), date.getMonth() + 2, 0)
  return {
    from: localDateStr(from),
    to:   localDateStr(to),
  }
}

// ── Shell ─────────────────────────────────────────────────────────────────────
interface CalendarShellProps {
  initialData: CalendarData
  initialFrom: string
  initialTo:   string
}

export function CalendarShell({ initialData, initialFrom }: CalendarShellProps) {
  const [view,           setView]           = useState<OurView>("month")
  const [currentDate,    setCurrentDate]    = useState(() => new Date(initialFrom + "T00:00:00"))
  const [data,           setData]           = useState<CalendarData>(initialData)
  const [loading,        setLoading]        = useState(false)
  const [selectedEvent,  setSelectedEvent]  = useState<RBCEvent | null>(null)
  const [filters,        setFilters]        = useState<FilterState>(DEFAULT_FILTERS)
  const [filtersOpen,    setFiltersOpen]    = useState(true)
  const [isFullscreen,   setIsFullscreen]   = useState(false)

  // Raw events
  const allEvents = useMemo(() => toRBCEvents(data), [data])

  // Filtered events for RBC views
  const filteredEvents = useMemo(() => allEvents.filter(e => {
    if (e.entityType === "job") {
      if (!filters.showJobs) return false
      if (filters.jobStatuses.length > 0 && !filters.jobStatuses.includes(e.status)) return false
      return true
    }
    if (e.entityType === "invoice") return filters.showInvoices
    if (e.entityType === "quote")   return filters.showQuotes
    return true
  }), [allEvents, filters])

  // Filtered jobs for timeline
  const filteredTimelineJobs = useMemo(() => {
    if (!filters.showJobs) return []
    if (filters.jobStatuses.length === 0) return data.jobs
    return data.jobs.filter(j => filters.jobStatuses.includes(j.status ?? ""))
  }, [data.jobs, filters])

  // ── Data fetching ───────────────────────────────────────────────────────────
  const load = useCallback(async (date: Date) => {
    setLoading(true)
    try {
      const { from, to } = rangeTo(date)
      setData(await getCalendarDataAction(from, to))
    } finally {
      setLoading(false)
    }
  }, [])

  function navigateTo(next: Date) {
    setCurrentDate(next)
    if (
      next.getMonth()    !== currentDate.getMonth() ||
      next.getFullYear() !== currentDate.getFullYear()
    ) {
      load(next)
    }
  }

  function navigate(delta: number) { navigateTo(shift(currentDate, view, delta)) }
  function goToday()               { navigateTo(new Date()) }

  // ── Counts for legend ───────────────────────────────────────────────────────
  const visibleJobs     = filteredEvents.filter(e => e.entityType === "job").length
  const visibleInvoices = filteredEvents.filter(e => e.entityType === "invoice").length
  const visibleQuotes   = filteredEvents.filter(e => e.entityType === "quote").length

  const rbcView = RBC_VIEW[view]

  // ── Toolbar button style helpers ────────────────────────────────────────────
  const iconBtn = {
    className: "w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-120 cursor-pointer",
    style:     { color: "var(--text-secondary)" } as React.CSSProperties,
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) =>
      (e.currentTarget.style.backgroundColor = "var(--background-subtle)"),
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) =>
      (e.currentTarget.style.backgroundColor = "transparent"),
  }

  return (
    <div
      className="flex min-h-0"
      style={{
        fontFamily: "var(--font-body)",
        ...(isFullscreen
          ? { position: "fixed", inset: 0, zIndex: 50, backgroundColor: "var(--background)" }
          : { height: "100%" }),
      }}
    >

      {/* ── Filter sidebar ─────────────────────────────────────────────────── */}
      {filtersOpen && (
        <CalendarFilters
          filters={filters}
          onChange={setFilters}
          currentDate={currentDate}
          onDateSelect={navigateTo}
          onMonthShift={(d) => navigateTo(shift(currentDate, "month", d))}
        />
      )}

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">

        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-3 py-2 flex-shrink-0 flex-wrap"
          style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
        >
          {/* Filter toggle */}
          <button
            {...iconBtn}
            onClick={() => setFiltersOpen(o => !o)}
            title={filtersOpen ? "Hide filters" : "Show filters"}
            style={{
              ...iconBtn.style,
              color: filtersOpen ? "var(--primary)" : "var(--text-secondary)",
            }}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <div style={{ width: 1, height: 18, backgroundColor: "var(--border)" }} />

          {/* Prev / Next */}
          <div className="flex items-center gap-0.5">
            <button {...iconBtn} onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button {...iconBtn} onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Date label */}
          <h2
            className="text-[14px] font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", minWidth: 140 }}
          >
            {formatLabel(currentDate, view)}
          </h2>

          {/* Today */}
          <button
            onClick={goToday}
            className="h-7 px-3 rounded-md text-[12px] font-medium transition-colors duration-120 cursor-pointer"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--background-subtle)"; e.currentTarget.style.color = "var(--text-primary)" }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent";              e.currentTarget.style.color = "var(--text-secondary)" }}
          >
            Today
          </button>

          <div className="flex-1" />

          {/* Entity legend — only show when something is visible */}
          <div className="hidden sm:flex items-center gap-3">
            {filters.showJobs && visibleJobs > 0 && (
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--status-scheduled-border)" }} />
                {visibleJobs} job{visibleJobs !== 1 ? "s" : ""}
              </span>
            )}
            {filters.showInvoices && visibleInvoices > 0 && (
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "oklch(0.72 0.10 240)" }} />
                {visibleInvoices} due
              </span>
            )}
            {filters.showQuotes && visibleQuotes > 0 && (
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "oklch(0.82 0.11 58)" }} />
                {visibleQuotes} expiring
              </span>
            )}
          </div>

          {/* View switcher */}
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{ backgroundColor: "var(--background-subtle)" }}
          >
            {VIEW_DEFS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className="h-6 px-2.5 rounded-md text-[12px] font-medium transition-all duration-120 cursor-pointer"
                style={{
                  backgroundColor: view === key ? "var(--surface)" : "transparent",
                  color:           view === key ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow:       view === key ? "var(--shadow-xs)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 18, backgroundColor: "var(--border)" }} />

          {/* Fullscreen toggle */}
          <button
            {...iconBtn}
            onClick={() => setIsFullscreen(f => !f)}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen
              ? <Minimize2 className="w-4 h-4" />
              : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Calendar body */}
        <div className="flex-1 min-h-0 relative p-3">
          {loading && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{ backgroundColor: "oklch(1 0 0 / 55%)" }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--primary) transparent var(--primary) var(--primary)" }}
              />
            </div>
          )}

          {view === "timeline" ? (
            <TimelineView
              jobs={filteredTimelineJobs}
              currentDate={currentDate}
              onSelectEvent={setSelectedEvent}
            />
          ) : rbcView ? (
            <Calendar<RBCEvent>
              localizer={localizer}
              events={filteredEvents}
              view={rbcView}
              date={currentDate}
              onNavigate={setCurrentDate}
              onView={(v) => { if (RBC_VIEW[v as OurView] !== undefined) setView(v as OurView) }}
              onSelectEvent={(event) => setSelectedEvent(event)}
              toolbar={false}
              popup
              popupOffset={10}
              drilldownView={null}
              components={{ event: EventChip as React.ComponentType<EventProps<RBCEvent>> }}
              eventPropGetter={() => ({
                style: { background: "transparent", border: "none", padding: 0, boxShadow: "none" },
              })}
              startAccessor="start"
              endAccessor="end"
              allDayAccessor="allDay"
              step={30}
              timeslots={2}
              scrollToTime={new Date(new Date().setHours(8, 0, 0, 0))}
              messages={{
                noEventsInRange: "Nothing scheduled this period.",
                showMore: (n: number) => `+${n} more`,
              }}
              style={{ height: "100%" }}
              culture="en-US"
            />
          ) : null}
        </div>
      </div>

      {/* ── Unscheduled panel ──────────────────────────────────────────────── */}
      <UnscheduledPanel jobs={data.unscheduledJobs} />

      {/* ── Event detail modal ─────────────────────────────────────────────── */}
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  )
}
