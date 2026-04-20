"use client"

import { formatDKK } from "@/lib/utils/currency"
import { TrendingUp } from "lucide-react"

interface Props {
  invoicedExVat: number
  quotedExVat: number
  hasData: boolean
}

export function ProfitabilityCard({ invoicedExVat, quotedExVat, hasData }: Props) {
  if (!hasData) return null

  const diff = invoicedExVat - quotedExVat
  const pct  = quotedExVat > 0 ? (diff / quotedExVat) * 100 : null
  const overBudget = diff > 0

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
        <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
          Profitability
        </p>
      </div>
      <div className="px-4 py-3 space-y-2" style={{ backgroundColor: "var(--card)" }}>
        <Row label="Invoiced (ex. VAT)" value={formatDKK(invoicedExVat)} />
        <Row label="Quoted (accepted)" value={formatDKK(quotedExVat)} />
        {quotedExVat > 0 && (
          <div className="pt-2 mt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
              vs. quote
            </span>
            <span
              className="text-sm font-semibold"
              style={{
                fontFamily: "var(--font-mono)",
                color: overBudget ? "var(--error)" : "var(--success)",
              }}
            >
              {overBudget ? "+" : ""}{formatDKK(diff)}
              {pct !== null && (
                <span className="text-xs font-normal ml-1">
                  ({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>{label}</span>
      <span className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{value}</span>
    </div>
  )
}
