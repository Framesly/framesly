# 1. AI cull review

**Who:** the photographer, after upload, with 2,000 to 15,000 frames from a wedding.
**Job:** decide what to keep, fast, and trust the AI because every pick has a reason. The target is "cull to N" (for example 600) in about 40 minutes.
**Promise on the site:** "Flags blur, closed eyes, bursts and duplicates. Cull to any number, with a reason for every pick."

## Layout (desktop, 1280px and up)

```
┌ Top bar: gallery title · progress "612 picks · target 600" · Cull to N [ 600 ] · filters · view toggle ┐
├────────────┬───────────────────────────────────────────────┬──────────────────────────┤
│ Groups     │  Grid of frames (windowed)                    │  Inspector               │
│ Bursts 214 │  ▢ ▢ ▢ ▢ ▢ ▢   each frame shows:             │  Large preview           │
│ Duplicates │  ▢ ▢ ▢ ▢ ▢ ▢   pick ring / dim + reason chip │  Reasons (chips + words) │
│ Eyes 38    │  ▢ ▢ ▢ ▢ ▢ ▢                                  │  EXIF · burst position   │
│ Blur 91    │                                               │  Pick · Reject · Reset   │
└────────────┴───────────────────────────────────────────────┴──────────────────────────┘
Bottom: keyboard hint bar (P pick · X reject · C compare · ? all shortcuts)
```

Three views, switched by a segmented control (`aria-pressed` buttons):
- **Grid:** overview, 6 to 10 columns, density slider.
- **Review:** one frame large with a filmstrip below; the default for fast decisions.
- **Compare:** 2-up or 4-up of a burst or duplicate group, synced zoom, "keep best" action.

## Frame states (all three use an icon and a word, never colour alone)

| State | Look | Chip |
|---|---|---|
| Pick (AI) | safelight ring, check icon | `Pick` (Chip tone `pick`) |
| Pick (you) | same ring plus a small person mark | `Your pick` |
| Reject (AI) | dimmed to 45%, no ring | `Blur`, `Eyes closed`, `Duplicate` (Chip tone `reject`) |
| Undecided | plain | none |
| Best of burst | star | `Best of 7` |

A reason is always one short phrase plus a plain-language explanation in the inspector, for example "Eyes closed: the bride's eyes are shut in this frame; frame 1024 is open."

## "Cull to N"

A number field plus a slider (new `Slider` primitive). The AI ranks every frame and sets the threshold; the count updates live ("612 picks, 12 over target"). Moving the target never erases your own decisions: **your picks and rejects always win**.

## Keyboard (the main way people work)

Arrows move. `P` pick, `X` reject, `U` back to undecided, `Z` undo (unlimited this session), `C` compare, `B` / `Shift+B` next and previous burst, `[` and `]` next and previous group, `Space` toggle 100% zoom, `?` shortcut sheet (a Dialog). The grid is a roving-tabindex grid; each decision is announced ("Frame 1024, picked").

## States

- **Processing:** frames stream in as the AI finishes; a Progress bar and "1,240 of 2,184 analysed"; decisions are allowed on analysed frames only.
- **Empty:** no photos yet → link to upload.
- **Partial failure:** some frames could not be analysed → a Badge `warning` on them and "Review these by eye", never silently dropped.
- **Full failure:** the whole run failed → ErrorState with "Try again" and the reference code; existing decisions are kept.
- **Re-run:** warn that AI labels will refresh and that your own decisions stay.

## Phone

Review view only. Swipe right to pick, left to reject, with an undo Toast (swiping is easy to do by accident). Bottom sheet for reasons. Grid is a read-only overview.

## New components

`Slider`, `SegmentedControl` (the theme switch already does this; extract it), `Kbd`, `Tooltip`, a windowed `PhotoGrid` (reuse the windowing from `upload-list.tsx`).

## Data the backend must provide (design assumption)

Per photo: `blur_score`, `eyes_closed` (bool), `burst_id`, `duplicate_of`, `ai_rank`, `ai_decision`, `ai_reasons[]`. Per decision: `photo_id`, `decision`, `source` (`ai` or `user`). Anything not in this list is out of scope for v1.

## Success measures

Median time to cull a 2,000-frame wedding; share of AI decisions the photographer overrides (a target under 15% means the AI is trusted); share of picks the client later hearts.

## Open questions

Does a photographer want "rating stars" as well as pick and reject? Should rejected frames be hidden from clients forever or recoverable? Both need a few interviews before build.
