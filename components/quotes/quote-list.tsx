"use client"

import { useState } from "react"
import { useUIStore } from "@/stores/ui-store"
import { Link, useRouter } from "@/i18n/navigation"
import { motion } from "motion/react"
import {
  ChevronRight, Search, Plus, FileText, Receipt, Edit2, Trash2,
  Send, Download, BookmarkPlus, Copy, LayoutList, LayoutGrid, Loader2,
  GitMerge, X,
} from "lucide-react"
import { toast } from "sonner"
import { formatDKK } from "@/lib/utils/currency"
import { deleteQuoteAction, sendQuoteEmailAction, saveQuoteAsTemplateAction, mergeQuotesAction } from "@/lib/actions/quotes"
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
  merged:   { bg: "--status-done-bg",      text: "--status-done-text",      border: "--status-done-border",      label: "Merged" },
}

const STATUS_BAR: Record<string, string> = {
  draft:    "var(--muted-foreground)",
  sent:     "oklch(0.55 0.15 240)",
  accepted: "oklch(0.52 0.14 145)",
  rejected: "var(--status-overdue-text)",
  expired:  "var(--muted-foreground)",
  merged:   "oklch(0.55 0.12 290)",
}

function QuoteStatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft
  return (
    <span
      className="inline-flex items-center px-2 h-5 rounded-full text-[11px] font-medium border flex-shrink-0"
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

const iconBtn = "w-8 h-8 flex items-center justify-center rounded-lg border bg-[var(--background)] hover:bg-[var(--accent)] transition-colors cursor-pointer disabled:opacity-40 flex-shrink-0"
const iconBtnStyle = { borderColor: "var(--border)", color: "var(--foreground)" }

function QuoteActions({ quote }: { quote: QuoteWithRelations }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const status = quote.status ?? "draft"
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/en/q/${quote.shareToken}` : ""

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
        if (confirm("An invoice already exists. View it?")) router.push(`/invoices/${result.existingInvoiceId}`)
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

  async function handleDelete() {
    setBusy(true)
    setConfirming(false)
    try { await deleteQuoteAction(quote.id); router.refresh() } catch { toast.error("Failed to delete") }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {status === "draft" && (
        <Link href={`/quotes/${quote.id}/edit`} className={iconBtn} style={iconBtnStyle} title="Edit">
          <Edit2 className="w-3.5 h-3.5" />
        </Link>
      )}
      {(status === "draft" || status === "sent") && (
        <button onClick={handleSend} disabled={busy} className={iconBtn} style={iconBtnStyle} title={status === "sent" ? "Resend" : "Send"}>
          <Send className="w-3.5 h-3.5" />
        </button>
      )}
      {status === "accepted" && (
        <button onClick={handleInvoice} disabled={busy} className={iconBtn} style={iconBtnStyle} title="Create invoice">
          <Receipt className="w-3.5 h-3.5" />
        </button>
      )}
      <a href={`/api/quotes/${quote.id}/pdf`} download className={iconBtn} style={iconBtnStyle} title="Download PDF">
        <Download className="w-3.5 h-3.5" />
      </a>
      {shareUrl && (
        <button
          onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied") }}
          className={iconBtn} style={iconBtnStyle} title="Copy link"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}
      <button onClick={handleTemplate} disabled={busy} className={iconBtn} style={iconBtnStyle} title="Save as template">
        <BookmarkPlus className="w-3.5 h-3.5" />
      </button>
      {status === "draft" && (
        confirming ? (
          <button onClick={handleDelete} disabled={busy}
            className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg border text-xs font-medium cursor-pointer disabled:opacity-50 flex-shrink-0"
            style={{ backgroundColor: "var(--error-light)", borderColor: "var(--error)", color: "var(--error)", fontFamily: "var(--font-body)" }}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Confirm
          </button>
        ) : (
          <button onClick={() => setConfirming(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border bg-[var(--background)] hover:bg-[var(--error-light)] transition-colors cursor-pointer flex-shrink-0"
            style={{ borderColor: "var(--border)", color: "var(--error)" }} title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )
      )}
    </div>
  )
}

function MergeCheckbox({ selected, onToggle }: { selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); onToggle() }}
      className="flex-shrink-0 w-10 flex items-center justify-center cursor-pointer self-stretch"
      style={{ backgroundColor: selected ? "var(--accent)" : "transparent" }}
    >
      <div
        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: selected ? "var(--primary)" : "var(--border)",
          backgroundColor: selected ? "var(--primary)" : "transparent",
        }}
      >
        {selected && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
      </div>
    </button>
  )
}

function MergeBar({
  quotes,
  selectedIds,
  onClear,
}: {
  quotes: QuoteWithRelations[]
  selectedIds: string[]
  onClear: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  const selected = quotes.filter(q => selectedIds.includes(q.id))
  const customerIds = [...new Set(selected.map(q => q.customerId))]
  const sameCustomer = customerIds.length <= 1
  const hasDiscounts = selected.some(q => q.discountType && q.discountValue)
  const total = selected.reduce((s, q) => s + calcTotal(q.items), 0)

  async function handleConfirm() {
    setBusy(true)
    try {
      const { id } = await mergeQuotesAction(selectedIds)
      toast.success("Quotes merged")
      router.push(`/quotes/${id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Merge failed")
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed bottom-16 right-0 z-30 px-4 py-3 border-t shadow-lg"
      style={{ left: sidebarOpen ? 240 : 64, backgroundColor: "var(--surface, var(--background))", borderColor: "var(--border)" }}
    >
      {!confirming ? (
        <div className="flex flex-col gap-2">
          {!sameCustomer && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--error-light)", border: "1px solid var(--error)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>
                Can&apos;t merge — selected quotes are from different customers. Select quotes from the same customer only.
              </p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                {selectedIds.length} quote{selectedIds.length !== 1 ? "s" : ""} selected
              </p>
              {sameCustomer && (
                <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                  Total: {formatDKK(total)}
                </p>
              )}
            </div>
            <button
              onClick={onClear}
              className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "var(--background)" }}
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirming(true)}
              disabled={!sameCustomer || selectedIds.length < 2}
              className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
            >
              <GitMerge className="w-3.5 h-3.5" />
              Merge
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {hasDiscounts && (
            <p className="text-xs px-2 py-1.5 rounded-md" style={{ backgroundColor: "var(--status-invoiced-bg)", color: "var(--status-invoiced-text)", fontFamily: "var(--font-body)" }}>
              Header discounts on selected quotes will not carry over to the merged quote.
            </p>
          )}
          <div className="flex items-center gap-3">
            <p className="flex-1 text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
              Create merged quote? ({formatDKK(total)})
            </p>
            <button
              onClick={() => setConfirming(false)}
              className="h-8 px-3 rounded-lg border text-sm cursor-pointer transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontFamily: "var(--font-body)", backgroundColor: "var(--background)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={busy}
              className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function QuoteList({ quotes }: { quotes: QuoteWithRelations[] }) {
  const [query, setQuery] = useState("")
  const [page, setPage]   = useState(1)
  const [view, setView]   = useState<"list" | "grid">("list")
  const [isMergeMode, setIsMergeMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const filtered = query.trim()
    ? quotes.filter(q => {
        const s = query.toLowerCase()
        return q.quoteNumber.toLowerCase().includes(s) || q.customer.name.toLowerCase().includes(s)
      })
    : quotes

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paged      = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div>
      {/* Toolbar */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search quotes…"
            className="w-full h-8 pl-8 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: "var(--border)",
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
              ["--tw-ring-color" as string]: "oklch(0.720 0.195 58 / 20%)",
            }}
          />
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5 ml-auto flex-shrink-0" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
          <button
            onClick={() => setView("list")}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer"
            style={{ backgroundColor: view === "list" ? "var(--accent)" : "transparent", color: view === "list" ? "var(--foreground)" : "var(--muted-foreground)" }}
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView("grid")}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer"
            style={{ backgroundColor: view === "grid" ? "var(--accent)" : "transparent", color: view === "grid" ? "var(--foreground)" : "var(--muted-foreground)" }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={() => { setIsMergeMode(m => !m); setSelectedIds([]) }}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border transition-colors cursor-pointer flex-shrink-0"
          style={{
            borderColor: isMergeMode ? "var(--primary)" : "var(--border)",
            backgroundColor: isMergeMode ? "var(--primary)" : "var(--background)",
            color: isMergeMode ? "var(--primary-foreground)" : "var(--muted-foreground)",
          }}
          title="Merge quotes"
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span className="text-xs font-medium" style={{ fontFamily: "var(--font-body)" }}>Merge</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState searching={query.trim().length > 0} />
      ) : (
        <>
          {view === "list" && (
            <div>
              {paged.map((quote, i) => (
                <QuoteRow
                  key={quote.id}
                  quote={quote}
                  index={i}
                  isMergeMode={isMergeMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          )}
          {view === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {paged.map((quote, i) => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  index={i}
                  isMergeMode={isMergeMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          )}
          {totalPages > 1 && <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />}
        </>
      )}

      {isMergeMode && selectedIds.length > 0 && (
        <MergeBar
          quotes={quotes}
          selectedIds={selectedIds}
          onClear={() => { setSelectedIds([]); setIsMergeMode(false) }}
        />
      )}
    </div>
  )
}

function QuoteRow({
  quote,
  index,
  isMergeMode,
  selectedIds,
  onToggleSelect,
}: {
  quote: QuoteWithRelations
  index: number
  isMergeMode: boolean
  selectedIds: string[]
  onToggleSelect: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const status = quote.status ?? "draft"
  const barColor = STATUS_BAR[status] ?? "var(--muted-foreground)"
  const subtotal = calcTotal(quote.items)
  const isSelected = selectedIds.includes(quote.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.18), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: 2, transition: { type: "spring", stiffness: 300, damping: 30 } }}
      className="flex border-b"
      style={{
        borderColor: "var(--border)",
        backgroundColor: isSelected ? "var(--accent)" : hovered ? "var(--accent)" : "transparent",
        transition: "background-color 120ms cubic-bezier(0.4,0,0.2,1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isMergeMode && (
        <MergeCheckbox selected={isSelected} onToggle={() => onToggleSelect(quote.id)} />
      )}
      <div className="flex-shrink-0 self-stretch" style={{
        width: hovered || isSelected ? 4 : 3,
        backgroundColor: barColor,
        boxShadow: hovered ? `4px 0 12px ${barColor}55` : "none",
        transition: "width 120ms cubic-bezier(0.4,0,0.2,1), box-shadow 200ms ease",
      }} />
      <div className="flex-1 min-w-0">
        <Link
          href={`/quotes/${quote.id}`}
          className="flex items-center gap-3 px-4 py-3 min-w-0"
          onClick={(e) => { if (isMergeMode) { e.preventDefault(); onToggleSelect(quote.id) } }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
              {quote.quoteNumber}
            </p>
            <p className="text-xs truncate" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
              {quote.customer.name}
            </p>
            {quote.sentAt && (
              <p className="text-[11px] tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                Sent {new Date(quote.sentAt).toLocaleDateString("da-DK")}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <QuoteStatusBadge status={status} />
            <span className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
              {formatDKK(subtotal)}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
        </Link>
        {!isMergeMode && (
          <div className="flex items-center gap-1 px-4 py-2 border-t flex-wrap" style={{ borderColor: "var(--border)" }}>
            <QuoteActions quote={quote} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

function QuoteCard({
  quote,
  index,
  isMergeMode,
  selectedIds,
  onToggleSelect,
}: {
  quote: QuoteWithRelations
  index: number
  isMergeMode: boolean
  selectedIds: string[]
  onToggleSelect: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const status = quote.status ?? "draft"
  const barColor = STATUS_BAR[status] ?? "var(--muted-foreground)"
  const subtotal = calcTotal(quote.items)
  const isSelected = selectedIds.includes(quote.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.2), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, rotate: 0.8, transition: { type: "spring", stiffness: 350, damping: 28 } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex flex-col rounded-xl border overflow-hidden"
        style={{
          borderColor: isSelected ? "var(--primary)" : "var(--border)",
          backgroundColor: isSelected ? "var(--accent)" : hovered ? "var(--accent)" : "var(--card)",
          boxShadow: hovered ? `0 14px 36px rgba(0,0,0,0.13), 0 0 0 1px ${barColor}40` : "none",
          transition: "background-color 120ms cubic-bezier(0.4,0,0.2,1), box-shadow 220ms ease",
        }}
      >
        <div className="h-1 w-full" style={{ backgroundColor: barColor }} />
        {isMergeMode && (
          <div className="px-3 pt-2 flex items-center gap-2">
            <MergeCheckbox selected={isSelected} onToggle={() => onToggleSelect(quote.id)} />
          </div>
        )}
        <Link
          href={`/quotes/${quote.id}`}
          className="p-3 flex flex-col gap-2"
          onClick={(e) => { if (isMergeMode) { e.preventDefault(); onToggleSelect(quote.id) } }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
              {quote.quoteNumber}
            </p>
            <QuoteStatusBadge status={status} />
          </div>
          <p className="text-xs truncate" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
            {quote.customer.name}
          </p>
          <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
            {formatDKK(subtotal)}
          </p>
          {quote.sentAt && (
            <p className="text-[11px] tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
              Sent {new Date(quote.sentAt).toLocaleDateString("da-DK")}
            </p>
          )}
          {quote.validUntil && (
            <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
              Valid until {new Date(quote.validUntil).toLocaleDateString("da-DK")}
            </p>
          )}
        </Link>
        {!isMergeMode && (
          <div className="flex items-center gap-1 px-3 pb-3 border-t pt-2 flex-wrap" style={{ borderColor: "var(--border)" }}>
            <QuoteActions quote={quote} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "var(--background)" }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background)"}
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
      </button>
      <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
        {page} / {totalPages}
      </p>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "var(--background)" }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background)"}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function EmptyState({ searching }: { searching: boolean }) {
  if (searching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 gap-3 text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }}>
          <Search className="w-6 h-6" style={{ color: "var(--muted-foreground)" }} />
        </div>
        <p className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>No results</p>
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>Try a different search term</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-4 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }}>
        <FileText className="w-6 h-6" style={{ color: "var(--muted-foreground)" }} />
      </div>
      <div className="space-y-1">
        <p className="text-[17px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>No quotes yet</p>
        <p className="text-sm max-w-[240px]" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>Create your first quote and send it to a customer</p>
      </div>
      <Link
        href="/quotes/new"
        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-[var(--primary)] hover:bg-[var(--amber-600)] transition-colors active:scale-[0.98] cursor-pointer"
        style={{ color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
      >
        <Plus className="w-4 h-4" />
        New quote
      </Link>
    </div>
  )
}
