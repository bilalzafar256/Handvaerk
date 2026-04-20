"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import { Trash2, Clock, DollarSign, Ban } from "lucide-react"
import { deleteTimeEntryAction } from "@/lib/actions/time-tracking"
import type { TimeEntry } from "@/lib/db/schema/time-entries"

function formatDuration(minutes: number | null) {
  if (!minutes) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

interface TimeEntryRow extends TimeEntry {
  billedToQuote?: { quoteNumber: string } | null
  billedToInvoice?: { invoiceNumber: string } | null
}

interface TimeEntryListProps {
  entries: TimeEntryRow[]
  jobId: string
}

export function TimeEntryList({ entries, jobId }: TimeEntryListProps) {
  const router = useRouter()

  const completed = entries.filter(e => e.endedAt)
  const totalMinutes = completed.reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
  const billableMinutes = completed.filter(e => e.isBillable).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)

  if (entries.length === 0) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
        No time logged for this job
      </p>
    )
  }

  return (
    <div>
      {/* Totals row */}
      <div
        className="flex items-center gap-4 px-4 py-2.5 border-b text-xs"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
          <span style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Total</span>
          <span className="font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
            {formatDuration(totalMinutes)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
          <span style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Billable</span>
          <span className="font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
            {formatDuration(billableMinutes)}
          </span>
        </div>
      </div>

      {/* Entry rows */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {entries.map(entry => (
          <EntryRow key={entry.id} entry={entry} jobId={jobId} onDeleted={() => router.refresh()} />
        ))}
      </div>
    </div>
  )
}

function EntryRow({ entry, jobId, onDeleted }: { entry: TimeEntryRow; jobId: string; onDeleted: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const isRunning = !entry.endedAt

  const billedLabel = entry.billedToQuote
    ? `Billed · ${entry.billedToQuote.quoteNumber}`
    : entry.billedToInvoice
    ? `Billed · ${entry.billedToInvoice.invoiceNumber}`
    : null

  function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    startTransition(async () => {
      try {
        await deleteTimeEntryAction(entry.id)
        onDeleted()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete entry")
        setConfirming(false)
      }
    })
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ backgroundColor: isRunning ? "oklch(0.97 0.03 58)" : undefined }}
      onMouseLeave={() => setConfirming(false)}
    >
      {/* Billable indicator */}
      <div className="shrink-0">
        {entry.isBillable
          ? <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
          : <Ban className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
        }
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
            {formatDate(entry.startedAt)}
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {formatTime(entry.startedAt)}
            {entry.endedAt && ` – ${formatTime(entry.endedAt)}`}
          </span>
          {isRunning && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
            >
              RUNNING
            </span>
          )}
        </div>
        {entry.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
            {entry.description}
          </p>
        )}
        {billedLabel && (
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
            {billedLabel}
          </p>
        )}
      </div>

      {/* Duration */}
      <span
        className="text-sm font-semibold shrink-0"
        style={{ fontFamily: "var(--font-mono)", color: isRunning ? "var(--primary)" : "var(--text-primary)" }}
      >
        {isRunning ? "…" : formatDuration(entry.durationMinutes)}
      </span>

      {/* Delete */}
      {confirming ? (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="shrink-0 h-7 px-2.5 rounded-lg border text-[11px] font-medium cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: "var(--error-light)", borderColor: "var(--error)", color: "var(--error)", fontFamily: "var(--font-body)" }}
        >
          Confirm
        </button>
      ) : (
        <button
          onClick={handleDelete}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--error)" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--error-light)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = ""}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
