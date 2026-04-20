import { Topbar } from "@/components/shared/topbar"
import { Skeleton } from "@/components/ui/skeleton"

export default function OverviewLoading() {
  return (
    <>
      <Topbar title="Overview" />

      <main className="pt-4 pb-24 md:pb-10 px-4 lg:px-6 space-y-5">

        {/* Greeting */}
        <div className="pt-4 space-y-2">
          <Skeleton className="h-7 w-52 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>

        {/* Record job CTA */}
        <Skeleton className="h-[68px] w-full rounded-xl" />

        {/* Critical zone */}
        <Skeleton className="h-[60px] w-full rounded-xl" />

        {/* Stat cards — 2×3 grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border p-4 flex flex-col gap-3"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          ))}
        </div>

        {/* Revenue trend */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="px-5 py-3.5 border-b"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
          >
            <Skeleton className="h-3 w-36 rounded" />
          </div>
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-end gap-2 h-[96px]">
              {[35, 50, 42, 68, 55, 80].map((pct, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                  <div className="flex-1 w-full flex items-end">
                    <Skeleton className="w-full rounded-t-sm" style={{ height: `${pct}%` }} />
                  </div>
                  <Skeleton className="h-2.5 w-6 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Job pipeline */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="px-5 py-3.5 border-b"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
          >
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <div className="px-5 py-4 space-y-3">
            {[48, 72, 30, 60].map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-[72px] rounded shrink-0" />
                <Skeleton className="flex-1 h-2 rounded-full" style={{ maxWidth: `${w}%` }} />
                <Skeleton className="h-3 w-5 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Today + Activity grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-xl border p-4 flex flex-col gap-4"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
            >
              <Skeleton className="h-3 w-28 rounded" />
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-[58px] rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>

      </main>
    </>
  )
}
