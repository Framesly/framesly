# 8. Regional pricing, locale and RTL

**Markets:** US, UK and Europe, Middle East, India, Australia, South-East Asia. **Promise:** local currency and data regions from day one.

## Pricing display

- `config/plans.ts` already holds USD and INR. Extend to GBP, EUR, AED, AUD, SGD, with prices **set per market** (not converted), stored in config and mirrored in Stripe and Razorpay.
- A **currency Select** in the pricing page header and footer, defaulting from the visitor's country (CDN header) and remembered. The page never shows two currencies at once; it states "Billed in USD" or "Billed in INR with UPI" under the price.
- Taxes: show prices as the visitor will pay where the law requires (VAT/GST inclusive in the EU, UK, India, Australia); label it "incl. VAT". Show the monthly-versus-yearly saving as an amount, not only a percentage.
- Payment methods shown by market: cards everywhere, UPI and net banking for India, local methods later.

## Locale

- Dates, numbers and currency through `Intl` with the visitor's locale (the code already uses `Intl.DateTimeFormat("en", …)`; pass the locale instead of hard-coding `"en"`).
- Languages for v1: English, then Arabic and Hindi after launch. All UI text moves to message files (`next-intl`) before translation starts; no string concatenation for sentences.
- **Data region** is chosen at studio creation (already a `region` field) and shown in Settings with an honest note about what it covers.

## RTL (Arabic first)

- `dir="rtl"` on `<html>` by locale. Use **logical** Tailwind utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) in new code; migrate the physical ones (`ml-*`, `left-*`, `text-left`) in a sweep, found with a grep check added to `pnpm lint:design`.
- Icons that imply direction (arrows, chevrons, the lightbox Previous/Next, the progress direction) flip; icons that do not (play, heart, download) stay.
- Latin photographer names inside Arabic text use `<bdi>` so punctuation does not jump.
- The gallery cover title, masonry order and lightbox swipe direction follow reading direction.
- Fonts: add an Arabic-capable family (for example IBM Plex Sans Arabic) to the three-font system, mapped to the same roles.

## States and edge cases

Unsupported currency for a country → fall back to USD with a note; the user's saved choice always wins; long German and Arabic strings must not break buttons (buttons grow, they never truncate a label).

## Open questions

Which payment provider covers the Middle East? Is Hindi needed for the photographer app or only for client galleries?
