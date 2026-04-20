import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | Håndværk Pro",
}

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p className="text-sm mb-10" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
        Last updated: April 2026
      </p>

      <div
        className="prose max-w-none space-y-8"
        style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
      >
        <Section title="Who we are">
          <p>
            Håndværk Pro is a job management platform for Danish tradespeople. We are the data controller
            for all personal data you provide when using the service.
          </p>
        </Section>

        <Section title="What data we collect">
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Account data:</strong> Email address, phone number, company name, CVR number, address, and hourly rate provided during sign-up and profile setup.</li>
            <li><strong>Customer data:</strong> Names, phone numbers, email addresses, and addresses of your customers that you enter.</li>
            <li><strong>Business records:</strong> Jobs, quotes, invoices, and line items you create on the platform.</li>
            <li><strong>AI recordings:</strong> Voice recordings uploaded for AI job extraction. These are permanently deleted immediately after processing — they are never stored beyond the processing step.</li>
            <li><strong>Usage data:</strong> Pages visited, features used, and interaction events (collected via PostHog analytics).</li>
            <li><strong>Error data:</strong> Technical error details (collected via Sentry for debugging).</li>
          </ul>
        </Section>

        <Section title="Legal basis for processing">
          <p>
            We process your data under the following legal bases (GDPR Article 6):
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Contract performance:</strong> Processing your profile, customers, jobs, quotes, and invoices is necessary to deliver the service.</li>
            <li><strong>Legitimate interest:</strong> Analytics and error tracking to improve the product.</li>
            <li><strong>Consent:</strong> Analytics cookies (PostHog), which you can decline via our cookie banner.</li>
          </ul>
        </Section>

        <Section title="Data retention">
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>AI audio recordings:</strong> Deleted immediately after AI processing completes.</li>
            <li><strong>Account and business data:</strong> Retained while your account is active. Upon account deletion, all data is permanently removed after a 30-day grace period.</li>
            <li><strong>Analytics data:</strong> Retained according to PostHog&apos;s standard retention policy.</li>
          </ul>
        </Section>

        <Section title="Third-party processors">
          <p className="text-sm mb-3">We use the following sub-processors to deliver the service:</p>
          <div className="space-y-3 text-sm">
            {[
              { name: "Clerk", purpose: "Authentication and user identity management", location: "USA (EU data residency option)" },
              { name: "Neon", purpose: "PostgreSQL database hosting", location: "EU (Frankfurt)" },
              { name: "Vercel", purpose: "Application hosting and file storage", location: "EU" },
              { name: "Resend", purpose: "Transactional email delivery", location: "USA" },
              { name: "Groq", purpose: "AI transcription and data extraction from voice recordings", location: "USA" },
              { name: "PostHog", purpose: "Product analytics", location: "EU" },
              { name: "Sentry", purpose: "Error tracking and debugging", location: "USA" },
            ].map(({ name, purpose, location }) => (
              <div key={name} className="flex gap-3">
                <span className="font-semibold w-20 shrink-0" style={{ color: "var(--text-primary)" }}>{name}</span>
                <span>{purpose} — {location}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Your rights">
          <p>Under GDPR, you have the following rights:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Right of access:</strong> Download a copy of all your data via Settings → Profile → Export data.</li>
            <li><strong>Right to erasure:</strong> Delete your account at any time via Settings → Profile → Delete account. All data is permanently deleted after 30 days.</li>
            <li><strong>Right to portability:</strong> Your data export is provided in machine-readable JSON format.</li>
            <li><strong>Right to object:</strong> You can decline analytics cookies at any time via the cookie banner.</li>
          </ul>
        </Section>

        <Section title="Cookies">
          <p>
            We use a single analytics cookie from PostHog to understand how the product is used. No
            advertising cookies. No third-party tracking. You can accept or decline analytics cookies
            via the banner shown on your first visit.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For any privacy-related questions or to exercise your rights, contact us at:{" "}
            <a
              href="mailto:privacy@handvaerk.pro"
              style={{ color: "var(--primary)" }}
            >
              privacy@handvaerk.pro
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
