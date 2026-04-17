"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { motion } from "motion/react"
import {
  Edit2, Trash2, Send, Download, CheckCircle, AlertCircle, FileText, MoreHorizontal,
  User as UserIcon, Calendar, CreditCard, StickyNote, Briefcase,
} from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"
import {
  sendInvoiceAction, markInvoicePaidAction, deleteInvoiceAction, createCreditNoteAction,
} from "@/lib/actions/invoices"
import type { Invoice, InvoiceItem } from "@/lib/db/schema/invoices"
import type { Customer } from "@/lib/db/schema/customers"
import type { User } from "@/lib/db/schema/users"
import type { Job } from "@/lib/db/schema/jobs"
import type { Quote } from "@/lib/db/schema/quotes"

type InvoiceWithRelations = Invoice & { customer: Customer; items: InvoiceItem[]; job?: Job | null; quote?: Quote | null }

const STATUS_CONFIG = {
  draft:   { bg: "--status-new-bg",       text: "--status-new-text",       border: "--status-new-border",       label: "Draft" },
  sent:    { bg: "--status-scheduled-bg", text: "--status-scheduled-text", border: "--status-scheduled-border", label: "Sent" },
  viewed:  { bg: "--status-done-bg",      text: "--status-done-text",      border: "--status-done-border",      label: "Viewed" },
  paid:    { bg: "--status-paid-bg",      text: "--status-paid-text",      border: "--status-paid-border",      label: "Paid" },
  overdue: { bg: "--status-overdue-bg",   text: "--status-overdue-text",   border: "--status-overdue-border",   label: "Overdue" },
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

export function InvoiceDetail({ invoice, user }: { invoice: InvoiceWithRelations; user: User }) {
  const router = useRouter()
  const [busy, setBusy]                           = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showActionsMenu, setShowActionsMenu]     = useState(false)

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
    try { await sendInvoiceAction(invoice.id); toast.success("Invoice sent to " + invoice.customer.email); router.refresh() }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to send") }
    finally { setBusy(false) }
  }

  async function handleMarkPaid() {
    setBusy(true)
    try { await markInvoicePaidAction(invoice.id); toast.success("Marked as paid"); router.refresh() }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update") }
    finally { setBusy(false) }
  }

  async function handleCreditNote() {
    setBusy(true)
    try { await createCreditNoteAction(invoice.id) }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create credit note"); setBusy(false) }
  }

  async function handleDelete() {
    setBusy(true)
    try { await deleteInvoiceAction(invoice.id) }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete"); setBusy(false) }
  }

  const iconBtn = "w-8 h-8 flex items-center justify-center rounded-lg border bg-[var(--background)] hover:bg-[var(--accent)] transition-colors cursor-pointer disabled:opacity-40"
  const iconBtnStyle = { borderColor: "var(--border)", color: "var(--foreground)" }

  return (
    <div className="pb-16">
      {/* Sticky action bar */}
      <div className="sticky top-14 z-20 px-4 py-2 flex items-center gap-2 border-b" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <motion.div key={status} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-xs font-medium border"
              style={{ backgroundColor: `var(${statusCfg.bg})`, color: `var(${statusCfg.text})`, borderColor: `var(${statusCfg.border})` }}
            >
              {isOverdue && <AlertCircle className="w-3 h-3" />}
              {isPaid && <CheckCircle className="w-3 h-3" />}
              {statusCfg.label}
            </span>
          </motion.div>
          {invoice.isCreditNote && (
            <span
              className="inline-flex items-center px-2.5 h-6 rounded-full text-xs font-medium border"
              style={{ backgroundColor: "var(--status-done-bg)", color: "var(--status-done-text)", borderColor: "var(--status-done-border)" }}
            >
              Kreditnota
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {!isPaid && (
            <button onClick={handleSend} disabled={busy}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--primary)] hover:bg-[var(--amber-600)] transition-colors disabled:opacity-50 cursor-pointer"
              style={{ color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}>
              <Send className="w-3.5 h-3.5" />
              {status === "sent" ? "Resend" : "Send"}
            </button>
          )}
          {(status === "sent" || status === "viewed" || status === "overdue") && (
            <button onClick={handleMarkPaid} disabled={busy}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 cursor-pointer"
              style={{ borderColor: "var(--status-paid-border)", color: "var(--status-paid-text)", backgroundColor: "var(--status-paid-bg)", fontFamily: "var(--font-body)" }}>
              <CheckCircle className="w-3.5 h-3.5" />
              Paid
            </button>
          )}
          <a href={`/api/invoices/${invoice.id}/pdf`} download className={iconBtn} style={iconBtnStyle} title="Download PDF">
            <Download className="w-3.5 h-3.5" />
          </a>
          <div className="relative">
            <button type="button" onClick={() => setShowActionsMenu(v => !v)}
              className={iconBtn} style={iconBtnStyle}>
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {showActionsMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border overflow-hidden z-30"
                  style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>
                  {status === "draft" && (
                    <button onClick={() => { setShowActionsMenu(false); router.push(`/invoices/${invoice.id}/edit`) }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--accent)] transition-colors cursor-pointer"
                      style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                      <Edit2 className="w-4 h-4 flex-shrink-0" />
                      Edit invoice
                    </button>
                  )}
                  {(status === "sent" || status === "paid" || status === "overdue") && !invoice.isCreditNote && (
                    <button onClick={() => { setShowActionsMenu(false); handleCreditNote() }} disabled={busy}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--accent)] transition-colors cursor-pointer"
                      style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      Create credit note
                    </button>
                  )}
                  {status === "draft" && (
                    <button onClick={() => { setShowActionsMenu(false); setShowDeleteConfirm(true) }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--error-light)] transition-colors cursor-pointer border-t"
                      style={{ fontFamily: "var(--font-body)", color: "var(--error)", borderColor: "var(--border)" }}>
                      <Trash2 className="w-4 h-4 flex-shrink-0" />
                      Delete invoice
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-3 pb-8 px-4 lg:px-6 space-y-4">

        {/* Customer card */}
        <Card title="Customer" accent="blue">
          <div className="flex items-center gap-3">
            <UserIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{invoice.customer.name}</p>
              {invoice.customer.email && <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>{invoice.customer.email}</p>}
              {invoice.eanNumber && <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>EAN: {invoice.eanNumber}</p>}
            </div>
          </div>
          {invoice.job && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <Briefcase className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                #{invoice.job.jobNumber} — {invoice.job.title}
              </p>
            </div>
          )}
        </Card>

        {/* Dates card */}
        <Card title="Dates" accent="amber">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              <div>
                <p className="text-[11px] uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>Issued</p>
                <p className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{invoice.issueDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: isOverdue ? "var(--error)" : "var(--muted-foreground)" }} />
              <div>
                <p className="text-[11px] uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>Due</p>
                <p className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)", color: isOverdue ? "var(--error)" : "var(--foreground)" }}>{invoice.dueDate}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Line items card */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="px-4 py-2.5 border-b flex items-center gap-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ACCENTS.green }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>Line items</p>
          </div>
          {invoice.items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)", backgroundColor: "var(--card)" }}>No items added</p>
          ) : (
            <div className="divide-y" style={{ ["--tw-divide-color" as string]: "var(--border)" }}>
              {invoice.items.map(item => {
                const qty   = parseFloat(item.quantity ?? "1")
                const price = parseFloat(item.unitPrice ?? "0")
                const line  = parseFloat(item.lineTotal ?? String(qty * price))
                return (
                  <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3" style={{ backgroundColor: "var(--card)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{item.description}</p>
                      <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                        {qty} × {formatDKK(price)} ekskl. moms
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
          <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>Subtotal ekskl. moms</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{formatDKK(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>Moms 25%</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{formatDKK(vat)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <span style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>Total inkl. moms</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)", fontSize: 18 }}>{formatDKK(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment info card */}
        {(invoice.bankAccount || invoice.mobilepayNumber) && (
          <Card title="Payment info" accent="amber">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              <div className="space-y-0.5">
                {invoice.bankAccount && (
                  <p className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>Bank: {invoice.bankAccount}</p>
                )}
                {invoice.mobilepayNumber && (
                  <p className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>MobilePay: {invoice.mobilepayNumber}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Paid stamp */}
        {isPaid && invoice.paidAt && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: "var(--status-paid-bg)", border: "1px solid var(--status-paid-border)" }}>
            <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--status-paid-text)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--status-paid-text)", fontFamily: "var(--font-body)" }}>
              Paid on {new Date(invoice.paidAt).toLocaleDateString("da-DK")}
            </p>
          </div>
        )}

        {/* Notes card */}
        {invoice.notes && (
          <Card title="Notes" accent="purple">
            <div className="flex gap-3">
              <StickyNote className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{invoice.notes}</p>
            </div>
          </Card>
        )}

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--error)", backgroundColor: "var(--error-light)" }}>
            <p className="text-sm font-medium text-center" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>Delete this invoice?</p>
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
