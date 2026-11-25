import type { Metadata } from "next"

import { ProsePage } from "@/components/site/prose-page"
import { ContactEmail } from "@/components/site/social-links"
import { pageMeta } from "@/lib/site"

export const metadata: Metadata = {
  ...pageMeta("/legal/privacy"),
  title: "Privacy",
}

export default function PrivacyPage() {
  return (
    <ProsePage eyebrow="Legal" title="Privacy policy" updated="Draft · not yet in force">
      <p>The privacy policy will be published here before the paid beta opens.</p>
      <h2>What to cover</h2>
      <p>What we store and where, how photos are processed for culling, client and guest data, cookies and analytics consent, and rights under GDPR and India&apos;s DPDP Act.</p>
      <h2>Contact</h2>
      <p>
        Framesly is a Parvathy Studios SaaS. Questions about this page: <ContactEmail className="text-ink" />.
      </p>
    </ProsePage>
  )
}
