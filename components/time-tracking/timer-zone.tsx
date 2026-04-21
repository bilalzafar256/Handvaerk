"use client"

import { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import { Play, Square, Loader2, AlertTriangle } from "lucide-react"
import { clockInAction, clockOutAction } from "@/lib/actions/time-tracking"
import type { TimeEntry } from "@/lib/db/schema/time-entries"

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${sec.toString().padStart(2, "0")}s`
  return `${m.toString().padStart(2, "0")}m ${sec.toString().padStart(2, "0")}s`
}

function toISO(d: Date) {
  return d.toISOString().split("T")[0]
}

function isStaleTimer(startedAt: Date) {
  const hoursSince = (Date.now() - startedAt.getTime()) / 3_600_000
  return hoursSince > 14 || toISO(startedAt) !== toISO(new Date())
}

const inputCls = `
  h-10 px-3 w-full text-sm rounded-lg border focus:outline-none focus:ring-1
  focus:ring-[var(--primary)] focus:border-[var(--primary)]
  transition-colors duration-150
`

export interface JobOption {
  id: string
  title: string
  customer: { name: string }
}

interface TimerZoneProps {
  activeEntry: (TimeEntry & { job: JobOption }) | null
  jobs: JobOption[]
}

export function TimerZone({ activeEntry, jobs }: TimerZoneProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [elapsed, setElapsed] = useState(0)
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? "")
  const [showDesc, setShowDesc] = useState(false)
  const [description, setDescription] = useState("")
  const [customEndTime, setCustomEndTime] = useState("")

  useEffect(() => {
    if (!activeEntry) return
    const start = new Date(activeEntry.startedAt).getTime()
    setElapsed(Date.now() - start)
    const interval = setInterval(() => setElapsed(Date.now() - start), 1000)
    return () => clearInterval(interval)
  }, [activeEntry])

  function handleClockIn() {
    if (!selectedJobId) return
    startTransition(async () => {
      try {
        await clockInAction(selectedJobId)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to clock in")
      }
    })
  }

  function handleClockOut() {
    if (!showDesc) { setShowDesc(true); return }
    commit()
  }

  function commit(customEnd?: string) {
    if (!activeEntry) return
    startTransition(async () => {
      try {
        await clockOutAction(activeEntry.id, {
          customEndedAt: customEnd,
          description: description.trim() || undefined,
        })
        setShowDesc(false)
        setDescription("")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to clock out")
      }
    })
  }

  // ── Stale timer recovery ──────────────────────────────────────────────────
  if (activeEntry && isStaleTimer(new Date(activeEntry.startedAt))) {
    const startedDate = new Date(activeEntry.startedAt)
    const startLabel = startedDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    const startTime  = startedDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

    const defaultEnd = new Date(Math.min(startedDate.getTime() + 8 * 3_600_000, Date.now()))
    const defaultEndValue = defaultEnd.toISOString().slice(0, 16)

    return (
      <div
        className="rounded-xl border px-4 py-4 space-y-3"
        style={{ backgroundColor: "oklch(0.97 0.04 58)", borderColor: "oklch(0.85 0.12 58)" }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--primary)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              Timer still running from {startLabel}
            </p>
            <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
              {activeEntry.job.title} · started at {startTime}
            </p>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              When did you stop?
            </label>
            <input
              type="datetime-local"
              defaultValue={defaultEndValue}
              max={new Date().toISOString().slice(0, 16)}
              onChange={e => setCustomEndTime(e.target.value)}
              className={inputCls}
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
            />
          </div>
          <button
            onClick={() => commit(customEndTime ? new Date(customEndTime).toISOString() : undefined)}
            disabled={isPending}
            className="h-10 px-4 rounded-lg text-sm font-medium shrink-0 flex items-center gap-1.5 disabled:opacity-60"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
            Stop timer
          </button>
        </div>
      </div>
    )
  }

  // ── Active timer ──────────────────────────────────────────────────────────
  if (activeEntry) {
    return (
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: "oklch(0.97 0.03 58)", borderColor: "oklch(0.85 0.10 58)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: "var(--primary)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              {activeEntry.job.title}
            </p>
            <p className="text-xs" style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
              {formatElapsed(elapsed)}
            </p>
          </div>
          <button
            onClick={handleClockOut}
            disabled={isPending}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium shrink-0 disabled:opacity-60"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
            Clock out
          </button>
        </div>

        {showDesc && (
          <div className="px-4 pb-4 pt-1 border-t space-y-2" style={{ borderColor: "oklch(0.85 0.10 58)" }}>
            <input
              autoFocus
              type="text"
              placeholder="What did you work on? (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") commit() }}
              className={inputCls}
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDesc(false); setDescription("") }}
                className="flex-1 h-8 rounded-lg text-sm border"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => commit()}
                disabled={isPending}
                className="flex-1 h-8 rounded-lg text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save & stop"}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── No active timer: job picker ───────────────────────────────────────────
  const recentJobs = jobs.slice(0, 3)

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="px-4 pt-4 pb-4 space-y-3">
        {recentJobs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recentJobs.map(job => (
              <button
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className="h-8 px-3 rounded-lg border text-sm transition-colors"
                style={{
                  borderColor: selectedJobId === job.id ? "var(--primary)" : "var(--border)",
                  backgroundColor: selectedJobId === job.id ? "oklch(0.97 0.03 58)" : "var(--background-subtle)",
                  color: selectedJobId === job.id ? "var(--primary)" : "var(--text-secondary)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {job.title}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="flex-1 h-10 px-3 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[var(--primary)] appearance-none"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: selectedJobId ? "var(--text-primary)" : "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
          >
            <option value="">Select a job…</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.title} · {job.customer.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleClockIn}
            disabled={isPending || !selectedJobId}
            className="flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium shrink-0 disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Start timer
          </button>
        </div>
      </div>
    </div>
  )
}
