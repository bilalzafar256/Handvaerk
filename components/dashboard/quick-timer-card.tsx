"use client"

import { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import { Play, Square, Timer, Loader2, ChevronDown } from "lucide-react"
import { clockInAction, clockOutAction } from "@/lib/actions/time-tracking"
import type { TimeEntry } from "@/lib/db/schema/time-entries"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"

function formatDigital(ms: number) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
}

type ActiveEntry = TimeEntry & {
  job: Job & { customer: Customer }
}

type JobOption = Job & { customer: Customer }

interface QuickTimerCardProps {
  activeEntry: ActiveEntry | null
  jobs: JobOption[]
}

export function QuickTimerCard({ activeEntry, jobs }: QuickTimerCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [elapsed, setElapsed] = useState(0)
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id ?? "")

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

  if (activeEntry) {
    return (
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: "oklch(0.987 0.020 58)", borderColor: "oklch(0.88 0.08 58)" }}
      >
        <div
          className="px-4 py-2.5 border-b flex items-center gap-2"
          style={{ borderColor: "oklch(0.88 0.08 58)", backgroundColor: "oklch(0.970 0.035 58)" }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--primary)" }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--primary)" }}>
            Timer running
          </p>
        </div>
        <div className="px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className="font-bold leading-none tracking-wider"
              style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontSize: "2rem" }}
            >
              {formatDigital(elapsed)}
            </p>
            <p className="text-xs mt-1.5 truncate flex items-center gap-1.5" style={{ fontFamily: "var(--font-body)", color: "oklch(0.55 0.18 58)" }}>
              <Timer className="w-3 h-3 shrink-0" />
              {activeEntry.job.title} · {activeEntry.job.customer.name}
            </p>
          </div>
          <button
            onClick={handleClockOut}
            disabled={isPending}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium disabled:opacity-60 shrink-0"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
            Stop
          </button>
        </div>
      </div>
    )
  }

  if (jobs.length === 0) return null

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
          Quick timer
        </p>
      </div>
      <div className="px-4 py-3 flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="w-full h-10 pl-3 pr-8 rounded-lg border text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: "var(--border)",
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
              ["--tw-ring-color" as string]: "oklch(0.720 0.195 58 / 20%)",
            }}
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title} — {j.customer.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
        </div>
        <button
          onClick={handleClockIn}
          disabled={isPending || !selectedJobId}
          className="flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium disabled:opacity-60 shrink-0 transition-opacity"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          Start
        </button>
      </div>
    </div>
  )
}
