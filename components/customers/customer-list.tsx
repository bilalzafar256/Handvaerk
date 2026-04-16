"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { motion } from "motion/react"
import { Phone, ChevronRight, UserX, Search, Plus, AlertCircle } from "lucide-react"
import type { Customer } from "@/lib/db/schema/customers"

interface CustomerWithOwed extends Customer {
  unpaidCount: number
}

interface CustomerListProps {
  customers: CustomerWithOwed[]
}

export function CustomerList({ customers }: CustomerListProps) {
  const t = useTranslations("Customers")
  const [query, setQuery] = useState("")

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

  return (
    <div>
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full h-11 pl-10 pr-4 rounded-[--radius-sm] border text-sm bg-[--surface] placeholder:text-[--text-tertiary] focus:outline-none focus:border-[--accent] focus:ring-2 focus:ring-[--accent]/20 transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState searching={query.trim().length > 0} t={t} />
      ) : (
        <ul className="px-4 space-y-2 pb-6">
          {filtered.map((customer, i) => (
            <motion.li
              key={customer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.3) }}
            >
              <CustomerCard customer={customer} />
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CustomerCard({ customer }: { customer: CustomerWithOwed }) {
  const t = useTranslations("Customers")

  const addressLine = [customer.addressLine1, customer.addressZip, customer.addressCity]
    .filter(Boolean)
    .join(", ")

  return (
    <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
      <Link
        href={`/customers/${customer.id}`}
        className="flex items-center gap-3 p-4 rounded-[--radius-md] border transition-colors duration-150"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
          style={{
            backgroundColor: "var(--accent-light)",
            color: "var(--primary)",
            fontFamily: "var(--font-display)",
          }}
        >
          {customer.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-semibold truncate"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
            >
              {customer.name}
            </p>
            {customer.unpaidCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 h-5 rounded-[--radius-pill] text-[11px] font-medium border flex-shrink-0"
                style={{
                  backgroundColor: "var(--status-overdue-bg)",
                  color: "var(--status-overdue-text)",
                  borderColor: "var(--status-overdue-border)",
                }}
              >
                <AlertCircle className="w-3 h-3" />
                {t("owesBadge")}
              </span>
            )}
          </div>

          {customer.phone ? (
            <p
              className="text-sm truncate mt-0.5"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
            >
              {customer.phone}
            </p>
          ) : addressLine ? (
            <p
              className="text-xs truncate mt-0.5"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
            >
              {addressLine}
            </p>
          ) : null}
        </div>

        {/* Quick-dial (F-206) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {customer.phone && (
            <a
              href={`tel:${customer.phone.replace(/\s/g, "")}`}
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150"
              style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
              aria-label={`Call ${customer.name}`}
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          <ChevronRight className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
        </div>
      </Link>
    </motion.div>
  )
}

function EmptyState({
  searching,
  t,
}: {
  searching: boolean
  t: ReturnType<typeof useTranslations<"Customers">>
}) {
  if (searching) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 gap-3 text-center">
        <div
          className="w-14 h-14 rounded-[--radius-xl] flex items-center justify-center"
          style={{ backgroundColor: "var(--accent-light)" }}
        >
          <Search className="w-7 h-7" style={{ color: "var(--accent)" }} />
        </div>
        <p
          className="text-base font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          {t("emptySearch.title")}
        </p>
        <p
          className="text-sm"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
        >
          {t("emptySearch.description")}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-4 text-center">
      <div
        className="w-14 h-14 rounded-[--radius-xl] flex items-center justify-center"
        style={{ backgroundColor: "var(--accent-light)" }}
      >
        <UserX className="w-7 h-7" style={{ color: "var(--accent)" }} />
      </div>
      <div className="space-y-1">
        <p
          className="text-[17px] font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          {t("empty.title")}
        </p>
        <p
          className="text-sm max-w-[240px]"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
        >
          {t("empty.description")}
        </p>
      </div>
      <Link
        href="/customers/new"
        className="flex items-center gap-2 h-11 px-5 rounded-[--radius-md] text-sm font-medium transition-all duration-200 active:scale-[0.98]"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          fontFamily: "var(--font-body)",
          boxShadow: "var(--shadow-accent)",
        }}
      >
        <Plus className="w-4 h-4" />
        {t("empty.cta")}
      </Link>
    </div>
  )
}
