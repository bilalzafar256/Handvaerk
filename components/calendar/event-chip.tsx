"use client"

import type { EventProps } from "react-big-calendar"
import type { RBCEvent } from "./types"

const JOB_TYPE_ICON: Record<string, string> = {
  project: "◆",
  recurring: "↻",
  service: "●",
}

function getColors(event: RBCEvent): { bg: string; text: string; accent: string } {
  if (event.entityType === "job") {
    return {
      bg: `var(--status-${event.status}-bg)`,
      text: `var(--status-${event.status}-text)`,
      accent: `var(--status-${event.status}-border)`,
    }
  }
  if (event.entityType === "invoice") {
    if (event.status === "overdue") {
      return {
        bg: "var(--status-overdue-bg)",
        text: "var(--status-overdue-text)",
        accent: "var(--status-overdue-border)",
      }
    }
    return {
      bg: "oklch(0.94 0.03 240)",
      text: "oklch(0.38 0.14 240)",
      accent: "oklch(0.72 0.10 240)",
    }
  }
  // quote
  return {
    bg: "var(--accent-light)",
    text: "oklch(0.52 0.13 58)",
    accent: "oklch(0.82 0.11 58)",
  }
}

function getLabel(event: RBCEvent, continuesPrior: boolean): string {
  const prefix = continuesPrior ? "↩ " : ""
  if (event.entityType === "job") {
    const icon = JOB_TYPE_ICON[event.jobType ?? "service"] ?? "●"
    return `${prefix}${icon} ${event.title}`
  }
  if (event.entityType === "invoice") {
    return `${prefix}${event.invoiceNumber} due`
  }
  return `${prefix}${event.quoteNumber} expires`
}

export function EventChip({
  event,
  continuesPrior = false,
  continuesAfter = false,
}: EventProps<RBCEvent>) {
  const { bg, text, accent } = getColors(event)
  const label = getLabel(event, continuesPrior)

  return (
    <div
      title={`${event.entityType === "job" ? event.title : event.invoiceNumber ?? event.quoteNumber} · ${event.customerName}`}
      style={{
        backgroundColor: bg,
        color: text,
        borderLeft: continuesPrior ? "none" : `3px solid ${accent}`,
        borderTopLeftRadius: continuesPrior ? 0 : 4,
        borderBottomLeftRadius: continuesPrior ? 0 : 4,
        borderTopRightRadius: continuesAfter ? 0 : 4,
        borderBottomRightRadius: continuesAfter ? 0 : 4,
        paddingLeft: continuesPrior ? 5 : 4,
        paddingRight: continuesAfter ? 0 : 4,
        paddingTop: 2,
        paddingBottom: 2,
        fontSize: 10,
        fontWeight: 600,
        fontFamily: "var(--font-body)",
        lineHeight: "14px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        display: "flex",
        alignItems: "center",
        gap: 3,
        userSelect: "none",
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
        {label}
      </span>
      {continuesAfter && (
        <span style={{ flexShrink: 0, opacity: 0.7 }}>→</span>
      )}
    </div>
  )
}
