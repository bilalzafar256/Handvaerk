"use client"

import { useUIStore } from "@/stores/ui-store"
import { Menu } from "lucide-react"

interface TopbarProps {
  title: string
  action?: React.ReactNode
}

export function Topbar({ title, action }: TopbarProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  return (
    <header
      className="fixed top-0 right-0 z-30 h-14 flex items-center px-4 border-b transition-all duration-[220ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
      style={{
        left: sidebarOpen ? 240 : 64,
        backgroundColor: "color-mix(in oklch, var(--background) 92%, transparent)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}
    >
      {/* Mobile toggle */}
      <button
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-[--radius-sm] mr-2 transition-colors"
        style={{ color: "var(--text-secondary)" }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1
        className="text-[17px] font-semibold flex-1"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        {title}
      </h1>
      {action}
    </header>
  )
}
