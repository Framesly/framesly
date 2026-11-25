"use client"

import { useActionState, useState } from "react"

import { FormAlert, SubmitButton } from "@/components/auth/primitives"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Dialog } from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { Icon } from "@/components/ui/icon"
import { createGalleryAction } from "@/features/galleries/actions"
import { idle } from "@/lib/action-state"
import { cn } from "@/lib/utils"

const presets = [
  { value: "multi-day", label: "Multi-day wedding", sections: "Haldi, Mehendi, Sangeet, Ceremony, Reception" },
  { value: "one-day", label: "One-day wedding", sections: "Getting ready, Ceremony, Reception" },
  { value: "custom", label: "My own sections", sections: "Type them below" },
  { value: "none", label: "No sections yet", sections: "Add them later" },
] as const

/** "New gallery" dialog: title, date and a section preset. */
export function NewGalleryDialog({ label = "New gallery", variant = "primary" }: { label?: string; variant?: "primary" | "secondary" }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Icon name="plus" className="size-[18px]" />
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="New gallery">
        <NewGalleryForm onCancel={() => setOpen(false)} />
      </Dialog>
    </>
  )
}

function NewGalleryForm({ onCancel }: { onCancel: () => void }) {
  const [state, action] = useActionState(createGalleryAction, idle)
  const [preset, setPreset] = useState<(typeof presets)[number]["value"]>((state.values?.preset as never) ?? "multi-day")
  const [date, setDate] = useState<string | null>(state.values?.eventDate || null)
  return (
    <form action={action} className="space-y-6" noValidate>
      {state.message && <FormAlert>{state.message}</FormAlert>}
      <Field label="Gallery name" name="title" placeholder="Aarohi & Kabir…" required autoComplete="off" defaultValue={state.values?.title} error={state.fieldErrors?.title} autoFocus />
      <div>
        <p className="mb-2 type-caption text-ink">Wedding date</p>
        <input type="hidden" name="eventDate" value={date ?? ""} />
        <DatePicker label="Wedding date" value={date} onChange={setDate} placeholder="Add a date (optional)" />
        <p className={cn("mt-1.5 type-caption font-normal", state.fieldErrors?.eventDate ? "text-danger" : "text-ink-muted")}>
          {state.fieldErrors?.eventDate ?? "Optional. Helps you find galleries later."}
        </p>
      </div>
      <fieldset>
        <legend className="type-caption text-ink">Sections</legend>
        <p className="mt-1 type-caption font-normal text-ink-muted">One section per event. You can rename or reorder them later.</p>
        <input type="hidden" name="preset" value={preset} />
        <div role="radiogroup" aria-label="Section preset" className="mt-3 grid gap-2 sm:grid-cols-2">
          {presets.map((p) => {
            const on = preset === p.value
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPreset(p.value)}
                className={cn("rounded-[var(--radius-control)] border p-3 text-left transition-colors", on ? "border-safelight bg-safelight-soft" : "border-line hover:border-line-strong")}
              >
                <span className="block type-caption text-ink">{p.label}</span>
                <span className="mt-0.5 block type-caption font-normal text-ink-muted">{p.sections}</span>
              </button>
            )
          })}
        </div>
        {preset === "custom" && (
          <div className="mt-3">
            <Field label="Your sections" name="customSections" placeholder="Engagement, Wedding, After party…" defaultValue={state.values?.customSections} hint="Separate them with commas." autoComplete="off" />
          </div>
        )}
      </fieldset>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="quiet" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Creating…" className="sm:w-auto">
          Create gallery
        </SubmitButton>
      </div>
    </form>
  )
}
