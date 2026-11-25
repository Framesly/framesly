/*
 * Colour helpers for studio brand colours, which are chosen by photographers
 * and so can be any colour. Everything here follows WCAG 2.2 contrast maths.
 */

const DARK_INK = "#16191f"
const WHITE = "#ffffff"

type Rgb = [number, number, number]

function parse(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex([r, g, b]: Rgb) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`
}

function luminance([r, g, b]: Rgb) {
  const f = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** WCAG contrast ratio between two hex colours (1 to 21). Returns 1 for invalid input. */
export function contrastRatio(a: string, b: string) {
  const ra = parse(a)
  const rb = parse(b)
  if (!ra || !rb) return 1
  const [hi, lo] = [luminance(ra), luminance(rb)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Dark ink or white, whichever reads better on `hex`. Always at least 4.5:1 for any colour. */
export function readableOn(hex: string) {
  return contrastRatio(DARK_INK, hex) >= contrastRatio(WHITE, hex) ? DARK_INK : WHITE
}

/**
 * Nudge `hex` lighter or darker (keeping its hue) until it has at least `min`
 * contrast against `surface`. Returns it unchanged when it already does.
 * Use 3 for graphics (hearts, underlines) and 4.5 for text.
 */
export function ensureContrast(hex: string, surface: string, min = 3) {
  const rgb = parse(hex)
  const bg = parse(surface)
  if (!rgb || !bg) return hex
  if (contrastRatio(hex, surface) >= min) return hex
  // Move away from the surface: lighter on dark surfaces, darker on light ones.
  const target: Rgb = luminance(bg) < 0.4 ? [255, 255, 255] : [0, 0, 0]
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const mixed = toHex(rgb.map((v, i) => v + (target[i] - v) * t) as Rgb)
    if (contrastRatio(mixed, surface) >= min) return mixed
  }
  return toHex(target)
}

/**
 * CSS custom properties that re-point the safelight accent at a studio's brand
 * colour, safe to read on `surface`. Spread into a style prop on the element
 * that carries the theme class.
 */
export function brandAccentStyle(
  brand: string | null | undefined,
  surface: string,
  darkSurface?: string
): Record<string, string> | undefined {
  if (!brand || !parse(brand)) return undefined
  const on = (s: string) => {
    const graphic = ensureContrast(brand, s, 3)
    return {
      "--safelight": graphic,
      "--safelight-text": ensureContrast(brand, s, 4.5),
      "--safelight-soft": `color-mix(in oklab, ${graphic} 18%, ${s})`,
      "--on-safelight": readableOn(graphic),
    }
  }
  const light = on(surface)
  if (!darkSurface) return light
  // Surfaces that follow dark mode: give both values and let CSS pick by the
  // element's colour scheme (set by the theme class), so there is no flash.
  const dark = on(darkSurface)
  return Object.fromEntries(
    (Object.keys(light) as (keyof typeof light)[]).map((k) => [k, `light-dark(${light[k]}, ${dark[k]})`])
  )
}

/**
 * Surfaces a studio accent has to read on. Keep in step with the tokens in
 * app/globals.css (`.theme-print --surface`, `.theme-darkroom --surface-sunken`).
 */
export const ACCENT_SURFACES = {
  print: "#f5f3ef",
  darkroom: "#0b0d10",
  // The lightest Darkroom surface (`--surface-raised`): if an accent reads on it, it reads on them all.
  darkroomRaised: "#1c2026",
} as const
