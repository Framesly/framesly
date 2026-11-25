import Link from "next/link"

import { Icon } from "@/components/ui/icon"

type Metric = { label: string; value: number; tone?: "danger" }

/**
 * A slim row of counts. Always one row, even on phones: the numbers are short,
 * so three columns fit at 320px and the page keeps its content above the fold.
 * An optional link sits at the end on wide screens and wraps below on phones.
 */
export function MetricStrip({ metrics, link }: { metrics: Metric[]; link?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-raised">
      <dl className="grid w-full grid-cols-3 divide-x divide-line sm:w-auto sm:flex-1">
        {metrics.map((m) => (
          <div key={m.label} className="min-w-0 px-4 py-3">
            <dt className="truncate type-caption font-normal text-ink-muted">{m.label}</dt>
            <dd className={m.tone === "danger" && m.value > 0 ? "type-metric text-stat leading-8 text-danger" : "type-metric text-stat leading-8 text-ink"}>
              {m.value.toLocaleString("en")}
            </dd>
          </div>
        ))}
      </dl>
      {link && (
        <Link
          href={link.href}
          className="group flex w-full items-center justify-between gap-3 border-t border-line px-4 py-3 type-caption text-ink transition-colors hover:bg-surface-overlay sm:w-auto sm:border-t-0 sm:border-l"
        >
          <span className="flex items-center gap-2">
            <Icon name="heart" className="size-4 text-safelight" />
            {link.label}
          </span>
          <Icon name="chevron-right" className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}
