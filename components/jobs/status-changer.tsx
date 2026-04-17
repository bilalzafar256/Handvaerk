"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { updateJobStatusAction } from "@/lib/actions/jobs"
import { toast } from "sonner"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"

type Status = "new" | "scheduled" | "in_progress" | "done" | "invoiced" | "paid"

const STATUS_CONFIG: Record<Status, { bg: string; text: string; border: string }> = {
  new:         { bg: "--status-new-bg",        text: "--status-new-text",        border: "--status-new-border" },
  scheduled:   { bg: "--status-scheduled-bg",  text: "--status-scheduled-text",  border: "--status-scheduled-border" },
  in_progress: { bg: "--status-progress-bg",   text: "--status-progress-text",   border: "--status-progress-border" },
  done:        { bg: "--status-done-bg",        text: "--status-done-text",       border: "--status-done-border" },
  invoiced:    { bg: "--status-invoiced-bg",    text: "--status-invoiced-text",   border: "--status-invoiced-border" },
  paid:        { bg: "--status-paid-bg",        text: "--status-paid-text",       border: "--status-paid-border" },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as Status[]

export function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations("JobStatus")
  const s = STATUS_CONFIG[status]
  return (
    <motion.span
      key={status}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="inline-flex items-center px-2.5 h-6 rounded-full text-xs font-medium border flex-shrink-0"
      style={{
        backgroundColor: `var(${s.bg})`,
        color: `var(${s.text})`,
        borderColor: `var(${s.border})`,
        fontFamily: "var(--font-body)",
      }}
    >
      {t(status)}
    </motion.span>
  )
}

interface StatusChangerProps {
  jobId: string
  currentStatus: Status
}

export function StatusChanger({ jobId, currentStatus }: StatusChangerProps) {
  const t = useTranslations("JobStatus")
  const [status, setStatus] = useState<Status>(currentStatus)
  const [pending, setPending] = useState<Status | null>(null)
  const [saving, setSaving] = useState(false)

  const currentIdx = ALL_STATUSES.indexOf(status)

  async function confirm(next: Status) {
    if (saving) return
    setSaving(true)
    try {
      await updateJobStatusAction(jobId, next)
      setStatus(next)
      setPending(null)
    } catch {
      toast.error(t("errorUpdate"))
    } finally {
      setSaving(false)
    }
  }

  function handleClick(s: Status) {
    if (s === status || saving) return
    if (pending === s) {
      confirm(s)
    } else {
      setPending(s)
    }
  }

  useEffect(() => {
    if (!pending) return
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setPending(null)
      if (e.key === "Enter") confirm(pending!)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [pending])

  return (
    <div className="space-y-3">
      {/* Stepper track */}
      <div className="flex items-start overflow-x-auto pb-1 -mx-1 px-1">
        {ALL_STATUSES.map((s, i) => {
          const cfg = STATUS_CONFIG[s]
          const idx = ALL_STATUSES.indexOf(s)
          const isPast = idx < currentIdx
          const isCurrent = s === status
          const isPending = s === pending

          return (
            <div key={s} className="flex items-start" style={{ flex: i < ALL_STATUSES.length - 1 ? "1 1 0" : "none" }}>
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => handleClick(s)}
                  disabled={isCurrent || saving}
                  className="flex items-center justify-center rounded-full border-2 transition-all duration-180 cursor-pointer disabled:cursor-default"
                  style={{
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    backgroundColor: isCurrent
                      ? `var(${cfg.text})`
                      : isPast
                      ? "oklch(0.52 0.14 145)"
                      : isPending
                      ? `var(${cfg.bg})`
                      : "var(--background)",
                    borderColor: isCurrent
                      ? `var(${cfg.text})`
                      : isPast
                      ? "oklch(0.52 0.14 145)"
                      : isPending
                      ? `var(${cfg.text})`
                      : "var(--border)",
                  }}
                >
                  {isPast ? (
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isPending ? `var(${cfg.text})` : "var(--border)" }} />
                  )}
                </button>

                <p
                  className="text-[10px] text-center leading-tight font-medium"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: isCurrent
                      ? `var(${cfg.text})`
                      : isPending
                      ? `var(${cfg.text})`
                      : isPast
                      ? "oklch(0.52 0.14 145)"
                      : "var(--muted-foreground)",
                    fontWeight: isCurrent || isPending ? 600 : 400,
                    maxWidth: 52,
                    whiteSpace: "pre-line",
                  }}
                >
                  {t(s)}
                </p>
              </div>

              {/* Connector */}
              {i < ALL_STATUSES.length - 1 && (
                <div
                  className="flex-1 h-[2px] mt-3 mx-1"
                  style={{ backgroundColor: idx < currentIdx ? "oklch(0.52 0.14 145)" : "var(--border)", minWidth: 8 }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Pending confirmation */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: "var(--accent)", fontFamily: "var(--font-body)" }}
          >
            <span style={{ color: "var(--foreground)", flex: 1 }}>
              {t("confirmChange", { label: t(pending) })}
            </span>
            <button
              onClick={() => confirm(pending)}
              disabled={saving}
              className="h-7 px-2.5 rounded-md text-xs font-medium cursor-pointer transition-opacity hover:opacity-85"
              style={{ backgroundColor: "var(--amber-500)", color: "oklch(0.10 0.005 52)" }}
            >
              {t("confirm")}
            </button>
            <button
              onClick={() => setPending(null)}
              className="p-1 rounded cursor-pointer transition-opacity hover:opacity-70"
              style={{ color: "var(--muted-foreground)" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
