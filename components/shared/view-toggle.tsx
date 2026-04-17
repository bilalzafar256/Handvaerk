"use client"

import { List, LayoutGrid, Table } from "lucide-react"

export type ViewMode = "list" | "card" | "table"

interface ViewToggleProps {
  mode: ViewMode
  onChange: (m: ViewMode) => void
}

const OPTIONS: { mode: ViewMode; Icon: React.ElementType; label: string }[] = [
  { mode: "list",  Icon: List,        label: "List" },
  { mode: "card",  Icon: LayoutGrid,  label: "Card" },
  { mode: "table", Icon: Table,       label: "Table" },
]

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div
      className="flex items-center rounded-[--radius-sm] border overflow-hidden bg-[--surface]"
      style={{ borderColor: "var(--border)" }}
    >
      {OPTIONS.map(({ mode: m, Icon, label }) => {
        const active = m === mode
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            aria-label={label}
            className={`h-11 w-11 flex items-center justify-center transition-colors duration-150 cursor-pointer ${
              active
                ? "bg-[--primary] text-[--primary-foreground]"
                : "bg-transparent text-[--text-tertiary] hover:bg-[--background-subtle]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        )
      })}
    </div>
  )
}
