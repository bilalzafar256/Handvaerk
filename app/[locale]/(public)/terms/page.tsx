import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | Håndværk Pro",
}

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <Link
          href="/"
          className="text-sm font-medium"
          style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
        >
          ← Håndværk Pro
        </Link>
      </div>

      <h1
        className="text-3xl font-bold mb-2"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        Terms of Service
      </h1>
      <p className="text-sm mb-10" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
        Last updated: April 2026
      </p>

      <div className="space-y-8" style={{ fontFamily: "var(--font-body)" }}>
        <Section title="1. The service">
          <p>
            Håndværk Pro is a job management tool for Danish tradespeople. It helps you manage
            customers, jobs, quotes, and invoices. The service is provided as-is via a web application
            accessible at handvaerk.pro.
          </p>
        </Section>

        <Section title="2. Account and eligibility">
          <p>
            To use Håndværk Pro you must create an account using a valid email address or phone number.
            You are responsible for keeping your login credentials secure. You must be at least 18 years
            old and operating a legal business to use the service.
          </p>
        </Section>

        <Section title="3. Subscription and payment">
          <p>
            Håndværk Pro offers a free tier and paid subscription plans. Paid plans are billed
            monthly or annually. You can cancel at any time — your subscription remains active until
            the end of the current billing period. We do not issue pro-rated refunds for partial months.
          </p>
          <p>
            Prices are shown in Danish Krone (DKK) and include 25% VAT (moms) where applicable.
            We reserve the right to change pricing with 30 days&apos; notice.
          </p>
        </Section>

        <Section title="4. Your data">
          <p>
            You retain full ownership of all data you enter into Håndværk Pro — customer records,
            jobs, quotes, and invoices. You grant us a limited license to store and process that data
            solely to deliver the service. We do not sell your data to third parties.
          </p>
          <p>
            You can export all your data at any time and delete your account at any time. See our{" "}
            <Link href="/en/privacy" style={{ color: "var(--primary)" }}>
              Privacy Policy
            </Link>{" "}
            for full details on data handling.
          </p>
        </Section>

        <Section title="5. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Use the service for any unlawful purpose or in violation of Danish law.</li>
            <li>Attempt to gain unauthorized access to the platform or other users&apos; data.</li>
            <li>Upload malicious code, spam, or content that violates third-party rights.</li>
            <li>Resell or sublicense access to the service without written permission.</li>
          </ul>
        </Section>

        <Section title="6. AI features">
          <p>
            Håndværk Pro includes AI-powered features (voice recording transcription and data
            extraction). AI outputs are suggestions only — you are responsible for reviewing and
            verifying all AI-extracted data before using it in quotes, invoices, or customer records.
            AI audio recordings are permanently deleted immediately after processing.
          </p>
        </Section>

        <Section title="7. Invoices and financial data">
          <p>
            Håndværk Pro is a tool to help you create and manage invoices. We are not an accounting
            firm and do not provide financial, legal, or tax advice. You are responsible for ensuring
            your invoices comply with Danish tax law (momslovgivning) and bookkeeping requirements.
          </p>
        </Section>

        <Section title="8. Limitation of liability">
          <p>
            To the maximum extent permitted by law, Håndværk Pro is not liable for any indirect,
            incidental, or consequential damages arising from your use of the service — including
            lost revenue, lost data, or business interruption. Our total liability shall not exceed
            the amount you paid us in the three months preceding the claim.
          </p>
        </Section>

        <Section title="9. Service availability">
          <p>
            We aim for high availability but do not guarantee uninterrupted access. Planned
            maintenance will be announced in advance where possible. We are not liable for downtime
            caused by third-party services (hosting, auth, database).
          </p>
        </Section>

        <Section title="10. Changes to terms">
          <p>
            We may update these terms. Material changes will be communicated via email or in-app
            notification with at least 14 days&apos; notice. Continued use after the effective date
            constitutes acceptance.
          </p>
        </Section>

        <Section title="11. Governing law">
          <p>
            These terms are governed by Danish law. Any disputes shall be resolved in the courts of
            Copenhagen, Denmark.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these terms:{" "}
            <a href="mailto:legal@handvaerk.pro" style={{ color: "var(--primary)" }}>
              legal@handvaerk.pro
            </a>
          </p>
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-base font-semibold mb-3"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        {title}
      </h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: "var(--text-secondary)" }}>
        {children}
      </div>
    </section>
  )
}
