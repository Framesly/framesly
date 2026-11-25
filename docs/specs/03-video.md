# 3. Video

**Who:** wedding videographers and photographers who also deliver a film. **Promise:** a teaser, a highlight and the full film live beside the photos, with comments pinned to the second.
**Delivery:** Bunny Stream (adaptive HLS), 4K, reels (vertical).

## Client side

- **Where it lives:** a "Films" section at the top of the gallery, before the photo sections, as a row of poster cards (Teaser · Highlight · Full film · Reels). Each card: poster, title, duration in `type-metric`, a play icon, and a "Download" text button when allowed.
- **Player (Print theme chrome, dark video surface):** custom controls over Bunny's player: play/pause, scrub with **chapter ticks** (Ceremony, First dance, Speeches), time, speed (0.5x to 2x), captions toggle, quality Select (Auto, 1080p, 4K), fullscreen, picture-in-picture. All controls 44px; the scrub bar has a larger hit area than its visible 4px line.
- **Comments pinned to the second:** a "Comment at 02:14" button under the player; comments appear as dots on the scrub bar and in a list that follows playback. Clicking a comment seeks to it.
- **Reels:** vertical 9:16 cards in a horizontal scroller; tap opens a full-screen vertical player.

## Photographer side

Upload (resumable, large files, shows encoding progress with the shared Progress), set title, chapters (time + name rows), thumbnail frame picker (scrub and "use this frame"), allow downloads, order. Encoding states are words: **Uploading, Processing, Ready, Failed**.

## States

Processing (poster placeholder with "Preparing your film. This can take a few minutes."); failed (Badge `danger` + retry); slow network (auto quality, a quiet "Lowered quality to keep playing"); no film yet (the section is simply absent for clients, and a prompt card in the app).

## Accessibility

Keyboard: Space/K play, arrows seek 5s, `J`/`L` 10s, `M` mute, `F` fullscreen, `C` captions, shown in a help Dialog. Captions are required to publish a film to clients' public links? (open question). Reduced motion: no autoplay, ever.

## Phone

Player fills the width, landscape rotates to fullscreen, comments in a bottom sheet.

## New components

`Player`, `Scrubber`, `Slider`, `Tabs`, `Sheet` (the Dialog's bottom-sheet form as its own variant).

## Data

`videos (id, gallery_id, kind, title, bunny_id, duration, status, allow_download, sort)`, `video_chapters`, `video_comments (second, body, …)`.
