"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { Bell, User, Briefcase, FileText, Mail } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  clearAllNotificationsAction,
} from "@/lib/actions/notifications"
import type { Notification } from "@/lib/db/schema/notifications"

const TYPE_CONFIG: Record<string, { Icon: React.ElementType; bg: string; color: string }> = {
  ai_customer_found:    { Icon: User,      bg: "oklch(0.91 0.05 250)", color: "oklch(0.35 0.14 250)" },
  ai_job_found:         { Icon: Briefcase, bg: "oklch(0.91 0.07 145)", color: "oklch(0.30 0.14 145)" },
  ai_quote_found:       { Icon: FileText,  bg: "oklch(0.93 0.06 55)",  color: "oklch(0.38 0.12 55)"  },
  quote_followup_draft: { Icon: Mail,      bg: "oklch(0.93 0.06 220)", color: "oklch(0.35 0.12 220)" },
}

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const fetchCount = useCallback(async () => {
    try {
      const data = await getNotificationsAction()
      setUnreadCount(data.unreadCount)
    } catch {
      // silent — bell is non-critical
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getNotificationsAction()
      setUnreadCount(data.unreadCount)
      setItems(data.items as Notification[])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  // Load unread count on mount
  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      fetchAll()
    } else {
      fetchCount()
    }
  }

  const handleMarkRead = (id: string) => {
    if (items.find(n => n.id === id)?.read) return
    startTransition(async () => {
      await markNotificationReadAction(id)
      setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction()
      setItems(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    })
  }

  const handleClearAll = () => {
    startTransition(async () => {
      await clearAllNotificationsAction()
      setItems([])
      setUnreadCount(0)
    })
  }

  return (
    <>
      <button
        onClick={() => handleOpenChange(true)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-120 cursor-pointer"
        style={{ color: "var(--muted-foreground)" }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)"}
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center leading-none"
            style={{ backgroundColor: "var(--destructive)", color: "#fff" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full p-0 flex flex-col gap-0" showCloseButton={false}>
          {/* Header */}
          <SheetHeader
            className="px-4 py-3.5 border-b flex-shrink-0"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
          >
            <div className="flex items-center justify-between">
              <SheetTitle
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
              >
                Notifications
                {unreadCount > 0 && (
                  <span
                    className="ml-2 inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    {unreadCount}
                  </span>
                )}
              </SheetTitle>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={isPending}
                    className="text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                    style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
                  >
                    Mark all read
                  </button>
                )}
                {items.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    disabled={isPending}
                    className="text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                    style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => handleOpenChange(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                  style={{ color: "var(--muted-foreground)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)"}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--background)" }}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div
                  className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }}
                />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <Bell className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
                </div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)", fontFamily: "var(--font-body)" }}
                >
                  No notifications yet
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
                >
                  AI results and important updates will appear here.
                </p>
              </div>
            ) : (
              <ul>
                {items.map((n, i) => {
                  const cfg = TYPE_CONFIG[n.type] ?? {
                    Icon: Bell,
                    bg: "var(--muted)",
                    color: "var(--muted-foreground)",
                  }
                  const Icon = cfg.Icon
                  return (
                    <li
                      key={n.id}
                      className="border-b"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors"
                        style={{
                          backgroundColor: n.read ? "transparent" : "oklch(0.985 0.005 250 / 0.5)",
                          cursor: n.read ? "default" : "pointer",
                        }}
                        onMouseEnter={e => {
                          if (!n.read) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)"
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = n.read ? "transparent" : "oklch(0.985 0.005 250 / 0.5)"
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: cfg.bg }}
                        >
                          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="text-sm leading-snug"
                              style={{
                                fontFamily: "var(--font-body)",
                                color: "var(--foreground)",
                                fontWeight: n.read ? 400 : 600,
                              }}
                            >
                              {n.title}
                            </p>
                            <span
                              className="text-[10px] flex-shrink-0 mt-0.5 tabular-nums"
                              style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
                            >
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p
                            className="text-xs mt-0.5 truncate"
                            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
                          >
                            {n.body}
                          </p>
                        </div>

                        {/* Unread dot */}
                        {!n.read && (
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                            style={{ backgroundColor: "var(--primary)" }}
                          />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
