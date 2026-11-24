"use client"

import { useRouter } from "next/navigation"
import { useCallback, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { ACCEPTED_IMAGE_TYPES, MAX_FILES_PER_BATCH, MAX_ORIGINAL_BYTES, WEB_COPY_EDGE, WEB_COPY_QUALITY } from "@/lib/uploads"
import { cn } from "@/lib/utils"

type Status = "waiting" | "uploading" | "done" | "failed"
type Item = { key: string; file: File; status: Status; progress: number; error?: string; photoId?: string }

const CONCURRENCY = 3

/** Draw the photo at WEB_COPY_EDGE on its long edge and encode it as a JPEG. */
async function makeWebCopy(file: File) {
  const bitmap = await createImageBitmap(file) // honours EXIF rotation
  const { width, height } = bitmap
  const scale = Math.min(1, WEB_COPY_EDGE / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("This browser can't resize photos.")
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", WEB_COPY_QUALITY))
  if (!blob) throw new Error("Couldn't make the web copy.")
  return { blob, width, height }
}

/** PUT with upload progress (fetch can't report it). */
function put(url: string, body: Blob, contentType: string, onProgress: (loaded: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    xhr.setRequestHeader("Content-Type", contentType)
    xhr.upload.onprogress = (e) => onProgress(e.loaded)
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Storage said ${xhr.status}.`)))
    xhr.onerror = () => reject(new Error("Connection dropped."))
    xhr.send(body)
  })
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? "Something went wrong.")
  return json as T
}

/** Pick photos, make a 2048px web copy of each in the browser, send both to R2. */
export function PhotoUploader({ galleryId }: { galleryId: string }) {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const patch = useCallback((key: string, next: Partial<Item>) => setItems((all) => all.map((i) => (i.key === key ? { ...i, ...next } : i))), [])

  /** Upload one batch: presign, send files with limited parallelism, then confirm. */
  const uploadBatch = useCallback(
    async (batch: Item[]) => {
      batch.forEach((i) => patch(i.key, { status: "uploading", progress: 0, error: undefined }))
      let presigned: { items: { photoId: string; originalUrl: string; webUrl: string }[] }
      try {
        presigned = await post("/api/uploads/presign", {
          galleryId,
          files: batch.map((i) => ({ name: i.file.name, size: i.file.size, type: i.file.type })),
          replaces: batch.map((i) => i.photoId).filter(Boolean),
        })
      } catch (e) {
        batch.forEach((i) => patch(i.key, { status: "failed", error: (e as Error).message }))
        return
      }
      batch.forEach((i, idx) => patch(i.key, { photoId: presigned.items[idx].photoId }))

      const outcomes: { id: string; ok: boolean; width?: number; height?: number; error?: string }[] = []
      let next = 0
      const worker = async () => {
        while (next < batch.length) {
          const idx = next++
          const item = batch[idx]
          const target = presigned.items[idx]
          try {
            const web = await makeWebCopy(item.file)
            const total = item.file.size + web.blob.size
            let originalLoaded = 0
            let webLoaded = 0
            const report = () => patch(item.key, { progress: Math.round(((originalLoaded + webLoaded) / total) * 100) })
            await Promise.all([
              put(target.originalUrl, item.file, item.file.type, (n) => ((originalLoaded = n), report())),
              put(target.webUrl, web.blob, "image/jpeg", (n) => ((webLoaded = n), report())),
            ])
            outcomes.push({ id: target.photoId, ok: true, width: web.width, height: web.height })
          } catch (e) {
            outcomes.push({ id: target.photoId, ok: false, error: (e as Error).message })
            patch(item.key, { status: "failed", error: (e as Error).message })
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker))

      try {
        const { results } = await post<{ results: { id: string; status: "ready" | "failed" }[] }>("/api/photos", { galleryId, photos: outcomes })
        const failedIds = new Set(results.filter((r) => r.status === "failed").map((r) => r.id))
        batch.forEach((item, idx) => {
          if (failedIds.has(presigned.items[idx].photoId)) patch(item.key, { status: "failed", error: (outcomes.find((o) => o.id === presigned.items[idx].photoId)?.error) ?? "Didn't reach storage." })
          else patch(item.key, { status: "done", progress: 100 })
        })
      } catch (e) {
        batch.forEach((i) => patch(i.key, { status: "failed", error: (e as Error).message }))
      }
    },
    [galleryId, patch]
  )

  const run = useCallback(
    async (queue: Item[]) => {
      setRunning(true)
      for (let i = 0; i < queue.length; i += MAX_FILES_PER_BATCH) await uploadBatch(queue.slice(i, i + MAX_FILES_PER_BATCH))
      setRunning(false)
      router.refresh()
    },
    [uploadBatch, router]
  )

  const add = (files: FileList | File[]) => {
    const picked = Array.from(files)
    const ok = picked.filter((f) => f.type in ACCEPTED_IMAGE_TYPES && f.size <= MAX_ORIGINAL_BYTES)
    const skipped = picked.length - ok.length
    setNotice(skipped ? `${skipped} file${skipped === 1 ? "" : "s"} skipped. Use JPEG, PNG or WebP under 200 MB.` : null)
    if (!ok.length) return
    const queue: Item[] = ok.map((file) => ({ key: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`, file, status: "waiting", progress: 0 }))
    setItems((all) => [...queue, ...all])
    void run(queue)
  }

  const retry = () => {
    const failed = items.filter((i) => i.status === "failed")
    if (failed.length) void run(failed)
  }

  const done = items.filter((i) => i.status === "done").length
  const failed = items.filter((i) => i.status === "failed").length
  const overall = items.length ? Math.round(items.reduce((sum, i) => sum + (i.status === "done" ? 100 : i.progress), 0) / items.length) : 0

  return (
    <section
      aria-labelledby="upload-title"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        add(e.dataTransfer.files)
      }}
      className={cn(
        "flex min-h-72 flex-col rounded-[var(--radius-cover)] border border-dashed p-6 transition-colors sm:p-8",
        dragging ? "border-safelight bg-safelight-soft" : "border-line-strong"
      )}
    >
      <div className="flex flex-col items-center text-center">
        <svg viewBox="0 0 24 24" className="size-10 text-ink-muted" aria-hidden>
          <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 17v2.5h16V17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 id="upload-title" className="mt-4 type-heading-2">Upload the wedding</h2>
        <p className="mt-2 max-w-sm type-caption font-normal text-ink-muted">
          Drag photos here, or choose them. JPEG, PNG or WebP, up to 200 MB each. We keep the original and make a web copy for your clients.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={Object.keys(ACCEPTED_IMAGE_TYPES).join(",")}
          className="sr-only"
          aria-label="Choose photos to upload"
          onChange={(e) => {
            if (e.target.files) add(e.target.files)
            e.target.value = ""
          }}
        />
        <Button className="mt-5" variant="secondary" onClick={() => inputRef.current?.click()}>Choose photos</Button>
        {notice && <p className="mt-3 type-caption text-danger" role="alert">{notice}</p>}
      </div>

      {items.length > 0 && (
        <div className="mt-6 border-t border-line pt-5" aria-live="polite">
          <div className="flex items-center justify-between gap-3 type-caption">
            <span className="text-ink">{running ? `Uploading… ${done} of ${items.length}` : `${done} of ${items.length} uploaded`}</span>
            {failed > 0 && !running && <Button size="sm" variant="secondary" onClick={retry}>Retry {failed} failed</Button>}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken" role="progressbar" aria-valuenow={overall} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="h-full bg-safelight transition-[width] duration-300" style={{ width: `${overall}%` }} />
          </div>
          <ul className="mt-4 max-h-56 space-y-1 overflow-y-auto">
            {items.map((i) => (
              <li key={i.key} className="flex items-center gap-3 type-caption font-normal">
                <span className="min-w-0 flex-1 truncate text-ink">{i.file.name}</span>
                <span className={cn("shrink-0", i.status === "failed" ? "text-danger" : "text-ink-muted")}>
                  {i.status === "done" ? "Done" : i.status === "failed" ? (i.error ?? "Failed") : i.status === "uploading" ? `${i.progress}%` : "Waiting"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
