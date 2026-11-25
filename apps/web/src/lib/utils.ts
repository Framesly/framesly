import { createCn } from "cn/config"

/**
 * Class merging that knows our own design tokens (app/globals.css, `@theme`).
 * Without this, `text-lead` (a font size) looks like a text colour to the
 * merger and silently removes `text-on-safelight` from the same element.
 * Keep these lists in step with the `--text-*` and `--shadow-*` tokens.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["micro", "caption", "small", "body", "lead", "stat"] }],
      shadow: [{ shadow: ["float"] }],
    },
  },
})

/** Format a frame number the way it is printed on a contact sheet: 0412. */
export function frameNo(n: number) {
  return String(n).padStart(4, "0")
}
