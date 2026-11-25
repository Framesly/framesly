import { z } from "zod"

import { toSlug, validateStudioSlug } from "@/lib/reserved-slugs"

/** Shared form schemas: the same rules run in the browser and in server actions. */

export const emailSchema = z.string().trim().toLowerCase().email("Enter an email address like you@studio.com.")

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[a-zA-Z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.")

export const planSchema = z.enum(["solo", "studio", "collective"]).optional().catch(undefined)

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(120, "Use 120 characters or fewer."),
  email: emailSchema,
  password: passwordSchema,
  plan: planSchema,
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
})

export const studioNameSchema = z.string().trim().min(2, "Enter your studio name.").max(80, "Use 80 characters or fewer.")

export const studioSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .superRefine((value, ctx) => {
    const error = validateStudioSlug(value)
    if (error) ctx.addIssue({ code: "custom", message: error })
  })

export const brandColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour like #F2A93B.")
  .transform((v) => v.toUpperCase())

export const regionSchema = z.enum(["us", "eu", "in"], { message: "Choose where your photos are stored." })

export const createStudioSchema = z.object({
  name: studioNameSchema,
  slug: studioSlugSchema,
  brandColor: brandColorSchema,
  region: regionSchema,
})

export const updateStudioSchema = z.object({
  name: studioNameSchema,
  slug: studioSlugSchema,
  brandColor: brandColorSchema,
})

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(120, "Use 120 characters or fewer."),
})

export const sectionPresets = {
  "one-day": ["Getting ready", "Ceremony", "Reception"],
  "multi-day": ["Haldi", "Mehendi", "Sangeet", "Ceremony", "Reception"],
  none: [],
} as const
export type SectionPreset = keyof typeof sectionPresets

export const createGallerySchema = z.object({
  title: z.string().trim().min(1, "Give the gallery a name, like the couple's names.").max(120, "Use 120 characters or fewer."),
  eventDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a date like 2026-02-14."),
  preset: z.enum(["one-day", "multi-day", "none", "custom"]).default("multi-day"),
  customSections: z.string().optional(),
})

export const sectionNameSchema = z.string().trim().min(1, "Name the section.").max(60, "Use 60 characters or fewer.")

/** Client link name: framesly.app/g/<slug>. Same rule as the database check. */
export const publicSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/, "Use 3 to 60 letters, numbers or hyphens, starting and ending with a letter or number.")

export const publishGallerySchema = z.object({
  slug: publicSlugSchema,
  /** New password; empty keeps the current one (or none). */
  password: z.string().max(72, "Use 72 characters or fewer.").optional().transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || v.length >= 4, "Use at least 4 characters."),
  removePassword: z.boolean().optional().default(false),
  /** Replace the key with a new generated one (ignored when a password is given). */
  resetKey: z.boolean().optional().default(false),
  /** ISO timestamp from the browser (end of the chosen day, local time), or null for no expiry. */
  expiresAt: z.iso.datetime({ offset: true }).nullable().optional().default(null),
})

/** Turn zod errors into { field: message } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form")
    out[key] ??= issue.message
  }
  return out
}

export { toSlug }
