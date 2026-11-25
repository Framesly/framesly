"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

/** Re-renders the page every few seconds while it's visible, so new hearts show up. */
export function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh()
    }, seconds * 1000)
    return () => clearInterval(t)
  }, [router, seconds])
  return null
}

/** The picked file names, one per line, ready to paste into Lightroom's filter. */
export function FilenameList({ names }: { names: string[] }) {
  const [copied, setCopied] = useState(false)
  const text = names.join("\n")
  return (
    <div>
      <label htmlFor="pick-names" className="type-caption text-ink">File names</label>
      <textarea
        id="pick-names"
        readOnly
        value={text}
        rows={Math.min(10, Math.max(3, names.length))}
        className="mt-2 block w-full resize-y rounded-[var(--radius-control)] border border-line-strong bg-surface-sunken p-3 font-mono text-[13px] text-ink"
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="mt-3"
        disabled={!names.length}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          } catch {}
        }}
      >
        {copied ? "Copied" : "Copy file names"}
      </Button>
    </div>
  )
}
