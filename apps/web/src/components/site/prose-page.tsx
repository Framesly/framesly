import { EdgeLabel } from "@/components/ui/card"

/** Shell for short static pages (legal, coming soon). */
export function ProsePage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string
  title: string
  updated?: string
  children: React.ReactNode
}) {
  return (
    <section className="gutter mx-auto max-w-3xl pt-32 pb-24 md:pt-40">
      <EdgeLabel tone="safelight">{eyebrow}</EdgeLabel>
      <h1 className="mt-4 type-display-l text-balance">{title}</h1>
      {updated && <p className="mt-4 type-label text-ink-muted">{updated}</p>}
      <div className="mt-10 space-y-5 type-body-l text-ink-muted [&_h2]:mt-12 [&_h2]:type-heading-2 [&_h2]:text-ink [&_strong]:font-medium [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:text-safelight-text [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </section>
  )
}
