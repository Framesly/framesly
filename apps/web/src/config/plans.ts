/**
 * Plans for /pricing and the landing page. Prices live in config so the
 * pages stay static.
 *
 * Draft prices, to be confirmed before launch. Stripe price IDs live in the
 * backend, keyed by plan `id`.
 */
export type Currency = "USD" | "INR"
export type Period = "monthly" | "yearly"

export type Plan = {
  id: "solo" | "studio" | "collective"
  name: string
  forWho: string
  monthly: Record<Currency, number> | null
  recommended?: boolean
  specs: [string, string][]
  cta: string
}

/** Yearly billing discount. DRAFT. */
export const YEARLY_DISCOUNT = 0.2
export const TRIAL_DAYS = 14

export const plans: Plan[] = [
  {
    id: "solo",
    name: "Solo",
    forWho: "One photographer, a few weddings a month.",
    monthly: { USD: 25, INR: 1500 },
    specs: [
      ["Storage", "500 GB"],
      ["Client galleries", "Unlimited"],
      ["AI culling", "Unlimited, coming soon"],
      ["Branding", "Logo and colours"],
      ["Support", "Email"],
    ],
    cta: "Start free",
  },
  {
    id: "studio",
    name: "Studio",
    forWho: "Second shooters and multi-day weddings.",
    monthly: { USD: 35, INR: 2400 },
    recommended: true,
    specs: [
      ["Storage", "2 TB"],
      ["Client galleries", "Unlimited"],
      ["AI culling", "Unlimited, coming soon"],
      ["Branding", "Logo and colours; themes coming soon"],
      ["Support", "Priority"],
    ],
    cta: "Start free",
  },
  {
    id: "collective",
    name: "Collective",
    forWho: "Agencies and teams of five or more.",
    monthly: null,
    specs: [
      ["Storage", "Pooled, from 10 TB"],
      ["Client galleries", "Unlimited"],
      ["AI culling", "Unlimited, coming soon"],
      ["Brands", "Several"],
      ["Support", "Named contact"],
    ],
    cta: "Talk to us",
  },
]

export function priceFor(plan: Plan, currency: Currency, period: Period) {
  if (!plan.monthly) return null
  const base = plan.monthly[currency]
  return period === "yearly" ? Math.round(base * (1 - YEARLY_DISCOUNT)) : base
}

export function formatMoney(amount: number, currency: Currency) {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
