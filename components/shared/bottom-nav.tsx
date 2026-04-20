"use client"

import { usePathname } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { LayoutDashboard, Briefcase, FileText, UserCircle, Timer } from "lucide-react"
import { useTranslations } from "next-intl"

const navItems = [
  { icon: LayoutDashboard, labelKey: "overview",     href: "/overview" },
  { icon: Briefcase,       labelKey: "jobs",         href: "/jobs" },
  { icon: Timer,           labelKey: "timeTracking", href: "/time-tracking" },
  { icon: FileText,        labelKey: "invoices",     href: "/invoices" },
  { icon: UserCircle,      labelKey: "profile",      href: "/profile" },
] as const

export function BottomNav() {
  const t = useTranslations("BottomNav")
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-stretch h-16">
        {navItems.map(({ icon: Icon, labelKey, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors duration-150"
              style={{ color: isActive ? "var(--primary)" : "var(--text-tertiary)" }}
            >
              <div className="relative">
                <Icon
                  className="w-[22px] h-[22px]"
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                {isActive && (
                  <span
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: "var(--primary)" }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {t(labelKey)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
