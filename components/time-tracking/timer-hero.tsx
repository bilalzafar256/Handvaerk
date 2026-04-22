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
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
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

interface TimerHeroProps {
  activeEntry: (TimeEntry & { job: JobOption }) | null
  jobs: JobOption[]
}

export function TimerHero({ activeEntry, jobs }: TimerHeroProps) {
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
              defaultValue={defaultEnd.toISOString().slice(0, 16)}
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
        style={{ backgroundColor: "oklch(0.97 0.03 58)", borderColor: "oklch(0.82 0.12 58)" }}
      >
        <div className="px-5 py-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--primary)" }} />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-body)", color: "var(--primary)" }}
              >
                Live
              </span>
            </div>
            <button
              onClick={handleClockOut}
              disabled={isPending}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium shrink-0 disabled:opacity-60 transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                fontFamily: "var(--font-body)",
                boxShadow: "var(--shadow-accent)",
              }}
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
              Clock out
            </button>
          </div>

          <div className="mb-3">
            <span
              className="font-semibold leading-none select-none tabular-nums"
              style={{ fontFamily: "var(--font-mono)", fontSize: 48, color: "var(--text-primary)", letterSpacing: "-0.03em" }}
            >
              {formatElapsed(elapsed)}
            </span>
          </div>

          <p
            className="text-base font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {activeEntry.job.title}
          </p>
          <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
            {activeEntry.job.customer.name}
          </p>
        </div>

        {showDesc && (
          <div className="px-5 pb-5 pt-0 border-t space-y-2" style={{ borderColor: "oklch(0.85 0.10 58)" }}>
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

  // ── Idle — job picker ─────────────────────────────────────────────────────
  const recentJobs = jobs.slice(0, 4)

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="px-5 pt-5 pb-5 space-y-4">
        <div>
          <span
            className="font-semibold leading-none select-none tabular-nums"
            style={{ fontFamily: "var(--font-mono)", fontSize: 48, color: "var(--text-tertiary)", letterSpacing: "-0.03em" }}
          >
            00:00
          </span>
          <p className="text-sm mt-1" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
            No timer running
          </p>
        </div>

        {recentJobs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recentJobs.map(job => (
              <button
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className="h-8 px-3 rounded-lg border text-sm transition-all"
                style={{
                  borderColor: selectedJobId === job.id ? "var(--primary)" : "var(--border)",
                  backgroundColor: selectedJobId === job.id ? "oklch(0.97 0.04 58)" : "var(--background-subtle)",
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
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: selectedJobId ? "var(--text-primary)" : "var(--text-tertiary)",
              fontFamily: "var(--font-body)",
            }}
          >
            <option value="">Select a job…</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title} · {job.customer.name}</option>
            ))}
          </select>

          <button
            onClick={handleClockIn}
            disabled={isPending || !selectedJobId}
            className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold shrink-0 disabled:opacity-50 transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              fontFamily: "var(--font-body)",
              boxShadow: selectedJobId ? "var(--shadow-accent)" : "none",
            }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Start
          </button>
        </div>
      </div>
    </div>
  )
}
