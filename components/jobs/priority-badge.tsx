import { cn } from "@/lib/utils"

type Priority = "low" | "normal" | "high" | "urgent"

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; border: string; label: string }> = {
  low:    { bg: "var(--muted)",        text: "var(--muted-foreground)", border: "var(--border)",        label: "Low" },
  normal: { bg: "oklch(0.94 0.05 240 / 0.6)", text: "oklch(0.40 0.12 240)", border: "oklch(0.80 0.08 240)", label: "Normal" },
  high:   { bg: "var(--accent-light)", text: "var(--amber-700)",        border: "oklch(0.85 0.10 58)",  label: "High" },
  urgent: { bg: "var(--error-light)",  text: "var(--error)",            border: "var(--error)",         label: "Urgent" },
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const p = (priority ?? "normal") as Priority
  const style = PRIORITY_STYLES[p] ?? PRIORITY_STYLES.normal

  return (
    <span
      className={cn("inline-flex items-center px-2 h-5 rounded-full text-[11px] font-semibold border", className)}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
        fontFamily: "var(--font-body)",
      }}
    >
      {style.label}
    </span>
  )
}
