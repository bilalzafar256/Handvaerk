import { FileText, CheckSquare, UserPlus, CreditCard, Send, ThumbsUp } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"
import type { ActivityEvent } from "@/lib/db/queries/overview"

function timeAgo(ts: Date): string {
  const diff = Date.now() - ts.getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 2) return "Just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return "Yesterday"
  return `${days} days ago`
}

const ICON_MAP: Record<ActivityEvent["type"], React.ElementType> = {
  invoice_sent:    Send,
  invoice_paid:    CreditCard,
  job_done:        CheckSquare,
  customer_added:  UserPlus,
  quote_sent:      FileText,
  quote_accepted:  ThumbsUp,
}

export function ActivityFeed({ items }: { items: ActivityEvent[] }) {
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

      {items.length === 0 ? (
        <p
          className="text-sm py-4 text-center"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
        >
          No recent activity.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const Icon = ICON_MAP[item.type]
            return (
              <div key={item.id} className="flex items-start gap-3">
                <div
                  className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
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
                      <span className="ml-1" style={{ fontFamily: "var(--font-mono)" }}>
                        · {formatDKK(item.amount)}
                      </span>
                    )}
                  </p>
                </div>
                <p
                  className="text-xs shrink-0 mt-0.5"
                  style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
                >
                  {timeAgo(item.timestamp)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
