import Link from "next/link"

export default function GalleryNotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="type-heading-1">Gallery not found</h1>
      <p className="mt-3 text-ink-muted">It may have been deleted, or it belongs to another studio.</p>
      <Link href="/galleries" className="mt-6 inline-block font-semibold text-safelight-text underline-offset-4 hover:underline">Back to your galleries</Link>
    </div>
  )
}
