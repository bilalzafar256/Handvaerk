import { AlertTriangle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { formatDKK } from "@/lib/utils/currency"

const STUB_OVERDUE = [
  { id: "inv-1042", customer: "Niels Lund A/S", amount: 28400, daysOverdue: 12 },
]

export async function CriticalZone() {
  const overdue = STUB_OVERDUE

  if (overdue.length === 0) {
    return (
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ backgroundColor: "var(--muted)" }}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
        <p
          className="text-sm"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
        >
          No urgent items — business is running smoothly.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
      >
        Needs attention
      </p>
      {overdue.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border-l-4 p-4 flex items-center justify-between gap-4"
          style={{
            backgroundColor: "var(--status-overdue-bg)",
            borderLeftColor: "var(--status-overdue-text)",
            border: "1px solid var(--status-overdue-border)",
            borderLeft: "4px solid var(--status-overdue-text)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "var(--status-overdue-text)" }} />
            <div className="min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--foreground)", fontFamily: "var(--font-body)" }}
              >
                {item.customer}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--status-overdue-text)", fontFamily: "var(--font-body)" }}
              >
                <span style={{ fontFamily: "var(--font-mono)" }}>{formatDKK(item.amount)}</span>
                {" · "}
                {item.daysOverdue} dage forfalden
              </p>
            </div>
          </div>
          <Link
            href="/invoices"
            className="shrink-0 text-xs font-medium px-3 h-8 rounded-lg flex items-center cursor-pointer transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              fontFamily: "var(--font-body)",
            }}
          >
            View
          </Link>
        </div>
      ))}
    </div>
  )
}
