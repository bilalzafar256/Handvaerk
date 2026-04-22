"use client"

import { useState } from "react"
import { ChevronRight, Clock } from "lucide-react"
import { type CalendarJob } from "@/lib/actions/calendar"
import { Link } from "@/i18n/navigation"

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  scheduled: "Scheduled",
  in_progress: "In progress",
}

interface UnscheduledPanelProps {
  jobs: CalendarJob[]
}

export function UnscheduledPanel({ jobs }: UnscheduledPanelProps) {
  const [open, setOpen] = useState(true)

  return (
    <div
      className="flex-shrink-0 flex flex-col transition-all duration-200"
      style={{
        width: open ? 220 : 40,
        borderLeft: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-3 flex-shrink-0 w-full text-left cursor-pointer transition-colors duration-120"
        style={{ borderBottom: "1px solid var(--border)" }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background-subtle)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
      >
        <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
        {open && (
          <span
            className="text-[11px] font-semibold uppercase tracking-wider flex-1"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
          >
            Unscheduled
          </span>
        )}
        {jobs.length > 0 && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: "var(--accent-light)",
              color: "var(--primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {jobs.length}
          </span>
        )}
      </button>

      {/* Job list */}
      {open && (
        <div className="flex-1 overflow-y-auto py-1">
          {jobs.length === 0 ? (
            <p
              className="text-[11px] px-3 py-4 text-center"
              style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
            >
              All jobs are scheduled
            </p>
          ) : (
            jobs.map(job => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-start gap-2 px-3 py-2 group transition-colors duration-120"
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--background-subtle)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[12px] font-medium truncate"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
                  >
                    {job.title}
                  </p>
                  <p
                    className="text-[11px] truncate"
                    style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
                  >
                    {job.customer?.name ?? ""}
                  </p>
                  <span
                    className="inline-block text-[10px] font-medium px-1.5 py-px rounded mt-0.5"
                    style={{
                      backgroundColor: `var(--status-${job.status}-bg)`,
                      color: `var(--status-${job.status}-text)`,
                    }}
                  >
                    {(job.status ? STATUS_LABEL[job.status] : null) ?? job.status}
                  </span>
                </div>
                <ChevronRight
                  className="w-3 h-3 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-tertiary)" }}
                />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
