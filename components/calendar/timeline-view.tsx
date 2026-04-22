"use client"

import { useMemo, useRef, useEffect } from "react"
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  differenceInDays,
  isWeekend,
  isSameDay,
  format,
} from "date-fns"
import { Link } from "@/i18n/navigation"
import type { CalendarJob } from "@/lib/actions/calendar"
import type { RBCEvent } from "./types"

// ── Layout constants ──────────────────────────────────────────────────────────
const DAY_W     = 28   // px per day column
const LEFT_W    = 188  // px for sticky job-name column
const ROW_H     = 40   // px per job row
const MONTH_H   = 26   // px month header row
const DAY_HDR_H = 26   // px day-number header row

function statusCSSKey(status: string) {
  return status === "in_progress" ? "progress" : status
}

// ── Convert job to RBCEvent for the shared detail modal ──────────────────────
function jobToRBCEvent(job: CalendarJob): RBCEvent {
  const start = new Date((job.scheduledDate ?? "") + "T00:00:00")
  const end   = job.endDate
    ? new Date(job.endDate + "T00:00:00")
    : new Date((job.scheduledDate ?? "") + "T00:00:00")
  return {
    id:           job.id,
    title:        job.title,
    start, end,
    allDay:       true,
    entityType:   "job",
    status:       job.status ?? "new",
    customerName: job.customer?.name ?? "",
    customerId:   job.customerId,
    entityId:     job.id,
    jobType:      job.jobType,
  }
}

// ── Timeline view ─────────────────────────────────────────────────────────────
interface TimelineViewProps {
  jobs:          CalendarJob[]
  currentDate:   Date
  onSelectEvent: (event: RBCEvent) => void
}

export function TimelineView({ jobs, currentDate, onSelectEvent }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // View spans currentMonth ± 1 month
  const viewStart = useMemo(() => startOfMonth(addMonths(currentDate, -1)), [currentDate])
  const viewEnd   = useMemo(() => endOfMonth(addMonths(currentDate, 1)),    [currentDate])
  const totalDays = useMemo(() => differenceInDays(viewEnd, viewStart) + 1, [viewStart, viewEnd])

  const today       = new Date()
  const todayOffset = differenceInDays(today, viewStart)
  const todayVisible = todayOffset >= 0 && todayOffset < totalDays

  // Build day metadata array once
  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(viewStart)
      d.setDate(d.getDate() + i)
      return {
        date:        d,
        num:         d.getDate(),
        isToday:     isSameDay(d, today),
        isWeekend:   isWeekend(d),
        isMonthStart: d.getDate() === 1,
      }
    })
  }, [viewStart, totalDays])

  // Build month segments for header
  const monthSegments = useMemo(() => {
    const segs: { label: string; start: number; count: number }[] = []
    days.forEach((day, i) => {
      const lbl = format(day.date, "MMM yyyy")
      if (!segs.length || segs[segs.length - 1].label !== lbl) {
        segs.push({ label: lbl, start: i, count: 1 })
      } else {
        segs[segs.length - 1].count++
      }
    })
    return segs
  }, [days])

  // Sort scheduled jobs by start date
  const scheduledJobs = useMemo(() =>
    [...jobs]
      .filter(j => j.scheduledDate)
      .sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? "")),
    [jobs]
  )

  // Scroll to center today on mount
  useEffect(() => {
    if (!scrollRef.current || !todayVisible) return
    const target = LEFT_W + todayOffset * DAY_W - scrollRef.current.clientWidth / 2 + DAY_W / 2
    scrollRef.current.scrollLeft = Math.max(0, target)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Compute bar position for a job
  function barFor(job: CalendarJob): { left: number; width: number } | null {
    if (!job.scheduledDate) return null
    const s = differenceInDays(new Date(job.scheduledDate + "T00:00:00"), viewStart)
    const e = job.endDate
      ? differenceInDays(new Date(job.endDate + "T00:00:00"), viewStart)
      : s
    const left  = Math.max(0, s) * DAY_W + 2
    const right = Math.min(totalDays, e + 1) * DAY_W - 2
    return { left, width: Math.max(DAY_W - 4, right - left) }
  }

  const totalW = totalDays * DAY_W

  return (
    <div
      style={{
        border:        "1px solid var(--border)",
        borderRadius:  10,
        overflow:      "hidden",
        height:        "100%",
        display:       "flex",
        flexDirection: "column",
        backgroundColor: "var(--surface)",
      }}
    >
      <div ref={scrollRef} style={{ flex: 1, overflow: "auto" }}>
        <div style={{ minWidth: LEFT_W + totalW, position: "relative" }}>

          {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
          <div
            style={{
              display:         "flex",
              position:        "sticky",
              top:             0,
              zIndex:          10,
              backgroundColor: "var(--surface)",
              borderBottom:    "1px solid var(--border)",
            }}
          >
            {/* Sticky corner cell */}
            <div
              style={{
                width:           LEFT_W,
                minWidth:        LEFT_W,
                flexShrink:      0,
                position:        "sticky",
                left:            0,
                zIndex:          11,
                backgroundColor: "var(--surface)",
                borderRight:     "1px solid var(--border)",
                display:         "flex",
                alignItems:      "flex-end",
                padding:         "0 10px 6px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize:   10,
                  fontWeight: 600,
                  color:      "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Job
              </span>
            </div>

            {/* Month + day header */}
            <div style={{ position: "relative", width: totalW, flexShrink: 0 }}>

              {/* Month row */}
              <div
                style={{
                  display:   "flex",
                  height:    MONTH_H,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {monthSegments.map(seg => (
                  <div
                    key={seg.label + seg.start}
                    style={{
                      width:          seg.count * DAY_W,
                      flexShrink:     0,
                      display:        "flex",
                      alignItems:     "center",
                      paddingLeft:    8,
                      fontFamily:     "var(--font-body)",
                      fontSize:       11,
                      fontWeight:     700,
                      color:          "var(--text-secondary)",
                      borderRight:    "1px solid var(--border)",
                      overflow:       "hidden",
                    }}
                  >
                    {seg.label}
                  </div>
                ))}
              </div>

              {/* Day-number row */}
              <div style={{ display: "flex", height: DAY_HDR_H }}>
                {days.map((day, i) => (
                  <div
                    key={i}
                    style={{
                      width:          DAY_W,
                      flexShrink:     0,
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      fontSize:       9,
                      fontFamily:     "var(--font-mono)",
                      fontWeight:     day.isToday ? 700 : 400,
                      color:          day.isToday
                        ? "oklch(0.10 0.005 52)"
                        : day.isWeekend ? "var(--text-tertiary)" : "var(--text-secondary)",
                      backgroundColor: day.isToday
                        ? "var(--primary)"
                        : day.isWeekend
                        ? "oklch(0 0 0 / 3%)"
                        : "transparent",
                      borderRight: "1px solid var(--border)",
                    }}
                  >
                    {day.num}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── JOB ROWS ──────────────────────────────────────────────────── */}
          {scheduledJobs.length === 0 ? (
            <div
              style={{
                height:         160,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontFamily:     "var(--font-body)",
                fontSize:       13,
                color:          "var(--text-tertiary)",
              }}
            >
              No scheduled jobs in this period
            </div>
          ) : (
            scheduledJobs.map((job, idx) => {
              const bar    = barFor(job)
              const cssKey = statusCSSKey(job.status ?? "new")
              const stripe = idx % 2 === 1

              return (
                <div
                  key={job.id}
                  style={{
                    display:         "flex",
                    height:          ROW_H,
                    borderBottom:    "1px solid var(--border)",
                    backgroundColor: stripe ? "var(--background-subtle)" : "var(--surface)",
                  }}
                >
                  {/* Sticky left: job info */}
                  <div
                    style={{
                      width:           LEFT_W,
                      minWidth:        LEFT_W,
                      flexShrink:      0,
                      position:        "sticky",
                      left:            0,
                      zIndex:          2,
                      backgroundColor: stripe ? "var(--background-subtle)" : "var(--surface)",
                      borderRight:     "1px solid var(--border)",
                      display:         "flex",
                      flexDirection:   "column",
                      justifyContent:  "center",
                      padding:         "0 10px",
                      gap:             1,
                    }}
                  >
                    <Link
                      href={`/jobs/${job.id}`}
                      style={{
                        fontFamily:   "var(--font-body)",
                        fontSize:     12,
                        fontWeight:   600,
                        color:        "var(--text-primary)",
                        overflow:     "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace:   "nowrap",
                        textDecoration: "none",
                        lineHeight:   1.2,
                      }}
                      title={job.title}
                    >
                      {job.title}
                    </Link>
                    <span
                      style={{
                        fontFamily:   "var(--font-body)",
                        fontSize:     10,
                        color:        "var(--text-tertiary)",
                        overflow:     "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace:   "nowrap",
                      }}
                    >
                      {job.customer?.name}
                    </span>
                  </div>

                  {/* Bar area */}
                  <div
                    style={{
                      width:      totalW,
                      flexShrink: 0,
                      position:   "relative",
                      display:    "flex",
                      alignItems: "center",
                    }}
                  >
                    {/* Weekend column tints */}
                    {days.map((day, i) =>
                      day.isWeekend ? (
                        <div
                          key={i}
                          style={{
                            position:        "absolute",
                            left:            i * DAY_W,
                            width:           DAY_W,
                            top:             0,
                            bottom:          0,
                            backgroundColor: "oklch(0 0 0 / 3%)",
                            pointerEvents:   "none",
                          }}
                        />
                      ) : null
                    )}

                    {/* Job bar */}
                    {bar && (
                      <button
                        onClick={() => onSelectEvent(jobToRBCEvent(job))}
                        title={`${job.title} · ${job.customer?.name}`}
                        style={{
                          position:        "absolute",
                          left:            bar.left,
                          width:           bar.width,
                          height:          26,
                          backgroundColor: `var(--status-${cssKey}-bg)`,
                          border:          `1px solid var(--status-${cssKey}-border)`,
                          borderLeft:      `3px solid var(--status-${cssKey}-border)`,
                          borderRadius:    4,
                          display:         "flex",
                          alignItems:      "center",
                          paddingInline:   6,
                          cursor:          "pointer",
                          overflow:        "hidden",
                          fontFamily:      "var(--font-body)",
                          fontSize:        10,
                          fontWeight:      600,
                          color:           `var(--status-${cssKey}-text)`,
                          whiteSpace:      "nowrap",
                          textOverflow:    "ellipsis",
                          zIndex:          1,
                          transition:      "filter 120ms",
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.filter = "brightness(0.93)"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.filter = "none"}
                      >
                        {bar.width > 48 ? job.title : ""}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* ── TODAY LINE ────────────────────────────────────────────────── */}
          {todayVisible && (
            <div
              style={{
                position:        "absolute",
                left:            LEFT_W + todayOffset * DAY_W + DAY_W / 2,
                top:             0,
                bottom:          0,
                width:           2,
                backgroundColor: "var(--primary)",
                opacity:         0.7,
                zIndex:          4,
                pointerEvents:   "none",
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
