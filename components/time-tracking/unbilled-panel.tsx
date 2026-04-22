"use client"

import { useState } from "react"
import { AlertTriangle, ChevronRight } from "lucide-react"
import Link from "next/link"
import { formatDKK } from "@/lib/utils/currency"
import type { TimeEntry } from "@/lib/db/schema/time-entries"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"

type UnbilledEntry = TimeEntry & { job: Job & { customer: Customer } }

function fmtDur(minutes: number): string {
  if (!minutes) return "0h"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!m) return `${h}h`
  return `${h}h ${m}m`
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

interface UnbilledPanelProps {
  entries: UnbilledEntry[]
  hourlyRate: string | null
}

export function UnbilledPanel({ entries, hourlyRate }: UnbilledPanelProps) {
  const [open, setOpen] = useState(true)

  const totalMins = entries.reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
  const totalEarnings = hourlyRate ? (totalMins / 60) * Number(hourlyRate) : null

  return (
    <div
      className="flex-shrink-0 flex flex-col border-l overflow-hidden"
      style={{
        width: open ? 220 : 40,
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
        <AlertTriangle
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: entries.length > 0 ? "var(--primary)" : "var(--text-tertiary)" }}
        />
        {open && (
          <span
            className="text-[11px] font-semibold uppercase tracking-wider flex-1 truncate"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
          >
            Unbilled
          </span>
        )}
        {entries.length > 0 && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: "var(--accent-light)",
              color: "var(--primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {entries.length}
          </span>
        )}
      </button>

      {open && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Summary strip */}
          {entries.length > 0 && totalMins > 0 && (
            <div
              className="px-3 py-3 border-b space-y-0.5 flex-shrink-0"
              style={{ borderColor: "var(--border)", backgroundColor: "oklch(0.99 0.015 58)" }}
            >
              <p
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}
              >
                {fmtDur(totalMins)} unbilled
              </p>
              {totalEarnings !== null && (
                <p
                  className="text-xs"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
                >
                  ≈ {formatDKK(totalEarnings)}
                </p>
              )}
            </div>
          )}

          {entries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-3 py-8 gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                style={{ backgroundColor: "var(--success-light)" }}
              >
                ✓
              </div>
              <p
                className="text-[11px] text-center"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
              >
                All time is billed
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-1">
              {entries.map(entry => (
                <Link
                  key={entry.id}
                  href={`/jobs/${entry.jobId}`}
                  className="flex items-start gap-2 px-3 py-2.5 group transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--background-subtle)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] font-medium truncate"
                      style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
                    >
                      {entry.job.title}
                    </p>
                    <p
                      className="text-[11px] truncate"
                      style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
                    >
                      {fmtDate(entry.startedAt)} · {fmtDur(entry.durationMinutes ?? 0)}
                    </p>
                    {hourlyRate && (
                      <p
                        className="text-[10px]"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}
                      >
                        ≈ {formatDKK(((entry.durationMinutes ?? 0) / 60) * Number(hourlyRate))}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    className="w-3 h-3 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
