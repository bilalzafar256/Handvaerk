"use client"

import { useState } from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { motion } from "motion/react"
import { ChevronRight, ChevronLeft, Search, Plus, Receipt, AlertCircle, Edit2, Trash2, Send, Download, CheckCircle, FileText } from "lucide-react"
import { toast } from "sonner"
import { formatDKK } from "@/lib/utils/currency"
import { ViewToggle } from "@/components/shared/view-toggle"
import { useViewPreference } from "@/hooks/use-view-preference"
import { deleteInvoiceAction, sendInvoiceAction, markInvoicePaidAction, createCreditNoteAction } from "@/lib/actions/invoices"
import type { Invoice, InvoiceItem } from "@/lib/db/schema/invoices"
import type { Customer } from "@/lib/db/schema/customers"

type InvoiceWithRelations = Invoice & { customer: Customer; items: InvoiceItem[] }

const STATUS_CONFIG = {
  draft:   { bg: "--status-new-bg",       text: "--status-new-text",       border: "--status-new-border",       label: "Draft" },
  sent:    { bg: "--status-scheduled-bg", text: "--status-scheduled-text", border: "--status-scheduled-border", label: "Sent" },
  viewed:  { bg: "--status-done-bg",      text: "--status-done-text",      border: "--status-done-border",      label: "Viewed" },
  paid:    { bg: "--status-paid-bg",      text: "--status-paid-text",      border: "--status-paid-border",      label: "Paid" },
  overdue: { bg: "--status-overdue-bg",   text: "--status-overdue-text",   border: "--status-overdue-border",   label: "Overdue" },
}

function InvoiceStatusBadge({ status, isCreditNote }: { status: string; isCreditNote?: boolean }) {
  if (isCreditNote) {
    return (
      <span
        className="inline-flex items-center px-2.5 h-6 rounded-[--radius-pill] text-xs font-medium border"
        style={{ backgroundColor: "var(--status-done-bg)", color: "var(--status-done-text)", borderColor: "var(--status-done-border)" }}
      >
        Kreditnota
      </span>
    )
  }
  const s = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft
  return (
    <span
      className="inline-flex items-center px-2.5 h-6 rounded-[--radius-pill] text-xs font-medium border"
      style={{ backgroundColor: `var(${s.bg})`, color: `var(${s.text})`, borderColor: `var(${s.border})` }}
    >
      {s.label}
    </span>
  )
}

const PER_PAGE = 15

const btnCls = "flex items-center justify-center w-8 h-8 rounded-[--radius-sm] border transition-colors cursor-pointer disabled:opacity-40 bg-[--surface] hover:bg-[--background-subtle] flex-shrink-0"
const btnStyle = { borderColor: "var(--border)", color: "var(--text-secondary)" }
const btnDangerStyle = { borderColor: "var(--border)", color: "var(--error)" }

function InvoiceInlineActions({ inv }: { inv: InvoiceWithRelations }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const status = inv.status ?? "draft"
  const isPaid = status === "paid"

  async function handleDelete() {
    if (!confirm("Delete this invoice?")) return
    setBusy(true)
    try { await deleteInvoiceAction(inv.id) } catch { toast.error("Failed to delete") }
    setBusy(false)
  }

  async function handleSend() {
    setBusy(true)
    try { await sendInvoiceAction(inv.id); toast.success("Invoice sent") } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    setBusy(false)
  }

  async function handleMarkPaid() {
    setBusy(true)
    try { await markInvoicePaidAction(inv.id); toast.success("Marked as paid"); router.refresh() } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    setBusy(false)
  }

  async function handleCreditNote() {
    setBusy(true)
    try { await createCreditNoteAction(inv.id) } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
      {status === "draft" && (
        <Link href={`/invoices/${inv.id}/edit`} title="Edit" className={btnCls} style={btnStyle}>
          <Edit2 className="w-3.5 h-3.5" />
        </Link>
      )}
      {!isPaid && (
        <button onClick={handleSend} disabled={busy} title={status === "sent" ? "Resend" : "Send"} className={btnCls} style={btnStyle}>
          <Send className="w-3.5 h-3.5" />
        </button>
      )}
      {(status === "sent" || status === "viewed" || status === "overdue") && (
        <button onClick={handleMarkPaid} disabled={busy} title="Mark as paid" className={btnCls} style={btnStyle}>
          <CheckCircle className="w-3.5 h-3.5" />
        </button>
      )}
      <a href={`/api/invoices/${inv.id}/pdf`} download title="Download PDF" className={btnCls} style={btnStyle}>
        <Download className="w-3.5 h-3.5" />
      </a>
      {(status === "sent" || status === "paid" || status === "overdue") && !inv.isCreditNote && (
        <button onClick={handleCreditNote} disabled={busy} title="Credit note" className={btnCls} style={btnStyle}>
          <FileText className="w-3.5 h-3.5" />
        </button>
      )}
      {status === "draft" && (
        <button onClick={handleDelete} disabled={busy} title="Delete" className={btnCls} style={btnDangerStyle}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export function InvoiceList({ invoices }: { invoices: InvoiceWithRelations[] }) {
  const [query, setQuery] = useState("")
  const [page, setPage]   = useState(1)
  const [view, setView]   = useViewPreference("invoices", "list")

  const filtered = query.trim()
    ? invoices.filter(inv => {
        const s = query.toLowerCase()
        return inv.invoiceNumber.toLowerCase().includes(s) || inv.customer.name.toLowerCase().includes(s)
      })
    : invoices

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paged      = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div>
      {/* Toolbar */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search invoices…"
            className="w-full h-11 pl-10 pr-4 rounded-[--radius-sm] border text-sm bg-[--surface] placeholder:text-[--text-tertiary] focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 transition-colors"
            style={{ fontFamily: "var(--font-body)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        <ViewToggle mode={view} onChange={setView} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState searching={query.trim().length > 0} />
      ) : (
        <>
          {view === "list"  && <ListView  invoices={paged} />}
          {view === "card"  && <CardView  invoices={paged} />}
          {view === "table" && <TableView invoices={paged} />}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pb-24 pt-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={safePage <= 1}
                className="w-9 h-9 flex items-center justify-center rounded-[--radius-sm] border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                {safePage} / {totalPages}
              </p>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={safePage >= totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-[--radius-sm] border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── List view ── */
function ListView({ invoices }: { invoices: InvoiceWithRelations[] }) {
  return (
    <ul className="px-4 space-y-2 pb-4">
      {invoices.map((inv, i) => {
        const isOverdue = inv.status === "overdue"
        return (
          <motion.li
            key={inv.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2) }}
          >
            <div
              className="rounded-[--radius-md] border overflow-hidden"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: isOverdue ? "var(--status-overdue-border)" : "var(--border)",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              <Link
                href={`/invoices/${inv.id}`}
                className="flex items-center gap-3 p-4 transition-colors duration-150 hover:bg-[--background-subtle]"
              >
                <div
                  className="w-9 h-9 rounded-[--radius-sm] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: isOverdue ? "var(--status-overdue-bg)" : "var(--accent-light)" }}
                >
                  {isOverdue
                    ? <AlertCircle className="w-4 h-4" style={{ color: "var(--status-overdue-text)" }} />
                    : <Receipt className="w-4 h-4" style={{ color: "var(--primary)" }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {inv.invoiceNumber}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                    {inv.customer.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                    Due: {new Date(inv.dueDate).toLocaleDateString("da-DK")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <InvoiceStatusBadge status={inv.status ?? "draft"} isCreditNote={inv.isCreditNote ?? false} />
                  <span className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {formatDKK(parseFloat(inv.totalInclVat ?? "0"))}
                  </span>
                </div>
              </Link>
              <div
                className="flex items-center gap-1 px-4 py-2 border-t"
                style={{ borderColor: isOverdue ? "var(--status-overdue-border)" : "var(--border)", backgroundColor: "var(--background-subtle)" }}
              >
                <InvoiceInlineActions inv={inv} />
              </div>
            </div>
          </motion.li>
        )
      })}
    </ul>
  )
}

/* ── Card view ── */
function CardView({ invoices }: { invoices: InvoiceWithRelations[] }) {
  return (
    <div className="px-4 grid grid-cols-2 gap-3 pb-4">
      {invoices.map((inv, i) => {
        const isOverdue = inv.status === "overdue"
        return (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2) }}
            className="flex flex-col rounded-[--radius-lg] border overflow-hidden"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: isOverdue ? "var(--status-overdue-border)" : "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Link
              href={`/invoices/${inv.id}`}
              className="flex flex-col gap-3 p-4 flex-1 transition-colors duration-150 hover:bg-[--background-subtle]"
            >
              <div
                className="w-10 h-10 rounded-[--radius-sm] flex items-center justify-center"
                style={{ backgroundColor: isOverdue ? "var(--status-overdue-bg)" : "var(--accent-light)" }}
              >
                {isOverdue
                  ? <AlertCircle className="w-5 h-5" style={{ color: "var(--status-overdue-text)" }} />
                  : <Receipt className="w-5 h-5" style={{ color: "var(--primary)" }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {inv.invoiceNumber}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                  {inv.customer.name}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <InvoiceStatusBadge status={inv.status ?? "draft"} isCreditNote={inv.isCreditNote ?? false} />
                <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {formatDKK(parseFloat(inv.totalInclVat ?? "0"))}
                </span>
              </div>
            </Link>
            <div
              className="flex items-center gap-1 px-3 py-2 border-t flex-wrap"
              style={{ borderColor: isOverdue ? "var(--status-overdue-border)" : "var(--border)", backgroundColor: "var(--background-subtle)" }}
            >
              <InvoiceInlineActions inv={inv} />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ── Table view ── */
function TableView({ invoices }: { invoices: InvoiceWithRelations[] }) {
  return (
    <div className="px-4 pb-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Number", "Customer", "Due date", "Amount", "Status", "Actions"].map((h, i) => (
              <th
                key={i}
                className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider first:pl-0"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              className="transition-colors duration-100 hover:bg-[--background-subtle]"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <td className="py-3 px-3 first:pl-0">
                <Link href={`/invoices/${inv.id}`} className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
                  <span className="font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {inv.invoiceNumber}
                  </span>
                </Link>
              </td>
              <td className="py-3 px-3">
                <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                  {inv.customer.name}
                </span>
              </td>
              <td className="py-3 px-3">
                <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                  {new Date(inv.dueDate).toLocaleDateString("da-DK")}
                </span>
              </td>
              <td className="py-3 px-3">
                <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {formatDKK(parseFloat(inv.totalInclVat ?? "0"))}
                </span>
              </td>
              <td className="py-3 px-3">
                <InvoiceStatusBadge status={inv.status ?? "draft"} isCreditNote={inv.isCreditNote ?? false} />
              </td>
              <td className="py-3 px-3">
                <InvoiceInlineActions inv={inv} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ searching }: { searching: boolean }) {
  if (searching) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 gap-3 text-center">
        <div className="w-14 h-14 rounded-[--radius-xl] flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
          <Search className="w-7 h-7" style={{ color: "var(--primary)" }} />
        </div>
        <p className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>No results</p>
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Try a different search term</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-4 text-center">
      <div className="w-14 h-14 rounded-[--radius-xl] flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
        <Receipt className="w-7 h-7" style={{ color: "var(--primary)" }} />
      </div>
      <div className="space-y-1">
        <p className="text-[17px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>No invoices yet</p>
        <p className="text-sm max-w-[240px]" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Create your first invoice or convert a job</p>
      </div>
      <Link
        href="/invoices/new"
        className="flex items-center gap-2 h-11 px-5 rounded-[--radius-md] text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-accent)" }}
      >
        <Plus className="w-4 h-4" />
        New invoice
      </Link>
    </div>
  )
}
