import { Topbar } from "@/components/shared/topbar"
import { Skeleton } from "@/components/ui/skeleton"

export default function TimeTrackingLoading() {
  return (
    <>
      <Topbar title="Time tracking" />
      <main className="pt-4 pb-24 md:pb-10 px-4 lg:px-6 space-y-5">
        <div className="pt-4 space-y-2">
          <Skeleton className="h-7 w-44 rounded-lg" />
        </div>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
              <Skeleton className="h-3 w-[72px] rounded shrink-0" />
              <Skeleton className="flex-1 h-1.5 rounded-full" />
              <Skeleton className="h-3 w-10 rounded shrink-0" />
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
