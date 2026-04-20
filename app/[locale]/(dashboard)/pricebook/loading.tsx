import { Topbar } from "@/components/shared/topbar"
import { Skeleton } from "@/components/ui/skeleton"

export default function PricebookLoading() {
  return (
    <>
      <Topbar title="Pricebook" />
      <div>
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b" style={{ borderColor: "var(--border)" }}>
          <Skeleton className="flex-1 h-8 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <ul className="divide-y" style={{ ["--tw-divide-color" as string]: "var(--border)" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--card)" }}>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-36 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48 rounded" />
              </div>
              <Skeleton className="h-3.5 w-16 rounded flex-shrink-0" />
              <div className="flex gap-1 flex-shrink-0">
                <Skeleton className="w-7 h-7 rounded-lg" />
                <Skeleton className="w-7 h-7 rounded-lg" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
