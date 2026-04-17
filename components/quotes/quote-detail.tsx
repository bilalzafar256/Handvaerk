"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { motion } from "motion/react"
import {
  Edit2, Trash2, Send, Download, Copy, FileText, CheckCircle, XCircle,
  BookmarkPlus, Receipt, ChevronRight, MoreHorizontal, User as UserIcon, Calendar, Briefcase, StickyNote,
} from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"
import {
  updateQuoteStatusAction, deleteQuoteAction, sendQuoteEmailAction, saveQuoteAsTemplateAction,
} from "@/lib/actions/quotes"
import { createInvoiceFromQuoteAction } from "@/lib/actions/invoices"
import type { Quote, QuoteItem } from "@/lib/db/schema/quotes"
import type { Customer } from "@/lib/db/schema/customers"
import type { User } from "@/lib/db/schema/users"
import type { Job } from "@/lib/db/schema/jobs"
import type { Invoice } from "@/lib/db/schema/invoices"
import { Link } from "@/i18n/navigation"

type QuoteWithRelations = Quote & { customer: Customer; items: QuoteItem[]; job?: Job | null; user?: User }

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", sent: "Sent", accepted: "Accepted", rejected: "Rejected", expired: "Expired",
}
const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  draft:    { bg: "--status-new-bg",       text: "--status-new-text",       border: "--status-new-border" },
  sent:     { bg: "--status-scheduled-bg", text: "--status-scheduled-text", border: "--status-scheduled-border" },
  accepted: { bg: "--status-paid-bg",      text: "--status-paid-text",      border: "--status-paid-border" },
  rejected: { bg: "--status-overdue-bg",   text: "--status-overdue-text",   border: "--status-overdue-border" },
  expired:  { bg: "--status-invoiced-bg",  text: "--status-invoiced-text",  border: "--status-invoiced-border" },
}

const ACCENTS: Record<string, string> = {
  blue:   "oklch(0.55 0.15 240)",
  amber:  "var(--amber-500)",
  green:  "oklch(0.52 0.14 145)",
  purple: "oklch(0.55 0.12 290)",
}

function Card({ title, children, accent = "blue" }: { title: string; children: React.ReactNode; accent?: keyof typeof ACCENTS }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ACCENTS[accent] }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
          {title}
        </p>
      </div>
      <div className="px-4 py-3" style={{ backgroundColor: "var(--card)" }}>{children}</div>
    </div>
  )
}

export function QuoteDetail({
  quote, user, linkedInvoice,
}: {
  quote: QuoteWithRelations; user: User; linkedInvoice?: Invoice | null
}) {
  const router = useRouter()
  const [busy, setBusy]                             = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm]   = useState(false)
  const [showTemplateName, setShowTemplateName]     = useState(false)
  const [templateName, setTemplateName]             = useState("")
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
    try { await sendQuoteEmailAction(quote.id); toast.success("Quote sent to " + quote.customer.email); router.refresh() }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to send") }
    finally { setBusy(false) }
  }

  async function handleStatusChange(newStatus: string) {
    setBusy(true)
    try { await updateQuoteStatusAction(quote.id, newStatus); router.refresh() }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update") }
    finally { setBusy(false) }
  }

  async function handleDelete() {
    setBusy(true)
    try { await deleteQuoteAction(quote.id) }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete"); setBusy(false) }
  }

  async function handleCreateInvoice(force = false) {
    setBusy(true)
    try {
      const result = await createInvoiceFromQuoteAction(quote.id, force)
      if ("existingInvoiceId" in result) { setDuplicateInvoiceId(result.existingInvoiceId); setBusy(false) }
      else { router.push(`/invoices/${result.id}`) }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create invoice"); setBusy(false) }
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) { toast.error("Enter a template name"); return }
    setBusy(true)
    try { await saveQuoteAsTemplateAction(quote.id, templateName.trim()); toast.success("Template saved"); setShowTemplateName(false); setTemplateName("") }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save template") }
    finally { setBusy(false) }
  }

  const iconBtn = "w-8 h-8 flex items-center justify-center rounded-lg border bg-[var(--background)] hover:bg-[var(--accent)] transition-colors cursor-pointer disabled:opacity-40"
  const iconBtnStyle = { borderColor: "var(--border)", color: "var(--foreground)" }

  return (
    <div className="pb-16">
      {/* Duplicate invoice modal */}
      {duplicateInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" style={{ backgroundColor: "oklch(0.10 0.005 50 / 0.5)" }}>
          <div className="w-full max-w-sm rounded-xl border p-5 space-y-4" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-xl)" }}>
            <div>
              <p className="font-semibold text-base" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Invoice already exists</p>
              <p className="text-sm mt-1" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                An invoice was already generated from this quote. View it or create a new one?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setDuplicateInvoiceId(null); router.push(`/invoices/${duplicateInvoiceId}`) }}
                className="h-10 rounded-lg border text-sm font-medium cursor-pointer hover:bg-[var(--accent)] transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}
              >
                View existing
              </button>
              <button
                onClick={() => { setDuplicateInvoiceId(null); handleCreateInvoice(true) }}
                disabled={busy}
                className="h-10 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 bg-[var(--primary)] hover:bg-[var(--amber-600)] transition-colors"
                style={{ color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
              >
                Create new
              </button>
            </div>
            <button onClick={() => setDuplicateInvoiceId(null)} className="w-full text-sm text-center cursor-pointer hover:opacity-70 transition-opacity" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sticky action bar */}
      <div className="sticky top-14 z-20 px-4 py-2 flex items-center gap-2 border-b" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
        <motion.div key={status} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
          <span
            className="inline-flex items-center px-2.5 h-6 rounded-full text-xs font-medium border"
            style={{ backgroundColor: `var(${style.bg})`, color: `var(${style.text})`, borderColor: `var(${style.border})` }}
          >
            {STATUS_LABELS[status]}
          </span>
        </motion.div>

        <div className="flex items-center gap-1.5 ml-auto">
          {(status === "draft" || status === "sent") && (
            <button onClick={handleSend} disabled={busy}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--primary)] hover:bg-[var(--amber-600)] transition-colors disabled:opacity-50 cursor-pointer"
              style={{ color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}>
              <Send className="w-3.5 h-3.5" />
              {status === "sent" ? "Resend" : "Send"}
            </button>
          )}
          {status === "accepted" && (
            <button onClick={() => handleCreateInvoice()} disabled={busy}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--primary)] hover:bg-[var(--amber-600)] transition-colors disabled:opacity-50 cursor-pointer"
              style={{ color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}>
              <Receipt className="w-3.5 h-3.5" />
              Invoice
            </button>
          )}
          <a href={`/api/quotes/${quote.id}/pdf`} download className={iconBtn} style={iconBtnStyle} title="Download PDF">
            <Download className="w-3.5 h-3.5" />
          </a>
          <button type="button" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied") }}
            className={iconBtn} style={iconBtnStyle} title="Copy share link">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button type="button" onClick={() => setShowActionsMenu(v => !v)}
              className={iconBtn} style={iconBtnStyle}>
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {showActionsMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border overflow-hidden z-30"
                  style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>
                  {status === "draft" && (
                    <button onClick={() => { setShowActionsMenu(false); router.push(`/quotes/${quote.id}/edit`) }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--accent)] transition-colors cursor-pointer"
                      style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                      <Edit2 className="w-4 h-4 flex-shrink-0" />
                      Edit quote
                    </button>
                  )}
                  {status === "sent" && (
                    <div className="grid grid-cols-2 gap-1 px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                      <button onClick={() => { setShowActionsMenu(false); handleStatusChange("accepted") }} disabled={busy}
                        className="h-8 flex items-center justify-center gap-1 rounded-lg text-xs font-medium cursor-pointer border"
                        style={{ borderColor: "var(--status-paid-border)", color: "var(--status-paid-text)", backgroundColor: "var(--status-paid-bg)" }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button onClick={() => { setShowActionsMenu(false); handleStatusChange("rejected") }} disabled={busy}
                        className="h-8 flex items-center justify-center gap-1 rounded-lg text-xs font-medium cursor-pointer border"
                        style={{ borderColor: "var(--status-overdue-border)", color: "var(--status-overdue-text)", backgroundColor: "var(--status-overdue-bg)" }}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                  <button onClick={() => { setShowActionsMenu(false); setShowTemplateName(true) }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--accent)] transition-colors cursor-pointer"
                    style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                    <BookmarkPlus className="w-4 h-4 flex-shrink-0" />
                    Save as template
                  </button>
                  <button onClick={() => { setShowActionsMenu(false); setShowDeleteConfirm(true) }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--error-light)] transition-colors cursor-pointer border-t"
                    style={{ fontFamily: "var(--font-body)", color: "var(--error)", borderColor: "var(--border)" }}>
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    Delete quote
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-3 pb-8 px-4 lg:px-6 space-y-4">

        {/* Linked invoice banner */}
        {linkedInvoice && (
          <Link href={`/invoices/${linkedInvoice.id}`}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--status-paid-bg)", borderColor: "var(--status-paid-border)" }}>
            <Receipt className="w-4 h-4 flex-shrink-0" style={{ color: "var(--status-paid-text)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)", color: "var(--status-paid-text)" }}>Invoice generated</p>
              <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--status-paid-text)", opacity: 0.8 }}>
                {linkedInvoice.invoiceNumber} · {linkedInvoice.status}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--status-paid-text)" }} />
          </Link>
        )}

        {/* Customer card */}
        <Card title="Customer" accent="blue">
          <div className="flex items-center gap-3">
            <UserIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{quote.customer.name}</p>
              {quote.customer.email && <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>{quote.customer.email}</p>}
            </div>
          </div>
          {quote.job && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <Briefcase className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                #{quote.job.jobNumber} — {quote.job.title}
              </p>
            </div>
          )}
        </Card>

        {/* Dates card */}
        {quote.validUntil && (
          <Card title="Valid until" accent="amber">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                {new Date(quote.validUntil).toLocaleDateString("da-DK")}
              </p>
            </div>
          </Card>
        )}

        {/* Line items card */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="px-4 py-2.5 border-b flex items-center gap-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ACCENTS.green }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>Line items</p>
          </div>
          {quote.items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)", backgroundColor: "var(--card)" }}>No items</p>
          ) : (
            <div className="divide-y" style={{ ["--tw-divide-color" as string]: "var(--border)" }}>
              {quote.items.map(item => {
                const qty    = parseFloat(item.quantity ?? "1")
                const price  = parseFloat(item.unitPrice ?? "0")
                const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
                const line   = calcLineTotal(item)
                return (
                  <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3" style={{ backgroundColor: "var(--card)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{item.description}</p>
                      <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                        {qty} × {formatDKK(price * markup)}
                        {item.markupPercent && parseFloat(item.markupPercent) > 0 ? ` (+${item.markupPercent}%)` : ""}
                        {item.discountType && item.discountValue ? ` −${item.discountType === "percent" ? `${item.discountValue}%` : formatDKK(parseFloat(item.discountValue))}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                      {formatDKK(line)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
          <div className="px-4 py-3 border-t space-y-1.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
            {discount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>Subtotal</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{formatDKK(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                    Discount {quote.discountType === "percent" ? `(${quote.discountValue}%)` : ""}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--error)" }}>-{formatDKK(discount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-semibold text-base pt-1 border-t" style={{ borderColor: "var(--border)" }}>
              <span style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>Total ekskl. moms</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{formatDKK(afterDiscount)}</span>
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>+ 25% moms = {formatDKK(afterDiscount * 1.25)} inkl. moms</p>
          </div>
        </div>

        {/* Notes card */}
        {quote.notes && (
          <Card title="Notes" accent="purple">
            <div className="flex gap-3">
              <StickyNote className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{quote.notes}</p>
            </div>
          </Card>
        )}

        {/* Save as template input */}
        {showTemplateName && (
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name…"
              className="flex-1 h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", fontFamily: "var(--font-body)", color: "var(--foreground)" }}
            />
            <button onClick={handleSaveTemplate} disabled={busy}
              className="h-10 px-4 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 bg-[var(--primary)] hover:bg-[var(--amber-600)] transition-colors"
              style={{ color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}>
              Save
            </button>
            <button onClick={() => setShowTemplateName(false)}
              className="h-10 px-3 rounded-lg text-sm font-medium cursor-pointer border hover:bg-[var(--accent)] transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
              Cancel
            </button>
          </div>
        )}

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--error)", backgroundColor: "var(--error-light)" }}>
            <p className="text-sm font-medium text-center" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>Delete this quote?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="h-10 rounded-lg border text-sm font-medium cursor-pointer hover:bg-[var(--accent)] transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={busy}
                className="h-10 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: "var(--error)", color: "#fff", fontFamily: "var(--font-body)" }}>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
