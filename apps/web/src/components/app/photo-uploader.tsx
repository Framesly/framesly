"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { UploadList, type UploadItem } from "@/components/app/upload-list"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Progress } from "@/components/ui/progress"
import { ACCEPTED_IMAGE_TYPES, MAX_FILES_PER_BATCH, MAX_ORIGINAL_BYTES, WEB_COPY_EDGE, WEB_COPY_QUALITY } from "@/lib/uploads"
import { cn } from "@/lib/utils"

const CONCURRENCY = 3
const CHECK_CHUNK = 500

type Outcome = { id: string; ok: boolean; width?: number; height?: number; error?: string; cancelled?: boolean }

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

/** PUT with upload progress (fetch can't report it) and cancellation. */
function put(url: string, body: Blob, contentType: string, onProgress: (loaded: number) => void, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    xhr.setRequestHeader("Content-Type", contentType)
    xhr.upload.onprogress = (e) => onProgress(e.loaded)
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Storage said ${xhr.status}.`)))
    xhr.onerror = () => reject(new Error("Connection dropped."))
    xhr.onabort = () => reject(new Error("Cancelled."))
    if (signal.aborted) return reject(new Error("Cancelled."))
    signal.addEventListener("abort", () => xhr.abort(), { once: true })
    xhr.send(body)
  })
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? "Something went wrong.")
  return json as T
}

/**
 * Pick photos (or a whole folder), make a 2048px web copy of each in the
 * browser, send both to R2. Files already in the gallery are skipped, so after
 * a dropped connection you choose the same photos again and only the missing
 * ones upload. Any file can be cancelled or removed while it waits or uploads.
 * `unfinished` is how many photos from an earlier session never finished.
 */
export function PhotoUploader({ galleryId, unfinished = 0 }: { galleryId: string; unfinished?: number }) {
  const router = useRouter()
  const [items, setItems] = useState<UploadItem[]>([])
  const [progress, setProgress] = useState<ReadonlyMap<string, number>>(new Map())
  const [running, setRunning] = useState(false)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  // Mutable upload bookkeeping: handlers write it, the screen reads a copy of progress on a timer.
  const pending = useRef(new Map<string, number>())
  const controllers = useRef(new Map<string, AbortController>())
  const cancelled = useRef(new Set<string>())
  const stopAll = useRef(false)

  const patch = useCallback((key: string, next: Partial<UploadItem>) => setItems((all) => all.map((i) => (i.key === key ? { ...i, ...next } : i))), [])

  // Progress changes many times a second; show it a few times a second.
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setProgress(new Map(pending.current)), 250)
    return () => clearInterval(t)
  }, [running])

  // Leaving the page would abandon the upload: ask first.
  useEffect(() => {
    if (!running) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [running])

  /** Upload one batch: presign, send files with limited parallelism, then confirm. */
  const uploadBatch = useCallback(
    async (all: UploadItem[]) => {
      const batch = all.filter((i) => !cancelled.current.has(i.key))
      if (!batch.length) return
      batch.forEach((i) => patch(i.key, { status: "uploading", error: undefined }))
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

      const outcomes = new Map<string, Outcome>()
      let next = 0
      const worker = async () => {
        while (next < batch.length && !stopAll.current) {
          const idx = next++
          const item = batch[idx]
          const target = presigned.items[idx]
          if (cancelled.current.has(item.key)) {
            outcomes.set(target.photoId, { id: target.photoId, ok: false, cancelled: true })
            continue
          }
          const controller = new AbortController()
          controllers.current.set(item.key, controller)
          try {
            const web = await makeWebCopy(item.file)
            const total = item.file.size + web.blob.size
            let originalLoaded = 0
            let webLoaded = 0
            const report = () => pending.current.set(item.key, Math.round(((originalLoaded + webLoaded) / total) * 100))
            await Promise.all([
              put(target.originalUrl, item.file, item.file.type, (n) => ((originalLoaded = n), report()), controller.signal),
              put(target.webUrl, web.blob, "image/jpeg", (n) => ((webLoaded = n), report()), controller.signal),
            ])
            outcomes.set(target.photoId, { id: target.photoId, ok: true, width: web.width, height: web.height })
          } catch (e) {
            if (cancelled.current.has(item.key)) outcomes.set(target.photoId, { id: target.photoId, ok: false, cancelled: true })
            else {
              outcomes.set(target.photoId, { id: target.photoId, ok: false, error: (e as Error).message })
              patch(item.key, { status: "failed", error: (e as Error).message })
            }
          } finally {
            controllers.current.delete(item.key)
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker))

      // Anything never reached (Cancel all) or cancelled meanwhile: tell the server to drop its row.
      batch.forEach((item, idx) => {
        const id = presigned.items[idx].photoId
        if (!outcomes.has(id) || cancelled.current.has(item.key)) outcomes.set(id, { id, ok: false, cancelled: true })
      })

      try {
        const { results } = await post<{ results: { id: string; status: "ready" | "failed" | "cancelled" }[] }>("/api/photos", { galleryId, photos: [...outcomes.values()] })
        const failedIds = new Set(results.filter((r) => r.status === "failed").map((r) => r.id))
        batch.forEach((item, idx) => {
          const id = presigned.items[idx].photoId
          if (cancelled.current.has(item.key)) return
          if (failedIds.has(id)) patch(item.key, { status: "failed", error: outcomes.get(id)?.error ?? "Didn't reach storage." })
          else patch(item.key, { status: "done" })
          pending.current.set(item.key, 100)
        })
      } catch (e) {
        batch.forEach((i) => !cancelled.current.has(i.key) && patch(i.key, { status: "failed", error: (e as Error).message }))
      }
    },
    [galleryId, patch]
  )

  const run = useCallback(
    async (queue: UploadItem[]) => {
      stopAll.current = false
      setRunning(true)
      for (let i = 0; i < queue.length && !stopAll.current; i += MAX_FILES_PER_BATCH) await uploadBatch(queue.slice(i, i + MAX_FILES_PER_BATCH))
      setProgress(new Map(pending.current))
      setRunning(false)
      router.refresh()
    },
    [uploadBatch, router]
  )

  const add = async (files: FileList | File[]) => {
    const picked = Array.from(files)
    const ok = picked.filter((f) => f.type in ACCEPTED_IMAGE_TYPES && f.size <= MAX_ORIGINAL_BYTES)
    const skipped = picked.length - ok.length
    if (!ok.length) {
      setNotice(skipped ? `${skipped} file${skipped === 1 ? "" : "s"} skipped. Use JPEG, PNG or WebP under 200 MB.` : null)
      return
    }

    // Skip photos that are already safely in this gallery. If the check fails, upload everything.
    setChecking(true)
    const have = new Set<number>()
    for (let start = 0; start < ok.length; start += CHECK_CHUNK) {
      try {
        const chunk = ok.slice(start, start + CHECK_CHUNK)
        const { existing } = await post<{ existing: number[] }>("/api/uploads/check", { galleryId, files: chunk.map((f) => ({ name: f.name, size: f.size })) })
        existing.forEach((i) => have.add(start + i))
      } catch {
        break
      }
    }
    setChecking(false)

    const fresh = ok.filter((_, i) => !have.has(i))
    const parts = [
      skipped ? `${skipped} file${skipped === 1 ? "" : "s"} skipped (use JPEG, PNG or WebP under 200 MB).` : "",
      have.size ? `${have.size} already in this gallery, skipped.` : "",
    ].filter(Boolean)
    setNotice(parts.length ? parts.join(" ") : null)
    if (!fresh.length) return

    const queue: UploadItem[] = fresh.map((file) => ({ key: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`, file, status: "waiting" }))
    setItems((all) => [...queue, ...all])
    void run(queue)
  }

  /** Remove a waiting or failed file, or cancel one that is uploading. */
  const remove = useCallback((key: string) => {
    cancelled.current.add(key)
    controllers.current.get(key)?.abort()
    pending.current.delete(key)
    setItems((all) => all.filter((i) => i.key !== key))
  }, [])

  const cancelAll = () => {
    stopAll.current = true
    items.filter((i) => i.status === "waiting" || i.status === "uploading").forEach((i) => remove(i.key))
  }

  const retry = () => {
    const failed = items.filter((i) => i.status === "failed")
    if (failed.length) void run(failed)
  }

  const done = items.filter((i) => i.status === "done").length
  const failed = items.filter((i) => i.status === "failed").length
  const overall = items.length ? Math.round(items.reduce((sum, i) => sum + (i.status === "done" ? 100 : (progress.get(i.key) ?? 0)), 0) / items.length) : 0

  return (
    <section
      aria-labelledby="upload-title"
      onDragEnter={(e) => {
        e.preventDefault()
        dragDepth.current += 1
        setDragging(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        // dragleave also fires when the pointer crosses child elements, so count enters and leaves.
        dragDepth.current = Math.max(0, dragDepth.current - 1)
        if (dragDepth.current === 0) setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        dragDepth.current = 0
        setDragging(false)
        void add(e.dataTransfer.files)
      }}
      className={cn(
        "flex min-h-72 flex-col rounded-[var(--radius-cover)] border border-dashed p-6 transition-colors sm:p-8",
        dragging ? "border-safelight bg-safelight-soft" : "border-line-strong"
      )}
    >
      <div className="flex flex-col items-center text-center">
        <Icon name="upload" className="size-10 text-ink-muted" strokeWidth={1.5} />
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
            if (e.target.files) void add(e.target.files)
            e.target.value = ""
          }}
        />
        <input
          ref={folderRef}
          type="file"
          multiple
          className="sr-only"
          aria-label="Choose a folder of photos to upload"
          // Non-standard but supported by every current browser; picks a whole folder at once.
          {...({ webkitdirectory: "" } as object)}
          onChange={(e) => {
            if (e.target.files) void add(e.target.files)
            e.target.value = ""
          }}
        />
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={checking}>
            Choose photos
          </Button>
          <Button variant="quiet" onClick={() => folderRef.current?.click()} disabled={checking}>
            Choose a folder
          </Button>
        </div>
        {checking && <p role="status" className="mt-3 type-caption font-normal text-ink-muted">Checking what is already in this gallery…</p>}
        {notice && <p className="mt-3 max-w-md type-caption text-ink-muted" role="status">{notice}</p>}
      </div>

      {unfinished > 0 && items.length === 0 && (
        <p role="status" className="mt-6 rounded-[var(--radius-control)] border border-warning/40 bg-warning/10 px-4 py-3 type-caption font-normal text-ink">
          {unfinished.toLocaleString("en")} {unfinished === 1 ? "photo" : "photos"} from an earlier upload didn&apos;t finish. Choose the same photos or folder again: the finished ones are skipped and only the rest upload.
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-6 border-t border-line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 type-caption">
            <span className="text-ink" role="status" aria-live="polite">
              {running ? `Uploading… ${done.toLocaleString("en")} of ${items.length.toLocaleString("en")}` : `${done.toLocaleString("en")} of ${items.length.toLocaleString("en")} uploaded`}
            </span>
            <span className="flex gap-2">
              {running && (
                <Button size="sm" variant="quiet" onClick={cancelAll}>
                  Cancel the rest
                </Button>
              )}
              {failed > 0 && !running && (
                <Button size="sm" variant="secondary" onClick={retry}>
                  Retry {failed} failed
                </Button>
              )}
            </span>
          </div>
          <Progress value={overall} label="Upload progress" className="mt-2" />
          {running && <p className="mt-2 type-caption font-normal text-ink-muted">Keep this tab open until the upload finishes.</p>}
          <UploadList items={items} progress={progress} onRemove={remove} />
        </div>
      )}
    </section>
  )
}
