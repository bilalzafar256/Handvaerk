"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Search, Plus, Briefcase, ChevronRight, ChevronDown, Check, X,
} from "lucide-react"
import { StatusBadge } from "@/components/jobs/status-changer"
import { useTranslations } from "next-intl"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"

type JobWithCustomer = Job & { customer: Customer }
type Status = "new" | "scheduled" | "in_progress" | "done" | "invoiced" | "paid"

const STATUS_COLORS: Record<Status, string> = {
  new:         "var(--status-new-text)",
  scheduled:   "var(--status-scheduled-text)",
  in_progress: "var(--status-progress-text)",
  done:        "var(--status-done-text)",
  invoiced:    "var(--status-invoiced-text)",
  paid:        "var(--status-paid-text)",
}

const ALL_STATUSES: Status[] = ["new", "scheduled", "in_progress", "done", "invoiced", "paid"]

const PER_PAGE = 25

export function JobList({ jobs }: { jobs: JobWithCustomer[] }) {
  const t = useTranslations("Jobs")
  const tStatus = useTranslations("JobStatus")
  const [query, setQuery] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([])
  const [statusOpen, setStatusOpen] = useState(false)
  const [page, setPage] = useState(1)

  const filtered = jobs.filter((j) => {
    const q = query.toLowerCase().trim()
    const matchesQuery = !q ||
      j.title.toLowerCase().includes(q) ||
      j.customer.name.toLowerCase().includes(q) ||
      j.jobNumber.includes(q)
    const matchesStatus = selectedStatuses.length === 0 ||
      selectedStatuses.includes(j.status as Status)
    return matchesQuery && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function toggleStatus(s: Status) {
    setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
    setPage(1)
  }

  const activeFilters = selectedStatuses.length > 0

  return (
    <div>
      {/* Filter bar */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap border-b" style={{ borderColor: "var(--border)" }}>
        {/* Search */}
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder={t("searchPlaceholder")}
            className="w-full h-8 pl-8 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: "var(--border)",
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
              ["--tw-ring-color" as string]: "oklch(0.720 0.195 58 / 20%)",
            }}
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className="h-8 px-2.5 rounded-lg border text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: activeFilters ? "var(--amber-400)" : "var(--border)",
              backgroundColor: activeFilters ? "var(--amber-50)" : "var(--background)",
              color: activeFilters ? "var(--amber-700)" : "var(--muted-foreground)",
            }}
          >
            {t("statusFilter")}
            {activeFilters && (
              <span className="px-1.5 rounded text-[11px] font-semibold leading-5"
                style={{ backgroundColor: "var(--amber-500)", color: "oklch(0.10 0.005 52)" }}>
                {selectedStatuses.length}
              </span>
            )}
            <ChevronDown className="w-3 h-3" />
          </button>

          <AnimatePresence>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                <motion.div
                  className="absolute top-full left-0 mt-1 z-20 w-48 rounded-xl border overflow-hidden"
                  style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.12 }}
                >
                  <div className="p-1">
                    {ALL_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleStatus(s)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors text-left"
                        style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = ""}
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center border flex-shrink-0"
                          style={{
                            backgroundColor: selectedStatuses.includes(s) ? "var(--amber-500)" : "transparent",
                            borderColor: selectedStatuses.includes(s) ? "var(--amber-500)" : "var(--border)",
                          }}
                        >
                          {selectedStatuses.includes(s) && (
                            <Check className="w-2.5 h-2.5" style={{ color: "oklch(0.10 0.005 52)" }} />
                          )}
                        </div>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s] }} />
                        {tStatus(s)}
                      </button>
                    ))}
                  </div>
                  {activeFilters && (
                    <div className="border-t px-3 py-1.5" style={{ borderColor: "var(--border)" }}>
                      <button
                        onClick={() => { setSelectedStatuses([]); setStatusOpen(false) }}
                        className="text-xs cursor-pointer hover:opacity-70 transition-opacity"
                        style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
                      >
                        {t("clearFilter")}
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Active filter pills */}
        {selectedStatuses.map(s => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className="h-8 px-2.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "var(--amber-100)", color: "var(--amber-700)", fontFamily: "var(--font-body)" }}
          >
            {tStatus(s)}
            <X className="w-3 h-3" />
          </button>
        ))}
      </div>

      {/* Result count */}
      {filtered.length > 0 && (
        <p className="px-4 py-2 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
          {t("jobCount", { count: filtered.length })}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState hasFilters={query.trim().length > 0 || activeFilters} />
      ) : (
        <>
          <div>
            {paged.map((job, i) => (
              <JobRow key={job.id} job={job} index={i} />
            ))}
          </div>
          {totalPages > 1 && <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  )
}

function JobRow({ job, index }: { job: JobWithCustomer; index: number }) {
  const [hovered, setHovered] = useState(false)
  const status = job.status as Status
  const barColor = STATUS_COLORS[status] ?? "var(--muted-foreground)"

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, delay: Math.min(index * 0.02, 0.14) }}
      className="flex border-b"
      style={{
        borderColor: "var(--border)",
        backgroundColor: hovered ? "var(--accent)" : "transparent",
        transition: "background-color 80ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Status bar */}
      <div
        className="flex-shrink-0 self-stretch"
        style={{
          width: hovered ? 4 : 3,
          backgroundColor: barColor,
          transition: "width 80ms ease",
        }}
      />

      {/* Row content */}
      <Link
        href={`/jobs/${job.id}`}
        className="flex items-center gap-3 flex-1 px-4 py-3 min-w-0"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
            {job.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs truncate" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
              {job.customer.name}
            </p>
            <span style={{ color: "var(--border)" }}>·</span>
            <p className="text-xs flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
              #{job.jobNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {job.scheduledDate && (
            <p className="text-xs hidden sm:block" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
              {new Date(job.scheduledDate).toLocaleDateString("da-DK", { day: "numeric", month: "short" })}
            </p>
          )}
          <StatusBadge status={status} />
          <ChevronRight className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
        </div>
      </Link>
    </motion.div>
  )
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "var(--background)" }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background)"}
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
      </button>
      <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
        {page} / {totalPages}
      </p>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "var(--background)" }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--background)"}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const t = useTranslations("Jobs")
  return (
    <div className="relative flex flex-col items-center justify-center py-20 px-8 gap-4 text-center overflow-hidden">
      {/* Ghost card behind */}
      <div className="absolute inset-x-4 top-8 bottom-8 rounded-xl border opacity-10 blur-[1px] pointer-events-none" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
        <div className="h-12 border-b" style={{ borderColor: "var(--border)" }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="w-3 h-full rounded-full" style={{ backgroundColor: "var(--muted-foreground)" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 rounded w-3/4" style={{ backgroundColor: "var(--muted-foreground)" }} />
              <div className="h-2.5 rounded w-1/2" style={{ backgroundColor: "var(--muted-foreground)" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative space-y-1 z-10">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "var(--accent-light)" }}>
          <Briefcase className="w-6 h-6" style={{ color: "var(--primary)" }} />
        </div>
        <p className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
          {hasFilters ? t("emptySearch.title") : t("empty.title")}
        </p>
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
          {hasFilters ? t("emptySearch.description") : t("empty.description")}
        </p>
      </div>
      {!hasFilters && (
        <Link
          href="/jobs/new"
          className="relative z-10 flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98]"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-accent)" }}
        >
          <Plus className="w-4 h-4" />
          {t("newJob")}
        </Link>
      )}
    </div>
  )
}
