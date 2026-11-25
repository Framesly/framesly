import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder for any app page while it loads: a title, three stat tiles and a large block. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[var(--container-content)]" role="status" aria-busy aria-label="Loading">
      <Skeleton className="h-10 w-56" />
      <div className="mt-8 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <Skeleton className="h-20 rounded-[var(--radius-control)]" />
        <Skeleton className="h-20 rounded-[var(--radius-control)]" />
        <Skeleton className="h-20 rounded-[var(--radius-control)]" />
      </div>
      <Skeleton className="mt-8 h-64 rounded-[var(--radius-cover)]" />
    </div>
  )
}
