/*
 * The Framesly mark (a frame corner pair around a lit safelight dot) drawn
 * for ImageResponse, used for the home-screen and app icons. Colours are fixed
 * here because these images are rendered outside the CSS tokens.
 */
export function brandIcon(size: number, { maskable = false }: { maskable?: boolean } = {}) {
  const ground = "#121315"
  const light = "#ECECEE"
  const safelight = "#F2A93B"
  // Maskable icons keep the mark inside the central 80% so any crop shape still shows it.
  const mark = Math.round(size * (maskable ? 0.5 : 0.62))
  const stroke = Math.max(2, Math.round(mark * 0.085))
  const dot = Math.round(mark * 0.29)
  const corner = Math.round(mark * 0.3)
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: ground }}>
      <div style={{ position: "relative", width: mark, height: mark, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: corner, height: corner, borderTop: `${stroke}px solid ${light}`, borderLeft: `${stroke}px solid ${light}` }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: corner, height: corner, borderBottom: `${stroke}px solid ${light}`, borderRight: `${stroke}px solid ${light}` }} />
        <div style={{ width: dot, height: dot, borderRadius: dot, background: safelight }} />
      </div>
    </div>
  )
}
