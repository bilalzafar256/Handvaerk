"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Pencil, Trash2, Clock, DollarSign, ExternalLink, Loader2, Ban, X } from "lucide-react"
import { deleteTimeEntryAction, updateTimeEntryAction } from "@/lib/actions/time-tracking"
import { ManualEntryForm } from "./manual-entry-form"
import type { TimeEntry } from "@/lib/db/schema/time-entries"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"
import Link from "next/link"

type EntryWithJob = TimeEntry & { job: Job & { customer: Customer } }

export interface JobOption {
  id: string
  title: string
  customer: { name: string }
}

interface WeeklyTimesheetProps {
  entries: EntryWithJob[]
  weekStart: Date
  activeJobs: JobOption[]
  hourlyRate: string | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date) {
  return d.toISOString().split("T")[0]
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDuration(minutes: number) {
  if (minutes === 0) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

function toTimeInput(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

const inputCls = `
  h-9 px-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1
  focus:ring-[var(--primary)] focus:border-[var(--primary)]
  transition-colors duration-150
`

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

// ── Main component ────────────────────────────────────────────────────────────

export function WeeklyTimesheet({ entries, weekStart, activeJobs, hourlyRate }: WeeklyTimesheetProps) {
  const router = useRouter()
  const today = toISO(new Date())
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const isCurrentWeek = toISO(weekStart) === toISO(startOfWeek(new Date()))

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([today]))
  const [addingDay, setAddingDay] = useState<string | null>(null)

  const totalMinutes = entries.filter(e => e.endedAt).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
  const billableMinutes = entries.filter(e => e.endedAt && e.isBillable).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)

  function toggleDay(iso: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(iso) ? next.delete(iso) : next.add(iso)
      return next
    })
  }

  function navigate(dir: -1 | 1) {
    router.push(`/time-tracking?week=${toISO(addDays(weekStart, dir * 7))}`)
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      {/* Week nav header */}
      <div
        className="px-5 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
      >
        <div className="flex items-center gap-2">
          <NavBtn onClick={() => navigate(-1)}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </NavBtn>
          <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            {isCurrentWeek
              ? "This week"
              : `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(weekStart, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
          </p>
          <NavBtn onClick={() => navigate(1)} disabled={isCurrentWeek}>
            <ChevronRight className="w-3.5 h-3.5" />
          </NavBtn>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 600 }}>
              {formatDuration(totalMinutes)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontWeight: 600 }}>
              {formatDuration(billableMinutes)}
            </span>
            <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>billable</span>
          </div>
        </div>
      </div>

      {/* Day rows */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {weekDays.map((day, i) => {
          const iso = toISO(day)
          const dayEntries = entries.filter(e => toISO(new Date(e.startedAt)) === iso)
          const dayMinutes = dayEntries.filter(e => e.endedAt).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
          const isToday = iso === today
          const isExpanded = expanded.has(iso)
          const isAddingHere = addingDay === iso

          // Group entries by job
          const jobGroups: Record<string, EntryWithJob[]> = {}
          for (const e of dayEntries) {
            if (!jobGroups[e.jobId]) jobGroups[e.jobId] = []
            jobGroups[e.jobId].push(e)
          }

          return (
            <div key={iso} style={{ backgroundColor: isToday ? "oklch(0.99 0.01 58)" : undefined }}>
              {/* Day header row */}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <button
                  onClick={() => toggleDay(iso)}
                  className="flex items-center gap-2 w-[72px] shrink-0"
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ fontFamily: "var(--font-body)", color: isToday ? "var(--primary)" : "var(--text-secondary)" }}
                  >
                    {DAY_LABELS[i]}
                  </span>
                  <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
                    {day.getDate()}
                  </span>
                  {dayEntries.length > 0 && (
                    <ChevronDown
                      className="w-3 h-3 transition-transform duration-150"
                      style={{ color: "var(--text-tertiary)", transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
                    />
                  )}
                </button>

                {dayEntries.length > 0 ? (
                  <>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--muted)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((dayMinutes / 480) * 100, 100)}%`,
                          backgroundColor: isToday ? "var(--primary)" : "oklch(0.60 0.14 58)",
                          opacity: isToday ? 1 : 0.6,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold shrink-0 w-12 text-right"
                      style={{ fontFamily: "var(--font-mono)", color: isToday ? "var(--primary)" : "var(--text-primary)" }}
                    >
                      {formatDuration(dayMinutes)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs flex-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>—</span>
                )}

                {/* Per-day add entry button */}
                <button
                  onClick={() => setAddingDay(isAddingHere ? null : iso)}
                  className="shrink-0 flex items-center gap-1 h-6 px-2 rounded-md border text-[11px] transition-colors"
                  style={{
                    borderColor: isAddingHere ? "var(--primary)" : "var(--border)",
                    color: isAddingHere ? "var(--primary)" : "var(--text-tertiary)",
                    backgroundColor: isAddingHere ? "oklch(0.97 0.03 58)" : "transparent",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {isAddingHere ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  Log
                </button>
              </div>

              {/* Expanded: job groups */}
              {isExpanded && dayEntries.length > 0 && (
                <div className="border-t" style={{ borderColor: "var(--border)" }}>
                  {Object.entries(jobGroups).map(([jobId, jobEntries]) => (
                    <JobGroup
                      key={jobId}
                      jobId={jobId}
                      entries={jobEntries}
                      onRefresh={() => router.refresh()}
                    />
                  ))}
                </div>
              )}

              {/* Inline add-entry form */}
              {isAddingHere && (
                <div className="px-4 pb-3 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                  <ManualEntryForm
                    jobs={activeJobs}
                    defaultDate={iso}
                    onClose={() => setAddingDay(null)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Job group ─────────────────────────────────────────────────────────────────

function JobGroup({ jobId, entries, onRefresh }: { jobId: string; entries: EntryWithJob[]; onRefresh: () => void }) {
  const job = entries[0].job
  const groupMinutes = entries.filter(e => e.endedAt).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
  const hasUnbilled = entries.some(e => e.endedAt && e.isBillable && !e.billedToQuoteId && !e.billedToInvoiceId)

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      {/* Job header */}
      <div
        className="flex items-center gap-3 px-4 py-2"
        style={{ backgroundColor: "var(--background-subtle)" }}
      >
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
            {job.title}
          </span>
          <span className="text-xs ml-1.5" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
            · {job.customer.name}
          </span>
        </div>

        {hasUnbilled && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
            style={{ backgroundColor: "oklch(0.97 0.04 58)", color: "var(--primary)", fontFamily: "var(--font-body)", border: "1px solid oklch(0.85 0.12 58)" }}
          >
            unbilled
          </span>
        )}

        <span className="text-xs font-semibold shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          {formatDuration(groupMinutes)}
        </span>

        <Link
          href={`/jobs/${jobId}`}
          className="shrink-0 flex items-center gap-0.5 text-[10px] transition-colors"
          style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--primary)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"}
        >
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Entry rows */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {entries.map(entry => (
          <EntryRow key={entry.id} entry={entry} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  )
}

// ── Entry row (with inline edit) ──────────────────────────────────────────────

function EntryRow({ entry, onRefresh }: { entry: EntryWithJob; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isRunning = !entry.endedAt

  // Edit state
  const [editStart, setEditStart] = useState(toTimeInput(entry.startedAt))
  const [editEnd,   setEditEnd]   = useState(entry.endedAt ? toTimeInput(entry.endedAt) : "")
  const [editDesc,  setEditDesc]  = useState(entry.description ?? "")
  const [editBill,  setEditBill]  = useState(entry.isBillable ?? true)

  function handleSave() {
    const dateStr = toISO(new Date(entry.startedAt))
    const newStart = new Date(`${dateStr}T${editStart}:00`)
    const newEnd   = editEnd ? new Date(`${dateStr}T${editEnd}:00`) : undefined

    startTransition(async () => {
      try {
        await updateTimeEntryAction(entry.id, {
          isBillable:  editBill,
          description: editDesc.trim() || undefined,
          startedAt:   newStart.toISOString(),
          ...(newEnd ? { endedAt: newEnd.toISOString() } : {}),
        })
        setEditing(false)
        onRefresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update entry")
      }
    })
  }

  function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    startTransition(async () => {
      try {
        await deleteTimeEntryAction(entry.id)
        onRefresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete entry")
        setConfirming(false)
      }
    })
  }

  if (editing) {
    return (
      <div
        className="px-4 py-3 space-y-2"
        style={{ backgroundColor: "oklch(0.985 0.005 58)" }}
      >
        <div className="flex gap-2 items-center">
          <div className="flex gap-2 flex-1">
            <div>
              <label className="block text-[10px] mb-0.5" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Start</label>
              <input
                type="time"
                value={editStart}
                onChange={e => setEditStart(e.target.value)}
                className={inputCls}
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", width: "9rem" }}
              />
            </div>
            {!isRunning && (
              <div>
                <label className="block text-[10px] mb-0.5" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>End</label>
                <input
                  type="time"
                  value={editEnd}
                  onChange={e => setEditEnd(e.target.value)}
                  className={inputCls}
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", width: "9rem" }}
                />
              </div>
            )}
          </div>
        </div>

        <input
          type="text"
          placeholder="Description (optional)"
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          className={`${inputCls} w-full`}
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setEditBill(b => !b)}
              className="w-9 h-5 rounded-full transition-colors relative shrink-0"
              style={{ backgroundColor: editBill ? "var(--primary)" : "var(--border)" }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ left: editBill ? "calc(100% - 18px)" : "2px" }}
              />
            </button>
            <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
              {editBill ? "Billable" : "Non-billable"}
            </span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="h-7 px-2.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="h-7 px-3 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-60"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group flex items-center gap-3 px-4 py-2.5 pl-8"
      style={{ backgroundColor: isRunning ? "oklch(0.97 0.03 58)" : undefined }}
      onMouseLeave={() => setConfirming(false)}
    >
      {/* Billable indicator */}
      <div className="shrink-0">
        {entry.isBillable
          ? <DollarSign className="w-3 h-3" style={{ color: "var(--primary)" }} />
          : <Ban className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
        }
      </div>

      {/* Times */}
      <span className="text-xs shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
        {formatTime(entry.startedAt)}
        {entry.endedAt ? ` – ${formatTime(entry.endedAt)}` : " (running)"}
      </span>

      {/* Description */}
      <span className="text-xs flex-1 truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
        {entry.description ?? ""}
      </span>

      {/* Duration */}
      <span className="text-xs font-semibold shrink-0" style={{ fontFamily: "var(--font-mono)", color: isRunning ? "var(--primary)" : "var(--text-primary)" }}>
        {isRunning ? "…" : formatDuration(entry.durationMinutes ?? 0)}
      </span>

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isRunning && (
          <button
            onClick={() => setEditing(true)}
            className="w-6 h-6 flex items-center justify-center rounded-md border transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-subtle)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ""}
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}

        {confirming ? (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="h-6 px-2 rounded-md border text-[10px] font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--error-light)", borderColor: "var(--error)", color: "var(--error)", fontFamily: "var(--font-body)" }}
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete?"}
          </button>
        ) : (
          <button
            onClick={handleDelete}
            className="w-6 h-6 flex items-center justify-center rounded-md border transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--error)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--error-light)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ""}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function NavBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--background)" }}
      onMouseEnter={e => !(e.currentTarget as HTMLButtonElement).disabled && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-subtle)")}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--background)"}
    >
      {children}
    </button>
  )
}
