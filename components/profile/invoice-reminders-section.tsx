"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Bell } from "lucide-react"
import { updateInvoiceRemindersAction } from "@/lib/actions/profile"

interface Props {
  reminder1Days: number
  reminder2Days: number
}

const inputCls = `
  w-full h-11 px-3
  bg-[var(--background)] text-[var(--foreground)]
  border border-[var(--border)]
  rounded-lg
  placeholder:opacity-40
  focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
  transition-colors duration-150 text-sm
`

export function InvoiceRemindersSection({ reminder1Days: init1, reminder2Days: init2 }: Props) {
  const [r1, setR1] = useState(String(init1))
  const [r2, setR2] = useState(String(init2))
  const [isPending, startTransition] = useTransition()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const d1 = parseInt(r1, 10)
    const d2 = parseInt(r2, 10)
    if (isNaN(d1) || d1 < 1 || isNaN(d2) || d2 < 1) {
      toast.error("Days must be positive numbers")
      return
    }
    if (d2 <= d1) {
      toast.error("Second reminder must be after first reminder")
      return
    }
    startTransition(async () => {
      try {
        await updateInvoiceRemindersAction(d1, d2)
        toast.success("Reminder settings saved")
      } catch {
        toast.error("Failed to save reminder settings")
      }
    })
  }

  return (
    <div
      className="mx-4 mt-4 rounded-[--radius-lg] border overflow-hidden"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
        >
          Invoice reminders
        </p>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--background-subtle)" }}
          >
            <Bell className="w-4 h-4" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
              Automatic payment reminders
            </p>
            <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
              Reminders are sent automatically after the invoice due date. Applies to all future invoices.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                First reminder (days after due date)
              </label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={r1}
                onChange={e => setR1(e.target.value)}
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                Second reminder (days after due date)
              </label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={r2}
                onChange={e => setR2(e.target.value)}
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-10 px-5 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  )
}
