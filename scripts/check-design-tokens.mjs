#!/usr/bin/env node
/*
 * Design-token guard (run in CI as `pnpm lint:design`).
 *
 * Fails when UI code goes around the design tokens in apps/web/src/app/globals.css:
 *   1. hard-coded hex colours in .tsx files (use a colour token, or text-fixed-dark / text-fixed-light)
 *   2. arbitrary z-index numbers such as z-[70] (use z-(--z-viewer) and the other --z-* layers)
 *   3. arbitrary pixel font sizes under 24px such as text-[13px] (use text-caption, text-body, ... or a type-* class)
 *
 * Display sizes of 24px and up (hero headlines) may stay arbitrary.
 * Files below legitimately need raw values; each has a reason.
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

const SRC = "apps/web/src"

/** Files allowed to contain hex colours, and why. */
const HEX_ALLOWED = {
  "app/layout.tsx": "browser theme-color meta tag needs a literal",
  "app/opengraph-image.tsx": "share image is rendered outside the CSS tokens",
  "lib/brand-icon.tsx": "home-screen icons are rendered by ImageResponse, outside the CSS tokens",
  "components/studio/brand-controls.tsx": "the studio brand colour presets are data",
  "components/onboarding/onboarding-wizard.tsx": "default studio brand colour is data",
  "components/auth/primitives.tsx": "Google's logo colours are fixed by their brand rules",
  "components/landing/gallery-track.tsx": "WhatsApp message mock-up colours",
}

const HEX = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/
const Z = /\bz-\[\d+\]/
const PX = /\btext-\[(\d+)px\]/g

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (p.endsWith(".tsx")) files.push(p)
  }
}
walk(SRC)

const problems = []
for (const file of files) {
  // Forward slashes on every OS, so the allowlist matches on Windows too.
  const rel = relative(SRC, file).split(sep).join("/")
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      const at = `${SRC}/${rel}:${i + 1}`
      // Ignore URL fragments and comments that merely mention a hex colour.
      const code = line.replace(/\/\/.*$/, "").replace(/\{\/\*.*?\*\/\}/g, "")
      if (!(rel in HEX_ALLOWED) && HEX.test(code) && !/href=|url\(#|id="#|\bhash\b/.test(code)) problems.push(`${at}  hard-coded colour: ${code.match(HEX)[0]}`)
      if (Z.test(code)) problems.push(`${at}  arbitrary z-index: ${code.match(Z)[0]} (use z-(--z-...))`)
      for (const m of code.matchAll(PX)) if (Number(m[1]) < 24) problems.push(`${at}  arbitrary font size: ${m[0]} (use text-micro/caption/small/body/lead/stat or a type-* class)`)
    })
}

if (problems.length) {
  console.error(`Design token check failed (${problems.length}):\n` + problems.map((p) => "  " + p).join("\n"))
  process.exit(1)
}
console.log(`Design token check passed (${files.length} files).`)
