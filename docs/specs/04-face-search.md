# 4. Face and selfie search

**Who:** wedding guests (client side, Print theme). **Job:** "show me every photo I am in" without scrolling 2,000 frames. **Also:** photographers can **gate** access so a guest sees only their own photos (Face Gating).
**Privacy is the design:** this is biometric data. The flow must be consent-first, plain-language and deletable.

## Guest flow

1. A button in the section bar and cover: **Find my photos** (icon + text).
2. A Dialog explains in two sentences what happens ("We compare your selfie with the faces in this gallery. Your selfie is deleted right after, and never used for anything else.") with a required **Checkbox** "I agree" and a link to the privacy page. No camera opens before consent.
3. **Capture:** front camera preview with a face-shaped guide, a big shutter button (52px), "Upload a photo instead" as a text button, and "Use camera" permission handled with clear fallback copy when blocked.
4. **Working:** Progress with words ("Looking through 2,184 photos…").
5. **Results:** the gallery filters to "Photos of you (47)" with a Chip you can clear; each result keeps heart and download. A line states the match confidence honestly ("These are the closest matches. Some may be missing.") and a "Not me" button on each photo to improve the result.
6. **Done:** "Delete my selfie data now" is always visible in the results bar.

## Photographer side

Gallery setting: **Face search** Off / On / **Gated** (guests must find themselves; they cannot browse all). Shows the privacy summary the guest will see; the photographer must tick "I have told my couple" before enabling. A usage count and "Delete all face data for this gallery" (confirm Dialog).

## States

Camera blocked; no face detected ("We couldn't see a face. Try a clear, front-facing photo."); multiple faces (choose which one); no matches; slow processing; gallery expired.

## Accessibility

Camera step has a text alternative (upload); results announce count; the face guide is decorative; every step is operable by keyboard and screen reader.

## Legal and regional

GDPR and DPDP: explicit consent, purpose limitation, deletion on request and after the gallery expires. Region setting decides whether the feature is available (open question for the Middle East).

## New components

`CameraCapture`, `Stepper`, a results `FilterChip` bar.

## Data

Face embeddings stored per photo (not images) and per session selfie (deleted at once); `face_search_events` for audit (no biometric content).
