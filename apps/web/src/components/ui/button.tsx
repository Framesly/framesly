"use client"

import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"
import { useRef, type ComponentProps, type MouseEvent } from "react"

import {
  clickOrigin,
  shouldTransition,
  TransitionLink,
  usePageTransition,
} from "@/components/transition/page-transition"
import { cn } from "@/lib/utils"

/*
 * Darkroom buttons.
 *
 * - `primary` is the safelight button. Use one per screen.
 * - Every press plays a "shutter blink": a dark band closes and reopens over
 *   the button from its centre line, like camera shutter blades.
 * - Heights are 44px or more to meet the touch-target rule; `sm` (40px) is
 *   for dense desktop toolbars only.
 * - Labels are sentence case. No emoji.
 */
export const buttonVariants = cva(
  [
    "group/button relative isolate inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden",
    "rounded-[var(--radius-control)] font-sans font-semibold whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,scale] duration-200 ease-[var(--ease-develop)]",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
    // shutter band
    "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:origin-center before:scale-y-0",
    "data-[shutter=on]:before:animate-[shutter_320ms_var(--ease-shutter)]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-safelight text-on-safelight before:bg-[rgb(0_0_0/0.22)]",
          "hover:bg-[color-mix(in_oklab,var(--safelight)_88%,black)]",
        ],
        ink: [
          "bg-ink text-surface before:bg-[rgb(255_255_255/0.18)]",
          "hover:bg-[color-mix(in_oklab,var(--ink)_86%,var(--safelight))]",
        ],
        secondary: [
          "border border-line-strong bg-transparent text-ink before:bg-safelight-soft",
          "hover:border-ink hover:bg-surface-raised",
        ],
        quiet: [
          "text-ink before:bg-surface-raised",
          "hover:bg-surface-raised",
        ],
        danger: [
          "border border-danger bg-transparent text-danger before:bg-danger/15",
          "hover:bg-danger/10",
        ],
      },
      size: {
        sm: "h-10 px-4 text-[13px]",
        md: "h-11 px-5 text-[15px]",
        lg: "h-[52px] px-6 text-[16px]",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
)

type Variants = VariantProps<typeof buttonVariants>

function useShutter<E extends HTMLElement>() {
  const ref = useRef<E>(null)
  const blink = () => {
    const el = ref.current
    if (!el) return
    el.dataset.shutter = "off"
    // force a reflow so the animation restarts on rapid clicks
    void el.offsetWidth
    el.dataset.shutter = "on"
  }
  return { ref, blink }
}

/** Trailing arrow that nudges forward on hover. */
export function ButtonArrow() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="size-[18px] shrink-0 transition-[translate] duration-300 ease-[var(--ease-develop)] group-hover/button:translate-x-0.5 group-hover/link:translate-x-0.5"
    >
      <path d="M4 10h11m0 0-4.5-4.5M15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Button({
  className,
  variant,
  size,
  onClick,
  type = "button",
  ...props
}: ComponentProps<"button"> & Variants) {
  const { ref, blink } = useShutter<HTMLButtonElement>()
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        blink()
        onClick?.(e)
      }}
      {...props}
    />
  )
}

/**
 * Link styled as a button. Internal links go through the page transition
 * (shutter from the click point); same-page anchors scroll smoothly.
 */
export function ButtonLink({
  className,
  variant,
  size,
  onClick,
  href,
  transitionLabel,
  ...props
}: ComponentProps<typeof Link> & Variants & { transitionLabel?: string }) {
  const { ref, blink } = useShutter<HTMLAnchorElement>()
  const navigate = usePageTransition()
  const path = typeof href === "string" ? href : (href.pathname ?? "/")
  return (
    <Link
      ref={ref}
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={(e) => {
        blink()
        onClick?.(e)
        if (!navigate || !shouldTransition(e, path)) return
        e.preventDefault()
        navigate(path, clickOrigin(e), transitionLabel)
      }}
      {...props}
    />
  )
}

/** Inline text link with an underline that draws in from the left. */
export function TextLink({ className, children, ...props }: ComponentProps<typeof TransitionLink>) {
  return (
    <TransitionLink
      className={cn(
        "group/link relative inline-flex items-center gap-1.5 font-semibold whitespace-nowrap text-safelight-text",
        className
      )}
      {...props}
    >
      <span className="relative">
        {children}
        <span
          aria-hidden
          className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-current transition-[scale] duration-300 ease-[var(--ease-develop)] group-hover/link:scale-x-100"
        />
      </span>
      <ButtonArrow />
    </TransitionLink>
  )
}
