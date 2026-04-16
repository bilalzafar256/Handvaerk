"use client"

import { useUIStore } from "@/stores/ui-store"
import { Link, usePathname } from "@/i18n/navigation"
import { useClerk } from "@clerk/nextjs"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "motion/react"
import {
  LayoutDashboard,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from "lucide-react"

const navItems = [
  { icon: LayoutDashboard, labelKey: "overview", href: "/overview" },
] as const

const settingsItems = [
  { icon: UserCircle, labelKey: "profile", href: "/profile" },
] as const

export function Sidebar() {
  const t = useTranslations("Sidebar")
  const pathname = usePathname()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const { signOut } = useClerk()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            style={{ backgroundColor: "oklch(0.10 0.005 50 / 0.4)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col border-r overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Brand + toggle */}
        <div
          className="h-14 flex items-center justify-between px-3 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Brand — links to overview */}
          <Link
            href="/overview"
            className="flex items-center gap-2 overflow-hidden min-w-0 flex-1"
          >
            <div
              className="w-7 h-7 rounded-[4px] flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--amber-500)" }}
            >
              <Wrench className="w-4 h-4" style={{ color: "oklch(0.12 0.005 55)" }} />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  className="text-[15px] font-bold whitespace-nowrap overflow-hidden"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  Håndværk Pro
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-[4px] flex items-center justify-center transition-colors duration-150 flex-shrink-0 cursor-pointer hover:bg-[--background]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {sidebarOpen
              ? <ChevronLeft className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-0.5 px-2">
          {navItems.map(({ icon: Icon, labelKey, href }) => (
            <NavItem
              key={href}
              icon={Icon}
              label={t(labelKey)}
              href={href}
              active={isActive(href)}
              expanded={sidebarOpen}
            />
          ))}

          {/* Settings section */}
          <div className="mt-4">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.p
                  className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {t("settingsSection")}
                </motion.p>
              )}
            </AnimatePresence>

            {settingsItems.map(({ icon: Icon, labelKey, href }) => (
              <NavItem
                key={href}
                icon={Icon}
                label={t(labelKey)}
                href={href}
                active={isActive(href)}
                expanded={sidebarOpen}
              />
            ))}
          </div>
        </nav>

        {/* Sign out */}
        <div className="px-2 pb-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full h-10 flex items-center gap-3 px-3 rounded-[6px] transition-colors duration-150 cursor-pointer hover:bg-[--background]"
            style={{ color: "var(--text-secondary)" }}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.75} />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  style={{ fontFamily: "var(--font-body)" }}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {t("signOut")}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  )
}

function NavItem({
  icon: Icon,
  label,
  href,
  active,
  expanded,
}: {
  icon: React.ElementType
  label: string
  href: string
  active: boolean
  expanded: boolean
}) {
  return (
    <Link
      href={href}
      className="h-10 flex items-center gap-3 px-3 rounded-[6px] transition-colors duration-150 relative cursor-pointer"
      style={{
        backgroundColor: active ? "var(--amber-100)" : "transparent",
        color: active ? "var(--amber-800)" : "var(--text-secondary)",
      }}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
          style={{ backgroundColor: "var(--amber-500)" }}
        />
      )}
      <Icon
        className="w-[18px] h-[18px] flex-shrink-0"
        strokeWidth={active ? 2.5 : 1.75}
      />
      <AnimatePresence>
        {expanded && (
          <motion.span
            className="text-sm font-medium whitespace-nowrap overflow-hidden"
            style={{ fontFamily: "var(--font-body)" }}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}
