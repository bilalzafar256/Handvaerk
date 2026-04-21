"use client"

import { Clock, DollarSign, TrendingUp } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"

function formatDuration(minutes: number) {
  if (minutes === 0) return "0h"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

interface WeeklySummaryBarProps {
  totalMinutes: number
  billableMinutes: number
  hourlyRate: string | null
}

export function WeeklySummaryBar({ totalMinutes, billableMinutes, hourlyRate }: WeeklySummaryBarProps) {
  const billableHours = billableMinutes / 60
  const estimated = hourlyRate ? billableHours * Number(hourlyRate) : null

  return (
    <div className="grid grid-cols-3 gap-3">
      <div
        className="rounded-xl border px-4 py-3 space-y-1"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
          <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>Total</span>
        </div>
        <p className="text-lg font-semibold leading-none" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
          {formatDuration(totalMinutes)}
        </p>
      </div>

      <div
        className="rounded-xl border px-4 py-3 space-y-1"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
          <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>Billable</span>
        </div>
        <p className="text-lg font-semibold leading-none" style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
          {formatDuration(billableMinutes)}
        </p>
      </div>

      <div
        className="rounded-xl border px-4 py-3 space-y-1"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        title={!hourlyRate ? "Set hourly rate in profile to see earnings" : undefined}
      >
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: estimated ? "var(--success)" : "var(--text-tertiary)" }} />
          <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>Earnings est.</span>
        </div>
        <p
          className="text-lg font-semibold leading-none"
          style={{ fontFamily: "var(--font-mono)", color: estimated ? "var(--text-primary)" : "var(--text-tertiary)" }}
        >
          {estimated !== null ? formatDKK(estimated) : "—"}
        </p>
      </div>
    </div>
  )
}
