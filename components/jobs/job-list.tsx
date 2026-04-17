"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { motion } from "motion/react"
import { ChevronRight, ChevronLeft, Search, Plus, Briefcase, Calendar, Edit2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { StatusBadge } from "@/components/jobs/status-changer"
import { ViewToggle } from "@/components/shared/view-toggle"
import { useViewPreference } from "@/hooks/use-view-preference"
import { deleteJobAction } from "@/lib/actions/jobs"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"

type JobWithCustomer = Job & { customer: Customer }

const PER_PAGE = 15

const btnCls = "flex items-center justify-center w-8 h-8 rounded-[--radius-sm] border transition-colors cursor-pointer disabled:opacity-40 bg-[--surface] hover:bg-[--background-subtle] flex-shrink-0"
const btnStyle = { borderColor: "var(--border)", color: "var(--text-secondary)" }
const btnDangerStyle = { borderColor: "var(--border)", color: "var(--error)" }

function JobInlineActions({ job }: { job: JobWithCustomer }) {
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm("Delete this job?")) return
    setBusy(true)
    try { await deleteJobAction(job.id) } catch { toast.error("Failed to delete") }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
      <Link href={`/jobs/${job.id}/edit`} title="Edit" className={btnCls} style={btnStyle}>
        <Edit2 className="w-3.5 h-3.5" />
      </Link>
      <button onClick={handleDelete} disabled={busy} title="Delete" className={btnCls} style={btnDangerStyle}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

interface JobListProps {
  jobs: JobWithCustomer[]
}

export function JobList({ jobs }: JobListProps) {
  const t = useTranslations("Jobs")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [view, setView] = useViewPreference("jobs", "list")

  const filtered = query.trim()
    ? jobs.filter((j) => {
        const q = query.toLowerCase()
        return (
          j.title.toLowerCase().includes(q) ||
          j.customer.name.toLowerCase().includes(q) ||
          j.jobNumber.includes(q)
        )
      })
    : jobs

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function handleQueryChange(q: string) {
    setQuery(q)
    setPage(1)
  }

  return (
    <div>
      {/* Toolbar: search + view toggle */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full h-11 pl-10 pr-4 rounded-[--radius-sm] border text-sm bg-[--surface] placeholder:text-[--text-tertiary] focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 transition-colors"
            style={{ fontFamily: "var(--font-body)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        <ViewToggle mode={view} onChange={setView} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState searching={query.trim().length > 0} t={t} />
      ) : (
        <>
          {view === "list" && <ListView jobs={paged} />}
          {view === "card" && <CardView jobs={paged} />}
          {view === "table" && <TableView jobs={paged} />}
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}

/* ── List view ── */
function ListView({ jobs }: { jobs: JobWithCustomer[] }) {
  return (
    <ul className="px-4 space-y-2 pb-4">
      {jobs.map((job, i) => (
        <motion.li
          key={job.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2) }}
        >
          <div
            className="rounded-[--radius-md] border overflow-hidden"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-xs)" }}
          >
            <Link
              href={`/jobs/${job.id}`}
              className="flex items-center gap-3 p-4 transition-colors duration-150 hover:bg-[--background-subtle]"
            >
              <div className="w-9 h-9 rounded-[--radius-sm] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--accent-light)" }}>
                <Briefcase className="w-4 h-4" style={{ color: "var(--primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                  {job.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                    {job.customer.name}
                  </p>
                  <span style={{ color: "var(--text-tertiary)" }}>·</span>
                  <p className="text-xs flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
                    #{job.jobNumber}
                  </p>
                </div>
                {job.scheduledDate && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                    <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                      {new Date(job.scheduledDate).toLocaleDateString("en-DK", { day: "numeric", month: "short" })}
                      {job.endDate && ` → ${new Date(job.endDate).toLocaleDateString("en-DK", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={job.status as Parameters<typeof StatusBadge>[0]["status"]} />
              </div>
            </Link>
            <div
              className="flex items-center gap-1 px-4 py-2 border-t"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
            >
              <JobInlineActions job={job} />
            </div>
          </div>
        </motion.li>
      ))}
    </ul>
  )
}

/* ── Card view ── */
function CardView({ jobs }: { jobs: JobWithCustomer[] }) {
  return (
    <div className="px-4 grid grid-cols-2 gap-3 pb-4">
      {jobs.map((job, i) => (
        <motion.div
          key={job.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2) }}
          className="flex flex-col rounded-[--radius-lg] border overflow-hidden"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <Link
            href={`/jobs/${job.id}`}
            className="flex flex-col gap-3 p-4 flex-1 transition-colors duration-150 hover:bg-[--background-subtle]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
                #{job.jobNumber}
              </p>
              <StatusBadge status={job.status as Parameters<typeof StatusBadge>[0]["status"]} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-snug" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                {job.title}
              </p>
              <p className="text-xs mt-1 truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                {job.customer.name}
              </p>
            </div>
            {job.scheduledDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                  {new Date(job.scheduledDate).toLocaleDateString("en-DK", { day: "numeric", month: "short" })}
                </p>
              </div>
            )}
          </Link>
          <div
            className="flex items-center gap-1 px-3 py-2 border-t flex-wrap"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
          >
            <JobInlineActions job={job} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ── Table view ── */
function TableView({ jobs }: { jobs: JobWithCustomer[] }) {
  return (
    <div className="px-4 pb-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["#", "Title", "Customer", "Status", "Scheduled", "End Date", "Actions"].map((h) => (
              <th
                key={h}
                className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider first:pl-0"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="transition-colors duration-100 hover:bg-[--background-subtle]"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <td className="py-3 px-3 first:pl-0">
                <Link href={`/jobs/${job.id}`} className="block">
                  <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
                    #{job.jobNumber}
                  </span>
                </Link>
              </td>
              <td className="py-3 px-3">
                <Link href={`/jobs/${job.id}`} className="block">
                  <span className="font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                    {job.title}
                  </span>
                </Link>
              </td>
              <td className="py-3 px-3">
                <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                  {job.customer.name}
                </span>
              </td>
              <td className="py-3 px-3">
                <StatusBadge status={job.status as Parameters<typeof StatusBadge>[0]["status"]} />
              </td>
              <td className="py-3 px-3">
                <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                  {job.scheduledDate
                    ? new Date(job.scheduledDate).toLocaleDateString("en-DK", { day: "numeric", month: "short", year: "2-digit" })
                    : "—"}
                </span>
              </td>
              <td className="py-3 px-3">
                <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                  {job.endDate
                    ? new Date(job.endDate).toLocaleDateString("en-DK", { day: "numeric", month: "short", year: "2-digit" })
                    : "—"}
                </span>
              </td>
              <td className="py-3 px-3">
                <JobInlineActions job={job} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Pagination ── */
function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 pb-24 pt-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="w-9 h-9 flex items-center justify-center rounded-[--radius-sm] border transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[--background-subtle]"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
        {page} / {totalPages}
      </p>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-[--radius-sm] border transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[--background-subtle]"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ── Empty state ── */
function EmptyState({
  searching,
  t,
}: {
  searching: boolean
  t: ReturnType<typeof useTranslations<"Jobs">>
}) {
  if (searching) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 gap-3 text-center">
        <div className="w-14 h-14 rounded-[--radius-xl] flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
          <Search className="w-7 h-7" style={{ color: "var(--primary)" }} />
        </div>
        <p className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{t("emptySearch.title")}</p>
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>{t("emptySearch.description")}</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-4 text-center">
      <div className="w-14 h-14 rounded-[--radius-xl] flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
        <Briefcase className="w-7 h-7" style={{ color: "var(--primary)" }} />
      </div>
      <div className="space-y-1">
        <p className="text-[17px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{t("empty.title")}</p>
        <p className="text-sm max-w-[240px]" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>{t("empty.description")}</p>
      </div>
      <Link
        href="/jobs/new"
        className="flex items-center gap-2 h-11 px-5 rounded-[--radius-md] text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-accent)" }}
      >
        <Plus className="w-4 h-4" />
        {t("empty.cta")}
      </Link>
    </div>
  )
}
