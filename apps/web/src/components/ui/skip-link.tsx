/**
 * "Skip to content" link: invisible until it gets keyboard focus, then jumps
 * past the navigation to the page's main content. Every layout with
 * repeated navigation (or a long header) needs one.
 */
export function SkipLink({ href = "#main", children = "Skip to content" }: { href?: string; children?: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only z-(--z-viewer) rounded-[var(--radius-chip)] bg-safelight px-4 py-2 type-caption text-on-safelight focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {children}
    </a>
  )
}
