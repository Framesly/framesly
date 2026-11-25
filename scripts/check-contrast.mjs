#!/usr/bin/env node
/*
 * Contrast guard for the Darkroom theme (run in CI as `pnpm lint:contrast`).
 *
 * Reads the Darkroom token block in apps/web/src/app/globals.css and checks it
 * with WCAG 2.2 maths:
 *   - text colours reach 4.5:1 on all four surfaces (sunken, page, raised, overlay)
 *   - control borders and the accent fill reach 3:1 on all four surfaces
 *   - text on an accent fill reaches 4.5:1 on safelight, hover and pressed
 *
 * Run from the repo root. Exits 1 when any pair fails.
 */
import { readFileSync } from "node:fs"

const CSS = "apps/web/src/app/globals.css"
const css = readFileSync(CSS, "utf8")

// The block that starts `:root,\n.theme-darkroom {` and ends at the first closing brace.
const block = /:root,\s*\.theme-darkroom\s*\{([^}]*)\}/.exec(css)
if (!block) {
  console.error(`Could not find the Darkroom block (":root, .theme-darkroom { ... }") in ${CSS}`)
  process.exit(1)
}
const tokens = {}
for (const m of block[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) tokens[m[1]] = m[2]

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  const f = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255)
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const SURFACES = ["surface-sunken", "surface", "surface-raised", "surface-overlay"]
const checks = [
  ...["ink", "ink-muted", "safelight-text", "success", "danger", "warning", "info"].map((t) => ({ fg: t, on: SURFACES, min: 4.5, kind: "text" })),
  ...["line-strong", "safelight"].map((t) => ({ fg: t, on: SURFACES, min: 3, kind: "control" })),
  { fg: "on-safelight", on: ["safelight", "safelight-hover", "safelight-pressed"], min: 4.5, kind: "text on fill" },
]

let failed = 0
const missing = new Set()
for (const { fg, on, min, kind } of checks) {
  const row = []
  for (const bg of on) {
    if (!tokens[fg] || !tokens[bg]) {
      for (const k of [fg, bg]) if (!tokens[k]) missing.add(k)
      continue
    }
    const r = ratio(tokens[fg], tokens[bg])
    const ok = r >= min
    if (!ok) failed++
    row.push(`${bg} ${r.toFixed(2)}${ok ? "" : " FAIL"}`)
  }
  console.log(`${fg.padEnd(15)} ${tokens[fg] ?? "?"}  need ${min}:1 (${kind})  ${row.join(" | ")}`)
}
if (missing.size) {
  console.error(`\nMissing tokens in the Darkroom block: ${[...missing].join(", ")}`)
  process.exit(1)
}
if (failed) {
  console.error(`\n${failed} contrast pair(s) below target.`)
  process.exit(1)
}
console.log("\nDarkroom contrast check passed.")
