"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import { Plus, Loader2, X } from "lucide-react"
import { createManualEntryAction } from "@/lib/actions/time-tracking"

const inputCls = `
  w-full h-10 px-3
  bg-[var(--background)] text-[var(--foreground)]
  border border-[var(--border)]
  rounded-lg
  placeholder:opacity-40
  focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
  transition-colors duration-150 text-sm
`

interface JobOption {
  id: string
  title: string
  customer: { name: string }
}

interface ManualEntryFormProps {
  jobId?: string
  jobs?: JobOption[]
  defaultDate?: string
  onClose: () => void
}

export function ManualEntryForm({ jobId: jobIdProp, jobs, defaultDate, onClose }: ManualEntryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const today = defaultDate ?? new Date().toISOString().split("T")[0]
  const [selectedJobId, setSelectedJobId] = useState(jobIdProp ?? jobs?.[0]?.id ?? "")
  const [date, setDate] = useState(today)
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("09:00")
  const [description, setDescription] = useState("")
  const [isBillable, setIsBillable] = useState(true)

  const jobId = jobIdProp ?? selectedJobId

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jobId) return
    startTransition(async () => {
      try {
        await createManualEntryAction({ jobId, date, startTime, endTime, description, isBillable })
        toast.success("Time entry added")
        router.refresh()
        onClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add entry")
      }
    })
  }

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          Add manual entry
        </p>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ color: "var(--text-tertiary)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {!jobIdProp && jobs && jobs.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Job</label>
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              required
              className={inputCls}
              style={{ appearance: "none" }}
            >
              <option value="">Select a job…</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title} · {j.customer.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Date</label>
            <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Start</label>
            <input type="time" className={inputCls} value={startTime} onChange={e => setStartTime(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>End</label>
            <input type="time" className={inputCls} value={endTime} onChange={e => setEndTime(e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Description (optional)</label>
          <input
            type="text"
            className={inputCls}
            placeholder="What did you work on?"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setIsBillable(b => !b)}
              className="w-10 h-6 rounded-full transition-colors relative"
              style={{ backgroundColor: isBillable ? "var(--primary)" : "var(--border)" }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ left: isBillable ? "calc(100% - 20px)" : "4px" }}
              />
            </button>
            <span className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
              {isBillable ? "Billable" : "Non-billable"}
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-lg text-sm border"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
