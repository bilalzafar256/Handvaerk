"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { motion } from "motion/react"
import { Phone, ChevronLeft, UserX, Search, Plus, AlertCircle, Mail, Edit2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ViewToggle } from "@/components/shared/view-toggle"
import { useViewPreference } from "@/hooks/use-view-preference"
import { deleteCustomerAction } from "@/lib/actions/customers"
import type { Customer } from "@/lib/db/schema/customers"

interface CustomerWithOwed extends Customer {
  unpaidCount: number
}

const PER_PAGE = 15

const btnCls = "flex items-center justify-center w-8 h-8 rounded-[--radius-sm] border transition-colors cursor-pointer disabled:opacity-40 bg-[--surface] hover:bg-[--background-subtle] flex-shrink-0"
const btnStyle = { borderColor: "var(--border)", color: "var(--text-secondary)" }
const btnDangerStyle = { borderColor: "var(--border)", color: "var(--error)" }

function CustomerInlineActions({ customer }: { customer: CustomerWithOwed }) {
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm("Delete this customer?")) return
    setBusy(true)
    try { await deleteCustomerAction(customer.id) } catch { toast.error("Failed to delete") }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
      {customer.phone && (
        <a href={`tel:${customer.phone.replace(/\s/g, "")}`} title="Call" className={btnCls} style={btnStyle}>
          <Phone className="w-3.5 h-3.5" />
        </a>
      )}
      {customer.email && (
        <a href={`mailto:${customer.email}`} title="Email" className={btnCls} style={btnStyle}>
          <Mail className="w-3.5 h-3.5" />
        </a>
      )}
      <Link href={`/customers/${customer.id}/edit`} title="Edit" className={btnCls} style={btnStyle}>
        <Edit2 className="w-3.5 h-3.5" />
      </Link>
      <button onClick={handleDelete} disabled={busy} title="Delete" className={btnCls} style={btnDangerStyle}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

interface CustomerListProps {
  customers: CustomerWithOwed[]
}

export function CustomerList({ customers }: CustomerListProps) {
  const t = useTranslations("Customers")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [view, setView] = useViewPreference("customers", "list")

  const filtered = query.trim()
    ? customers.filter((c) => {
        const q = query.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
        )
      })
    : customers

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

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
            placeholder={t("searchPlaceholder")}
            className="w-full h-11 pl-10 pr-4 rounded-[--radius-sm] border text-sm bg-[--surface] placeholder:text-[--text-tertiary] focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 transition-colors"
            style={{ fontFamily: "var(--font-body)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        <ViewToggle mode={view} onChange={setView} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState searching={query.trim().length > 0} t={t} />
      ) : (
        <>
          {view === "list" && <ListView customers={paged} t={t} />}
          {view === "card" && <CardView customers={paged} />}
          {view === "table" && <TableView customers={paged} t={t} />}
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}

/* ── List view ── */
function ListView({ customers, t }: { customers: CustomerWithOwed[]; t: ReturnType<typeof useTranslations<"Customers">> }) {
  return (
    <ul className="px-4 space-y-2 pb-4">
      {customers.map((customer, i) => (
        <motion.li
          key={customer.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2) }}
        >
          <div
            className="rounded-[--radius-md] border overflow-hidden"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-xs)" }}
          >
            <Link href={`/customers/${customer.id}`} className="flex items-center gap-3 p-4 transition-colors duration-150 hover:bg-[--background-subtle]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                style={{ backgroundColor: "var(--accent-light)", color: "var(--primary)", fontFamily: "var(--font-display)" }}
              >
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                    {customer.name}
                  </p>
                  {customer.unpaidCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 h-5 rounded-[--radius-pill] text-[11px] font-medium border flex-shrink-0"
                      style={{ backgroundColor: "var(--status-overdue-bg)", color: "var(--status-overdue-text)", borderColor: "var(--status-overdue-border)" }}
                    >
                      <AlertCircle className="w-3 h-3" />
                      {t("owesBadge")}
                    </span>
                  )}
                </div>
                {customer.phone && (
                  <p className="text-sm truncate mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                    {customer.phone}
                  </p>
                )}
              </div>
            </Link>
            <div
              className="flex items-center gap-1 px-4 py-2 border-t"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
            >
              <CustomerInlineActions customer={customer} />
            </div>
          </div>
        </motion.li>
      ))}
    </ul>
  )
}

/* ── Card view ── */
function CardView({ customers }: { customers: CustomerWithOwed[] }) {
  return (
    <div className="px-4 grid grid-cols-2 gap-3 pb-4">
      {customers.map((customer, i) => (
        <motion.div
          key={customer.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2) }}
          className="flex flex-col rounded-[--radius-lg] border overflow-hidden"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <Link
            href={`/customers/${customer.id}`}
            className="flex flex-col items-center gap-3 p-4 flex-1 text-center transition-colors duration-150 hover:bg-[--background-subtle]"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ backgroundColor: "var(--accent-light)", color: "var(--primary)", fontFamily: "var(--font-display)" }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 w-full">
              <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                {customer.name}
              </p>
              {customer.phone && (
                <p className="text-xs truncate mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                  {customer.phone}
                </p>
              )}
              {customer.email && !customer.phone && (
                <p className="text-xs truncate mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                  {customer.email}
                </p>
              )}
            </div>
          </Link>
          <div
            className="flex items-center gap-1 px-3 py-2 border-t flex-wrap"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
          >
            <CustomerInlineActions customer={customer} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ── Table view ── */
function TableView({ customers, t }: { customers: CustomerWithOwed[]; t: ReturnType<typeof useTranslations<"Customers">> }) {
  return (
    <div className="px-4 pb-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Name", "Phone", "Email", "City", "Actions"].map((h, i) => (
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
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="transition-colors duration-100 hover:bg-[--background-subtle]"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <td className="py-3 px-3 first:pl-0">
                <Link href={`/customers/${customer.id}`} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: "var(--accent-light)", color: "var(--primary)", fontFamily: "var(--font-display)" }}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                    {customer.name}
                  </span>
                  {customer.unpaidCount > 0 && (
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--status-overdue-text)" }} />
                  )}
                </Link>
              </td>
              <td className="py-3 px-3">
                {customer.phone ? (
                  <a href={`tel:${customer.phone.replace(/\s/g, "")}`} className="text-xs flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ fontFamily: "var(--font-body)", color: "var(--primary)" }}>
                    <Phone className="w-3 h-3" />
                    {customer.phone}
                  </a>
                ) : <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>—</span>}
              </td>
              <td className="py-3 px-3">
                <span className="text-xs truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                  {customer.email || "—"}
                </span>
              </td>
              <td className="py-3 px-3">
                <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                  {customer.addressCity || "—"}
                </span>
              </td>
              <td className="py-3 px-3">
                <CustomerInlineActions customer={customer} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Pagination ── */
function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 pb-24 pt-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="w-9 h-9 flex items-center justify-center rounded-[--radius-sm] border transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[--background-subtle]"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
        {page} / {totalPages}
      </p>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-[--radius-sm] border transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[--background-subtle]"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}
      >
        <ChevronLeft className="w-4 h-4 rotate-180" />
      </button>
    </div>
  )
}

/* ── Empty state ── */
function EmptyState({ searching, t }: { searching: boolean; t: ReturnType<typeof useTranslations<"Customers">> }) {
  if (searching) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 gap-3 text-center">
        <div className="w-14 h-14 rounded-[--radius-xl] flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
          <Search className="w-7 h-7" style={{ color: "var(--primary)" }} />
        </div>
        <p className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{t("emptySearch.title")}</p>
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>{t("emptySearch.description")}</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-4 text-center">
      <div className="w-14 h-14 rounded-[--radius-xl] flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
        <UserX className="w-7 h-7" style={{ color: "var(--primary)" }} />
      </div>
      <div className="space-y-1">
        <p className="text-[17px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{t("empty.title")}</p>
        <p className="text-sm max-w-[240px]" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>{t("empty.description")}</p>
      </div>
      <Link
        href="/customers/new"
        className="flex items-center gap-2 h-11 px-5 rounded-[--radius-md] text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-accent)" }}
      >
        <Plus className="w-4 h-4" />
        {t("empty.cta")}
      </Link>
    </div>
  )
}
