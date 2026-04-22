"use client"

import { Briefcase, Receipt, FileText, ExternalLink, User, Calendar, X } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { formatDKK } from "@/lib/utils/currency"
import type { RBCEvent } from "./types"

const ENTITY_ICON = {
  job: Briefcase,
  invoice: Receipt,
  quote: FileText,
}

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  done: "Done",
  invoiced: "Invoiced",
  paid: "Paid",
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  overdue: "Overdue",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
}

const JOB_TYPE_LABEL: Record<string, string> = {
  service: "Service job",
  project: "Project",
  recurring: "Recurring job",
}

function entityHref(event: RBCEvent): string {
  if (event.entityType === "job") return `/jobs/${event.entityId}`
  if (event.entityType === "invoice") return `/invoices/${event.entityId}`
  return `/quotes/${event.entityId}`
}

function formatDateRange(event: RBCEvent): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
  const start = event.start.toLocaleDateString("en-GB", opts)
  if (event.entityType !== "job") return start
  if (!event.end || event.end.toDateString() === event.start.toDateString()) return start
  return `${start} → ${event.end.toLocaleDateString("en-GB", opts)}`
}

interface EventDetailProps {
  event: RBCEvent | null
  onClose: () => void
}

export function EventDetailModal({ event, onClose }: EventDetailProps) {
  if (!event) return null

  const Icon = ENTITY_ICON[event.entityType]
  const href = entityHref(event)
  const dateRange = formatDateRange(event)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: "oklch(0.09 0.004 255 / 30%)" }}
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="fixed z-50 w-[300px]"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        }}
      >
        {/* Color bar */}
        <div
          style={{
            height: 3,
            backgroundColor: event.entityType === "job"
              ? `var(--status-${event.status}-border)`
              : event.entityType === "invoice"
              ? event.status === "overdue" ? "var(--status-overdue-border)" : "oklch(0.72 0.10 240)"
              : "oklch(0.82 0.11 58)",
          }}
        />

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: event.entityType === "job"
                    ? `var(--status-${event.status}-bg)`
                    : event.entityType === "invoice"
                    ? "oklch(0.94 0.03 240)"
                    : "var(--accent-light)",
                }}
              >
                <Icon
                  className="w-3.5 h-3.5"
                  style={{
                    color: event.entityType === "job"
                      ? `var(--status-${event.status}-text)`
                      : event.entityType === "invoice"
                      ? "oklch(0.38 0.14 240)"
                      : "oklch(0.52 0.13 58)",
                  }}
                />
              </div>
              <div className="min-w-0">
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
                >
                  {event.entityType}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors duration-120"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background-subtle)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Title + status */}
          <div className="mb-3">
            <p
              className="text-[15px] font-semibold leading-snug mb-1.5"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              {event.entityType === "job"
                ? event.title
                : event.entityType === "invoice"
                ? event.invoiceNumber
                : event.quoteNumber}
            </p>
            <span
              className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: event.entityType === "job"
                  ? `var(--status-${event.status}-bg)`
                  : event.entityType === "invoice" && event.status === "overdue"
                  ? "var(--status-overdue-bg)"
                  : "var(--accent-light)",
                color: event.entityType === "job"
                  ? `var(--status-${event.status}-text)`
                  : event.entityType === "invoice" && event.status === "overdue"
                  ? "var(--status-overdue-text)"
                  : "oklch(0.52 0.13 58)",
              }}
            >
              {STATUS_LABEL[event.status] ?? event.status}
            </span>
          </div>

          {/* Meta rows */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
              <Link
                href={`/customers/${event.customerId}`}
                className="text-[12px] truncate hover:underline"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
              >
                {event.customerName}
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
              <span
                className="text-[12px]"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
              >
                {dateRange}
              </span>
            </div>

            {event.entityType === "job" && event.jobType && (
              <p
                className="text-[11px]"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
              >
                {JOB_TYPE_LABEL[event.jobType] ?? event.jobType}
              </p>
            )}

            {event.entityType === "invoice" && event.totalInclVat && (
              <p
                className="text-[13px] font-semibold"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
              >
                {formatDKK(Number(event.totalInclVat))}
              </p>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--background-subtle)" }}
        >
          <Link
            href={href}
            className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors duration-120"
            style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open {event.entityType}
          </Link>
        </div>
      </div>
    </>
  )
}
