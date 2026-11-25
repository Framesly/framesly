import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder for any app page while it loads: a title, the metric strip and a content block. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[var(--container-content)]" role="status" aria-busy aria-label="Loading">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="mt-6 h-[74px] rounded-[var(--radius-control)]" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-[var(--radius-control)]" style={{ animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
    </div>
  )
}
