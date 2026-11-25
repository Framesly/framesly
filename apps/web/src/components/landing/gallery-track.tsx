"use client"

import { easeIn, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { HeartButton } from "@/components/gallery/heart-button"
import { TextLink } from "@/components/ui/button"
import { EdgeLabel } from "@/components/ui/card"
import { useSitePhotos } from "@/components/site/site-photos"
import { type Photo } from "@/lib/photos"
import { cn } from "@/lib/utils"

/** A photo that drifts sideways inside its frame as the track moves. */
function ParallaxPhoto({
  photo,
  progress,
  className,
  sizes,
  position,
  strength = 8,
}: {
  photo: Photo
  progress: MotionValue<number>
  className?: string
  sizes: string
  position?: string
  strength?: number
}) {
  const x = useTransform(progress, [0, 1], [`${-strength}%`, `${strength}%`])
  return (
    <div className={cn("relative overflow-hidden bg-surface-sunken", className)}>
      <motion.div style={{ x }} className="absolute inset-y-0 -left-[10%] w-[120%] will-change-transform">
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="object-cover" style={{ objectPosition: position }} />
      </motion.div>
    </div>
  )
}

function Panel({ label, title, body, className, children }: { label: string; title: string; body: string; className?: string; children: React.ReactNode }) {
  return (
    <article
      className={cn(
        "flex h-full w-[82vw] shrink-0 flex-col overflow-hidden rounded-[var(--radius-cover)] border border-line bg-surface-raised sm:w-[420px]",
        className
      )}
    >
      <div className="relative min-h-0 flex-1">{children}</div>
      <div className="border-t border-line p-5">
        <p className="type-label text-safelight-text">{label}</p>
        <h3 className="mt-2 type-heading-2">{title}</h3>
        <p className="mt-1 type-caption font-normal text-ink-muted">{body}</p>
      </div>
    </article>
  )
}

/**
 * Client gallery section. The dark band "switches the lights on" with a circle
 * that opens from the top, then the section pins and a row of gallery
 * features slides sideways as you scroll down.
 */
export function GalleryTrack() {
  const photos = useSitePhotos()
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion() ?? false
  const [distance, setDistance] = useState(0)
  const [fav, setFav] = useState(true)

  useEffect(() => {
    const track = trackRef.current
    const vp = viewportRef.current
    if (!track || !vp) return
    const ro = new ResizeObserver(() => setDistance(Math.max(0, track.scrollWidth - vp.clientWidth)))
    ro.observe(track)
    ro.observe(vp)
    return () => ro.disconnect()
  }, [])

  // The circle starts opening once the dark band is well into view, so the
  // "lights on" moment is visible rather than happening off screen.
  const { scrollYProgress: reveal } = useScroll({ target: sectionRef, offset: ["start 0.3", "start -0.1"] })
  const radius = useTransform(reveal, [0, 1], [reduce ? 150 : 0, 150], { ease: easeIn })
  // vmax, not %: the section is several screens tall, so % would be huge.
  // Once open, drop the clip entirely; a circle anchored at the section's top
  // would otherwise cut off the lower part of a tall section.
  const clipPath = useTransform(radius, (r) => (r >= 149.5 ? "none" : `circle(${r}vmax at 50% 0%)`))

  const { scrollYProgress: pin } = useScroll({ target: sectionRef, offset: ["start start", "end end"] })
  const x = useTransform(pin, [0.04, 0.96], [0, reduce ? 0 : -distance])
  const bar = useTransform(pin, [0.04, 0.96], [0, 1])

  const share = photos.tealDoor

  return (
    <section
      ref={sectionRef}
      aria-labelledby="gallery-track-title"
      className={cn("relative bg-surface-sunken", reduce ? "" : "h-[340vh]")}
    >
      {/* Seen only while the lights are still off */}
      {!reduce && (
        <div aria-hidden className="grain absolute inset-x-0 top-0 h-dvh">
          <div className="sticky top-0 flex h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
            <span className="size-2 rounded-full bg-safelight shadow-[0_0_24px_8px_rgb(242_169_59/0.35)]" />
            <p className="type-label text-ink-muted">Your dashboard lives in the darkroom</p>
            <p className="font-heading text-[40px] leading-none font-bold tracking-[-0.03em] text-ink sm:text-[64px]">Now, lights on.</p>
          </div>
        </div>
      )}
      <motion.div style={{ clipPath }} className="relative h-full bg-surface">
        <div ref={viewportRef} className={cn("flex flex-col overflow-hidden", reduce ? "py-24" : "sticky top-0 h-dvh justify-center")}>
          <div className={cn(reduce && "overflow-x-auto")}>
            <motion.div
              ref={trackRef}
              style={{ x }}
              className="flex h-[min(600px,74dvh)] w-max items-stretch gap-5 pr-[8vw] pl-4 will-change-transform sm:pl-[max(24px,calc((100vw-var(--container-content))/2+32px))]"
            >
              {/* Intro */}
              <div className="flex w-[82vw] shrink-0 flex-col justify-center pr-4 sm:w-[440px] sm:pr-10">
                <EdgeLabel tone="safelight">Client gallery</EdgeLabel>
                <h2 id="gallery-track-title" className="mt-4 type-heading-1 text-balance sm:type-display-l">
                  Lights on for your clients.
                </h2>
                <p className="mt-5 max-w-sm type-body-l text-ink-muted">
                  Your dashboard stays in the darkroom. Couples get a calm, quiet gallery that looks
                  like your studio made it.
                </p>
                <TextLink href="/sample" className="mt-6">
                  Open the sample gallery
                </TextLink>
              </div>

              {/* Cover */}
              <article className="relative w-[82vw] shrink-0 overflow-hidden rounded-[var(--radius-cover)] sm:w-[620px]">
                <ParallaxPhoto photo={photos.gardenArch} progress={pin} sizes="620px" className="absolute inset-0" position="50% 35%" strength={10} />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--scrim)/0.78)] via-[rgb(var(--scrim)/0.1)] to-[rgb(var(--scrim)/0.35)]" />
                <p className="absolute top-5 left-5 font-heading text-caption font-bold tracking-[0.28em] text-white uppercase">Saffron Lane</p>
                <span className="absolute top-5 right-5 rounded-full bg-white/85 px-2.5 py-0.5 type-label text-fixed-dark">Sample</span>
                <div className="absolute right-5 bottom-6 left-5 text-white sm:left-7">
                  <p className="type-label text-white/75">Your logo, your names, your cover</p>
                  <p className="mt-2 font-heading text-[40px] leading-none font-bold tracking-[-0.03em] sm:text-[56px]">Aarohi & Kabir</p>
                  <p className="mt-2 type-label text-white/75">Udaipur · 12 to 14 February</p>
                </div>
              </article>

              {/* Events */}
              <Panel label="Sections" title="One section per event" body="Haldi to reception. Clients jump straight to the day they want.">
                <div className="flex gap-4 overflow-hidden border-b border-line px-5 pt-4">
                  {["Haldi", "Mehendi", "Sangeet", "Ceremony"].map((s, i) => (
                    <span key={s} className={cn("relative pb-3 type-caption whitespace-nowrap", i === 2 ? "text-ink" : "text-ink-muted")}>
                      {s}
                      {i === 2 && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />}
                    </span>
                  ))}
                </div>
                <div className="grid h-[calc(100%-45px)] grid-cols-3 grid-rows-2 gap-1 p-1">
                  {[photos.tentDance, photos.brideDance, photos.sunglassesDance, photos.lakeDance, photos.receptionStage, photos.danceFloor].map((p) => (
                    <ParallaxPhoto key={p.id} photo={p} progress={pin} sizes="140px" className="h-full" strength={6} />
                  ))}
                </div>
              </Panel>

              {/* Favourites */}
              <Panel label="Favourites" title="Heart, then download" body="Two buttons per photo. Nothing else gets between a client and the picture.">
                <ParallaxPhoto photo={photos.seaBreeze} progress={pin} sizes="420px" className="absolute inset-0" position="50% 30%" />
                <div className="absolute right-4 bottom-4 flex items-center gap-1 rounded-full bg-[rgb(var(--scrim)/0.6)] p-1 text-white">
                  <HeartButton on={fav} onToggle={() => setFav((v) => !v)} label={fav ? "Remove from favourites" : "Add to favourites"} className="hover:bg-white/15" />
                  <span className="grid size-11 place-items-center" aria-hidden>
                    <svg viewBox="0 0 24 24" className="size-5"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </div>
                <p className="absolute top-4 left-4 rounded-full bg-[rgb(var(--scrim)/0.6)] px-3 py-1 type-label text-white">Tap the heart</p>
              </Panel>

              {/* Share preview */}
              <Panel label="Sharing" title="Looks right when shared" body="Links preview with the cover and names in chat apps and email.">
                <div className="flex h-full flex-col justify-end gap-3 bg-surface-sunken p-5">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#dff3d6] px-3 py-2 text-small text-[#1c1714]">
                    Our photos are here!
                  </div>
                  <div className="ml-auto w-[88%] overflow-hidden rounded-2xl rounded-br-md border border-line bg-surface-raised">
                    <ParallaxPhoto photo={share} progress={pin} sizes="360px" className="h-36" position="50% 30%" strength={5} />
                    <div className="p-3">
                      <p className="type-caption text-ink">Aarohi & Kabir · Saffron Lane</p>
                      <p className="type-caption font-normal text-ink-muted">framesly.app</p>
                    </div>
                  </div>
                  <p className="text-right type-label text-ink-muted">Delivered · 7:42 pm</p>
                </div>
              </Panel>

              {/* Downloads */}
              <Panel label="Downloads" title="Full sets by email" body="Big downloads are packed in the background and arrive as a link.">
                <div className="flex h-full flex-col justify-center gap-4 bg-surface-sunken p-5">
                  <div className="rounded-[var(--radius-control)] border border-line bg-surface-raised p-4">
                    <p className="type-label text-ink-muted">Email · from Saffron Lane</p>
                    <p className="mt-2 type-heading-2">Your photos are ready</p>
                    <p className="mt-1 type-caption font-normal text-ink-muted">612 photos · 4.2 GB · link works for 30 days</p>
                    <div className="mt-4 flex h-11 items-center justify-center rounded-[var(--radius-control)] bg-ink type-caption text-surface">
                      Download ZIP
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <motion.div style={{ scaleX: bar }} className="h-full origin-left bg-safelight" />
                  </div>
                  <p className="type-label text-ink-muted">Packing in the background</p>
                </div>
              </Panel>
            </motion.div>
          </div>

          {/* Progress */}
          {!reduce && (
            <div className="gutter mx-auto mt-8 flex w-full max-w-[var(--container-content)] items-center gap-4">
              <span className="type-label text-ink-muted">Scroll</span>
              <div className="h-px flex-1 bg-line">
                <motion.div style={{ scaleX: bar }} className="h-full origin-left bg-ink" />
              </div>
              <span className="type-label text-ink-muted">Sample</span>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  )
}
