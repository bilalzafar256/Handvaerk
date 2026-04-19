import { TrendingUp, Briefcase, Clock, CheckCircle2 } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"
import type { StatCardData } from "@/lib/db/queries/overview"

export function StatCards({ data }: { data: StatCardData }) {
  const deltaStr =
    data.paidDelta !== null
      ? `${data.paidDelta >= 0 ? "+" : ""}${data.paidDelta}%`
      : null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Revenue this month"
        amount={data.revenueThisMonth}
        icon={TrendingUp}
      />
      <StatCard
        label="Active jobs"
        count={data.activeJobs}
        icon={Briefcase}
      />
      <StatCard
        label="Outstanding"
        amount={data.outstandingTotal}
        icon={Clock}
        sub={data.outstandingCount > 0 ? `${data.outstandingCount} unpaid invoice${data.outstandingCount !== 1 ? "s" : ""}` : undefined}
      />
      <StatCard
        label="Paid this month"
        amount={data.paidThisMonth}
        icon={CheckCircle2}
        delta={deltaStr ?? undefined}
        positive={(data.paidDelta ?? 0) >= 0}
      />
    </div>
  )
}

function StatCard({
  label,
  amount,
  count,
  icon: Icon,
  delta,
  positive,
  sub,
}: {
  label: string
  amount?: number
  count?: number
  icon: React.ElementType
  delta?: string
  positive?: boolean
  sub?: string
}) {
  const formatted = amount !== undefined ? formatDKK(amount) : null
  const numPart = formatted ? formatted.replace(" kr.", "") : null

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-2"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between gap-1">
        <p
          className="text-xs font-semibold uppercase tracking-wider leading-tight"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
        >
          {label}
        </p>
        <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
      </div>

      {numPart !== null ? (
        <p
          className="text-2xl font-bold leading-none"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          <span style={{ fontFamily: "var(--font-mono)" }}>{numPart}</span>
          <span
            className="text-sm font-normal ml-1"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            kr.
          </span>
        </p>
      ) : (
        <p
          className="text-3xl font-bold leading-none"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          {count}
        </p>
      )}

      {delta && (
        <p
          className="text-xs font-medium"
          style={{
            color: positive ? "oklch(0.52 0.14 145)" : "var(--destructive)",
            fontFamily: "var(--font-body)",
          }}
        >
          {delta} vs. last month
        </p>
      )}
      {sub && (
        <p
          className="text-xs"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
