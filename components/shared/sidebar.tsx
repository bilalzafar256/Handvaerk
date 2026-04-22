"use client"

import { useUIStore } from "@/stores/ui-store"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { useClerk, useUser } from "@clerk/nextjs"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "motion/react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wrench,
  FileText,
  Receipt,
  Settings,
  Timer,
  BookOpen,
  CalendarDays,
} from "lucide-react"

const navItems = [
  { icon: LayoutDashboard, labelKey: "overview",      href: "/overview" },
  { icon: CalendarDays,    labelKey: "calendar",      href: "/calendar" },
  { icon: Briefcase,       labelKey: "jobs",          href: "/jobs" },
  { icon: Users,           labelKey: "customers",     href: "/customers" },
  { icon: FileText,        labelKey: "quotes",        href: "/quotes" },
  { icon: Receipt,         labelKey: "invoices",      href: "/invoices" },
  { icon: Timer,           labelKey: "timeTracking",  href: "/time-tracking" },
  { icon: BookOpen,        labelKey: "pricebook",     href: "/pricebook" },
] as const

const settingsItems = [
  { icon: UserCircle, labelKey: "profile", href: "/profile" },
] as const

function TierBadge({ tier }: { tier: string }) {
  const label = tier === "solo" ? "Solo" : tier === "hold" ? "Hold" : "Free"
  const style =
    tier === "solo"
      ? { bg: "var(--accent-light)", color: "var(--primary)" }
      : tier === "hold"
      ? { bg: "oklch(0.93 0.05 240)", color: "oklch(0.42 0.15 240)" }
      : { bg: "var(--muted)", color: "var(--text-tertiary)" }
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: style.bg, color: style.color, fontFamily: "var(--font-body)" }}
    >
      {label}
    </span>
  )
}

export function Sidebar({ tier = "free" }: { tier?: string }) {
  const t = useTranslations("Sidebar")
  const pathname = usePathname()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const { signOut } = useClerk()
  const { user } = useUser()
  const router = useRouter()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            style={{ backgroundColor: "oklch(0.09 0.004 255 / 50%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          backgroundColor: "var(--sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
          boxShadow: "var(--shadow-lg)",
        }}
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.20, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Brand + toggle */}
        <div
          className="h-12 flex items-center justify-between px-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <Link href="/overview" className="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1">
            <div
              className="w-7 h-7 rounded-[5px] flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--amber-500)" }}
            >
              <Wrench className="w-4 h-4" style={{ color: "oklch(0.10 0.005 52)" }} />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  className="text-[14px] font-bold whitespace-nowrap overflow-hidden"
                  style={{ fontFamily: "var(--font-display)", color: "var(--sidebar-foreground)" }}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15, delay: sidebarOpen ? 0.06 : 0 }}
                >
                  Håndværk Pro
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-7 h-7 rounded-[4px] flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors duration-120"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)"}
          >
            {sidebarOpen
              ? <ChevronLeft className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />
            }
          </button>
        </div>

        {/* User info — shown when expanded */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="px-3 py-2.5 flex items-center gap-2.5"
              style={{ borderBottom: "1px solid var(--sidebar-border)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, delay: 0.06 }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                style={{
                  backgroundColor: "var(--amber-500)",
                  color: "oklch(0.10 0.005 52)",
                  fontFamily: "var(--font-display)",
                  backgroundImage: user?.imageUrl ? `url(${user.imageUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {!user?.imageUrl && (user?.fullName?.charAt(0) ?? user?.primaryEmailAddress?.emailAddress?.charAt(0) ?? "?")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p
                    className="text-[13px] font-medium truncate leading-tight"
                    style={{ fontFamily: "var(--font-body)", color: "var(--sidebar-foreground)" }}
                  >
                    {user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? ""}
                  </p>
                  <TierBadge tier={tier} />
                </div>
                <p
                  className="text-[11px] truncate leading-tight"
                  style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}
                >
                  {user?.primaryEmailAddress?.emailAddress ?? ""}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2.5 flex flex-col gap-px px-2">
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
          <div className="mt-3">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.p
                  className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
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

        {/* Bottom: avatar dropdown */}
        <div className="px-2 pb-3 pt-2" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-full h-9 flex items-center gap-2.5 px-2.5 rounded-[6px] transition-colors duration-120 cursor-pointer"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ""; (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)" }}
            >
              <div
                className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                style={{
                  backgroundColor: "var(--amber-600)",
                  color: "oklch(0.10 0.005 52)",
                  backgroundImage: user?.imageUrl ? `url(${user.imageUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {!user?.imageUrl && (user?.fullName?.charAt(0) ?? "?")}
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    className="text-[13px] font-medium whitespace-nowrap overflow-hidden flex-1 text-left"
                    style={{ fontFamily: "var(--font-body)" }}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.14, delay: sidebarOpen ? 0.06 : 0 }}
                  >
                    {user?.fullName ?? "Account"}
                  </motion.span>
                )}
              </AnimatePresence>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/profile")}>
                <UserCircle className="w-4 h-4" />
                {t("profile")}
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/profile")}>
                <Settings className="w-4 h-4" />
                {t("settingsSection")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                <LogOut className="w-4 h-4" />
                {t("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
  const [hovered, setHovered] = useState(false)

  return (
    <div className="relative">
      <Link
        href={href}
        className="h-9 flex items-center gap-2.5 px-2.5 rounded-[6px] transition-colors duration-120 relative cursor-pointer"
        style={{
          backgroundColor: active ? "oklch(0.720 0.195 58 / 12%)" : hovered ? "var(--accent)" : "transparent",
          color: active ? "var(--amber-600)" : "var(--muted-foreground)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
            style={{ backgroundColor: "var(--amber-500)" }}
          />
        )}
        <Icon
          className="w-[16px] h-[16px] flex-shrink-0"
          strokeWidth={active ? 2.25 : 1.75}
        />
        <AnimatePresence>
          {expanded && (
            <motion.span
              className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
              style={{ fontFamily: "var(--font-body)" }}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.14, delay: expanded ? 0.06 : 0 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Tooltip when collapsed */}
      <AnimatePresence>
        {!expanded && hovered && (
          <motion.div
            className="fixed z-[60] pointer-events-none"
            style={{
              left: 72,
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "5px 10px",
              boxShadow: "var(--shadow-md)",
              whiteSpace: "nowrap",
              top: "auto",
            }}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.12 }}
          >
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
              {label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
