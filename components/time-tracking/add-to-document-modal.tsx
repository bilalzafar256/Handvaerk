"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import { AlertTriangle, CheckCircle2, Loader2, FileText, Receipt } from "lucide-react"
import { addBillableHoursToLineItemAction } from "@/lib/actions/time-tracking"
import type { Quote } from "@/lib/db/schema/quotes"
import type { Invoice } from "@/lib/db/schema/invoices"

function formatMins(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

interface BillingStatus {
  totalBillableMinutes: number
  unbilledMinutes: number
  billedToQuote: Record<string, number>
  billedToInvoice: Record<string, number>
}

interface AddToDocumentModalProps {
  jobId: string
  quotes: Quote[]
  invoices: Invoice[]
  billingStatus: BillingStatus
  onClose: () => void
}

type Target = { type: "quote" | "invoice"; id: string }

export function AddToDocumentModal({
  jobId,
  quotes,
  invoices,
  billingStatus,
  onClose,
}: AddToDocumentModalProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Target | null>(null)
  const [isPending, startTransition] = useTransition()

  const { totalBillableMinutes, unbilledMinutes, billedToQuote, billedToInvoice } = billingStatus
  const alreadyBilledMinutes = totalBillableMinutes - unbilledMinutes

  function handleConfirm() {
    if (!selected) return
    startTransition(async () => {
      try {
        await addBillableHoursToLineItemAction(jobId, selected.type, selected.id)
        toast.success("Hours added as a line item")
        router.refresh()
        onClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add hours")
      }
    })
  }

  const hasDocuments = quotes.length > 0 || invoices.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[--radius-lg] border overflow-hidden"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-xl)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
        >
          <p className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            Add billable hours
          </p>

          {/* Summary pills */}
          <div className="flex items-center gap-3 mt-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "oklch(0.97 0.03 58)", color: "var(--primary)", fontFamily: "var(--font-mono)" }}
            >
              {formatMins(totalBillableMinutes)} total billable
            </span>
            {alreadyBilledMinutes > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "var(--background-subtle)", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", border: "1px solid var(--border)" }}
              >
                {formatMins(alreadyBilledMinutes)} already billed
              </span>
            )}
            {unbilledMinutes > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "oklch(0.96 0.04 145)", color: "oklch(0.35 0.14 145)", fontFamily: "var(--font-mono)" }}
              >
                {formatMins(unbilledMinutes)} unbilled
              </span>
            )}
          </div>
        </div>

        {/* Document list */}
        <div className="p-3 space-y-1 max-h-72 overflow-y-auto">
          {!hasDocuments && (
            <p className="text-sm text-center py-6" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
              No quotes or invoices on this job yet
            </p>
          )}

          {quotes.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider px-2 pt-1 pb-0.5"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
                Quotes
              </p>
              {quotes.map(q => {
                const billedMins = billedToQuote[q.id] ?? 0
                const isSelected = selected?.id === q.id
                const hasBilled = billedMins > 0
                return (
                  <DocumentRow
                    key={q.id}
                    icon={<FileText className="w-4 h-4" />}
                    label={`Quote ${q.quoteNumber}`}
                    sublabel={q.status ?? "draft"}
                    billedMins={billedMins}
                    isSelected={isSelected}
                    onSelect={() => setSelected({ type: "quote", id: q.id })}
                  />
                )
              })}
            </>
          )}

          {invoices.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider px-2 pt-2 pb-0.5"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
                Invoices
              </p>
              {invoices.map(inv => {
                const billedMins = billedToInvoice[inv.id] ?? 0
                const isSelected = selected?.id === inv.id
                return (
                  <DocumentRow
                    key={inv.id}
                    icon={<Receipt className="w-4 h-4" />}
                    label={`Invoice ${inv.invoiceNumber}`}
                    sublabel={inv.status ?? "draft"}
                    billedMins={billedMins}
                    isSelected={isSelected}
                    onSelect={() => setSelected({ type: "invoice", id: inv.id })}
                  />
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2 flex gap-2 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg text-sm border"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || isPending}
            className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity flex items-center justify-center gap-1.5"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Add to selected
          </button>
        </div>
      </div>
    </div>
  )
}

function DocumentRow({
  icon, label, sublabel, billedMins, isSelected, onSelect,
}: {
  icon: React.ReactNode
  label: string
  sublabel: string
  billedMins: number
  isSelected: boolean
  onSelect: () => void
}) {
  const hasBilled = billedMins > 0

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
      style={{
        backgroundColor: isSelected ? "oklch(0.97 0.03 58)" : "var(--background-subtle)",
        border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
      }}
    >
      {/* Selection indicator */}
      <div
        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
        style={{
          borderColor: isSelected ? "var(--primary)" : "var(--border)",
          backgroundColor: isSelected ? "var(--primary)" : "transparent",
        }}
      >
        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>

      <div className="shrink-0" style={{ color: "var(--text-secondary)" }}>{icon}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
          {label}
        </p>
        <p className="text-xs capitalize" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
          {sublabel}
        </p>
      </div>

      {/* Billing status badge */}
      {hasBilled ? (
        <div className="flex items-center gap-1 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.18 50)" }} />
          <span className="text-[10px] font-medium" style={{ color: "oklch(0.55 0.18 50)", fontFamily: "var(--font-body)" }}>
            {formatMins(billedMins)} already added
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "oklch(0.45 0.14 145)" }} />
          <span className="text-[10px] font-medium" style={{ color: "oklch(0.45 0.14 145)", fontFamily: "var(--font-body)" }}>
            No hours added
          </span>
        </div>
      )}
    </button>
  )
}
