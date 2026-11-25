import type { Metadata } from "next"

import { FaqList, type Faq } from "@/components/landing/faq"
import { RevealText } from "@/components/motion/reveal"
import { PlanTickets } from "@/components/pricing/plan-tickets"
import { ContactEmail } from "@/components/site/social-links"
import { EdgeLabel } from "@/components/ui/card"
import { pageMeta } from "@/lib/site"

export const metadata: Metadata = {
  ...pageMeta("/pricing"),
  title: "Pricing",
  description: "One price for culling, client galleries and delivery. Start with a free trial.",
}

const compare: { group: string; rows: [string, string, string, string][] }[] = [
  {
    group: "Upload and storage",
    rows: [
      ["Storage", "500 GB", "2 TB", "From 10 TB"],
      ["Resumable browser upload", "Yes", "Yes", "Yes"],
      ["Desktop uploader and RAW", "After launch", "After launch", "After launch"],
    ],
  },
  {
    group: "AI culling",
    rows: [
      ["Blur and closed-eye checks", "Coming soon", "Coming soon", "Coming soon"],
      ["Burst and duplicate grouping", "Coming soon", "Coming soon", "Coming soon"],
      ["Cull to N with reasons", "Coming soon", "Coming soon", "Coming soon"],
    ],
  },
  {
    group: "Client galleries",
    rows: [
      ["Your logo and colours", "Yes", "Yes", "Yes"],
      ["Password, expiry, share link", "Yes", "Yes", "Yes"],
      ["ZIP downloads by email", "Coming soon", "Coming soon", "Coming soon"],
      ["Gallery themes", "One", "Coming soon", "Coming soon"],
    ],
  },
]

const faqs: Faq[] = [
  { q: "What happens when the trial ends?", a: "Pick a plan to keep delivering. Your galleries stay online while you decide." },
  { q: "Can I change plans later?", a: "Yes. Upgrades apply straight away; downgrades apply at the end of the billing period." },
  { q: "Do you charge per photo?", a: "No. Culling and galleries are unlimited on every plan. Plans differ by storage and support." },
  { q: "Can I pay in rupees?", a: "Billing is in USD during the beta. Local payment with UPI is planned after launch." },
]

export default function PricingPage() {
  return (
    <>
      <section className="grain relative overflow-hidden pt-32 pb-20 md:pt-40">
        <div className="gutter mx-auto max-w-[var(--container-content)]">
          <EdgeLabel tone="safelight">Pricing</EdgeLabel>
          <RevealText as="h1" immediate text="One price for the whole wedding." className="mt-4 max-w-3xl type-display-l text-balance md:type-display-xl" />
          <p className="mt-6 max-w-xl type-body-l text-ink-muted">
            Culling, galleries and delivery in one plan. No per-photo fees and no second upload.
          </p>
          <div className="mt-12">
            <PlanTickets />
          </div>
        </div>
      </section>

      <section aria-labelledby="compare-title" className="border-t border-line py-20 md:py-28">
        <div className="gutter mx-auto max-w-[var(--container-content)]">
          <h2 id="compare-title" className="type-heading-1">Compare plans</h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line-strong">
                  <th scope="col" className="w-2/5 py-3 type-label font-medium text-ink-muted">Feature</th>
                  {["Solo", "Studio", "Collective"].map((p) => (
                    <th key={p} scope="col" className={p === "Studio" ? "py-3 type-label font-medium text-safelight-text" : "py-3 type-label font-medium text-ink-muted"}>
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              {compare.map((g) => (
                <tbody key={g.group}>
                  <tr>
                    <th colSpan={4} scope="colgroup" className="pt-8 pb-2 type-heading-2">{g.group}</th>
                  </tr>
                  {g.rows.map(([f, ...vals]) => (
                    <tr key={f} className="border-b border-line">
                      <th scope="row" className="py-3.5 pr-4 font-normal text-ink">{f}</th>
                      {vals.map((v, i) => (
                        <td key={i} className={v === "After launch" || v === "Coming soon" ? "py-3.5 type-caption font-normal text-ink-muted" : "py-3.5 type-caption text-ink"}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="pricing-faq" className="border-t border-line py-20 md:py-28">
        <div className="gutter mx-auto grid max-w-[var(--container-content)] gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="pricing-faq" className="type-heading-1">Billing questions</h2>
            <p className="mt-4 max-w-xs text-ink-muted">
              Something not covered? Write to <ContactEmail className="font-semibold text-ink" />.
            </p>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={faqs} />
          </div>
        </div>
      </section>
    </>
  )
}
