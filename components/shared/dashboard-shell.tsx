"use client"

import { useUIStore } from "@/stores/ui-store"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <main
      className="min-h-screen pt-14 transition-all duration-[220ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
      style={{ marginLeft: sidebarOpen ? 240 : 64 }}
    >
      {children}
    </main>
  )
}
