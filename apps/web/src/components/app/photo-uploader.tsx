"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { UploadList, type UploadItem } from "@/components/app/upload-list"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Progress } from "@/components/ui/progress"
import {
  ACCEPTED_FORMATS_TEXT,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILES_PER_BATCH,
  MAX_ORIGINAL_BYTES,
  THUMB_EDGE,
  THUMB_QUALITY,
  WEB_COPY_EDGE,
  WEB_COPY_QUALITY,
  photoTypeOf,
} from "@/lib/uploads"
import { cn } from "@/lib/utils"

const CONCURRENCY = 4
const CHECK_CHUNK = 500

type Outcome = { id: string; ok: boolean; width?: number; height?: number; error?: string; cancelled?: boolean }

/** Draw a decoded photo at `edge` px on its long edge and encode it as a JPEG. */
async function encodeCopy(bitmap: ImageBitmap, edge: number, quality: number) {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("This browser can't resize photos.")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
  canvas.width = canvas.height = 0 // release the pixels now rather than at the next GC
  if (!blob) throw new Error("Couldn't make the web copy.")
  return blob
}

/** Decode once (honouring EXIF rotation), then make the 2048px web copy and the 800px grid thumbnail. */
async function makeCopies(file: File) {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    const heic = /\.hei[cf]$/i.test(file.name) || file.type.includes("heic") || file.type.includes("heif")
    throw new Error(heic ? "This browser can't read HEIC. Upload from Safari, or export as JPEG." : "This file couldn't be read as a photo.")
  }
  try {
    const web = await encodeCopy(bitmap, WEB_COPY_EDGE, WEB_COPY_QUALITY)
    const thumb = await encodeCopy(bitmap, THUMB_EDGE, THUMB_QUALITY)
    return { web, thumb, width: bitmap.width, height: bitmap.height }
  } finally {
    bitmap.close()
  }
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

/** Every file in a dropped folder, including subfolders. readEntries returns at most ~100 entries per call, so read until empty. */
async function readDirectory(dir: FileSystemDirectoryEntry): Promise<File[]> {
  const reader = dir.createReader()
  const entries: FileSystemEntry[] = []
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject))
    if (!batch.length) break
    entries.push(...batch)
  }
  const nested = await Promise.all(entries.map(readEntry))
  return nested.flat()
}

async function readEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) return [await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject))]
  if (entry.isDirectory) return readDirectory(entry as FileSystemDirectoryEntry)
  return []
}

/** Files from a drop: plain files as they are, folders opened recursively. Falls back to the flat file list. */
async function filesFromDrop(data: DataTransfer): Promise<File[]> {
  // The drop's data is cleared once the event returns: take both views before the first await.
  const flat = [...data.files]
  const entries = [...data.items].map((i) => (i.kind === "file" ? i.webkitGetAsEntry?.() : null)).filter((e): e is FileSystemEntry => Boolean(e))
  if (!entries.length) return flat
  try {
    return (await Promise.all(entries.map(readEntry))).flat()
  } catch {
    return flat
  }
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
      let presigned: { items: { photoId: string; originalUrl: string; webUrl: string; thumbUrl: string }[] }
      try {
        presigned = await post("/api/uploads/presign", {
          galleryId,
          files: batch.map((i) => ({ name: i.file.name, size: i.file.size, type: photoTypeOf(i.file) })),
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
            // The original starts uploading at once; the copies are made while it travels.
            let originalLoaded = 0
            let webLoaded = 0
            let thumbLoaded = 0
            let copiesSize = 0
            const report = () =>
              pending.current.set(item.key, Math.min(99, Math.round(((originalLoaded + webLoaded + thumbLoaded) / (item.file.size + copiesSize)) * 100)))
            const original = put(target.originalUrl, item.file, photoTypeOf(item.file) ?? item.file.type, (n) => ((originalLoaded = n), report()), controller.signal)
            const copies = makeCopies(item.file).then(async (c) => {
              copiesSize = c.web.size + c.thumb.size
              await Promise.all([
                put(target.webUrl, c.web, "image/jpeg", (n) => ((webLoaded = n), report()), controller.signal),
                put(target.thumbUrl, c.thumb, "image/jpeg", (n) => ((thumbLoaded = n), report()), controller.signal),
              ])
              return c
            })
            // An unreadable file fails its copies first: stop the original too instead of sending it for nothing.
            copies.catch(() => controller.abort())
            const [, made] = await Promise.all([original, copies])
            outcomes.set(target.photoId, { id: target.photoId, ok: true, width: made.width, height: made.height })
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
      for (let i = 0; i < queue.length && !stopAll.current; i += MAX_FILES_PER_BATCH) {
        await uploadBatch(queue.slice(i, i + MAX_FILES_PER_BATCH))
        // Show each finished batch in the grid while the next one uploads.
        router.refresh()
      }
      setProgress(new Map(pending.current))
      setRunning(false)
    },
    [uploadBatch, router]
  )

  const add = async (files: FileList | File[]) => {
    const picked = Array.from(files)
    // Folders often hold sidecar files (.xmp, .db, RAW); only photos we take are uploaded.
    const ok = picked.filter((f) => photoTypeOf(f) !== null && f.size > 0 && f.size <= MAX_ORIGINAL_BYTES)
    const skipped = picked.length - ok.length
    if (!ok.length) {
      setNotice(picked.length ? `${skipped} file${skipped === 1 ? "" : "s"} skipped. Use ${ACCEPTED_FORMATS_TEXT} under 200 MB.` : "That folder has no photos in it.")
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
      skipped ? `${skipped} file${skipped === 1 ? "" : "s"} skipped (not ${ACCEPTED_FORMATS_TEXT}, or over 200 MB).` : "",
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
        // Entries must be read synchronously in the drop event, so start now and add when ready.
        void filesFromDrop(e.dataTransfer).then(add)
      }}
      className={cn(
        "rounded-[var(--radius-cover)] border border-dashed p-4 transition-[background-color,border-color] duration-200 sm:p-5",
        dragging ? "border-safelight bg-safelight-soft" : "border-line-strong bg-surface-raised/40"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] border transition-colors",
              dragging ? "border-safelight text-safelight" : "border-line text-ink-muted"
            )}
          >
            <Icon name="upload" className="size-5" strokeWidth={1.6} />
          </span>
          <div className="min-w-0">
            <h2 id="upload-title" className="type-heading-2 text-ink">{dragging ? "Drop to upload" : "Upload the wedding"}</h2>
            <p className="mt-0.5 type-caption font-normal text-pretty text-ink-muted">
              Drag photos or a folder here. {ACCEPTED_FORMATS_TEXT}, up to 200&nbsp;MB each.
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={[...Object.keys(ACCEPTED_IMAGE_TYPES), ".heic", ".heif", ".avif"].join(",")}
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
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <Button size="sm" variant="primary" onClick={() => inputRef.current?.click()} disabled={checking}>
            Choose photos
          </Button>
          <Button size="sm" variant="secondary" onClick={() => folderRef.current?.click()} disabled={checking}>
            Choose a folder
          </Button>
        </div>
      </div>
      {checking && <p role="status" className="mt-3 type-caption font-normal text-ink-muted">Checking what is already in this gallery…</p>}
      {notice && <p className="mt-3 type-caption text-ink-muted" role="status">{notice}</p>}

      {unfinished > 0 && items.length === 0 && (
        <p role="status" className="mt-4 rounded-[var(--radius-control)] border border-warning/40 bg-warning/10 px-4 py-3 type-caption font-normal text-ink">
          {unfinished.toLocaleString("en")} {unfinished === 1 ? "photo" : "photos"} from an earlier upload didn&apos;t finish. Choose the same photos or folder again: the finished ones are skipped and only the rest upload.
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
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
