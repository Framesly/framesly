"use client"

import { useEffect, useRef, useState } from "react"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

export type UploadStatus = "waiting" | "uploading" | "done" | "failed"
export type UploadItem = { key: string; file: File; status: UploadStatus; error?: string; photoId?: string }

const ROW = 56 // px; every row is the same height so the list can be windowed
const VIEW = 336 // px visible at once (six rows)
const OVERSCAN = 4

/* Thumbnails are decoded one at a time: big camera JPEGs are slow to decode and a fast scroll would start dozens at once. */
let thumbChain: Promise<unknown> = Promise.resolve()
function queueThumb(task: () => Promise<void>) {
  const run = thumbChain.then(task, task)
  thumbChain = run.catch(() => {})
}

/** A small preview of the file, drawn when its row scrolls into view. Silently empty if the browser can't decode it. */
function Thumb({ file }: { file: File }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let alive = true
    queueThumb(async () => {
      if (!alive || !ref.current) return
      try {
        const bitmap = await createImageBitmap(file, { resizeWidth: 120, resizeQuality: "low" })
        const canvas = ref.current
        const ctx = canvas?.getContext("2d")
        if (alive && canvas && ctx) {
          // Cover-crop into the square.
          const side = Math.min(bitmap.width, bitmap.height)
          ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height)
        }
        bitmap.close()
      } catch {
        // No preview: the grey square stays.
      }
    })
    return () => {
      alive = false
    }
  }, [file])
  return <canvas ref={ref} width={80} height={80} aria-hidden className="size-10 shrink-0 rounded-[var(--radius-chip)] bg-surface-sunken" />
}

function statusText(item: UploadItem, percent: number) {
  if (item.status === "done") return "Done"
  if (item.status === "failed") return item.error ?? "Failed"
  if (item.status === "uploading") return `${percent}%`
  return "Waiting"
}

/**
 * The files of an upload, one row each, rendered a window at a time so a
 * 2,000-photo wedding scrolls as smoothly as a 20-photo one.
 */
export function UploadList({
  items,
  progress,
  onRemove,
}: {
  items: UploadItem[]
  progress: ReadonlyMap<string, number>
  onRemove: (key: string) => void
}) {
  const [scrollTop, setScrollTop] = useState(0)
  const height = Math.min(items.length * ROW, VIEW)
  const first = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN)
  const last = Math.min(items.length, Math.ceil((scrollTop + height) / ROW) + OVERSCAN)

  return (
    <div className="mt-4 overflow-y-auto rounded-[var(--radius-control)] border border-line" style={{ height }} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)} tabIndex={items.length * ROW > VIEW ? 0 : undefined} aria-label="Files in this upload">
      <ul className="relative" style={{ height: items.length * ROW }}>
        {items.slice(first, last).map((item, i) => {
          const percent = progress.get(item.key) ?? 0
          const canRemove = item.status !== "done"
          return (
            <li key={item.key} className="absolute inset-x-0 flex items-center gap-3 border-b border-line px-3 last:border-b-0" style={{ top: (first + i) * ROW, height: ROW }}>
              <Thumb file={item.file} />
              <span className="min-w-0 flex-1 truncate type-caption font-normal text-ink">{item.file.name}</span>
              <span className={cn("shrink-0 type-caption font-normal tabular-nums", item.status === "failed" ? "text-danger" : "text-ink-muted")}>{statusText(item, percent)}</span>
              {canRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(item.key)}
                  aria-label={`${item.status === "uploading" ? "Cancel" : "Remove"} ${item.file.name}`}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
                >
                  <Icon name="close" className="size-4" />
                </button>
              ) : (
                <span className="size-11 shrink-0" aria-hidden />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
