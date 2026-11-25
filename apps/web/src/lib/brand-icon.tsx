import { BRAND_MARK_COLOR, BRAND_MARK_PATH, BRAND_MARK_VIEWBOX } from "@/lib/brand-mark"

/*
 * The Framesly aperture on the Darkroom ground, drawn for ImageResponse and
 * used for the home-screen and app icons. Colours are fixed here because these
 * images are rendered outside the CSS tokens.
 */
export function brandIcon(size: number, { maskable = false }: { maskable?: boolean } = {}) {
  const ground = "#121315"
  // The mark is round, so in a maskable icon it only has to stay inside the
  // safe-zone circle (80% of the icon's width) for any crop shape to show it whole.
  const mark = Math.round(size * (maskable ? 0.78 : 0.84))
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: ground }}>
      <svg width={mark} height={mark} viewBox={BRAND_MARK_VIEWBOX}>
        <path d={BRAND_MARK_PATH} fill={BRAND_MARK_COLOR} />
      </svg>
    </div>
  )
}
