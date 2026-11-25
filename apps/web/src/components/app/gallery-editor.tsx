"use client"

import { AnimatePresence, motion } from "motion/react"
import { useOptimistic, useState, useTransition } from "react"

import { Aperture } from "@/components/auth/primitives"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Dialog } from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { Icon, type IconName } from "@/components/ui/icon"
import { MenuSelect, type MenuOption } from "@/components/ui/menu-select"
import { useToast } from "@/components/ui/toast"
import {
  addSectionAction,
  deleteGalleryAction,
  deleteSectionAction,
  moveSectionAction,
  renameSectionAction,
  updateGalleryAction,
} from "@/features/galleries/actions"
import type { GalleryStatus } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"

type Section = { id: string; name: string; sort_order: number }

const statuses: MenuOption<GalleryStatus>[] = [
  { value: "draft", label: "Draft", hint: "Only you can see it", dot: "var(--ink-muted)" },
  { value: "culling", label: "Culling", hint: "Picking the keepers", dot: "var(--info)" },
  { value: "delivered", label: "Delivered", hint: "Sent to the couple", dot: "var(--success)" },
  { value: "archived", label: "Archived", hint: "Done and put away", dot: "var(--line-strong)" },
]

/**
 * The top of a gallery: its name (edited in place), date and status, plus the
 * gallery-wide actions (sections, delete). Changes show at once and save in
 * the background; the server action refreshes the page data, and a failed
 * save puts the old value back.
 */
export function GalleryHeader({
  id,
  title,
  eventDate,
  status,
  sections,
}: {
  id: string
  title: string
  eventDate: string | null
  status: GalleryStatus
  sections: Section[]
}) {
  const toast = useToast()
  const [pending, start] = useTransition()
  const [date, setDate] = useState(eventDate)
  const [state, setState] = useState(status)
  const [sectionsOpen, setSectionsOpen] = useState(false)

  const save = (input: Parameters<typeof updateGalleryAction>[1], undo: () => void) =>
    start(async () => {
      const r = await updateGalleryAction(id, input)
      if (!r.ok) {
        undo()
        toast({ title: r.message ?? "Couldn't save that change", body: "Check your connection and try again." })
      }
    })

  return (
    <div>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-72">
          <label className="sr-only" htmlFor="gallery-title">Gallery name</label>
          <input
            id="gallery-title"
            defaultValue={title}
            maxLength={120}
            onBlur={(e) => {
              const next = e.target.value.trim()
              if (!next) e.target.value = title
              else if (next !== title) save({ title: next }, () => (e.target.value = title))
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur()
              if (e.key === "Escape") {
                ;(e.target as HTMLInputElement).value = title
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            className="-mx-1.5 w-[calc(100%+12px)] truncate rounded-[var(--radius-chip)] bg-transparent px-1.5 type-heading-1 text-ink transition-colors hover:bg-surface-raised focus:bg-surface-raised md:type-display-l"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setSectionsOpen(true)}>
            <Icon name="images" className="size-4" />
            Sections
            <span className="type-metric text-caption text-ink-muted">{sections.length}</span>
          </Button>
          <DeleteGallery id={id} title={title} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <DatePicker
          label="Wedding date"
          value={date}
          placeholder="Add wedding date"
          className="min-w-0 flex-1 sm:w-48 sm:flex-none"
          onChange={(next) => {
            const prev = date
            setDate(next)
            save({ eventDate: next }, () => setDate(prev))
          }}
        />
        <MenuSelect
          label="Gallery status"
          value={state}
          options={statuses}
          className="min-w-0 flex-1 sm:w-40 sm:flex-none"
          onChange={(next) => {
            const prev = state
            setState(next)
            save({ status: next }, () => setState(prev))
          }}
        />
        <span className="flex items-center gap-1.5 type-caption font-normal text-ink-muted" aria-live="polite">
          {pending && (
            <>
              <Aperture className="size-3.5" /> Saving…
            </>
          )}
        </span>
      </div>

      <Dialog open={sectionsOpen} onClose={() => setSectionsOpen(false)} title="Sections">
        <SectionsManager galleryId={id} sections={sections} />
      </Dialog>
    </div>
  )
}

type SectionChange = { type: "add"; name: string } | { type: "rename"; id: string; name: string } | { type: "delete"; id: string } | { type: "move"; id: string; direction: -1 | 1 }

function applyChange(list: Section[], c: SectionChange): Section[] {
  switch (c.type) {
    case "add":
      return [...list, { id: `pending-${list.length}`, name: c.name.trim(), sort_order: list.length }]
    case "rename":
      return list.map((s) => (s.id === c.id ? { ...s, name: c.name.trim() } : s))
    case "delete":
      return list.filter((s) => s.id !== c.id)
    case "move": {
      const i = list.findIndex((s) => s.id === c.id)
      const j = i + c.direction
      if (i < 0 || j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    }
  }
}

/** Sections (one per event): add, rename, reorder, delete. Each change shows at once. */
export function SectionsManager({ galleryId, sections }: { galleryId: string; sections: Section[] }) {
  const [, start] = useTransition()
  const [optimistic, apply] = useOptimistic(sections, applyChange)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [editing, setEditing] = useState<string | null>(null)

  const run = (change: SectionChange, fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      apply(change)
      const r = await fn()
      setError(r.ok ? null : (r.message ?? "Something went wrong. Try again."))
    })

  return (
    <div>
      <p className="type-caption font-normal text-ink-muted">Clients see one section per event, in this order.</p>

      <ol className="mt-4 divide-y divide-line border-y border-line">
        <AnimatePresence initial={false}>
          {optimistic.map((s, i) => {
            const saving = s.id.startsWith("pending-")
            return (
              <motion.li
                key={s.id}
                layout="position"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: saving ? 0.6 : 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex min-h-14 items-center gap-1 py-1.5"
              >
                <span className="w-6 shrink-0 type-metric text-caption text-ink-muted">{i + 1}</span>
                {editing === s.id ? (
                  <form
                    className="flex flex-1 gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const name = String(new FormData(e.currentTarget).get("name") ?? "").trim()
                      setEditing(null)
                      if (name && name !== s.name) run({ type: "rename", id: s.id, name }, () => renameSectionAction(galleryId, s.id, name))
                    }}
                  >
                    <Field label="Section name" hideLabel name="name" defaultValue={s.name} autoFocus maxLength={60} autoComplete="off" className="min-w-0 flex-1" />
                    <Button type="submit" size="sm">Save</Button>
                    <Button type="button" size="sm" variant="quiet" onClick={() => setEditing(null)}>Cancel</Button>
                  </form>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-ink">{s.name}</span>
                    <IconBtn label={`Move ${s.name} up`} disabled={i === 0 || saving} onClick={() => run({ type: "move", id: s.id, direction: -1 }, () => moveSectionAction(galleryId, s.id, -1))} icon="arrow-up" />
                    <IconBtn label={`Move ${s.name} down`} disabled={i === optimistic.length - 1 || saving} onClick={() => run({ type: "move", id: s.id, direction: 1 }, () => moveSectionAction(galleryId, s.id, 1))} icon="arrow-down" />
                    <IconBtn label={`Rename ${s.name}`} disabled={saving} onClick={() => setEditing(s.id)} icon="pencil" />
                    <IconBtn label={`Delete ${s.name}`} danger disabled={saving} onClick={() => run({ type: "delete", id: s.id }, () => deleteSectionAction(galleryId, s.id))} icon="trash" />
                  </>
                )}
              </motion.li>
            )
          })}
        </AnimatePresence>
        {optimistic.length === 0 && <li className="py-4 type-caption font-normal text-ink-muted">No sections yet. Photos show in one list until you add some.</li>}
      </ol>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const name = newName.trim()
          if (!name) return
          setNewName("")
          run({ type: "add", name }, () => addSectionAction(galleryId, name))
        }}
      >
        <Field
          label="New section name"
          hideLabel
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a section, like Engagement…"
          maxLength={60}
          autoComplete="off"
          className="min-w-0 flex-1"
        />
        <Button type="submit" variant="secondary" disabled={!newName.trim()}>
          <Icon name="plus" className="size-4" />
          Add
        </Button>
      </form>
      {error && <p className="mt-3 type-caption text-danger" role="alert">{error}</p>}
    </div>
  )
}

function IconBtn({ label, icon, onClick, disabled, danger }: { label: string; icon: IconName; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn("grid size-10 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-sunken disabled:opacity-30", danger ? "hover:text-danger" : "hover:text-ink")}
    >
      <Icon name={icon} className="size-[18px]" />
    </button>
  )
}

/** Delete with a typed confirmation: deleting a gallery can't be undone. */
export function DeleteGallery({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState("")
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      <Button size="sm" variant="quiet" aria-label="Delete gallery" title="Delete gallery" className="text-ink-muted hover:text-danger" onClick={() => setOpen(true)}>
        <Icon name="trash" className="size-4" />
        <span className="hidden sm:inline">Delete</span>
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Delete this gallery?">
        <p className="text-ink-muted">
          This removes the gallery, its sections and every photo, and the client link stops working. It can’t be undone. Type{" "}
          <span className="font-semibold text-ink">{title}</span> to confirm.
        </p>
        <Field label="Gallery name" hideLabel value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="mt-4" />
        {error && <p className="mt-2 type-caption text-danger" role="alert">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="quiet" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={typed.trim() !== title.trim() || pending}
            onClick={() =>
              start(async () => {
                const r = await deleteGalleryAction(id)
                if (r && !r.ok) setError(r.message ?? "Couldn't delete. Try again.")
              })
            }
          >
            {pending ? <Aperture className="size-4" /> : null}
            {pending ? "Deleting…" : "Delete gallery"}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
