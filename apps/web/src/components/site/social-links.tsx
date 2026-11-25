import { contact, type SocialId } from "@/lib/site"
import { cn } from "@/lib/utils"

/** Brand glyphs are inline because lucide-react no longer ships them. */
const glyphs: Record<SocialId, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </>
  ),
  linkedin: (
    <path
      fill="currentColor"
      d="M4.5 9h3v10.5h-3V9Zm1.5-4.7a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5ZM10 9h2.9v1.4h.04c.4-.76 1.4-1.6 2.9-1.6 3.1 0 3.66 2.04 3.66 4.7v6h-3v-5.3c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8v5.4H10V9Z"
    />
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m10.2 9.2 4.6 2.8-4.6 2.8V9.2Z" fill="currentColor" />
    </>
  ),
  x: <path fill="currentColor" d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />,
}

/** Row of the company's social profiles. Each target is 44px for touch. */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-1", className)}>
      {contact.social.map((s) => (
        <li key={s.id}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${s.label} (opens in a new tab)`}
            className="inline-flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-safelight-text"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              {glyphs[s.id]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  )
}

/** The support address as a mailto link. The text stays visible because mailto can fail without a mail app. */
export function ContactEmail({ className }: { className?: string }) {
  return (
    <a href={`mailto:${contact.email}`} className={cn("underline underline-offset-4 hover:text-safelight-text", className)}>
      {contact.email}
    </a>
  )
}
