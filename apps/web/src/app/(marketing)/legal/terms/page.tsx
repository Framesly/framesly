import type { Metadata } from "next"

import { ProsePage } from "@/components/site/prose-page"
import { ContactEmail } from "@/components/site/social-links"
import { pageMeta } from "@/lib/site"

export const metadata: Metadata = {
  ...pageMeta("/legal/terms"),
  title: "Terms",
}

export default function TermsPage() {
  return (
    <ProsePage eyebrow="Legal" title="Terms of service" updated="Draft · not yet in force">
      <p>The terms of service will be published here before the paid beta opens.</p>
      <h2>What to cover</h2>
      <p>Accounts and studios, acceptable use, ownership of uploaded photos, client gallery access, billing and refunds, and termination.</p>
      <h2>Contact</h2>
      <p>
        Framesly is a Parvathy Studios SaaS. Questions about this page: <ContactEmail className="text-ink" />.
      </p>
    </ProsePage>
  )
}
