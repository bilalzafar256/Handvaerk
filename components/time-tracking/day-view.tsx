"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import {
  Plus,
  Clock,
  DollarSign,
  TrendingUp,
  Pencil,
  Trash2,
  Loader2,
  Ban,
  ExternalLink,
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { deleteTimeEntryAction, updateTimeEntryAction } from "@/lib/actions/time-tracking"
import { ManualEntryForm } from "./manual-entry-form"
import { formatDKK } from "@/lib/utils/currency"
import Link from "next/link"
import type { TimeEntry } from "@/lib/db/schema/time-entries"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryWithJob = TimeEntry & { job: Job & { customer: Customer } }

export interface JobOption {
  id: string
  title: string
  customer: { name: string }
}

interface DayViewProps {
  entries: EntryWithJob[]
  selectedDay: Date
  activeJobs: JobOption[]
  hourlyRate: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfWeek(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  r.setDate(r.getDate() + (day === 0 ? -6 : 1 - day))
  r.setHours(0, 0, 0, 0)
  return r
}

function fmtDur(minutes: number): string {
  if (!minutes) return "0h"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m}m`
  if (!m) return `${h}h`
  return `${h}h ${m}m`
}

function fmtTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

function toTimeInput(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

const HOUR_H = 56
const MIN_BLOCK_H = 26

const inputCls = `
  h-9 px-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1
  focus:ring-[var(--primary)] focus:border-[var(--primary)]
  transition-colors duration-150
`

// ─── Main component ───────────────────────────────────────────────────────────

export function DayView({ entries, selectedDay, activeJobs, hourlyRate }: DayViewProps) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)

  const dayISO = toISO(selectedDay)
  const todayISO = toISO(new Date())
  const isToday = dayISO === todayISO

  const dayEntries = entries
    .filter(e => toISO(new Date(e.startedAt)) === dayISO)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())

  const totalMins = dayEntries.filter(e => e.endedAt).reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
  const billableMins = dayEntries
    .filter(e => e.endedAt && e.isBillable)
    .reduce((s, e) => s + (e.durationMinutes ?? 0), 0)
  const earnings = hourlyRate ? (billableMins / 60) * Number(hourlyRate) : null

  function navDay(dir: -1 | 1) {
    const newDay = addDays(selectedDay, dir)
    router.push(`/time-tracking?week=${toISO(startOfWeek(newDay))}&day=${toISO(newDay)}`)
  }

  // Timeline range — expand ±1h around actual entries
  const allHourVals = dayEntries.flatMap(e => {
    const s = new Date(e.startedAt)
    const sh = s.getHours() + s.getMinutes() / 60
    if (!e.endedAt) {
      const now = new Date()
      return [sh, now.getHours() + now.getMinutes() / 60]
    }
    const en = new Date(e.endedAt)
    return [sh, en.getHours() + en.getMinutes() / 60]
  })

  const tlStart = allHourVals.length ? Math.max(0, Math.floor(Math.min(...allHourVals)) - 1) : 7
  const tlEnd = allHourVals.length ? Math.min(24, Math.ceil(Math.max(...allHourVals)) + 1) : 19
  const tlHours = Array.from({ length: tlEnd - tlStart }, (_, i) => tlStart + i)

  const formattedDay = selectedDay.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      {/* Day header */}
      <div
        className="px-4 py-3 border-b flex items-center gap-3 flex-wrap"
        style={{
          borderColor: "var(--border)",
          backgroundColor: isToday ? "oklch(0.99 0.01 58)" : "var(--muted)",
        }}
      >
        {/* Nav + title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => navDay(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors flex-shrink-0"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-subtle)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="min-w-0">
            <p
              className="text-[15px] font-semibold leading-tight truncate capitalize"
              style={{ fontFamily: "var(--font-display)", color: isToday ? "var(--primary)" : "var(--text-primary)" }}
            >
              {formattedDay}
            </p>
            {isToday && (
              <span
                className="text-[11px] font-medium"
                style={{ fontFamily: "var(--font-body)", color: "var(--primary)" }}
              >
                Today
              </span>
            )}
          </div>

          <button
            onClick={() => navDay(1)}
            disabled={dayISO >= todayISO}
            className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            onMouseEnter={e =>
              !(e.currentTarget as HTMLButtonElement).disabled &&
              ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-subtle)")
            }
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 flex-wrap">
          <StatChip
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Total"
            value={totalMins ? fmtDur(totalMins) : "—"}
            color={totalMins ? "var(--text-primary)" : "var(--text-tertiary)"}
            iconColor="var(--text-tertiary)"
          />
          <StatChip
            icon={<DollarSign className="w-3.5 h-3.5" />}
            label="Billable"
            value={billableMins ? fmtDur(billableMins) : "—"}
            color={billableMins ? "var(--primary)" : "var(--text-tertiary)"}
            iconColor={billableMins ? "var(--primary)" : "var(--text-tertiary)"}
          />
          {earnings !== null && earnings > 0 && (
            <StatChip
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              label="Est."
              value={formatDKK(earnings)}
              color="var(--success)"
              iconColor="var(--success)"
            />
          )}
        </div>

        {/* Add entry button */}
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium flex-shrink-0 transition-all"
          style={
            showAddForm
              ? {
                  backgroundColor: "oklch(0.97 0.03 58)",
                  color: "var(--primary)",
                  border: "1px solid var(--primary)",
                  fontFamily: "var(--font-body)",
                }
              : {
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                  fontFamily: "var(--font-body)",
                }
          }
        >
          {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAddForm ? "Cancel" : "Add entry"}
        </button>
      </div>

      {/* Add entry form */}
      {showAddForm && (
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)", backgroundColor: "oklch(0.99 0.01 58)" }}>
          <ManualEntryForm
            jobs={activeJobs}
            defaultDate={dayISO}
            onClose={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Empty state */}
      {dayEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <CalendarDays className="w-8 h-8" style={{ color: "var(--text-tertiary)" }} />
          <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
            No time logged {isToday ? "today" : "on this day"}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-1 text-sm font-medium"
            style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
          >
            Log time →
          </button>
        </div>
      )}

      {/* Timeline + entries */}
      {dayEntries.length > 0 && (
        <div className="flex flex-col md:flex-row">
          {/* Visual timeline */}
          <div
            className="relative flex-shrink-0 px-2 py-3 border-b md:border-b-0 md:border-r overflow-hidden"
            style={{
              borderColor: "var(--border)",
              width: "100%",
              minHeight: tlHours.length * HOUR_H + HOUR_H,
            }}
          >
            <div
              className="relative"
              style={{ height: tlHours.length * HOUR_H }}
            >
              {/* Hour grid lines */}
              {tlHours.map((h, i) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 flex items-start"
                  style={{ top: i * HOUR_H }}
                >
                  <span
                    className="text-[10px] w-10 text-right pr-2 select-none flex-shrink-0 leading-none pt-px"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </span>
                  <div className="flex-1 border-t mt-px" style={{ borderColor: "var(--border)" }} />
                </div>
              ))}

              {/* Entry blocks */}
              <div className="absolute" style={{ left: 44, right: 4, top: 0, bottom: 0 }}>
                {dayEntries.map(entry => {
                  const startTime = new Date(entry.startedAt)
                  const endTime = entry.endedAt ? new Date(entry.endedAt) : new Date()
                  const startH = startTime.getHours() + startTime.getMinutes() / 60
                  const endH = endTime.getHours() + endTime.getMinutes() / 60
                  const top = (startH - tlStart) * HOUR_H
                  const height = Math.max((endH - startH) * HOUR_H, MIN_BLOCK_H)
                  const isRunning = !entry.endedAt

                  return (
                    <div
                      key={entry.id}
                      className="absolute left-0 right-0 rounded-lg px-2 py-1 overflow-hidden border-l-[3px]"
                      style={{
                        top,
                        height,
                        marginBottom: 2,
                        backgroundColor: entry.isBillable ? "oklch(0.97 0.04 58)" : "var(--background-subtle)",
                        borderLeftColor: entry.isBillable ? "var(--primary)" : "var(--border-strong)",
                        borderTop: "1px solid",
                        borderRight: "1px solid",
                        borderBottom: isRunning ? "none" : "1px solid",
                        borderTopColor: entry.isBillable ? "oklch(0.88 0.09 58)" : "var(--border)",
                        borderRightColor: entry.isBillable ? "oklch(0.88 0.09 58)" : "var(--border)",
                        borderBottomColor: entry.isBillable ? "oklch(0.88 0.09 58)" : "var(--border)",
                      }}
                    >
                      <p
                        className="text-[11px] font-semibold truncate leading-tight"
                        style={{
                          fontFamily: "var(--font-body)",
                          color: entry.isBillable ? "var(--primary)" : "var(--text-secondary)",
                        }}
                      >
                        {entry.job.title}
                      </p>
                      {height > 44 && (
                        <p
                          className="text-[10px] truncate leading-tight"
                          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
                        >
                          {fmtTime(entry.startedAt)} – {entry.endedAt ? fmtTime(entry.endedAt) : "now"}
                        </p>
                      )}
                      {isRunning && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-0.5 animate-pulse"
                          style={{ backgroundColor: "var(--primary)" }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Entry cards */}
          <div className="flex-1 divide-y" style={{ borderColor: "var(--border)" }}>
            {dayEntries.map(entry => (
              <EntryCard key={entry.id} entry={entry} onRefresh={() => router.refresh()} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({
  icon,
  label,
  value,
  color,
  iconColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  iconColor: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color: iconColor }}>{icon}</span>
      <div>
        <p
          className="text-[10px] leading-none"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
        >
          {label}
        </p>
        <p
          className="text-sm font-semibold leading-tight"
          style={{ fontFamily: "var(--font-mono)", color }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({ entry, onRefresh }: { entry: EntryWithJob; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isRunning = !entry.endedAt

  const [editStart, setEditStart] = useState(toTimeInput(entry.startedAt))
  const [editEnd, setEditEnd] = useState(entry.endedAt ? toTimeInput(entry.endedAt) : "")
  const [editDesc, setEditDesc] = useState(entry.description ?? "")
  const [editBill, setEditBill] = useState(entry.isBillable ?? true)

  function handleSave() {
    const dateStr = toISO(new Date(entry.startedAt))
    const newStart = new Date(`${dateStr}T${editStart}:00`)
    const newEnd = editEnd ? new Date(`${dateStr}T${editEnd}:00`) : undefined

    startTransition(async () => {
      try {
        await updateTimeEntryAction(entry.id, {
          isBillable: editBill,
          description: editDesc.trim() || undefined,
          startedAt: newStart.toISOString(),
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
    if (!confirming) {
      setConfirming(true)
      return
    }
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
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label
              className="block text-[10px] mb-0.5"
              style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
            >
              Start
            </label>
            <input
              type="time"
              value={editStart}
              onChange={e => setEditStart(e.target.value)}
              className={inputCls}
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                width: "9rem",
              }}
            />
          </div>
          {!isRunning && (
            <div>
              <label
                className="block text-[10px] mb-0.5"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
              >
                End
              </label>
              <input
                type="time"
                value={editEnd}
                onChange={e => setEditEnd(e.target.value)}
                className={inputCls}
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  width: "9rem",
                }}
              />
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Description (optional)"
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          className={`${inputCls} w-full`}
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
          }}
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
            <span
              className="text-xs"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
            >
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
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                fontFamily: "var(--font-body)",
              }}
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
      className="group flex items-center gap-3 px-4 py-3"
      style={{ backgroundColor: isRunning ? "oklch(0.97 0.03 58)" : undefined }}
      onMouseLeave={() => setConfirming(false)}
    >
      {/* Billable indicator */}
      <div className="shrink-0">
        {entry.isBillable ? (
          <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
        ) : (
          <Ban className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
        )}
      </div>

      {/* Job + time */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-sm font-semibold truncate"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
          >
            {entry.job.title}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
          >
            · {entry.job.customer.name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span
            className="text-xs"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
          >
            {fmtTime(entry.startedAt)}
            {entry.endedAt ? ` – ${fmtTime(entry.endedAt)}` : " · running"}
          </span>
          {entry.description && (
            <span
              className="text-xs truncate"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
            >
              {entry.description}
            </span>
          )}
        </div>
      </div>

      {/* Duration */}
      <span
        className="text-sm font-semibold shrink-0"
        style={{
          fontFamily: "var(--font-mono)",
          color: isRunning ? "var(--primary)" : "var(--text-primary)",
        }}
      >
        {isRunning ? "…" : fmtDur(entry.durationMinutes ?? 0)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/jobs/${entry.jobId}`}
          className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-subtle)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {!isRunning && (
          <button
            onClick={() => setEditing(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-subtle)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        {confirming ? (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="h-7 px-2 rounded-lg border text-[11px] font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--error-light)",
              borderColor: "var(--error)",
              color: "var(--error)",
              fontFamily: "var(--font-body)",
            }}
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete?"}
          </button>
        ) : (
          <button
            onClick={handleDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--error)" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--error-light)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
