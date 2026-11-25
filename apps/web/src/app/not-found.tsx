import { ButtonLink } from "@/components/ui/button"
import { ContactEmail } from "@/components/site/social-links"
import { EdgeLabel } from "@/components/ui/card"
import { Viewfinder } from "@/components/ui/viewfinder"

export default function NotFound() {
  return (
    <main className="grain flex min-h-dvh items-center justify-center px-4">
      <div className="relative w-full max-w-lg p-10 text-center sm:p-14">
        <Viewfinder size={24} />
        <EdgeLabel>Frame 0404 · Not found</EdgeLabel>
        <h1 className="mt-4 type-display-l">Out of frame.</h1>
        <p className="mx-auto mt-4 max-w-sm text-ink-muted">
          This page was culled, moved or never shot. If a gallery link brought you here, ask your photographer for a new one.
        </p>
        <ButtonLink href="/" variant="secondary" className="mt-8">
          Back to Framesly
        </ButtonLink>
        <p className="mt-6 type-caption font-normal text-ink-muted">
          Still stuck? <ContactEmail className="font-semibold text-ink" />
        </p>
      </div>
    </main>
  )
}
