"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { updateJobStatusAction } from "@/lib/actions/jobs"
import { toast } from "sonner"

type Status = "new" | "scheduled" | "in_progress" | "done" | "invoiced" | "paid"

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; border: string }> = {
  new:         { label: "New",         bg: "--status-new-bg",        text: "--status-new-text",        border: "--status-new-border" },
  scheduled:   { label: "Scheduled",   bg: "--status-scheduled-bg",  text: "--status-scheduled-text",  border: "--status-scheduled-border" },
  in_progress: { label: "In progress", bg: "--status-progress-bg",   text: "--status-progress-text",   border: "--status-progress-border" },
  done:        { label: "Done",        bg: "--status-done-bg",        text: "--status-done-text",       border: "--status-done-border" },
  invoiced:    { label: "Invoiced",    bg: "--status-invoiced-bg",    text: "--status-invoiced-text",   border: "--status-invoiced-border" },
  paid:        { label: "Paid",        bg: "--status-paid-bg",        text: "--status-paid-text",       border: "--status-paid-border" },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as Status[]

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_CONFIG[status]
  return (
    <motion.span
      key={status}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="inline-flex items-center px-3 h-6 rounded-[--radius-pill] text-xs font-medium border"
      style={{
        backgroundColor: `var(${s.bg})`,
        color: `var(${s.text})`,
        borderColor: `var(${s.border})`,
        fontFamily: "var(--font-body)",
      }}
    >
      {s.label}
    </motion.span>
  )
}

interface StatusChangerProps {
  jobId: string
  currentStatus: Status
}

export function StatusChanger({ jobId, currentStatus }: StatusChangerProps) {
  const [status, setStatus] = useState<Status>(currentStatus)
  const [saving, setSaving] = useState(false)

  async function handleChange(next: Status) {
    if (next === status || saving) return
    setSaving(true)
    try {
      await updateJobStatusAction(jobId, next)
      setStatus(next)
    } catch {
      toast.error("Failed to update status")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
        >
          Status
        </p>
        <StatusBadge status={status} />
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s]
          const isActive = s === status
          return (
            <button
              key={s}
              onClick={() => handleChange(s)}
              disabled={saving}
              className={`h-8 px-3 rounded-[--radius-pill] text-xs font-medium border transition-all duration-150 cursor-pointer disabled:opacity-50 ${!isActive ? "opacity-45 hover:opacity-75" : "opacity-100"}`}
              style={{
                backgroundColor: `var(${cfg.bg})`,
                color: `var(${cfg.text})`,
                borderColor: `var(${cfg.border})`,
                fontFamily: "var(--font-body)",
                outline: isActive ? `2px solid var(${cfg.border})` : "none",
                outlineOffset: "1px",
              }}
            >
              {cfg.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
