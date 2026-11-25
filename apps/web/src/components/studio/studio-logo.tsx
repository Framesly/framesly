import { cn } from "@/lib/utils"

type StudioLogoProps = {
  name: string
  logoUrl: string | null | undefined
  /** Alt text for the logo image. Defaults to the studio name; pass "" when the name is shown elsewhere. */
  alt?: string
  /** Size limits for the logo image, e.g. "max-h-10 max-w-[160px]". */
  imageClassName?: string
  /** Typography for the name wordmark shown when there is no logo. */
  textClassName?: string
}

/**
 * A photographer's logo, or their studio name as a wordmark when they haven't
 * uploaded one. Galleries always carry the photographer's brand, never Framesly's.
 */
export function StudioLogo({ name, logoUrl, alt = name, imageClassName, textClassName }: StudioLogoProps) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logos come from Storage or a local preview URL and may be SVG
      <img src={logoUrl} alt={alt} className={cn("object-contain", imageClassName)} />
    )
  }
  return <p className={cn("font-heading font-bold uppercase", textClassName)}>{name}</p>
}
