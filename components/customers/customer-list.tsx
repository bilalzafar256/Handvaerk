"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { useRouter } from "@/i18n/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Search, Plus, Users, LayoutList, LayoutGrid,
  Pencil, Trash2, Loader2, AlertCircle, ChevronRight,
} from "lucide-react"
import { deleteCustomerAction } from "@/lib/actions/customers"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import type { Customer } from "@/lib/db/schema/customers"

interface CustomerWithOwed extends Customer {
  unpaidCount: number
}

const CUSTOMER_PALETTE = [
  { bar: "oklch(0.72 0.195 58)",  avatar: "oklch(0.94 0.05 58)",  text: "oklch(0.42 0.14 58)"  },
  { bar: "oklch(0.55 0.15 240)",  avatar: "oklch(0.92 0.05 240)", text: "oklch(0.38 0.12 240)" },
  { bar: "oklch(0.52 0.14 145)",  avatar: "oklch(0.92 0.05 145)", text: "oklch(0.36 0.11 145)" },
  { bar: "oklch(0.55 0.12 290)",  avatar: "oklch(0.92 0.04 290)", text: "oklch(0.38 0.10 290)" },
  { bar: "oklch(0.55 0.14 20)",   avatar: "oklch(0.92 0.05 20)",  text: "oklch(0.38 0.12 20)"  },
  { bar: "oklch(0.52 0.12 185)",  avatar: "oklch(0.92 0.04 185)", text: "oklch(0.38 0.10 185)" },
]

const PER_PAGE = 25

export function CustomerList({ customers }: { customers: CustomerWithOwed[] }) {
  const t = useTranslations("Customers")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const filtered = customers.filter(c => {
    const q = query.toLowerCase().trim()
    return !q || c.name.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div>
      {/* Filter bar */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap border-b" style={{ borderColor: "var(--border)" }}>
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="search"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder={t("searchPlaceholder")}
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

        {/* View toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5 ml-auto flex-shrink-0" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
          <button
            onClick={() => setViewMode("list")}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer"
            style={{ backgroundColor: viewMode === "list" ? "var(--accent)" : "transparent", color: viewMode === "list" ? "var(--foreground)" : "var(--muted-foreground)" }}
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer"
            style={{ backgroundColor: viewMode === "grid" ? "var(--accent)" : "transparent", color: viewMode === "grid" ? "var(--foreground)" : "var(--muted-foreground)" }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Result count */}
      {filtered.length > 0 && (
        <p className="px-4 py-2 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
          {filtered.length} {filtered.length === 1 ? "customer" : "customers"}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState searching={query.trim().length > 0} />
      ) : (
        <>
          {viewMode === "list" ? (
            <div>
              {paged.map((customer, i) => (
                <CustomerRow key={customer.id} customer={customer} index={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {paged.map((customer, i) => (
                <CustomerCard key={customer.id} customer={customer} index={i} />
              ))}
            </div>
          )}
          {totalPages > 1 && <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  )
}

function CustomerRow({ customer, index }: { customer: CustomerWithOwed; index: number }) {
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const palette = CUSTOMER_PALETTE[index % CUSTOMER_PALETTE.length]

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    try {
      await deleteCustomerAction(customer.id)
      router.refresh()
    } catch {
      toast.error("Failed to delete customer")
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.18), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: 5, transition: { type: "spring", stiffness: 450, damping: 32 } }}
      className="flex border-b"
      style={{
        borderColor: "var(--border)",
        backgroundColor: hovered ? "var(--accent)" : "transparent",
        transition: "background-color 120ms cubic-bezier(0.4,0,0.2,1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (!deleting) setConfirming(false) }}
    >
      {/* Main content link */}
      <Link href={`/customers/${customer.id}`} className="flex items-center gap-3 flex-1 px-4 py-3 min-w-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ backgroundColor: palette.avatar, color: palette.text, fontFamily: "var(--font-display)" }}
        >
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
              {customer.name}
            </p>
            {customer.unpaidCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 h-5 rounded-full text-[11px] font-medium border flex-shrink-0"
                style={{ backgroundColor: "var(--status-overdue-bg)", color: "var(--status-overdue-text)", borderColor: "var(--status-overdue-border)" }}
              >
                <AlertCircle className="w-3 h-3" />
                Owes
              </span>
            )}
          </div>
          {(customer.phone || customer.email) && (
            <p className="text-xs truncate mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
              {customer.phone || customer.email}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
      </Link>

      {/* Inline actions — always visible, outside Link */}
      <div className="flex items-center gap-1.5 pr-3 self-center flex-shrink-0">
        <Link
          href={`/customers/${customer.id}/edit`}
          onClick={e => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center rounded-lg border bg-[var(--background)] hover:bg-[var(--accent)] transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
        {confirming ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg border text-xs font-medium cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: "var(--error-light)", borderColor: "var(--error)", color: "var(--error)", fontFamily: "var(--font-body)" }}
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Confirm
          </button>
        ) : (
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg border bg-[var(--background)] hover:bg-[var(--error-light)] transition-colors cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--error)" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

function CustomerCard({ customer, index }: { customer: CustomerWithOwed; index: number }) {
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const palette = CUSTOMER_PALETTE[index % CUSTOMER_PALETTE.length]

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    try {
      await deleteCustomerAction(customer.id)
      router.refresh()
    } catch {
      toast.error("Failed to delete customer")
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.2), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.02, transition: { type: "spring", stiffness: 380, damping: 26 } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (!deleting) setConfirming(false) }}
    >
      <div
        className="flex flex-col rounded-xl border overflow-hidden"
        style={{
          borderColor: hovered ? palette.bar : "var(--border)",
          backgroundColor: hovered ? "var(--accent)" : "var(--card)",
          boxShadow: hovered ? `0 12px 32px rgba(0,0,0,0.11), 0 0 0 1px ${palette.bar}55` : "none",
          transition: "background-color 120ms cubic-bezier(0.4,0,0.2,1), box-shadow 220ms ease, border-color 180ms ease",
        }}
      >
        {/* Colored identity bar */}
        <div className="h-1 w-full" style={{ backgroundColor: palette.bar }} />

        {/* Main content link */}
        <Link href={`/customers/${customer.id}`} className="p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold"
              style={{ backgroundColor: palette.avatar, color: palette.text, fontFamily: "var(--font-display)" }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                {customer.name}
              </p>
              {(customer.phone || customer.email) && (
                <p className="text-xs truncate mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                  {customer.phone || customer.email}
                </p>
              )}
            </div>
          </div>
          {customer.unpaidCount > 0 && (
            <span
              className="self-start inline-flex items-center gap-1 px-2 h-5 rounded-full text-[11px] font-medium border"
              style={{ backgroundColor: "var(--status-overdue-bg)", color: "var(--status-overdue-text)", borderColor: "var(--status-overdue-border)" }}
            >
              <AlertCircle className="w-3 h-3" />
              Owes money
            </span>
          )}
        </Link>

        {/* Always-visible action bar */}
        <div className="flex items-center gap-1.5 px-3 pb-3 border-t pt-2" style={{ borderColor: "var(--border)" }}>
          <Link
            href={`/customers/${customer.id}/edit`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-xs font-medium bg-[var(--background)] hover:bg-[var(--accent)] transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}
          >
            <Pencil className="w-3 h-3" />
            Edit
          </Link>
          {confirming ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-xs font-medium cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: "var(--error-light)", borderColor: "var(--error)", color: "var(--error)", fontFamily: "var(--font-body)" }}
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Confirm
            </button>
          ) : (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-xs font-medium bg-[var(--background)] hover:bg-[var(--error-light)] transition-colors cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--error)", fontFamily: "var(--font-body)" }}
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>
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
  const t = useTranslations("Customers")
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-4 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
        <Users className="w-6 h-6" style={{ color: "var(--primary)" }} />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
          {searching ? t("emptySearch.title") : t("empty.title")}
        </p>
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
          {searching ? t("emptySearch.description") : t("empty.description")}
        </p>
      </div>
      {!searching && (
        <Link
          href="/customers/new"
          className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98]"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-accent)" }}
        >
          <Plus className="w-4 h-4" />
          {t("empty.cta")}
        </Link>
      )}
    </div>
  )
}
