"use client"

import { useState } from "react"
import { SlidersHorizontal, Clock, DollarSign, TrendingUp } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"

function fmtDur(minutes: number): string {
  if (!minutes) return "0h"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!m) return `${h}h`
  return `${h}h ${m}m`
}

export interface StatsSidebarEntry {
  startedAt: Date | string
  durationMinutes: number | null
  isBillable: boolean | null
  jobId: string
  job: { title: string; customer: { name: string } }
}

interface StatsSidebarProps {
  entries: StatsSidebarEntry[]
  prevWeekMinutes: number
  hourlyRate: string | null
}

export function StatsSidebar({ entries, prevWeekMinutes, hourlyRate }: StatsSidebarProps) {
  const [open, setOpen] = useState(true)

  const completed = entries.filter(e => e.durationMinutes)
  const totalMins = completed.reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
  const billableMins = completed.filter(e => e.isBillable).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
  const billableRate = totalMins > 0 ? billableMins / totalMins : 0
  const earnings = hourlyRate ? (billableMins / 60) * Number(hourlyRate) : null

  const delta = totalMins - prevWeekMinutes
  const showDelta = prevWeekMinutes > 0

  // Per-job breakdown
  const jobMap: Record<string, { title: string; total: number; billable: number }> = {}
  for (const e of completed) {
    if (!jobMap[e.jobId]) jobMap[e.jobId] = { title: e.job.title, total: 0, billable: 0 }
    jobMap[e.jobId].total += e.durationMinutes ?? 0
    if (e.isBillable) jobMap[e.jobId].billable += e.durationMinutes ?? 0
  }
  const jobs = Object.values(jobMap).sort((a, b) => b.total - a.total).slice(0, 5)
  const maxJobMins = Math.max(...jobs.map(j => j.total), 1)

  return (
    <div
      className="flex-shrink-0 flex flex-col border-r overflow-hidden"
      style={{
        width: open ? 200 : 40,
        transition: "width 200ms ease",
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
        height: "100%",
      }}
    >
      {/* Toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 h-11 flex-shrink-0 w-full text-left transition-colors border-b cursor-pointer"
        style={{ borderColor: "var(--border)" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--background-subtle)")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <SlidersHorizontal
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: open ? "var(--primary)" : "var(--text-tertiary)" }}
        />
        {open && (
          <span
            className="text-[11px] font-semibold uppercase tracking-wider flex-1 truncate"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
          >
            This week
          </span>
        )}
      </button>

      {open && (
        <div className="flex-1 overflow-y-auto">
          {/* Stats */}
          <div className="px-3 py-4 space-y-5">
            {/* Total */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
                >
                  Total
                </span>
              </div>
              <div className="flex items-end gap-1.5">
                <span
                  className="text-xl font-semibold leading-none"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
                >
                  {fmtDur(totalMins)}
                </span>
                {showDelta && (
                  <span
                    className="text-[10px] font-semibold mb-0.5"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: delta >= 0 ? "var(--success)" : "var(--error)",
                    }}
                  >
                    {delta >= 0 ? "+" : ""}{fmtDur(Math.abs(delta))}
                  </span>
                )}
              </div>
            </div>

            {/* Billable */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3 h-3" style={{ color: "var(--primary)" }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
                >
                  Billable
                </span>
              </div>
              <span
                className="text-xl font-semibold leading-none block"
                style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}
              >
                {fmtDur(billableMins)}
              </span>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(billableRate * 100)}%`, backgroundColor: "var(--primary)" }}
                />
              </div>
              <span
                className="text-[10px]"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
              >
                {Math.round(billableRate * 100)}% billable
              </span>
            </div>

            {/* Earnings */}
            {earnings !== null && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" style={{ color: "var(--success)" }} />
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
                  >
                    Est. earnings
                  </span>
                </div>
                <span
                  className="text-xl font-semibold leading-none block"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
                >
                  {formatDKK(earnings)}
                </span>
              </div>
            )}
          </div>

          {totalMins === 0 && (
            <p
              className="text-[11px] text-center px-3 pb-4"
              style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
            >
              No time logged this week
            </p>
          )}

          {/* Divider */}
          {jobs.length > 0 && <div style={{ height: 1, backgroundColor: "var(--border)" }} />}

          {/* Job breakdown */}
          {jobs.length > 0 && (
            <div className="px-3 py-4 space-y-3">
              <p
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
              >
                By job
              </p>
              <div className="space-y-3">
                {jobs.map((job, i) => {
                  const pct = (job.total / maxJobMins) * 100
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-[11px] font-medium truncate flex-1"
                          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
                        >
                          {job.title}
                        </span>
                        <span
                          className="text-[10px] flex-shrink-0"
                          style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
                        >
                          {fmtDur(job.total)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--background-subtle)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: job.billable > 0 ? "var(--primary)" : "var(--border-strong)",
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
