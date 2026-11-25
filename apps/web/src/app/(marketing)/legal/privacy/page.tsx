import type { Metadata } from "next"
import Link from "next/link"

import { ProsePage } from "@/components/site/prose-page"
import { ContactEmail } from "@/components/site/social-links"
import { pageMeta } from "@/lib/site"

export const metadata: Metadata = {
  ...pageMeta("/legal/privacy"),
  title: "Privacy",
}

export default function PrivacyPage() {
  return (
    <ProsePage eyebrow="Legal" title="Privacy policy" updated="Last updated 25 November 2026">
      <p>
        Framesly is operated by Parvathy Studios (&ldquo;we&rdquo;, &ldquo;us&rdquo;). This policy explains what
        personal data we collect, why, who sees it and what choices you have. It covers photographers who use
        Framesly, and the clients and guests who view a gallery a photographer shares.
      </p>

      <h2>Who is responsible for what</h2>
      <ul>
        <li>
          <strong>Photographers and studios.</strong> For your account, studio and billing details, we decide how
          the data is used (we are the &ldquo;controller&rdquo;, or &ldquo;data fiduciary&rdquo; under India&apos;s DPDP Act).
        </li>
        <li>
          <strong>Clients and guests.</strong> For the photos and details in a gallery, the photographer decides
          how they are used and we process them on the photographer&apos;s behalf. If you are a client and want
          to see or remove something, ask your photographer first. You can also write to us and we will pass it
          on or act on it where we can.
        </li>
      </ul>

      <h2>What we collect</h2>
      <p>
        <strong>Account and studio.</strong> Your name, email address and password (stored only as a salted hash by
        our sign-in provider), or your Google account name and email if you sign in with Google. Your studio name,
        address, brand colour, logo, profile picture, the plan you are interested in and the data region you
        chose.
      </p>
      <p>
        <strong>Your content.</strong> Photos and the web copies we generate from them, gallery titles, sections,
        covers, publish settings (link name, expiry date) and gallery passwords. Gallery passwords are stored only
        as bcrypt hashes and cannot be read back, even by us.
      </p>
      <p>
        <strong>Clients and guests.</strong> If you open a client gallery we set a cookie so the gallery stays
        unlocked for 24 hours and a random visitor ID so your favourite photos are remembered. If you choose to,
        you can add a name to your picks. We store your favourites, that optional name and the time. Clients do
        not need an account.
      </p>
      <p>
        <strong>Technical data.</strong> Our hosting and security systems handle IP addresses, browser type and
        request logs so the site works and stays secure. We do not currently run advertising or behavioural
        analytics tools.
      </p>
      <p>
        <strong>Payments.</strong> Paid plans are not open yet. When they open, a payment provider will handle card
        details. We will see your plan, billing country and payment status, never your full card number.
      </p>
      <p>
        <strong>Messages.</strong> Anything you send to us, such as support emails.
      </p>

      <h2>Why we use it</h2>
      <ul>
        <li>To provide Framesly: sign you in, store your photos, build galleries and deliver them to your clients.</li>
        <li>To keep it secure, prevent abuse and fix problems.</li>
        <li>To send service emails, such as sign-in, password reset and account notices.</li>
        <li>To bill you, once paid plans open.</li>
        <li>To meet legal obligations and to handle disputes.</li>
        <li>To improve the product, using the cookie choice described below.</li>
      </ul>
      <p>
        Where the GDPR applies, our legal bases are: performing our contract with you, our legitimate interests in
        running a secure, reliable service, complying with the law, and your consent where we ask for it (for
        example, analytics cookies). Under the DPDP Act we process data for these purposes with your consent or
        for the legitimate uses the Act allows.
      </p>

      <h2>Your photos and AI</h2>
      <p>
        We do not sell your photos, show them to advertisers or use them to train AI models without a separate,
        explicit opt-in from you. AI culling (finding blurred shots, closed eyes and duplicates) is coming soon.
        When it launches it will analyse your photos only to help you, and we will update this policy before then.
        If we ever add face search for guests, we will ask for consent first and explain how the data is handled.
      </p>

      <h2>Where your data is stored and who handles it</h2>
      <p>We use these providers to run Framesly. They process data only to provide their service to us.</p>
      <ul>
        <li><strong>Supabase</strong> for the database, sign-in and storage of logos and profile pictures.</li>
        <li><strong>Cloudflare</strong> for photo storage and fast delivery of galleries.</li>
        <li><strong>Vercel</strong> for hosting the website and app.</li>
        <li><strong>Google</strong>, only if you choose &ldquo;Continue with Google&rdquo;.</li>
        <li><strong>An email delivery provider</strong> for service emails.</li>
        <li><strong>A payment provider</strong>, once paid plans open.</li>
      </ul>
      <p>
        During setup you choose a preferred data region (India, United States or Europe). We record your choice and
        will honour it as regional storage rolls out. Until then, your data may be stored and processed in other
        countries. When we move data across borders we rely on appropriate safeguards, such as standard contractual
        clauses where the GDPR requires them. We do not sell personal data.
      </p>
      <p>
        We may also share data if the law requires it, to protect people&apos;s safety or our rights, or as part of
        a merger or sale of the business (we would tell you first).
      </p>

      <h2>Cookies and similar storage</h2>
      <ul>
        <li><strong>Essential.</strong> Sign-in session cookies, the 24-hour gallery unlock cookie and the visitor ID for favourites. The service does not work without them, so they do not need consent.</li>
        <li><strong>Your choice.</strong> The banner asks whether we may measure how the site is used. Your answer is saved in your browser&apos;s local storage under the key <code>framesly-consent</code>. We load no analytics tools today, so the answer has no effect yet. If we add them, they will load only if you chose &ldquo;Allow analytics&rdquo;.</li>
      </ul>
      <p>You can clear cookies and local storage in your browser at any time. The banner will then ask again.</p>

      <h2>How long we keep data</h2>
      <ul>
        <li>Account and studio data: while your account is open.</li>
        <li>Photos and galleries: until you delete them or close your account. Unpublishing or an expired gallery stops client access but does not delete the photos.</li>
        <li>Client favourites: as long as the gallery exists.</li>
        <li>After closure: we delete your content within 30 days, and it leaves backups shortly after. We keep a small amount of billing and legal records for as long as the law requires.</li>
      </ul>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit. Access to each studio&apos;s data is restricted in the database so one studio
        cannot read another&apos;s. Gallery photos are served through signed links that expire, and gallery
        passwords are hashed. No system is perfectly secure. If a breach affects your data, we will tell you and
        the authorities as the law requires.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live (including under the GDPR, the UK GDPR and India&apos;s DPDP Act), you can ask us to:
      </p>
      <ul>
        <li>give you a copy of your personal data;</li>
        <li>correct data that is wrong or incomplete;</li>
        <li>delete your data or close your account;</li>
        <li>limit or object to some of our uses of it, or withdraw consent you gave;</li>
        <li>move your data to another service;</li>
        <li>name someone to exercise your rights for you if you die or cannot act.</li>
      </ul>
      <p>
        Write to <ContactEmail /> and we will reply within 30 days. If you are unhappy with our answer, you can
        complain to your data protection authority, such as the Data Protection Board of India or the regulator in
        your EU or UK country. We would like the chance to fix the problem first.
      </p>

      <h2>Children</h2>
      <p>
        Framesly is for adults running a photography business. We do not knowingly collect data from children
        through accounts. Photographers may upload photos that include children as part of their work. They
        are responsible for having the consent the law requires, and for how those photos are shared.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy in a way that matters, we will tell you by email or in the app before it takes
        effect, and update the date at the top. Earlier versions are available on request. See also our{" "}
        <Link href="/legal/terms">terms of service</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        Framesly is a Parvathy Studios SaaS. For privacy questions, requests or complaints, including to our
        grievance contact, write to <ContactEmail />.
      </p>
    </ProsePage>
  )
}
