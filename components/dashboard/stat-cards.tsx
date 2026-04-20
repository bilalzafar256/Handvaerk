import { TrendingUp, TrendingDown, Briefcase, Clock, CheckCircle2, FileText, Users } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"
import type { StatCardData } from "@/lib/db/queries/overview"

type Props = {
  data: StatCardData
  openQuoteCount: number
  customerCount: number
}

const ACCENTS = {
  amber:  { fg: "var(--primary)",            bg: "oklch(0.97 0.04 58)" },
  green:  { fg: "oklch(0.52 0.14 145)",      bg: "oklch(0.93 0.06 145)" },
  red:    { fg: "oklch(0.52 0.20 25)",       bg: "oklch(0.94 0.05 25)" },
  teal:   { fg: "oklch(0.45 0.18 200)",      bg: "oklch(0.93 0.04 200)" },
  blue:   { fg: "oklch(0.45 0.16 240)",      bg: "oklch(0.93 0.04 240)" },
  purple: { fg: "oklch(0.45 0.14 290)",      bg: "oklch(0.93 0.04 290)" },
} as const

type Accent = keyof typeof ACCENTS

export function StatCards({ data, openQuoteCount, customerCount }: Props) {
  const paidDeltaPositive = (data.paidDelta ?? 0) >= 0
  const deltaStr = data.paidDelta !== null ? `${paidDeltaPositive ? "+" : ""}${data.paidDelta}% vs last month` : null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <StatCard label="Revenue" sublabel="this month" amount={data.revenueThisMonth} icon={TrendingUp} accent="amber" />
      <StatCard
        label="Paid"
        sublabel="this month"
        amount={data.paidThisMonth}
        icon={paidDeltaPositive ? TrendingUp : TrendingDown}
        accent="green"
        sub={deltaStr ?? undefined}
        positive={paidDeltaPositive}
        hasDelta={data.paidDelta !== null}
      />
      <StatCard
        label="Outstanding"
        sublabel={data.outstandingCount > 0 ? `${data.outstandingCount} unpaid invoice${data.outstandingCount !== 1 ? "s" : ""}` : "invoices"}
        amount={data.outstandingTotal}
        icon={Clock}
        accent={data.outstandingTotal > 0 ? "red" : "teal"}
        alert={data.outstandingTotal > 0}
      />
      <StatCard label="Active jobs" count={data.activeJobs} icon={Briefcase} accent="teal" />
      <StatCard label="Open quotes" count={openQuoteCount} icon={FileText} accent="blue" />
      <StatCard label="Customers" count={customerCount} icon={Users} accent="purple" />
    </div>
  )
}

function StatCard({
  label,
  sublabel,
  amount,
  count,
  icon: Icon,
  accent,
  sub,
  positive,
  hasDelta,
  alert,
}: {
  label: string
  sublabel?: string
  amount?: number
  count?: number
  icon: React.ElementType
  accent: Accent
  sub?: string
  positive?: boolean
  hasDelta?: boolean
  alert?: boolean
}) {
  const { fg, bg } = ACCENTS[accent]
  const formatted = amount !== undefined ? formatDKK(amount) : null
  const numPart = formatted ? formatted.replace(" kr.", "") : null

  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="h-[3px] w-full" style={{ backgroundColor: fg }} />

      <div className="px-3 pt-3 pb-3 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p
            className="text-[11px] font-medium leading-none truncate"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
          >
            {sublabel ? `${label} · ${sublabel}` : label}
          </p>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: bg }}
          >
            <Icon className="w-3 h-3" style={{ color: fg }} />
          </div>
        </div>

        {numPart !== null ? (
          <p
            className="text-lg font-bold leading-none"
            style={{ fontFamily: "var(--font-display)", color: alert ? "var(--destructive)" : "var(--text-primary)" }}
          >
            <span style={{ fontFamily: "var(--font-mono)" }}>{numPart}</span>
            <span className="text-xs font-normal ml-0.5" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              kr.
            </span>
          </p>
        ) : (
          <p
            className="text-2xl font-bold leading-none"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {count}
          </p>
        )}

        {sub && (
          <p
            className="text-[10px] font-medium leading-none"
            style={{
              color: hasDelta
                ? positive
                  ? "oklch(0.52 0.14 145)"
                  : "var(--destructive)"
                : "var(--muted-foreground)",
              fontFamily: "var(--font-body)",
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
