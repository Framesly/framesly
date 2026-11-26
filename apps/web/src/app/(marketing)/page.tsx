import type { Metadata } from "next"

import { CullCompare } from "@/components/landing/cull-compare"
import { EventMarquee } from "@/components/landing/event-marquee"
import { FaqList, landingFaqs } from "@/components/landing/faq"
import { FinalCta } from "@/components/landing/final-cta"
import { GalleryTrack } from "@/components/landing/gallery-track"
import { HeroScatter } from "@/components/landing/hero-scatter"
import { OneUpload } from "@/components/landing/one-upload"
import { PhotoRibbon } from "@/components/landing/photo-ribbon"
import { Proof } from "@/components/landing/proof"
import { ScrollFilm } from "@/components/landing/scroll-film"
import { StudioBackdrop } from "@/components/landing/studio-backdrop"
import { StepStack } from "@/components/landing/step-stack"
import { VideoTeaser } from "@/components/landing/video-teaser"
import { RevealText } from "@/components/motion/reveal"
import { ContactEmail } from "@/components/site/social-links"
import { PlanTickets } from "@/components/pricing/plan-tickets"
import { TextLink } from "@/components/ui/button"
import { EdgeLabel } from "@/components/ui/card"
import { pageMeta } from "@/lib/site"

export const metadata: Metadata = {
  ...pageMeta("/"),
  title: { absolute: "Framesly: cull a wedding before dinner" },
}

export default function LandingPage() {
  return (
    <>
      <StudioBackdrop />
      <ScrollFilm />
      <HeroScatter />
      <PhotoRibbon />
      <EventMarquee />
      <Proof />
      <CullCompare />
      <OneUpload />
      <StepStack />
      <GalleryTrack />
      <VideoTeaser />

      <section id="pricing" aria-labelledby="pricing-title" className="border-t border-line py-24 md:py-32">
        <div className="gutter mx-auto max-w-[var(--container-content)]">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <EdgeLabel tone="safelight">Pricing</EdgeLabel>
              <RevealText as="h2" text="One price for the whole wedding." className="mt-4 type-heading-1 md:type-display-l" />
            </div>
            <TextLink href="/pricing">Compare plans</TextLink>
          </div>
          <div className="mt-12">
            <PlanTickets />
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="border-t border-line py-24 md:py-32">
        <div className="gutter mx-auto grid max-w-[var(--container-content)] gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <EdgeLabel tone="safelight">Questions</EdgeLabel>
              <h2 id="faq-title" className="mt-4 type-heading-1">Before you upload</h2>
              <p className="mt-4 max-w-xs text-ink-muted">
                Anything else, write to <ContactEmail className="font-semibold text-ink" /> and a person replies.
              </p>
            </div>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={landingFaqs} />
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  )
}
