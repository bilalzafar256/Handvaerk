"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { motion } from "motion/react"
import { Edit2, Trash2, Send, Download, CheckCircle, Copy, AlertCircle, FileText } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"
import {
  sendInvoiceAction,
  markInvoicePaidAction,
  deleteInvoiceAction,
  createCreditNoteAction,
} from "@/lib/actions/invoices"
import type { Invoice, InvoiceItem } from "@/lib/db/schema/invoices"
import type { Customer } from "@/lib/db/schema/customers"
import type { User } from "@/lib/db/schema/users"
import type { Job } from "@/lib/db/schema/jobs"
import type { Quote } from "@/lib/db/schema/quotes"

type InvoiceWithRelations = Invoice & {
  customer: Customer
  items: InvoiceItem[]
  job?: Job | null
  quote?: Quote | null
}

const STATUS_CONFIG = {
  draft:   { bg: "--status-new-bg",       text: "--status-new-text",       border: "--status-new-border",       label: "Draft" },
  sent:    { bg: "--status-scheduled-bg", text: "--status-scheduled-text", border: "--status-scheduled-border", label: "Sent" },
  viewed:  { bg: "--status-done-bg",      text: "--status-done-text",      border: "--status-done-border",      label: "Viewed" },
  paid:    { bg: "--status-paid-bg",      text: "--status-paid-text",      border: "--status-paid-border",      label: "Paid" },
  overdue: { bg: "--status-overdue-bg",   text: "--status-overdue-text",   border: "--status-overdue-border",   label: "Overdue" },
}

export function InvoiceDetail({ invoice, user }: { invoice: InvoiceWithRelations; user: User }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const status    = invoice.status ?? "draft"
  const statusCfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft
  const isOverdue = status === "overdue"
  const isPaid    = status === "paid"

  const subtotal = parseFloat(invoice.subtotalExVat ?? "0")
  const vat      = parseFloat(invoice.vatAmount ?? "0")
  const total    = parseFloat(invoice.totalInclVat ?? "0")

  async function handleSend() {
    if (!invoice.customer.email) { toast.error("Customer has no email address"); return }
    setBusy(true)
    try {
      await sendInvoiceAction(invoice.id)
      toast.success("Invoice sent to " + invoice.customer.email)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setBusy(false)
    }
  }

  async function handleMarkPaid() {
    setBusy(true)
    try {
      await markInvoicePaidAction(invoice.id)
      toast.success("Marked as paid")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setBusy(false)
    }
  }

  async function handleCreditNote() {
    setBusy(true)
    try {
      await createCreditNoteAction(invoice.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create credit note")
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteInvoiceAction(invoice.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pb-32 space-y-4 pt-4">
      {/* Status */}
      <div className="flex items-center gap-3">
        <motion.div key={status} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
          <span
            className="inline-flex items-center gap-1.5 px-3 h-7 rounded-[--radius-pill] text-sm font-medium border"
            style={{ backgroundColor: `var(${statusCfg.bg})`, color: `var(${statusCfg.text})`, borderColor: `var(${statusCfg.border})` }}
          >
            {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
            {isPaid && <CheckCircle className="w-3.5 h-3.5" />}
            {statusCfg.label}
          </span>
        </motion.div>
        {invoice.isCreditNote && (
          <span
            className="inline-flex items-center px-2.5 h-6 rounded-[--radius-pill] text-xs font-medium border"
            style={{ backgroundColor: "var(--status-done-bg)", color: "var(--status-done-text)", borderColor: "var(--status-done-border)" }}
          >
            Kreditnota
          </span>
        )}
      </div>

      {/* Customer + dates card */}
      <div className="rounded-[--radius-lg] border p-4 space-y-3" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Customer</p>
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{invoice.customer.name}</p>
            {invoice.customer.email && <p className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{invoice.customer.email}</p>}
            {invoice.eanNumber && <p className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>EAN: {invoice.eanNumber}</p>}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Dates</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              Issued: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{invoice.issueDate}</span>
            </p>
            <p className="text-xs mt-1" style={{ color: isOverdue ? "var(--error)" : "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              Due: <span style={{ fontFamily: "var(--font-mono)", color: isOverdue ? "var(--error)" : "var(--text-primary)" }}>{invoice.dueDate}</span>
            </p>
          </div>
        </div>
        {invoice.job && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Linked job</p>
            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>#{invoice.job.jobNumber} — {invoice.job.title}</p>
          </div>
        )}
      </div>

      {/* Line items — legal DK moms layout */}
      <div className="rounded-[--radius-lg] border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Line items</p>
        </div>
        {invoice.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>No items added</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {invoice.items.map(item => {
              const qty   = parseFloat(item.quantity ?? "1")
              const price = parseFloat(item.unitPrice ?? "0")
              const line  = parseFloat(item.lineTotal ?? String(qty * price))
              return (
                <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>{item.description}</p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                      {qty} × {formatDKK(price)} ekskl. moms
                    </p>
                  </div>
                  <p className="text-sm font-semibold flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {formatDKK(line)}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Legal DK moms totals */}
        <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Subtotal ekskl. moms</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{formatDKK(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Moms 25%</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{formatDKK(vat)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <span style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>Total inkl. moms</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontSize: 18 }}>{formatDKK(total)}</span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      {(invoice.bankAccount || invoice.mobilepayNumber) && (
        <div className="rounded-[--radius-md] border p-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Payment info</p>
          {invoice.bankAccount && (
            <p className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>Bank: {invoice.bankAccount}</p>
          )}
          {invoice.mobilepayNumber && (
            <p className="text-sm mt-1" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>MobilePay: {invoice.mobilepayNumber}</p>
          )}
        </div>
      )}

      {/* Paid stamp */}
      {isPaid && invoice.paidAt && (
        <div className="rounded-[--radius-md] p-4 flex items-center gap-3" style={{ backgroundColor: "var(--status-paid-bg)", border: "1px solid var(--status-paid-border)" }}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--status-paid-text)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--status-paid-text)", fontFamily: "var(--font-body)" }}>
            Paid on {new Date(invoice.paidAt).toLocaleDateString("da-DK")}
          </p>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-[--radius-md] border p-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Notes</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{invoice.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-2">
        {/* Edit (draft only) */}
        {status === "draft" && (
          <button
            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-[--radius-md] border font-medium text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)", fontFamily: "var(--font-body)", backgroundColor: "var(--surface)" }}
          >
            <Edit2 className="w-4 h-4" />
            Edit invoice
          </button>
        )}

        {/* Send */}
        {!isPaid && status !== "overdue" && (
          <button
            onClick={handleSend}
            disabled={busy}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-[--radius-md] font-medium text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-accent)" }}
          >
            <Send className="w-4 h-4" />
            {status === "sent" ? "Resend invoice" : "Send invoice"}
          </button>
        )}

        {/* Mark as paid */}
        {(status === "sent" || status === "viewed" || status === "overdue") && (
          <button
            onClick={handleMarkPaid}
            disabled={busy}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-[--radius-md] border font-medium text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            style={{ borderColor: "var(--status-paid-border)", color: "var(--status-paid-text)", backgroundColor: "var(--status-paid-bg)", fontFamily: "var(--font-body)" }}
          >
            <CheckCircle className="w-4 h-4" />
            Mark as paid
          </button>
        )}

        {/* Download PDF */}
        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          download
          className="w-full h-12 flex items-center justify-center gap-2 rounded-[--radius-md] border font-medium text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)", fontFamily: "var(--font-body)", backgroundColor: "var(--surface)" }}
        >
          <Download className="w-4 h-4" />
          Download PDF
        </a>

        {/* Credit note (sent+ invoices) */}
        {(status === "sent" || status === "paid" || status === "overdue") && !invoice.isCreditNote && (
          <button
            onClick={handleCreditNote}
            disabled={busy}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-[--radius-md] border font-medium text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-body)", backgroundColor: "var(--surface)" }}
          >
            <FileText className="w-4 h-4" />
            Create credit note
          </button>
        )}

        {/* Delete (draft only) */}
        {status === "draft" && (
          !showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-[--radius-md] border font-medium text-sm transition-all duration-150 cursor-pointer"
              style={{ borderColor: "var(--error-light)", color: "var(--error)", fontFamily: "var(--font-body)", backgroundColor: "var(--surface)" }}
            >
              <Trash2 className="w-4 h-4" />
              Delete invoice
            </button>
          ) : (
            <div className="rounded-[--radius-md] border p-4 space-y-3" style={{ borderColor: "var(--error-light)", backgroundColor: "var(--error-light)" }}>
              <p className="text-sm font-medium text-center" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>Delete this invoice?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-10 rounded-[--radius-sm] border text-sm font-medium cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={busy}
                  className="h-10 rounded-[--radius-sm] text-sm font-medium cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "var(--error)", color: "#fff", fontFamily: "var(--font-body)" }}
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
