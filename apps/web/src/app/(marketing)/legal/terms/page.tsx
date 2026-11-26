import type { Metadata } from "next"
import Link from "next/link"

import { ProsePage } from "@/components/site/prose-page"
import { ContactEmail } from "@/components/site/social-links"
import { LEGAL_VERSIONS, lastUpdated } from "@/lib/legal"
import { pageMeta } from "@/lib/site"

export const metadata: Metadata = {
  ...pageMeta("/legal/terms"),
  title: "Terms",
}

export default function TermsPage() {
  return (
    <ProsePage eyebrow="Legal" title="Terms of service" updated={lastUpdated(LEGAL_VERSIONS.terms)}>
      <p>
        These terms are the agreement between you and Parvathy Studios (&ldquo;we&rdquo;, &ldquo;us&rdquo;), which
        operates Framesly. By creating an account or using Framesly you accept them. If you use Framesly for a
        studio or company, you confirm you can accept these terms on its behalf.
      </p>

      <h2>1. What Framesly is</h2>
      <p>
        Framesly is a service for photographers and videographers. You upload your work, organise it into
        galleries and share private gallery links with your clients. Some features on our pricing page are marked
        &ldquo;Coming soon&rdquo;. They are not part of the service until we release them, and we may change
        their scope or price before then.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must be at least 18 and able to enter a binding contract.</li>
        <li>Give us accurate details and keep your password and sign-in methods secure. You are responsible for what happens under your account.</li>
        <li>A studio has an owner. Owners decide who else can access the studio and are responsible for those people.</li>
        <li>Tell us at once if you think someone else has access to your account.</li>
      </ul>

      <h2>3. Your photos and content</h2>
      <p>
        <strong>You own your content.</strong> Photos, videos, logos, gallery titles and everything else you upload
        remain yours (or your clients&apos;, where your own contract says so). We do not claim ownership.
      </p>
      <p>
        <strong>What we may do with it.</strong> You give us a limited licence to store, copy, resize, process and
        display your content, and to deliver it to the people you share it with, only so we can run Framesly for
        you. That includes making smaller web copies for fast viewing, and signed, expiring links for galleries.
        The licence ends when you delete the content or close your account, apart from short delays in removing
        backups.
      </p>
      <p>
        <strong>What you promise.</strong> You have the rights needed to upload your content and share it with your
        clients, including permission from the people in it where the law or your contracts require it. Your
        content must not break the law or anyone&apos;s rights.
      </p>
      <p>
        We do not sell your photos and we do not use them to train AI models without a separate, explicit opt-in
        from you.
      </p>

      <h2>4. Client galleries</h2>
      <p>
        When you publish a gallery, anyone who has the link (and the password, if you set one) can view it until
        it expires or you unpublish it. You decide who receives the link. Treat the link and password like keys.
        Your clients can mark favourite photos without creating an account, and you can see those picks.
      </p>
      <p>
        You are responsible for your relationship with your clients, including telling them how their images and
        details are used. For client and guest personal data, you decide how it is used and we process it for you
        (see the <Link href="/legal/privacy">privacy policy</Link>).
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>upload content that is illegal, sexually exploits or endangers children, or is defamatory, hateful or harassing;</li>
        <li>upload content you have no right to share, or use Framesly to infringe copyright;</li>
        <li>try to access other studios&apos; data, galleries or accounts, or probe, scrape or overload the service;</li>
        <li>upload malware or interfere with how Framesly works;</li>
        <li>resell or sublicense Framesly without our written agreement;</li>
        <li>use the service for a purpose we could not reasonably have expected from a photo and video delivery tool, such as hosting files unrelated to your work.</li>
      </ul>
      <p>
        If we receive a credible complaint, or believe you broke these rules, we may remove content, disable a
        gallery or suspend the account. Where we can, we tell you first and give you a chance to fix the problem.
      </p>

      <h2>6. Plans, trials and payment</h2>
      <p>
        Plans, storage limits and prices are shown on the <Link href="/pricing">pricing page</Link>. Paid plans are
        not open yet. When they open, these terms apply:
      </p>
      <ul>
        <li>New accounts may get a free trial. We tell you its length and what happens at the end before you start it.</li>
        <li>Paid plans are billed in advance, monthly or yearly, in the currency shown at checkout. Prices exclude taxes such as GST or VAT, which we add where required.</li>
        <li>Plans renew automatically until you cancel. You can cancel at any time from your account, and your plan stays active until the end of the period you paid for.</li>
        <li>Fees already paid are not refunded, except where the law requires it or we agree otherwise in writing.</li>
        <li>We will give at least 30 days&apos; notice before raising the price of a plan you are already on.</li>
        <li>If you go over your storage limit, we may ask you to upgrade or remove files, and we may stop new uploads until you do.</li>
      </ul>

      <h2>7. Keeping your work safe</h2>
      <p>
        We take reasonable steps to protect your content and keep the service available. No service is perfect, so
        keep your own copies of originals. Framesly is not a replacement for your own backups, and you remain
        responsible for them.
      </p>

      <h2>8. Ending your account</h2>
      <p>
        You can stop using Framesly at any time and ask us to delete your account. We may suspend or end your
        account if you break these terms, if you do not pay, or if the law requires it. If we end your account
        for any other reason, we give you notice and a reasonable time to download your content. After an account
        closes we delete its content within 30 days, except where the law requires us to keep it, and backups
        clear out shortly after.
      </p>

      <h2>9. Our service and our rights</h2>
      <p>
        Framesly&apos;s software, design and brand belong to Parvathy Studios and its licensors. You get a
        personal, non-exclusive right to use the service under these terms, nothing more. If you send us feedback,
        we may use it without paying you.
      </p>

      <h2>10. Warranties and liability</h2>
      <p>
        Framesly is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the extent the law allows, we
        do not promise it will be uninterrupted or error-free, and we exclude all other warranties.
      </p>
      <p>
        To the extent the law allows, we are not liable for indirect or consequential loss, lost profits, lost
        bookings or lost data. Our total liability for any claim relating to Framesly is limited to the fees you
        paid us in the 12 months before the claim arose, or INR 5,000 if you have not paid us anything. Nothing in
        these terms limits liability that cannot be limited by law, and your statutory consumer rights are not
        affected.
      </p>
      <p>
        You agree to cover losses we suffer because your content or your use of Framesly breaks the law or
        someone&apos;s rights, for example a claim that you uploaded photos you had no right to share.
      </p>

      <h2>11. Changes to the service and these terms</h2>
      <p>
        We keep improving Framesly and may change or retire features. If we change these terms in a way that
        matters, we tell you by email or in the app at least 14 days before it takes effect. If you do not agree,
        you can close your account before then. Using Framesly after the change means you accept it.
      </p>

      <h2>12. Governing law and disputes</h2>
      <p>
        These terms are governed by the laws of India. Courts in India have exclusive jurisdiction, except that
        consumers keep any right they have under the law of their own country to bring a case locally. Please
        contact us first so we can try to settle a problem informally.
      </p>

      <h2>13. General</h2>
      <p>
        If part of these terms cannot be enforced, the rest still applies. If we do not enforce a right straight
        away, we have not given it up. You may not transfer your account or these terms to someone else without our
        consent. These terms and the <Link href="/legal/privacy">privacy policy</Link> are the whole agreement
        between us about Framesly.
      </p>

      <h2>Contact</h2>
      <p>
        Framesly is a Parvathy Studios SaaS. Questions about these terms: <ContactEmail />.
      </p>
    </ProsePage>
  )
}
