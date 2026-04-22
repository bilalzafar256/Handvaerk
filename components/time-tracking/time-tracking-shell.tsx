import { TimerHero, type JobOption } from "./timer-hero"
import { WeekBars, type WeekBarsEntry } from "./week-bars"
import { DayView } from "./day-view"
import { MonthCalendar, type MonthEntry } from "./month-calendar"
import { StatsSidebar, type StatsSidebarEntry } from "./stats-sidebar"
import { UnbilledPanel } from "./unbilled-panel"
import type { TimeEntry } from "@/lib/db/schema/time-entries"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"

type FullEntry = TimeEntry & { job: Job & { customer: Customer } }

interface TimeTrackingShellProps {
  entries: FullEntry[]
  prevWeekMinutes: number
  unbilledEntries: FullEntry[]
  activeEntry: (TimeEntry & { job: JobOption }) | null
  activeJobs: JobOption[]
  monthEntries: MonthEntry[]
  weekStart: Date
  monthStart: Date
  selectedDay: Date
  selectedDayISO: string
  hourlyRate: string | null
}

export function TimeTrackingShell({
  entries,
  prevWeekMinutes,
  unbilledEntries,
  activeEntry,
  activeJobs,
  monthEntries,
  weekStart,
  monthStart,
  selectedDay,
  selectedDayISO,
  hourlyRate,
}: TimeTrackingShellProps) {
  return (
    <div className="flex h-full min-h-0" style={{ fontFamily: "var(--font-body)" }}>

      {/* ── Stats sidebar (desktop) ─────────────────────────────────────── */}
      <div className="hidden md:flex">
        <StatsSidebar
          entries={entries as StatsSidebarEntry[]}
          prevWeekMinutes={prevWeekMinutes}
          hourlyRate={hourlyRate}
        />
      </div>

      {/* ── Main scrollable area ───────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-4 pt-4 pb-24 md:pb-10 space-y-4">

          <TimerHero
            activeEntry={activeEntry as Parameters<typeof TimerHero>[0]["activeEntry"]}
            jobs={activeJobs}
          />

          <WeekBars
            entries={entries as WeekBarsEntry[]}
            weekStart={weekStart}
            selectedDay={selectedDayISO}
          />

          <DayView
            entries={entries as Parameters<typeof DayView>[0]["entries"]}
            selectedDay={selectedDay}
            activeJobs={activeJobs}
            hourlyRate={hourlyRate}
          />

          <MonthCalendar
            entries={monthEntries}
            weekStart={weekStart}
            monthStart={monthStart}
            selectedDay={selectedDayISO}
          />
        </div>
      </div>

      {/* ── Unbilled panel (desktop) ───────────────────────────────────── */}
      <div className="hidden md:flex">
        <UnbilledPanel
          entries={unbilledEntries as Parameters<typeof UnbilledPanel>[0]["entries"]}
          hourlyRate={hourlyRate}
        />
      </div>
    </div>
  )
}
