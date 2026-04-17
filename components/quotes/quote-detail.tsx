"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { motion } from "motion/react"
import {
  Edit2,
  Trash2,
  Send,
  Download,
  Copy,
  FileText,
  CheckCircle,
  XCircle,
  BookmarkPlus,
  Receipt,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"
import {
  updateQuoteStatusAction,
  deleteQuoteAction,
  sendQuoteEmailAction,
  saveQuoteAsTemplateAction,
} from "@/lib/actions/quotes"
import { createInvoiceFromQuoteAction } from "@/lib/actions/invoices"
import type { Quote, QuoteItem } from "@/lib/db/schema/quotes"
import type { Customer } from "@/lib/db/schema/customers"
import type { User } from "@/lib/db/schema/users"
import type { Job } from "@/lib/db/schema/jobs"
import type { Invoice } from "@/lib/db/schema/invoices"

type QuoteWithRelations = Quote & {
  customer: Customer
  items: QuoteItem[]
  job?: Job | null
  user?: User
}

const STATUS_LABELS: Record<string, string> = {
  draft:    "Draft",
  sent:     "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired:  "Expired",
}

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  draft:    { bg: "--status-new-bg",       text: "--status-new-text",       border: "--status-new-border" },
  sent:     { bg: "--status-scheduled-bg", text: "--status-scheduled-text", border: "--status-scheduled-border" },
  accepted: { bg: "--status-paid-bg",      text: "--status-paid-text",      border: "--status-paid-border" },
  rejected: { bg: "--status-overdue-bg",   text: "--status-overdue-text",   border: "--status-overdue-border" },
  expired:  { bg: "--status-invoiced-bg",  text: "--status-invoiced-text",  border: "--status-invoiced-border" },
}

export function QuoteDetail({
  quote,
  user,
  linkedInvoice,
}: {
  quote: QuoteWithRelations
  user: User
  linkedInvoice?: Invoice | null
}) {
  const router = useRouter()
  const [busy, setBusy]               = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showTemplateName, setShowTemplateName]   = useState(false)
  const [templateName, setTemplateName]           = useState("")
  const [duplicateInvoiceId, setDuplicateInvoiceId] = useState<string | null>(null)
  const [showActionsMenu, setShowActionsMenu]       = useState(false)

  const status = quote.status ?? "draft"
  const style  = STATUS_STYLE[status] ?? STATUS_STYLE.draft

  function calcLineTotal(item: QuoteItem): number {
    const qty    = parseFloat(item.quantity ?? "1")
    const price  = parseFloat(item.unitPrice ?? "0")
    const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
    const gross  = qty * price * markup
    if (!item.discountType || !item.discountValue) return gross
    const dv = parseFloat(item.discountValue) || 0
    return item.discountType === "percent" ? gross * (1 - dv / 100) : gross - dv
  }

  const subtotal = quote.items.reduce((s, item) => s + calcLineTotal(item), 0)

  let discount = 0
  if (quote.discountValue && parseFloat(quote.discountValue) > 0) {
    discount = quote.discountType === "percent"
      ? subtotal * (parseFloat(quote.discountValue) / 100)
      : parseFloat(quote.discountValue)
  }

  const afterDiscount = subtotal - discount
  const shareUrl = `${window.location.origin}/en/q/${quote.shareToken}`

  async function handleSend() {
    if (!quote.customer.email) { toast.error("Customer has no email address"); return }
    setBusy(true)
    try {
      await sendQuoteEmailAction(quote.id)
      toast.success("Quote sent to " + quote.customer.email)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setBusy(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    setBusy(true)
    try {
      await updateQuoteStatusAction(quote.id, newStatus)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteQuoteAction(quote.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
      setBusy(false)
    }
  }

  async function handleCreateInvoice(force = false) {
    setBusy(true)
    try {
      const result = await createInvoiceFromQuoteAction(quote.id, force)
      if ("existingInvoiceId" in result) {
        setDuplicateInvoiceId(result.existingInvoiceId)
        setBusy(false)
      } else {
        router.push(`/invoices/${result.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invoice")
      setBusy(false)
    }
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) { toast.error("Enter a template name"); return }
    setBusy(true)
    try {
      await saveQuoteAsTemplateAction(quote.id, templateName.trim())
      toast.success("Template saved")
      setShowTemplateName(false)
      setTemplateName("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save template")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pb-16 space-y-4">
      {/* Duplicate invoice modal */}
      {duplicateInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm mx-4 rounded-[--radius-lg] border p-5 space-y-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div>
              <p className="font-semibold text-base" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>Invoice already exists</p>
              <p className="text-sm mt-1" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                An invoice was already generated from this quote. Do you want to view it or create a new one?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setDuplicateInvoiceId(null); router.push(`/invoices/${duplicateInvoiceId}`) }}
                className="h-10 rounded-[--radius-sm] border text-sm font-medium cursor-pointer"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)", fontFamily: "var(--font-body)", backgroundColor: "var(--surface)" }}
              >
                View existing
              </button>
              <button
                onClick={() => { setDuplicateInvoiceId(null); handleCreateInvoice(true) }}
                disabled={busy}
                className="h-10 rounded-[--radius-sm] text-sm font-medium cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
              >
                Create new
              </button>
            </div>
            <button
              onClick={() => setDuplicateInvoiceId(null)}
              className="w-full text-sm text-center cursor-pointer"
              style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Compact action bar */}
      <div className="sticky top-0 z-20 px-4 py-2 flex items-center gap-2 border-b" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <motion.div key={status} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
          <span
            className="inline-flex items-center px-2.5 h-6 rounded-[--radius-pill] text-xs font-medium border"
            style={{ backgroundColor: `var(${style.bg})`, color: `var(${style.text})`, borderColor: `var(${style.border})` }}
          >
            {STATUS_LABELS[status]}
          </span>
        </motion.div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Primary action */}
          {(status === "draft" || status === "sent") && (
            <button
              onClick={handleSend}
              disabled={busy}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[--radius-sm] text-xs font-medium transition-all duration-150 disabled:opacity-50 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
            >
              <Send className="w-3.5 h-3.5" />
              {status === "sent" ? "Resend" : "Send"}
            </button>
          )}
          {status === "accepted" && (
            <button
              onClick={() => handleCreateInvoice()}
              disabled={busy}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[--radius-sm] text-xs font-medium transition-all duration-150 disabled:opacity-50 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
            >
              <Receipt className="w-3.5 h-3.5" />
              Invoice
            </button>
          )}

          {/* PDF download */}
          <a
            href={`/api/quotes/${quote.id}/pdf`}
            download
            className="flex items-center justify-center w-8 h-8 rounded-[--radius-sm] border transition-colors cursor-pointer bg-[--surface] hover:bg-[--background-subtle]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </a>

          {/* Copy share link */}
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied") }}
            className="flex items-center justify-center w-8 h-8 rounded-[--radius-sm] border transition-colors cursor-pointer bg-[--surface] hover:bg-[--background-subtle]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            title="Copy share link"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowActionsMenu(v => !v)}
              className="flex items-center justify-center w-8 h-8 rounded-[--radius-sm] border transition-colors cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {showActionsMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-48 rounded-[--radius-md] border shadow-lg overflow-hidden z-30"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
              >
                {status === "draft" && (
                  <button
                    onClick={() => { setShowActionsMenu(false); router.push(`/quotes/${quote.id}/edit`) }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[--background-subtle] transition-colors cursor-pointer"
                    style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
                  >
                    <Edit2 className="w-4 h-4 flex-shrink-0" />
                    Edit quote
                  </button>
                )}
                {status === "sent" && (
                  <div className="grid grid-cols-2 gap-1 px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                    <button
                      onClick={() => { setShowActionsMenu(false); handleStatusChange("accepted") }}
                      disabled={busy}
                      className="h-8 flex items-center justify-center gap-1 rounded-[--radius-sm] text-xs font-medium cursor-pointer border"
                      style={{ borderColor: "var(--status-paid-border)", color: "var(--status-paid-text)", backgroundColor: "var(--status-paid-bg)" }}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => { setShowActionsMenu(false); handleStatusChange("rejected") }}
                      disabled={busy}
                      className="h-8 flex items-center justify-center gap-1 rounded-[--radius-sm] text-xs font-medium cursor-pointer border"
                      style={{ borderColor: "var(--status-overdue-border)", color: "var(--status-overdue-text)", backgroundColor: "var(--status-overdue-bg)" }}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}
                <button
                  onClick={() => { setShowActionsMenu(false); setShowTemplateName(true) }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[--background-subtle] transition-colors cursor-pointer"
                  style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
                >
                  <BookmarkPlus className="w-4 h-4 flex-shrink-0" />
                  Save as template
                </button>
                <button
                  onClick={() => { setShowActionsMenu(false); setShowDeleteConfirm(true) }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[--background-subtle] transition-colors cursor-pointer border-t"
                  style={{ fontFamily: "var(--font-body)", color: "var(--error)", borderColor: "var(--border)" }}
                >
                  <Trash2 className="w-4 h-4 flex-shrink-0" />
                  Delete quote
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">

      {/* Linked invoice banner */}
      {linkedInvoice && (
        <a
          href={`/invoices/${linkedInvoice.id}`}
          className="flex items-center gap-3 px-4 py-3 rounded-[--radius-md] border transition-colors duration-150 hover:opacity-90"
          style={{ backgroundColor: "var(--status-paid-bg)", borderColor: "var(--status-paid-border)" }}
        >
          <Receipt className="w-4 h-4 flex-shrink-0" style={{ color: "var(--status-paid-text)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)", color: "var(--status-paid-text)" }}>
              Invoice generated
            </p>
            <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--status-paid-text)", opacity: 0.8 }}>
              {linkedInvoice.invoiceNumber} · {linkedInvoice.status}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--status-paid-text)" }} />
        </a>
      )}

      {/* Customer + dates card */}
      <div className="rounded-[--radius-lg] border p-4 space-y-3" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Customer</p>
          <p className="font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{quote.customer.name}</p>
          {quote.customer.email && <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{quote.customer.email}</p>}
        </div>
        {quote.validUntil && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Valid until</p>
            <p className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
              {new Date(quote.validUntil).toLocaleDateString("da-DK")}
            </p>
          </div>
        )}
        {quote.job && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Linked job</p>
            <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
              #{quote.job.jobNumber} — {quote.job.title}
            </p>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="rounded-[--radius-lg] border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Line items</p>
        </div>
        {quote.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>No items</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {quote.items.map(item => {
              const qty    = parseFloat(item.quantity ?? "1")
              const price  = parseFloat(item.unitPrice ?? "0")
              const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
              const line   = calcLineTotal(item)
              return (
                <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>{item.description}</p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                      {qty} × {formatDKK(price * markup)}
                      {item.markupPercent && parseFloat(item.markupPercent) > 0 ? ` (+${item.markupPercent}%)` : ""}
                      {item.discountType && item.discountValue ? ` −${item.discountType === "percent" ? `${item.discountValue}%` : formatDKK(parseFloat(item.discountValue))}` : ""}
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

        {/* Totals */}
        <div className="px-4 py-3 border-t space-y-1.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}>
          {discount > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Subtotal</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{formatDKK(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                  Discount {quote.discountType === "percent" ? `(${quote.discountValue}%)` : ""}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--error)" }}>-{formatDKK(discount)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-semibold text-base pt-1 border-t" style={{ borderColor: "var(--border)" }}>
            <span style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>Total ekskl. moms</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{formatDKK(afterDiscount)}</span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>+ 25% moms = {formatDKK(afterDiscount * 1.25)} inkl. moms</p>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="rounded-[--radius-md] border p-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Notes</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{quote.notes}</p>
        </div>
      )}

      {/* Save as template inline input */}
      {showTemplateName && (
        <div className="flex gap-2">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name…"
            className="flex-1 h-11 px-3 rounded-[--radius-sm] border text-sm focus:outline-none focus:border-[--primary]"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
          />
          <button
            onClick={handleSaveTemplate}
            disabled={busy}
            className="h-11 px-4 rounded-[--radius-sm] text-sm font-medium cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            Save
          </button>
          <button
            onClick={() => setShowTemplateName(false)}
            className="h-11 px-3 rounded-[--radius-sm] text-sm font-medium cursor-pointer border"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="rounded-[--radius-md] border p-4 space-y-3" style={{ borderColor: "var(--error-light)", backgroundColor: "var(--error-light)" }}>
          <p className="text-sm font-medium text-center" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>Delete this quote?</p>
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
      )}

      </div>
    </div>
  )
}
