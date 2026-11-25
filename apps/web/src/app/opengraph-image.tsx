import { ImageResponse } from "next/og"

/*
 * Designed share image (1200×630) for link previews in WhatsApp, iMessage,
 * Slack, X and LinkedIn. Pure typography and shapes, so it needs no network
 * fetches at build time. Pages without their own image inherit this one.
 */
export const alt = "Framesly: cull a wedding before dinner. 2,184 frames in, 612 picks out, 41 minutes."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Darkroom values (see app/globals.css). Fixed here: ImageResponse is rendered outside the CSS tokens.
const ground = "#121315"
const raised = "#1A1B1E"
const line = "#2B2D31"
const ink = "#ECECEE"
const muted = "#9EA1A8"
const marigold = "#F2A93B"
const marigoldSoft = "#2B2113"
const marigoldText = "#F4C27A"

function Bracket({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  const s = 26
  const style: Record<string, string | number> = { position: "absolute", width: s, height: s, borderColor: marigold, borderStyle: "solid", borderWidth: 0 }
  if (corner[0] === "t") Object.assign(style, { top: -10, borderTopWidth: 4 })
  else Object.assign(style, { bottom: -10, borderBottomWidth: 4 })
  if (corner[1] === "l") Object.assign(style, { left: -10, borderLeftWidth: 4 })
  else Object.assign(style, { right: -10, borderRightWidth: 4 })
  return <div style={style} />
}

export default function OpengraphImage() {
  const tiles = [
    { bg: "#c98f6b", pick: true, tilt: -6 },
    { bg: "#8a5a49", pick: false, tilt: 4 },
    { bg: "#b9806a", pick: true, tilt: -2 },
    { bg: "#6f4b3e", pick: false, tilt: 7 },
    { bg: "#d4a27c", pick: true, tilt: -4 },
  ]
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: ground, color: ink, padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: marigold }} />
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>Framesly</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3 }}>Cull a wedding before dinner.</div>
            <div style={{ fontSize: 28, color: muted, marginTop: 22, lineHeight: 1.35 }}>
              Upload once. AI picks the keepers, you deliver a gallery in your brand.
            </div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {[
              ["2,184", "frames in"],
              ["612", "picks out"],
              ["41 min", "start to finish"],
            ].map(([v, l]) => (
              <div key={l} style={{ display: "flex", flexDirection: "column", padding: "12px 18px", borderRadius: 10, border: `2px solid ${line}`, background: raised }}>
                <div style={{ fontSize: 30, fontWeight: 800 }}>{v}</div>
                <div style={{ fontSize: 16, color: muted, textTransform: "uppercase", letterSpacing: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center", gap: 26, flex: 1, paddingLeft: 30 }}>
          {tiles.map((t, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                display: "flex",
                width: 120,
                height: 150,
                padding: 7,
                background: ink,
                boxShadow: "0 18px 30px -16px rgba(0,0,0,0.7)",
                transform: `rotate(${t.tilt}deg)`,
                opacity: t.pick ? 1 : 0.45,
              }}
            >
              <div style={{ flex: 1, display: "flex", background: t.pick ? t.bg : "#4A4A4A" }} />
              {t.pick && <Bracket corner="tl" />}
              {t.pick && <Bracket corner="tr" />}
              {t.pick && <Bracket corner="bl" />}
              {t.pick && <Bracket corner="br" />}
            </div>
          ))}
          <div style={{ display: "flex", marginTop: 10, padding: "8px 16px", borderRadius: 999, background: marigoldSoft, color: marigoldText, fontSize: 18, letterSpacing: 2, textTransform: "uppercase" }}>
            One upload · every step
          </div>
        </div>
      </div>
    ),
    size
  )
}
