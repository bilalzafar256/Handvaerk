"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { useRouter } from "@/i18n/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Search, Plus, Briefcase, ChevronRight, ChevronDown, Check, X, LayoutList, LayoutGrid,
  Pencil, Trash2, Loader2,
} from "lucide-react"
import { StatusBadge } from "@/components/jobs/status-changer"
import { deleteJobAction } from "@/lib/actions/jobs"
import { toast } from "sonner"
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
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

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
                  className="absolute top-full right-0 mt-1 z-20 w-48 rounded-xl border overflow-hidden"
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

        {/* View toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5 ml-auto flex-shrink-0" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
          <button
            onClick={() => setViewMode("list")}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer"
            style={{ backgroundColor: viewMode === "list" ? "var(--accent)" : "transparent", color: viewMode === "list" ? "var(--foreground)" : "var(--muted-foreground)" }}
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer"
            style={{ backgroundColor: viewMode === "grid" ? "var(--accent)" : "transparent", color: viewMode === "grid" ? "var(--foreground)" : "var(--muted-foreground)" }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
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
        <EmptyState hasFilters={query.trim().length > 0 || activeFilters} viewMode={viewMode} />
      ) : (
        <>
          {viewMode === "list" ? (
            <div>
              {paged.map((job, i) => (
                <JobRow key={job.id} job={job} index={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {paged.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} />
              ))}
            </div>
          )}
          {totalPages > 1 && <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  )
}

function JobRow({ job, index }: { job: JobWithCustomer; index: number }) {
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const status = job.status as Status
  const barColor = STATUS_COLORS[status] ?? "var(--muted-foreground)"

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    try {
      await deleteJobAction(job.id)
      router.refresh()
    } catch {
      toast.error("Failed to delete job")
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.18), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: 4, transition: { type: "spring", stiffness: 500, damping: 35 } }}
      className="flex border-b"
      style={{
        borderColor: "var(--border)",
        backgroundColor: hovered ? "var(--accent)" : "transparent",
        transition: "background-color 120ms cubic-bezier(0.4,0,0.2,1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (!deleting) setConfirming(false) }}
    >
      {/* Status bar */}
      <div className="flex-shrink-0 self-stretch" style={{ width: hovered ? 4 : 3, backgroundColor: barColor, transition: "width 120ms cubic-bezier(0.4,0,0.2,1)" }} />

      {/* Main content link */}
      <Link href={`/jobs/${job.id}`} className="flex items-center gap-3 flex-1 px-4 py-3 min-w-0">
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
        </div>
      </Link>

      {/* Inline actions — always visible, outside Link */}
      <div className="flex items-center gap-1.5 pr-3 self-center flex-shrink-0">
        <Link
          href={`/jobs/${job.id}/edit`}
          onClick={e => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center rounded-lg border bg-[var(--background)] hover:bg-[var(--accent)] transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
        {confirming ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg border text-xs font-medium cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: "var(--error-light)", borderColor: "var(--error)", color: "var(--error)", fontFamily: "var(--font-body)" }}
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Confirm
          </button>
        ) : (
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg border bg-[var(--background)] hover:bg-[var(--error-light)] transition-colors cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--error)" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

function JobCard({ job, index }: { job: JobWithCustomer; index: number }) {
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const status = job.status as Status
  const barColor = STATUS_COLORS[status] ?? "var(--muted-foreground)"

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    try {
      await deleteJobAction(job.id)
      router.refresh()
    } catch {
      toast.error("Failed to delete job")
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.2), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (!deleting) setConfirming(false) }}
    >
      <div
        className="flex flex-col rounded-xl border overflow-hidden"
        style={{
          borderColor: "var(--border)",
          backgroundColor: hovered ? "var(--accent)" : "var(--card)",
          boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.12)" : "none",
          transition: "background-color 120ms cubic-bezier(0.4,0,0.2,1), box-shadow 200ms ease",
        }}
      >
        {/* Status bar top */}
        <div className="h-1 w-full" style={{ backgroundColor: barColor }} />

        {/* Main content link */}
        <Link href={`/jobs/${job.id}`} className="p-3 flex flex-col gap-2">
          <div>
            <p className="text-sm font-semibold leading-snug" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
              {job.title}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
              {job.customer.name}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <StatusBadge status={status} />
            <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
              #{job.jobNumber}
            </p>
          </div>
          {job.scheduledDate && (
            <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
              {new Date(job.scheduledDate).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </Link>

        {/* Inline actions — always visible */}
        <div className="flex items-center gap-1.5 px-3 pb-3 border-t pt-2" style={{ borderColor: "var(--border)" }}>
          <Link
            href={`/jobs/${job.id}/edit`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-xs font-medium bg-[var(--background)] hover:bg-[var(--accent)] transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}
          >
            <Pencil className="w-3 h-3" />
            Edit
          </Link>
          {confirming ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-xs font-medium cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: "var(--error-light)", borderColor: "var(--error)", color: "var(--error)", fontFamily: "var(--font-body)" }}
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Confirm
            </button>
          ) : (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-xs font-medium bg-[var(--background)] hover:bg-[var(--error-light)] transition-colors cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--error)", fontFamily: "var(--font-body)" }}
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>
      </div>
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

function EmptyState({ hasFilters, viewMode: _ }: { hasFilters: boolean; viewMode: "list" | "grid" }) {
  const t = useTranslations("Jobs")
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-4 text-center">
      <div className="space-y-1">
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
          className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98]"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-accent)" }}
        >
          <Plus className="w-4 h-4" />
          {t("newJob")}
        </Link>
      )}
    </div>
  )
}
