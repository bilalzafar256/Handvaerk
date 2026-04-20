"use client"

import { useUIStore } from "@/stores/ui-store"
import { Menu } from "lucide-react"
import { useParams } from "next/navigation"
import { useRouter, usePathname } from "@/i18n/navigation"
import { NotificationBell } from "@/components/notifications/notification-bell"

function LangToggle() {
  const params = useParams()
  const locale = (params?.locale as string) ?? "en"
  const router = useRouter()
  const pathname = usePathname()
  const other = locale === "en" ? "da" : "en"

  return (
    <button
      onClick={() => router.replace(pathname, { locale: other })}
      className="h-7 px-2.5 rounded-md text-xs font-semibold tracking-wider transition-colors duration-120 cursor-pointer"
      style={{
        fontFamily: "var(--font-body)",
        color: "var(--muted-foreground)",
        border: "1px solid var(--border)",
        background: "transparent",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)"}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)"}
    >
      {other.toUpperCase()}
    </button>
  )
}

interface TopbarProps {
  title: string
  action?: React.ReactNode
}

export function Topbar({ title, action }: TopbarProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  return (
    <header
      className="fixed top-0 right-0 z-30 h-12 flex items-center px-4 transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        left: sidebarOpen ? 240 : 64,
        backgroundColor: "color-mix(in oklch, var(--background) 88%, transparent)",
        backdropFilter: "blur(16px) saturate(180%)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Mobile toggle */}
      <button
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-[--radius-sm] mr-2 transition-colors duration-120 cursor-pointer"
        style={{ color: "var(--muted-foreground)" }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)"}
      >
        <Menu className="w-4.5 h-4.5" />
      </button>

      <h1
        className="text-[15px] font-semibold flex-1 truncate"
        style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <LangToggle />
        {action}
      </div>
    </header>
  )
}
