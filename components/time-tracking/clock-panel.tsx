"use client"

import { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import { Play, Square, Loader2, Lock } from "lucide-react"
import { clockInAction, clockOutAction } from "@/lib/actions/time-tracking"
import type { TimeEntry } from "@/lib/db/schema/time-entries"

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`
  return `${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`
}

const CLOSED_JOB_STATUSES = ["done", "invoiced", "paid"]

interface ClockPanelProps {
  jobId: string
  activeEntry: TimeEntry | null // null = no active timer for any job
  isThisJobActive: boolean      // true = this job specifically has the active timer
  jobStatus?: string
}

export function ClockPanel({ jobId, activeEntry, isThisJobActive, jobStatus }: ClockPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isThisJobActive || !activeEntry) return
    const start = new Date(activeEntry.startedAt).getTime()
    setElapsed(Date.now() - start)
    const interval = setInterval(() => setElapsed(Date.now() - start), 1000)
    return () => clearInterval(interval)
  }, [isThisJobActive, activeEntry])

  function handleClockIn() {
    startTransition(async () => {
      try {
        await clockInAction(jobId)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to clock in")
      }
    })
  }

  function handleClockOut() {
    if (!activeEntry) return
    startTransition(async () => {
      try {
        await clockOutAction(activeEntry.id)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to clock out")
      }
    })
  }

  // Job is closed — show locked state (unless timer is actively running, so user can still stop it)
  if (jobStatus && CLOSED_JOB_STATUSES.includes(jobStatus) && !isThisJobActive) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
        style={{ backgroundColor: "var(--background-subtle)", borderColor: "var(--border)", color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
      >
        <Lock className="w-4 h-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
        Time tracking is closed — job is {jobStatus}
      </div>
    )
  }

  // Another job is currently active
  if (activeEntry && !isThisJobActive) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
        style={{ backgroundColor: "var(--background-subtle)", borderColor: "var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
      >
        <Square className="w-4 h-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
        Timer running on another job — clock out there first
      </div>
    )
  }

  if (isThisJobActive && activeEntry) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
        style={{ backgroundColor: "oklch(0.97 0.03 58)", borderColor: "oklch(0.85 0.10 58)" }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
          style={{ backgroundColor: "var(--primary)" }}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            Timer running
          </p>
          <p className="text-xs font-mono mt-0.5" style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
            {formatElapsed(elapsed)}
          </p>
        </div>
        <button
          onClick={handleClockOut}
          disabled={isPending}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium disabled:opacity-60 transition-opacity"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
          Clock out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleClockIn}
      disabled={isPending}
      className="w-full flex items-center gap-3 h-12 px-4 rounded-xl border text-sm font-medium disabled:opacity-60 transition-opacity text-left"
      style={{
        backgroundColor: "var(--background-subtle)",
        borderColor: "var(--border)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      {isPending
        ? <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "var(--primary)" }} />
        : <Play className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />
      }
      Clock in on this job
    </button>
  )
}
