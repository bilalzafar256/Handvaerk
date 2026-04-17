"use client"

import { useState } from "react"
import { Link, useRouter } from "@/i18n/navigation"
import { motion } from "motion/react"
import { ChevronRight, ChevronLeft, Search, Plus, FileText, Calendar, Receipt, Edit2, Trash2, Send, Download, BookmarkPlus, Copy } from "lucide-react"
import { toast } from "sonner"
import { formatDKK } from "@/lib/utils/currency"
import { ViewToggle } from "@/components/shared/view-toggle"
import { useViewPreference } from "@/hooks/use-view-preference"
import { deleteQuoteAction, sendQuoteEmailAction, saveQuoteAsTemplateAction } from "@/lib/actions/quotes"
import { createInvoiceFromQuoteAction } from "@/lib/actions/invoices"
import type { Quote, QuoteItem } from "@/lib/db/schema/quotes"
import type { Customer } from "@/lib/db/schema/customers"

type QuoteWithRelations = Quote & { customer: Customer; items: QuoteItem[] }

const STATUS_CONFIG = {
  draft:    { bg: "--status-new-bg",       text: "--status-new-text",       border: "--status-new-border",       label: "Draft" },
  sent:     { bg: "--status-scheduled-bg", text: "--status-scheduled-text", border: "--status-scheduled-border", label: "Sent" },
  accepted: { bg: "--status-paid-bg",      text: "--status-paid-text",      border: "--status-paid-border",      label: "Accepted" },
  rejected: { bg: "--status-overdue-bg",   text: "--status-overdue-text",   border: "--status-overdue-border",   label: "Rejected" },
  expired:  { bg: "--status-invoiced-bg",  text: "--status-invoiced-text",  border: "--status-invoiced-border",  label: "Expired" },
}

function QuoteStatusBadge({ status }: { status: string }) {
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

function calcTotal(items: QuoteItem[]): number {
  return items.reduce((s, item) => {
    const qty    = parseFloat(item.quantity ?? "1")
    const price  = parseFloat(item.unitPrice ?? "0")
    const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
    const gross  = qty * price * markup
    if (!item.discountType || !item.discountValue) return s + gross
    const dv = parseFloat(item.discountValue) || 0
    return s + (item.discountType === "percent" ? gross * (1 - dv / 100) : gross - dv)
  }, 0)
}

const PER_PAGE = 15

const btnCls = "flex items-center justify-center w-8 h-8 rounded-[--radius-sm] border transition-colors cursor-pointer disabled:opacity-40 bg-[--surface] hover:bg-[--background-subtle] flex-shrink-0"
const btnStyle = { borderColor: "var(--border)", color: "var(--text-secondary)" }
const btnDangerStyle = { borderColor: "var(--border)", color: "var(--error)" }

function QuoteInlineActions({ quote }: { quote: QuoteWithRelations }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const status = quote.status ?? "draft"
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/en/q/${quote.shareToken}` : ""

  async function handleDelete() {
    if (!confirm("Delete this quote?")) return
    setBusy(true)
    try { await deleteQuoteAction(quote.id) } catch { toast.error("Failed to delete") }
    setBusy(false)
  }

  async function handleSend() {
    setBusy(true)
    try { await sendQuoteEmailAction(quote.id); toast.success("Quote sent") } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    setBusy(false)
  }

  async function handleInvoice() {
    setBusy(true)
    try {
      const result = await createInvoiceFromQuoteAction(quote.id)
      if ("existingInvoiceId" in result) {
        if (confirm("An invoice already exists for this quote. View it?")) router.push(`/invoices/${result.existingInvoiceId}`)
      } else {
        router.push(`/invoices/${result.id}`)
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    setBusy(false)
  }

  async function handleTemplate() {
    const name = prompt("Template name:")
    if (!name) return
    setBusy(true)
    try { await saveQuoteAsTemplateAction(quote.id, name); toast.success("Saved as template") } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
      {status === "draft" && (
        <Link href={`/quotes/${quote.id}/edit`} title="Edit" className={btnCls} style={btnStyle}>
          <Edit2 className="w-3.5 h-3.5" />
        </Link>
      )}
      {(status === "draft" || status === "sent") && (
        <button onClick={handleSend} disabled={busy} title={status === "sent" ? "Resend" : "Send"} className={btnCls} style={btnStyle}>
          <Send className="w-3.5 h-3.5" />
        </button>
      )}
      {status === "accepted" && (
        <button onClick={handleInvoice} disabled={busy} title="Create invoice" className={btnCls} style={btnStyle}>
          <Receipt className="w-3.5 h-3.5" />
        </button>
      )}
      <a href={`/api/quotes/${quote.id}/pdf`} download title="Download PDF" className={btnCls} style={btnStyle}>
        <Download className="w-3.5 h-3.5" />
      </a>
      {shareUrl && (
        <button
          onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied") }}
          title="Copy link"
          className={btnCls}
          style={btnStyle}
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}
      <button onClick={handleTemplate} disabled={busy} title="Save as template" className={btnCls} style={btnStyle}>
        <BookmarkPlus className="w-3.5 h-3.5" />
      </button>
      {status === "draft" && (
        <button onClick={handleDelete} disabled={busy} title="Delete" className={btnCls} style={btnDangerStyle}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export function QuoteList({ quotes }: { quotes: QuoteWithRelations[] }) {
  const [query, setQuery] = useState("")
  const [page, setPage]   = useState(1)
  const [view, setView]   = useViewPreference("quotes", "list")

  const filtered = query.trim()
    ? quotes.filter(q => {
        const s = query.toLowerCase()
        return q.quoteNumber.toLowerCase().includes(s) || q.customer.name.toLowerCase().includes(s)
      })
    : quotes

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paged      = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function handleQueryChange(q: string) {
    setQuery(q)
    setPage(1)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search quotes…"
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
          {view === "list"  && <ListView  quotes={paged} />}
          {view === "card"  && <CardView  quotes={paged} />}
          {view === "table" && <TableView quotes={paged} />}

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
function ListView({ quotes }: { quotes: QuoteWithRelations[] }) {
  return (
    <ul className="px-4 space-y-2 pb-4">
      {quotes.map((quote, i) => {
        const subtotal = calcTotal(quote.items)
        return (
          <motion.li
            key={quote.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2) }}
          >
            <div
              className="rounded-[--radius-md] border overflow-hidden"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-xs)" }}
            >
              <Link
                href={`/quotes/${quote.id}`}
                className="flex items-center gap-3 p-4 transition-colors duration-150 hover:bg-[--background-subtle]"
              >
                <div className="w-9 h-9 rounded-[--radius-sm] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--accent-light)" }}>
                  <FileText className="w-4 h-4" style={{ color: "var(--primary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {quote.quoteNumber}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                    {quote.customer.name}
                  </p>
                  {quote.validUntil && (
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
                      <span className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
                        Valid until {new Date(quote.validUntil).toLocaleDateString("da-DK")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <QuoteStatusBadge status={quote.status ?? "draft"} />
                  <span className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {formatDKK(subtotal)}
                  </span>
                </div>
              </Link>
              <div
                className="flex items-center gap-1 px-4 py-2 border-t"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
              >
                <QuoteInlineActions quote={quote} />
              </div>
            </div>
          </motion.li>
        )
      })}
    </ul>
  )
}

/* ── Card view ── */
function CardView({ quotes }: { quotes: QuoteWithRelations[] }) {
  return (
    <div className="px-4 grid grid-cols-2 gap-3 pb-4">
      {quotes.map((quote, i) => {
        const subtotal = calcTotal(quote.items)
        return (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2) }}
            className="flex flex-col rounded-[--radius-lg] border overflow-hidden"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <Link
              href={`/quotes/${quote.id}`}
              className="flex flex-col gap-3 p-4 flex-1 transition-colors duration-150 hover:bg-[--background-subtle]"
            >
              <div className="w-10 h-10 rounded-[--radius-sm] flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
                <FileText className="w-5 h-5" style={{ color: "var(--primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {quote.quoteNumber}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                  {quote.customer.name}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <QuoteStatusBadge status={quote.status ?? "draft"} />
                <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {formatDKK(subtotal)}
                </span>
              </div>
            </Link>
            <div
              className="flex items-center gap-1 px-3 py-2 border-t flex-wrap"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
            >
              <QuoteInlineActions quote={quote} />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ── Table view ── */
function TableView({ quotes }: { quotes: QuoteWithRelations[] }) {
  return (
    <div className="px-4 pb-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Number", "Customer", "Valid until", "Amount", "Status", "Actions"].map((h, i) => (
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
          {quotes.map((quote) => {
            const subtotal = calcTotal(quote.items)
            return (
              <tr
                key={quote.id}
                className="transition-colors duration-100 hover:bg-[--background-subtle]"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <td className="py-3 px-3 first:pl-0">
                  <Link href={`/quotes/${quote.id}`} className="flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
                    <span className="font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                      {quote.quoteNumber}
                    </span>
                  </Link>
                </td>
                <td className="py-3 px-3">
                  <span className="text-xs truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                    {quote.customer.name}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                    {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString("da-DK") : "—"}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {formatDKK(subtotal)}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <QuoteStatusBadge status={quote.status ?? "draft"} />
                </td>
                <td className="py-3 px-3">
                  <QuoteInlineActions quote={quote} />
                </td>
              </tr>
            )
          })}
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
        <FileText className="w-7 h-7" style={{ color: "var(--primary)" }} />
      </div>
      <div className="space-y-1">
        <p className="text-[17px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>No quotes yet</p>
        <p className="text-sm max-w-[240px]" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Create your first quote and send it to a customer</p>
      </div>
      <Link
        href="/quotes/new"
        className="flex items-center gap-2 h-11 px-5 rounded-[--radius-md] text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-accent)" }}
      >
        <Plus className="w-4 h-4" />
        New quote
      </Link>
    </div>
  )
}
