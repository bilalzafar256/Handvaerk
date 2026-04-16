import Link from "next/link"
import { BookOpen, Wrench, ArrowRight } from "lucide-react"

const coreDocs = [
  {
    slug: "CONTEXT",
    title: "Project Context",
    description: "Architecture overview, docs map, skills map, and phase status",
  },
  {
    slug: "FEATURES",
    title: "Feature Specification",
    description: "All features with tracking status across every phase",
  },
  {
    slug: "BUSINESS_PLAN",
    title: "Business Plan",
    description: "Product vision, business model, full tech stack, and project structure",
  },
  {
    slug: "MOBILE_DESIGN",
    title: "Mobile Design",
    description: "Mobile UX constraints, patterns, and layout decisions",
  },
  {
    slug: "GDPR",
    title: "GDPR",
    description: "Privacy compliance requirements and data handling",
  },
  {
    slug: "REPORTING",
    title: "Reporting",
    description: "Analytics and reporting specifications",
  },
]

const skills = [
  { slug: "skills/DESIGN_SKILL", title: "Design System" },
  { slug: "skills/NEXTJS_SKILL", title: "Next.js" },
  { slug: "skills/DRIZZLE_SKILL", title: "Drizzle ORM" },
  { slug: "skills/CLERK_SKILL", title: "Clerk Auth" },
  { slug: "skills/UPSTASH_SKILL", title: "Upstash" },
  { slug: "skills/INNGEST_SKILL", title: "Inngest" },
  { slug: "skills/SHADCN_SKILL", title: "shadcn/ui" },
  { slug: "skills/RESEND_SKILL", title: "Resend" },
  { slug: "skills/INTL_SKILL", title: "Internationalisation" },
  { slug: "skills/MOTION_SKILL", title: "Motion Animations" },
  { slug: "skills/BLOB_SKILL", title: "Vercel Blob" },
  { slug: "skills/PDF_SKILL", title: "PDF Generation" },
  { slug: "skills/POSTHOG_SKILL", title: "PostHog" },
  { slug: "skills/ZUSTAND_SKILL", title: "Zustand" },
]

export default function DocsIndex() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border,oklch(0.88_0.008_70))] bg-[var(--surface,white)]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--amber-500,oklch(0.70_0.19_62))] flex items-center justify-center">
            <Wrench className="w-4 h-4 text-[var(--accent-foreground-brand,oklch(0.12_0.005_55))]" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-[18px] font-700 leading-none text-[var(--text-primary)]">
              Håndværk Pro
            </h1>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider font-500">
              Internal Docs
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Core docs */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-[var(--text-secondary)]" />
            <h2 className="font-[family-name:var(--font-display)] text-[18px] font-600 text-[var(--text-primary)]">
              Documentation
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {coreDocs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="group block p-5 bg-[var(--surface,white)] border border-[var(--border,oklch(0.88_0.008_70))] hover:border-[var(--amber-400,oklch(0.76_0.17_64))] hover:shadow-sm transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-[family-name:var(--font-display)] text-[15px] font-600 text-[var(--text-primary)] leading-snug">
                    {doc.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--amber-500)] shrink-0 mt-0.5 transition-colors" />
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  {doc.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-5">
            <Wrench className="w-4 h-4 text-[var(--text-secondary)]" />
            <h2 className="font-[family-name:var(--font-display)] text-[18px] font-600 text-[var(--text-primary)]">
              Skills
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {skills.map((skill) => (
              <Link
                key={skill.slug}
                href={`/docs/${skill.slug}`}
                className="group flex items-center justify-between gap-2 px-4 py-3 bg-[var(--surface,white)] border border-[var(--border,oklch(0.88_0.008_70))] hover:border-[var(--amber-400,oklch(0.76_0.17_64))] hover:shadow-sm transition-all duration-150"
              >
                <span className="text-[13px] font-500 text-[var(--text-primary)]">{skill.title}</span>
                <ArrowRight className="w-3 h-3 text-[var(--text-tertiary)] group-hover:text-[var(--amber-500)] shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
