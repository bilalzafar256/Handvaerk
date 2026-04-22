export type DashboardWidget = { id: string; enabled: boolean }

export const WIDGET_META: Record<string, { label: string; description: string }> = {
  quick_timer:     { label: "Quick Timer",     description: "Start/stop time tracking from the dashboard" },
  recording:       { label: "Recording",       description: "Record a job and AI-ready recording banners" },
  stat_cards:      { label: "Stat Cards",      description: "Revenue, invoices, quotes, and customer counts" },
  revenue:         { label: "Revenue Chart",   description: "Bar chart of paid revenue over the last 6 months" },
  job_pipeline:    { label: "Job Pipeline",    description: "Status breakdown of all active jobs" },
  todays_jobs:     { label: "Today's Jobs",    description: "Jobs scheduled for today" },
  recent_activity: { label: "Recent Activity", description: "Latest events across jobs, invoices, and quotes" },
  recent_jobs:     { label: "Recent Jobs",     description: "Last few jobs with status" },
}

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: "quick_timer",     enabled: true },
  { id: "recording",       enabled: true },
  { id: "stat_cards",      enabled: true },
  { id: "revenue",         enabled: true },
  { id: "job_pipeline",    enabled: true },
  { id: "todays_jobs",     enabled: true },
  { id: "recent_activity", enabled: true },
  { id: "recent_jobs",     enabled: true },
]

/** Merge stored prefs with defaults — handles new widgets added after initial save */
export function resolveWidgets(stored: DashboardWidget[] | null | undefined): DashboardWidget[] {
  if (!stored || stored.length === 0) return DEFAULT_WIDGETS

  const storedIds = new Set(stored.map((w) => w.id))
  const knownIds = new Set(Object.keys(WIDGET_META))

  // Keep stored order, filter out unknown ids, append new widgets at end
  const filtered = stored.filter((w) => knownIds.has(w.id))
  const appended = DEFAULT_WIDGETS.filter((w) => !storedIds.has(w.id))
  return [...filtered, ...appended]
}
