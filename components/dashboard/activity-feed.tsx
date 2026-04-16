import { FileText, CheckSquare, UserPlus, CreditCard, Send } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"

type ActivityItem = {
  id: string
  icon: React.ElementType
  label: string
  sub: string
  time: string
  amount?: number
}

const STUB_ACTIVITY: ActivityItem[] = [
  {
    id: "a1",
    icon: Send,
    label: "Invoice #1042 sent",
    sub: "Niels Lund A/S",
    time: "2t siden",
  },
  {
    id: "a2",
    icon: CheckSquare,
    label: "Job marked done",
    sub: "Elinstallation · Jens Møller",
    time: "3t siden",
  },
  {
    id: "a3",
    icon: UserPlus,
    label: "New customer added",
    sub: "Birch & Partners ApS",
    time: "I går",
  },
  {
    id: "a4",
    icon: CreditCard,
    label: "Invoice #1039 paid",
    sub: "Birch & Partners ApS",
    time: "I går",
    amount: 18750,
  },
  {
    id: "a5",
    icon: FileText,
    label: "Quote sent",
    sub: "Familie Christoffersen",
    time: "2 dage siden",
  },
]

export async function ActivityFeed() {
  const items = STUB_ACTIVITY

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-4"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
      >
        Recent activity
      </p>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div
              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center mt-0.5"
              style={{ backgroundColor: "var(--muted)" }}
            >
              <item.icon className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium leading-none"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
              >
                {item.label}
              </p>
              <p
                className="text-xs mt-0.5 truncate"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
              >
                {item.sub}
                {item.amount !== undefined && (
                  <span
                    className="ml-1"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    · {formatDKK(item.amount)}
                  </span>
                )}
              </p>
            </div>
            <p
              className="text-xs shrink-0 mt-0.5"
              style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
            >
              {item.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
