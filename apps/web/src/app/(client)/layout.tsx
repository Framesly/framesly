import { ThemeArea } from "@/components/theme/theme"

/**
 * Client galleries follow the same light/dark setting as the rest of the site
 * (device setting, or the visitor's saved choice). Light is the Print theme,
 * dark is Darkroom.
 */
export default function ClientLayout({ children }: LayoutProps<"/">) {
  return <ThemeArea area="site">{children}</ThemeArea>
}
