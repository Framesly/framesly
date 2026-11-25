# 7. Branded emails

**Who receives them:** couples and guests (from the studio, not from Framesly) and photographers (from Framesly). **Sent with:** Resend. **Rule:** a client email carries the studio's logo and colour; "Delivered with Framesly" is a small line at the bottom, never the header.

## Templates

| Email | To | Trigger | Purpose |
|---|---|---|---|
| Gallery ready | Couple | Publish | Link, password hint (never the password in the same email), expiry date |
| Expiry reminder | Couple | 14, 7 and 1 day before expiry | "Download your photos before 12 Mar", one button |
| ZIP ready | Anyone who requested it | ZIP built | Download link, how long it works |
| Picks received | Photographer | Couple sends picks | Count, link to the picks page |
| Nudge | Couple | Photographer taps Remind | Friendly prompt to look and heart |
| Upsell (print sale) | Couple | Sale or reminder campaign | Photo mosaic, discount code, deadline |
| Order updates | Buyer | Order status changes | Received, shipped, delivered |
| Account | Photographer | Sign-up, reset, trial ending | Framesly-branded, plain |

## Layout (all client emails)

600px single column, system-font stack (web fonts are unreliable in email) with the heading in the studio's colour; a **logo or studio name** at the top; one big photo (the cover, 1200px, with alt text), a 2 to 3 sentence message, **one** primary button (min 48px tall, bulletproof, studio colour with readable text from `readableOn`), the plain-text link under it, a footer with the studio's contact details and the small "Delivered with Framesly" line, and an unsubscribe line on campaigns.

## Rules

- Dark mode: transparent PNG logo variant and no pure-white backgrounds that glare; test in Apple Mail dark.
- Subject lines state the job ("Your photos from Aarohi & Kabir's wedding are ready"), under 50 characters, no emoji.
- Plain-text version for every email.
- Never put a password, a PIN or a signed link older than its expiry in an email body without the matching text ("This link works until …").
- Accessibility: real text, 16px minimum, 4.5:1 contrast, descriptive alt text, buttons are links with clear labels.

## Photographer controls

Settings → Emails: preview each template with the studio's real logo and colour, edit the message paragraph (not the layout), choose reminder timing, send a test to yourself.

## Build

React Email components in `apps/web/src/emails/`, sharing the studio-colour logic in `lib/color.ts`. A preview route (dev only) renders every template with sample data.
