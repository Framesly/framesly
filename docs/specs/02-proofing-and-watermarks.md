# 2. Proofing, comments and watermarks

**Who:** a couple choosing album photos (client side, Print theme) and the photographer reading their feedback (app, Darkroom).
**Builds on:** favourites and the picks page that already exist.

## Client side: proofing

- **Heart stays the main action.** Add one more: a **comment** on any photo, opened from the lightbox (a text button "Add a note", 44px).
- A **selection limit** set by the photographer ("Choose up to 40 for the album"): a counter in the section bar, `type-metric`, "23 of 40". At the limit, hearting another photo shows a Toast ("You've chosen 40. Remove one to add another.") and never fails silently.
- **Lists:** the couple can group picks into named lists ("Album", "Parents' frames") from a Select in the lightbox. Default list is "Favourites".
- **Who is commenting:** first comment asks for a name and email once (Field, saved in the browser). No account.
- **Submit:** a clear "Send my picks to {studio}" button; after sending, picks are locked and a Badge `success` "Sent on 12 Mar" shows. The photographer can unlock.

## Photographer side

The existing picks page gains: comments shown under each frame, filter by list and by "has a note", per-photo count of who picked it, and **Export**: copy filenames (exists), download CSV, Lightroom filename list.

## Watermarks (settings, per studio)

- Studio settings → Watermark: choose **text** (studio name) or **logo** (reuses the logo upload), position (9-point grid as a radiogroup), size and opacity sliders, and an "Apply to downloads / web view / both" Select.
- A **live preview** on a sample photo, in the Print theme, updating as controls move.
- Default **off**. Turning it on never changes originals; only the web copy and downloads are marked at serve time.

## States

Loading skeletons for the comment thread; empty ("No notes yet"); comment send failure keeps the text and shows a retry; limit reached; gallery expired mid-session shows the expired screen, with the draft comment kept in the browser.

## Phone

Comment input is a bottom sheet (Dialog variant) so the keyboard never covers it.

## New components

`Textarea` (same chrome as Field), `Slider`, `RadioGroup` for the position grid, `Tabs` for lists.

## Data

`comments (id, photo_id, visitor_id, client_name, body, created_at)`, `pick_lists`, `selection_limit` on galleries. Watermark config on `studios`.

## Open questions

Do couples expect to comment on a photo or on a whole section? Is the selection limit ever a hard stop, or only a guide?
