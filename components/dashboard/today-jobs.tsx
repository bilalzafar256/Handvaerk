import { MapPin } from "lucide-react"
import Link from "next/link"
import type { TodayJob } from "@/lib/db/queries/overview"

export function TodayJobs({ jobs }: { jobs: TodayJob[] }) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-4"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
        >
          {"Today\u2019s jobs"}
        </p>
        <Link
          href="/jobs"
          className="text-xs font-medium cursor-pointer transition-opacity hover:opacity-70"
          style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
        >
          View all
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p
          className="text-sm py-6 text-center"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
        >
          No jobs scheduled for today.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex gap-3 rounded-lg p-3 cursor-pointer transition-colors hover:opacity-80"
              style={{ backgroundColor: "var(--muted)" }}
            >
              <div className="shrink-0 w-16 pt-0.5">
                <p
                  className="text-xs font-semibold leading-none truncate"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
                >
                  {job.jobNumber}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-semibold leading-none"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
                >
                  {job.customer.name}
                </p>
                <p
                  className="text-xs mt-1 truncate"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                >
                  {job.title}
                </p>
                {(job.customer.addressLine1 || job.customer.addressCity) && (
                  <p
                    className="text-xs mt-0.5 truncate flex items-center gap-0.5"
                    style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
                  >
                    <MapPin className="w-3 h-3 shrink-0" />
                    {[job.customer.addressLine1, job.customer.addressCity].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
