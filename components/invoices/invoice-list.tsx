"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { motion } from "motion/react"
import { ChevronRight, ChevronLeft, Search, Plus, Receipt, AlertCircle } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"
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

export function InvoiceList({ invoices }: { invoices: InvoiceWithRelations[] }) {
  const [query, setQuery] = useState("")
  const [page, setPage]   = useState(1)

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
      {/* Search */}
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
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
      </div>

      {filtered.length === 0 ? (
        <EmptyState searching={query.trim().length > 0} />
      ) : (
        <>
          <ul className="px-4 space-y-2 pb-4">
            {paged.map((inv, i) => {
              const isOverdue = inv.status === "overdue"
              return (
                <motion.li
                  key={inv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2) }}
                >
                  <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="flex items-center gap-3 p-4 rounded-[--radius-md] border transition-colors duration-150"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: isOverdue ? "var(--status-overdue-border)" : "var(--border)",
                        boxShadow: "var(--shadow-xs)",
                      }}
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                            {inv.invoiceNumber}
                          </p>
                        </div>
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
                        <ChevronRight className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                      </div>
                    </Link>
                  </motion.div>
                </motion.li>
              )
            })}
          </ul>
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
