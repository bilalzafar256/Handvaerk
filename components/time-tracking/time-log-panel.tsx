"use client"

import { useState } from "react"
import { Plus, Timer } from "lucide-react"
import { ClockPanel } from "./clock-panel"
import { TimeEntryList } from "./time-entry-list"
import { ManualEntryForm } from "./manual-entry-form"
import { AddToDocumentModal } from "./add-to-document-modal"
import type { TimeEntry } from "@/lib/db/schema/time-entries"
import type { Quote } from "@/lib/db/schema/quotes"
import type { Invoice } from "@/lib/db/schema/invoices"

interface BillingStatus {
  totalBillableMinutes: number
  unbilledMinutes: number
  billedToQuote: Record<string, number>
  billedToInvoice: Record<string, number>
}

interface TimeEntryWithRefs extends TimeEntry {
  billedToQuote?: { quoteNumber: string } | null
  billedToInvoice?: { invoiceNumber: string } | null
}

const CLOSED_JOB_STATUSES = ["done", "invoiced", "paid"]
const BLOCKED_QUOTE_STATUSES = ["rejected", "expired"]
const BLOCKED_INVOICE_STATUSES = ["paid"]

interface TimeLogPanelProps {
  jobId: string
  jobStatus: string
  entries: TimeEntryWithRefs[]
  activeEntry: TimeEntry | null
  isThisJobActive: boolean
  quotes: Quote[]
  invoices: Invoice[]
  billingStatus: BillingStatus
  hourlyRate: string | null
  estimatedHours?: string | null
}

export function TimeLogPanel({
  jobId,
  jobStatus,
  entries,
  activeEntry,
  isThisJobActive,
  quotes,
  invoices,
  billingStatus,
  hourlyRate,
  estimatedHours,
}: TimeLogPanelProps) {
  const [showManualForm, setShowManualForm] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const isJobClosed = CLOSED_JOB_STATUSES.includes(jobStatus)
  const eligibleQuotes = quotes.filter(q => !BLOCKED_QUOTE_STATUSES.includes(q.status ?? ""))
  const eligibleInvoices = invoices.filter(inv => !BLOCKED_INVOICE_STATUSES.includes(inv.status ?? ""))

  const hasBillableHours = billingStatus.totalBillableMinutes > 0
  const hasDocuments = eligibleQuotes.length > 0 || eligibleInvoices.length > 0

  const totalLoggedMinutes = entries.reduce((sum, e) => {
    if (e.durationMinutes !== null && e.durationMinutes !== undefined) return sum + e.durationMinutes
    const end = e.endedAt ? new Date(e.endedAt) : new Date()
    return sum + Math.floor((end.getTime() - new Date(e.startedAt).getTime()) / 60000)
  }, 0)
  const loggedHours = totalLoggedMinutes / 60
  const estHours = estimatedHours ? parseFloat(estimatedHours) : null
  const showProgress = estHours !== null && estHours > 0
  const progressPct = showProgress ? Math.min((loggedHours / estHours!) * 100, 100) : 0
  const isOverBudget = showProgress && loggedHours > estHours!

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 border-b flex items-center gap-2.5"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
      >
        <Timer className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--primary)" }} />
        <p
          className="text-xs font-semibold uppercase tracking-wider flex-1"
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          Time tracking
        </p>
        {!isJobClosed && (
          <button
            onClick={() => setShowManualForm(s => !s)}
            className="flex items-center gap-1 h-6 px-2 rounded-md text-xs border transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: "var(--border)",
              color: "var(--muted-foreground)",
              backgroundColor: showManualForm ? "var(--accent)" : "transparent",
            }}
          >
            <Plus className="w-3 h-3" />
            Manual
          </button>
        )}
      </div>

      <div className="px-4 py-3 space-y-3" style={{ backgroundColor: "var(--card)" }}>
        {/* Estimated hours progress (F-1802) */}
        {showProgress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                {loggedHours.toFixed(1)} hrs logged · {estHours!.toFixed(1)} hrs estimated
              </p>
              {isOverBudget && (
                <span className="text-[11px] font-semibold" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>
                  Over budget
                </span>
              )}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: isOverBudget ? "var(--error)" : "var(--primary)",
                }}
              />
            </div>
          </div>
        )}

        {/* Clock in/out */}
        <ClockPanel
          jobId={jobId}
          activeEntry={activeEntry}
          isThisJobActive={isThisJobActive}
          jobStatus={jobStatus}
        />

        {/* Manual entry form */}
        {showManualForm && (
          <ManualEntryForm jobId={jobId} onClose={() => setShowManualForm(false)} />
        )}

        {/* Entry list */}
        {entries.length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <TimeEntryList entries={entries} jobId={jobId} />
          </div>
        )}

        {/* Add hours to document */}
        {hasBillableHours && !hourlyRate && (
          <p
            className="text-xs text-center py-2"
            style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
          >
            Set your hourly rate in profile to convert hours to a line item
          </p>
        )}
        {hasBillableHours && hourlyRate && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full h-10 rounded-xl text-sm font-medium border transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: "var(--primary)",
              color: "var(--primary)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.97 0.03 58)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
          >
            Add billable hours to quote / invoice
          </button>
        )}
      </div>

      {/* Add to document modal */}
      {showAddModal && (
        <AddToDocumentModal
          jobId={jobId}
          quotes={eligibleQuotes}
          invoices={eligibleInvoices}
          billingStatus={billingStatus}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
