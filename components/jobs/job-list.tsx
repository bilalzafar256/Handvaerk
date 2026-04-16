"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { motion } from "motion/react"
import { ChevronRight, Search, Plus, Briefcase, Calendar } from "lucide-react"
import { StatusBadge } from "@/components/jobs/status-changer"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"

type JobWithCustomer = Job & { customer: Customer }

interface JobListProps {
  jobs: JobWithCustomer[]
}

export function JobList({ jobs }: JobListProps) {
  const t = useTranslations("Jobs")
  const [query, setQuery] = useState("")

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

  return (
    <div>
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full h-11 pl-10 pr-4 rounded-[--radius-sm] border text-sm bg-[--surface] placeholder:text-[--text-tertiary] focus:outline-none focus:border-[--accent] focus:ring-2 focus:ring-[--accent]/20 transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState searching={query.trim().length > 0} t={t} />
      ) : (
        <ul className="px-4 space-y-2 pb-24">
          {filtered.map((job, i) => (
            <motion.li
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.3) }}
            >
              <JobCard job={job} />
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}

function JobCard({ job }: { job: JobWithCustomer }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <Link
        href={`/jobs/${job.id}`}
        className="flex items-center gap-3 p-4 rounded-[--radius-md] border transition-colors duration-150"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {/* Job number icon */}
        <div
          className="w-10 h-10 rounded-[--radius-sm] flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--accent-light)" }}
        >
          <Briefcase className="w-5 h-5" style={{ color: "var(--primary)" }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p
              className="text-sm font-semibold truncate"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
            >
              {job.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p
              className="text-xs truncate"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
            >
              {job.customer.name}
            </p>
            <span style={{ color: "var(--text-tertiary)" }}>·</span>
            <p
              className="text-xs flex-shrink-0"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
            >
              #{job.jobNumber}
            </p>
          </div>
          {job.scheduledDate && (
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
              <p
                className="text-xs"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
              >
                {new Date(job.scheduledDate).toLocaleDateString("en-DK", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={job.status as Parameters<typeof StatusBadge>[0]["status"]} />
          <ChevronRight className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
        </div>
      </Link>
    </motion.div>
  )
}

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
        <div
          className="w-14 h-14 rounded-[--radius-xl] flex items-center justify-center"
          style={{ backgroundColor: "var(--accent-light)" }}
        >
          <Search className="w-7 h-7" style={{ color: "var(--primary)" }} />
        </div>
        <p className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          {t("emptySearch.title")}
        </p>
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
          {t("emptySearch.description")}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-4 text-center">
      <div
        className="w-14 h-14 rounded-[--radius-xl] flex items-center justify-center"
        style={{ backgroundColor: "var(--accent-light)" }}
      >
        <Briefcase className="w-7 h-7" style={{ color: "var(--primary)" }} />
      </div>
      <div className="space-y-1">
        <p className="text-[17px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          {t("empty.title")}
        </p>
        <p className="text-sm max-w-[240px]" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
          {t("empty.description")}
        </p>
      </div>
      <Link
        href="/jobs/new"
        className="flex items-center gap-2 h-11 px-5 rounded-[--radius-md] text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          fontFamily: "var(--font-body)",
          boxShadow: "var(--shadow-accent)",
        }}
      >
        <Plus className="w-4 h-4" />
        {t("empty.cta")}
      </Link>
    </div>
  )
}
