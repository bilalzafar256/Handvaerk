import { TrendingUp, Briefcase, Clock, CheckCircle2 } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"

const STUB_STATS = {
  revenueThisMonth: 82450,
  activeJobs: 7,
  outstanding: 54200,
  paidThisMonth: 34750,
}

export async function StatCards() {
  const s = STUB_STATS
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Revenue this month"
        amount={s.revenueThisMonth}
        icon={TrendingUp}
        delta="+12%"
        positive
      />
      <StatCard
        label="Active jobs"
        count={s.activeJobs}
        icon={Briefcase}
      />
      <StatCard
        label="Outstanding"
        amount={s.outstanding}
        icon={Clock}
        sub="2 unpaid invoices"
      />
      <StatCard
        label="Paid this month"
        amount={s.paidThisMonth}
        icon={CheckCircle2}
        delta="+8%"
        positive
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
