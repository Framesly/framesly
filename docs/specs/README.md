# Surface specs (plan section D)

Design specs for the surfaces we have not built yet. Each one is **Draft v0**: written from the audit and the roadmap, not yet tested with photographers. Build in this order; each spec lists the components and tokens it needs, so nothing new gets invented in code.

| # | Surface | Priority | Needed by |
|---|---|---|---|
| 1 | [AI cull review](01-cull-review.md) ([HTML mock](01-cull-review.html)) | Highest | Week 3 of the 30-day plan |
| 2 | [Proofing, comments and watermarks](02-proofing-and-watermarks.md) | High | After MVP |
| 3 | [Video](03-video.md) | High | Next 2 to 3 months |
| 4 | [Face and selfie search](04-face-search.md) | Medium | Next 2 to 3 months |
| 5 | [Print store](05-print-store.md) | Medium | Then |
| 6 | [Activity](06-activity.md) | Medium | After MVP |
| 7 | [Branded emails](07-emails.md) | Medium | With expiry reminders |
| 8 | [Regional pricing, locale and RTL](08-regional.md) | Medium | Before regional launch |
| 9 | [Team accounts](09-team.md) | Lower | Later |

## Rules every spec follows

1. **Theme:** the photographer's app is Darkroom; anything a client or guest sees is the Print theme (and follows dark mode). Studio brand colour only changes the accent, through `brandAccentStyle`.
2. **Tokens only:** colours, `text-micro` to `text-stat`, `--z-*`, `--duration-*`, `shadow-float`. The CI check (`pnpm lint:design`) rejects anything else.
3. **Components first:** use what is in `components/ui/` (Button, Field, Select, Checkbox, Badge, Chip, Dialog, Toast, Progress, Skeleton, Icon). If a spec needs a new primitive, it is named under "New components" and built in `ui/` first.
4. **Accessible by default:** 44px touch targets, visible focus, state in words and icons (never colour alone), full keyboard path, reduced motion respected, high-contrast and forced-colours safe.
5. **Every screen has five states:** loading, empty, normal, partial failure, full failure. Each spec describes them.
6. **Mobile is a design, not a shrink:** each spec says what the phone version does differently.
