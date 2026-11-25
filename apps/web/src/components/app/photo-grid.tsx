"use client"

import Image from "next/image"

import { FallbackImage } from "@/components/ui/fallback-image"
import { useState, useTransition } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { assignSectionAction, deletePhotosAction, loadMorePhotosAction, movePhotoAction, setCoverAction } from "@/features/galleries/photo-actions"
import type { GridPhoto } from "@/lib/data/grid-photos"
import { cn } from "@/lib/utils"

type Section = { id: string; name: string }

/**
 * Every photo in the gallery. Click one for its detail view: set it as the
 * cover, move it earlier or later, put it in a section, delete it. "Select"
 * switches to picking many photos at once for a section or a delete.
 * The first page comes from the server; the rest load on request.
 */
export function PhotoGrid({
  galleryId,
  initial,
  total,
  sections,
  coverId: initialCover,
}: {
  galleryId: string
  initial: GridPhoto[]
  total: number
  sections: Section[]
  coverId: string | null
}) {
  const toast = useToast()
  const [photos, setPhotos] = useState(initial)
  const [done, setDone] = useState(initial.length >= total)
  const [coverId, setCoverId] = useState(initialCover)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)
  const [pending, start] = useTransition()

  const sectionName = (id: string | null) => sections.find((s) => s.id === id)?.name
  const openIndex = openId ? photos.findIndex((p) => p.id === openId) : -1
  const open = openIndex >= 0 ? photos[openIndex] : null

  const fail = (message: string) => toast({ title: "Couldn't do that", body: message, tone: "error" })

  const loadMore = () =>
    start(async () => {
      const r = await loadMorePhotosAction(galleryId, photos.length)
      if (!r.ok) return fail(r.message)
      setPhotos((all) => [...all, ...r.photos.filter((p) => !all.some((a) => a.id === p.id))])
      setDone(r.done)
    })

  const setCover = (id: string) =>
    start(async () => {
      const r = await setCoverAction(galleryId, id)
      if (!r.ok) return fail(r.message)
      setCoverId(id)
      toast({ title: "Cover set", body: "Clients see this photo first.", tone: "success" })
    })

  const assign = (ids: string[], sectionId: string | null) =>
    start(async () => {
      const r = await assignSectionAction(galleryId, ids, sectionId)
      if (!r.ok) return fail(r.message)
      setPhotos((all) => all.map((p) => (ids.includes(p.id) ? { ...p, sectionId } : p)))
      toast({ title: sectionId ? `Moved to ${sectionName(sectionId)}` : "Taken out of its section", tone: "success" })
    })

  const remove = (ids: string[]) =>
    start(async () => {
      const r = await deletePhotosAction(galleryId, ids)
      if (!r.ok) return fail(r.message)
      setPhotos((all) => all.filter((p) => !ids.includes(p.id)))
      setSelected(new Set())
      setConfirmDelete(null)
      setOpenId(null)
      toast({ title: ids.length === 1 ? "Photo deleted" : `${ids.length} photos deleted`, tone: "success" })
    })

  const move = (id: string, to: "start" | "earlier" | "later") => {
    // Reorder on screen at once; the server saves it and we put things back if that fails.
    const before = photos
    const i = photos.findIndex((p) => p.id === id)
    const j = to === "start" ? 0 : to === "earlier" ? i - 1 : i + 1
    if (i < 0 || j < 0 || j >= photos.length || i === j) return
    const next = [...photos]
    const [moved] = next.splice(i, 1)
    next.splice(j, 0, moved)
    setPhotos(next)
    start(async () => {
      const r = await movePhotoAction(galleryId, id, to)
      if (!r.ok) {
        setPhotos(before)
        return fail(r.message)
      }
    })
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (photos.length === 0) return null

  return (
    <section aria-labelledby="photos-title" className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="photos-title" className="type-heading-2">Photos</h2>
          <p className="mt-1 type-caption font-normal text-ink-muted">
            {photos.length < total ? `Showing ${photos.length.toLocaleString("en")} of ${total.toLocaleString("en")}. ` : `${total.toLocaleString("en")} in this gallery. `}
            Click a photo to set the cover, reorder, or move it to a section.
          </p>
        </div>
        <Button
          variant={selecting ? "primary" : "secondary"}
          size="sm"
          aria-pressed={selecting}
          onClick={() => {
            setSelecting((v) => !v)
            setSelected(new Set())
          }}
        >
          {selecting ? "Done selecting" : "Select photos"}
        </Button>
      </div>

      {selecting && (
        <div className="sticky top-16 z-(--z-sticky) mt-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface-raised p-3">
          <span role="status" className="type-caption text-ink">
            {selected.size} selected
          </span>
          <Select
            label="Move selected photos to a section"
            hideLabel
            prefix="Move to"
            value=""
            disabled={selected.size === 0 || pending}
            onChange={(e) => e.target.value && assign([...selected], e.target.value === "none" ? null : e.target.value)}
            className="w-56"
          >
            <option value="">Choose…</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value="none">No section</option>
          </Select>
          <Button variant="danger" size="sm" disabled={selected.size === 0 || pending} onClick={() => setConfirmDelete([...selected])}>
            Delete
          </Button>
          <Button variant="quiet" size="sm" disabled={selected.size === photos.length} onClick={() => setSelected(new Set(photos.map((p) => p.id)))}>
            Select all shown
          </Button>
        </div>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {photos.map((p) => {
          const isSelected = selected.has(p.id)
          const section = sectionName(p.sectionId)
          return (
            <li key={p.id} className="[contain-intrinsic-size:auto_200px] [content-visibility:auto]">
              <button
                type="button"
                onClick={() => (selecting ? toggle(p.id) : setOpenId(p.id))}
                aria-label={selecting ? `${isSelected ? "Deselect" : "Select"} ${p.name}` : `Open ${p.name}`}
                aria-pressed={selecting ? isSelected : undefined}
                className={cn("relative block aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-chip)] bg-surface-sunken text-left", isSelected && "selected-frame")}
              >
                {p.src ? (
                  <FallbackImage src={p.src} fallback={p.full} alt="" fill unoptimized loading="lazy" sizes="(min-width: 1024px) 16vw, 25vw" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center px-2 text-center type-caption font-normal text-ink-muted">{p.status === "failed" ? "Failed" : "Uploading…"}</span>
                )}
                {p.id === coverId && <Badge variant="solid" tone="accent" className="absolute top-1.5 left-1.5">Cover</Badge>}
                {section && <span className="absolute inset-x-0 bottom-0 truncate bg-[rgb(var(--scrim)/0.7)] px-2 py-1 type-label text-fixed-light">{section}</span>}
                {selecting && (
                  <span aria-hidden className={cn("absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full border-2", isSelected ? "border-safelight bg-safelight text-on-safelight" : "border-fixed-light bg-[rgb(var(--scrim)/0.4)]")}>
                    {isSelected && <Icon name="check" strokeWidth={3} className="size-3.5" />}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {!done && photos.length < total && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={loadMore} disabled={pending}>
            {pending ? "Loading…" : `Show more (${(total - photos.length).toLocaleString("en")} left)`}
          </Button>
        </div>
      )}

      {/* One photo */}
      <Dialog open={open !== null} onClose={() => setOpenId(null)} title={open?.name ?? "Photo"}>
        {open && (
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-control)] bg-surface-sunken">
              {open.full ? <Image src={open.full} alt={open.name} fill unoptimized sizes="(min-width: 640px) 512px, 100vw" className="object-contain" /> : <span className="absolute inset-0 grid place-items-center type-caption font-normal text-ink-muted">{open.status === "failed" ? "This upload failed. Delete it and upload the photo again." : "Still uploading…"}</span>}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="type-metric text-ink-muted">
                {openIndex + 1} / {photos.length}
                {open.id === coverId && <Badge tone="accent" className="ml-3">Cover</Badge>}
              </span>
              <span className="flex gap-1">
                <Button variant="quiet" size="icon" aria-label="Previous photo" disabled={openIndex === 0} onClick={() => setOpenId(photos[openIndex - 1].id)}>
                  <Icon name="chevron-left" />
                </Button>
                <Button variant="quiet" size="icon" aria-label="Next photo" disabled={openIndex === photos.length - 1} onClick={() => setOpenId(photos[openIndex + 1].id)}>
                  <Icon name="chevron-right" />
                </Button>
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <Select label="Section" value={open.sectionId ?? ""} disabled={pending} onChange={(e) => assign([open.id], e.target.value || null)}>
                <option value="">No section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" disabled={pending || open.status !== "ready" || open.id === coverId} onClick={() => setCover(open.id)}>
                  Set as cover
                </Button>
                <Button variant="quiet" size="sm" disabled={pending || openIndex === 0} onClick={() => move(open.id, "start")}>
                  <Icon name="arrow-up" className="size-4" /> To the front
                </Button>
                <Button variant="quiet" size="sm" disabled={pending || openIndex === 0} onClick={() => move(open.id, "earlier")}>
                  <Icon name="chevron-left" className="size-4" /> Earlier
                </Button>
                <Button variant="quiet" size="sm" disabled={pending || openIndex === photos.length - 1} onClick={() => move(open.id, "later")}>
                  Later <Icon name="chevron-right" className="size-4" />
                </Button>
              </div>
              <div className="border-t border-line pt-3">
                <Button variant="danger" size="sm" disabled={pending} onClick={() => setConfirmDelete([open.id])}>
                  <Icon name="trash" className="size-4" /> Delete photo
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Confirm delete: deleting removes the original and the web copy for good */}
      <Dialog open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title={confirmDelete && confirmDelete.length > 1 ? `Delete ${confirmDelete.length} photos?` : "Delete this photo?"}>
        <p className="text-ink-muted">This removes the original and the web copy for good. It can&apos;t be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="quiet" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={pending} onClick={() => confirmDelete && remove(confirmDelete)}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
