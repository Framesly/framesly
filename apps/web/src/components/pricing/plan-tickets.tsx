"use client"

import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

import { Reveal } from "@/components/motion/reveal"
import { ButtonArrow, ButtonLink } from "@/components/ui/button"
import { Viewfinder } from "@/components/ui/viewfinder"
import {
  formatMoney,
  plans,
  priceFor,
  TRIAL_DAYS,
  YEARLY_DISCOUNT,
  type Currency,
  type Period,
} from "@/config/plans"
import { cn } from "@/lib/utils"

const develop = [0.22, 1, 0.36, 1] as const

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  id,
}: {
  label: string
  value: T
  options: { value: T; label: string; hint?: string }[]
  onChange: (v: T) => void
  id: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[var(--radius-control)] border border-line bg-surface-sunken p-1">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex h-10 items-center gap-2 rounded-[7px] px-4 type-caption transition-colors",
              on ? "text-ink" : "text-ink-muted hover:text-ink"
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[7px] border border-line-strong bg-surface-raised"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
            {o.hint && <span className="relative type-label text-safelight-text">{o.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Pricing as lab order tickets: a header stub, a perforated tear line, and a
 * spec sheet with dotted leaders. The recommended plan gets the safelight
 * border. Buttons are secondary except on the recommended ticket, so
 * the section keeps one safelight button.
 */
export function PlanTickets({ defaultCurrency = "USD" }: { defaultCurrency?: Currency }) {
  const [period, setPeriod] = useState<Period>("monthly")
  const [currency, setCurrency] = useState<Currency>(defaultCurrency)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          id="period"
          label="Billing period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly", hint: `−${YEARLY_DISCOUNT * 100}%` },
          ]}
        />
        <Segmented
          id="currency"
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={[
            { value: "USD", label: "USD" },
            { value: "INR", label: "INR" },
          ]}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {plans.map((plan, i) => {
          const price = priceFor(plan, currency, period)
          const rec = plan.recommended
          return (
            <Reveal key={plan.id} delay={i * 0.08} className="h-full">
              <article
                className={cn(
                  "group relative flex h-full flex-col rounded-[var(--radius-control)] bg-surface-raised",
                  rec ? "border-2 border-safelight" : "border border-line hover:border-line-strong"
                )}
              >
                {!rec && <Viewfinder state="hover" inset={-7} size={12} />}

                {/* Stub */}
                <div className="flex items-start justify-between gap-3 px-6 pt-6">
                  <div>
                    <p className="type-label text-ink-muted">Plan {String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-2 type-heading-1">{plan.name}</h3>
                  </div>
                  {rec && (
                    <span className="rounded-full bg-safelight-soft px-3 py-1 type-label text-safelight-text">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-2 px-6 text-ink-muted">{plan.forWho}</p>

                <div className="mt-6 flex items-end gap-2 px-6">
                  <div className="relative h-[52px] overflow-hidden">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.p
                        key={`${currency}-${period}`}
                        className="font-heading text-[48px] leading-[52px] font-bold tracking-[-0.03em] tabular-nums"
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        transition={{ duration: 0.4, ease: develop }}
                      >
                        {price != null ? formatMoney(price, currency) : "Custom"}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  {price != null && (
                    <p className="pb-2 type-caption text-ink-muted">
                      / month{period === "yearly" ? ", billed yearly" : ""}
                    </p>
                  )}
                </div>

                {/* Perforation with notches */}
                <div className="relative my-6" aria-hidden>
                  <div className="mx-5 border-t-2 border-dashed border-line" />
                  <span className={cn("absolute top-1/2 -left-px size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface [clip-path:inset(0_0_0_50%)]", rec ? "border-2 border-safelight -left-0.5" : "border border-line")} />
                  <span className={cn("absolute top-1/2 -right-px size-5 translate-x-1/2 -translate-y-1/2 rounded-full bg-surface [clip-path:inset(0_50%_0_0)]", rec ? "border-2 border-safelight -right-0.5" : "border border-line")} />
                </div>

                {/* Spec sheet */}
                <dl className="flex-1 space-y-3 px-6">
                  {plan.specs.map(([k, v]) => (
                    <div key={k} className="flex items-baseline gap-2">
                      <dt className="type-caption font-normal text-ink-muted">{k}</dt>
                      <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-line-strong/60" />
                      <dd className="type-caption text-right text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="p-6 pt-8">
                  <ButtonLink
                    href={plan.monthly ? `/signup?plan=${plan.id}` : "mailto:hello@framesly.app"}
                    variant={rec ? "primary" : "secondary"}
                    className="w-full"
                    data-cta={`pricing-${plan.id}`}
                  >
                    {plan.cta}
                    {rec && <ButtonArrow />}
                  </ButtonLink>
                  {plan.monthly ? (
                    <p className="mt-3 text-center type-label text-ink-muted">{TRIAL_DAYS}-day free trial</p>
                  ) : (
                    // mailto can fail silently with no mail app set up, so the address is also shown as text.
                    <p className="mt-3 text-center type-caption font-normal text-ink-muted">
                      or write to{" "}
                      <a href="mailto:hello@framesly.app" className="font-semibold text-ink underline underline-offset-4 select-all">
                        hello@framesly.app
                      </a>
                    </p>
                  )}
                </div>
              </article>
            </Reveal>
          )
        })}
      </div>
      <p className="mt-6 type-caption font-normal text-ink-muted">
        Billing is in USD during the beta. INR prices show what local billing will cost once UPI arrives.
      </p>
    </div>
  )
}
