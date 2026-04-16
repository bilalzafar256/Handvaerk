import { auth } from "@clerk/nextjs/server"
import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Briefcase, FileText, CreditCard, Check } from "lucide-react"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { userId } = await auth()
  if (userId) redirect("/overview")

  const t = await getTranslations("Landing")

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--workshop-50)", color: "var(--workshop-900)" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: "oklch(0.98 0.004 75 / 0.92)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--workshop-200)",
        }}
      >
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <span
            className="text-[18px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--workshop-900)" }}
          >
            Håndværk Pro
          </span>
          <Link
            href="/sign-in"
            className="text-[15px] font-medium transition-colors"
            style={{ fontFamily: "var(--font-body)", color: "var(--workshop-600)" }}
          >
            {t("nav.signIn")}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-24 text-center">
        <p
          className="inline-flex items-center px-3 h-7 rounded-full text-xs font-medium tracking-wider uppercase mb-6 border"
          style={{
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--amber-100)",
            color: "var(--amber-800)",
            borderColor: "var(--amber-300)",
          }}
        >
          {t("hero.eyebrow")}
        </p>

        <h1
          className="text-[40px] sm:text-[52px] font-bold leading-[1.1] tracking-tight mb-6 max-w-2xl mx-auto"
          style={{ fontFamily: "var(--font-display)", color: "var(--workshop-900)" }}
        >
          {t("hero.headline")}
        </h1>

        <p
          className="text-[18px] leading-relaxed mb-10 max-w-lg mx-auto"
          style={{ fontFamily: "var(--font-body)", color: "var(--workshop-500)" }}
        >
          {t("hero.sub")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center h-12 px-8 rounded-[10px] text-[16px] font-medium transition-all active:scale-[0.98]"
            style={{
              fontFamily: "var(--font-body)",
              backgroundColor: "var(--amber-500)",
              color: "oklch(0.12 0.005 55)",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            {t("hero.cta")}
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center h-12 px-8 rounded-[10px] text-[16px] font-medium border transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              backgroundColor: "var(--surface)",
              color: "var(--workshop-700)",
              borderColor: "var(--workshop-200)",
            }}
          >
            {t("hero.ctaSecondary")}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section
        className="border-t border-b py-20"
        style={{ borderColor: "var(--workshop-200)", backgroundColor: "var(--workshop-100)" }}
      >
        <div className="mx-auto max-w-5xl px-4">
          <h2
            className="text-[28px] font-bold text-center mb-14"
            style={{ fontFamily: "var(--font-display)", color: "var(--workshop-900)" }}
          >
            {t("features.headline")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Briefcase,
                title: t("features.jobs.title"),
                desc: t("features.jobs.desc"),
              },
              {
                icon: FileText,
                title: t("features.quotes.title"),
                desc: t("features.quotes.desc"),
              },
              {
                icon: CreditCard,
                title: t("features.invoices.title"),
                desc: t("features.invoices.desc"),
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-[10px] p-6 border"
                style={{
                  backgroundColor: "oklch(1.00 0.000 0)",
                  borderColor: "var(--workshop-200)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-[8px] flex items-center justify-center mb-4"
                  style={{ backgroundColor: "var(--amber-100)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "var(--amber-600)" }} strokeWidth={1.5} />
                </div>
                <p
                  className="text-[17px] font-semibold mb-2"
                  style={{ fontFamily: "var(--font-display)", color: "var(--workshop-900)" }}
                >
                  {title}
                </p>
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ fontFamily: "var(--font-body)", color: "var(--workshop-500)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <h2
          className="text-[28px] font-bold text-center mb-3"
          style={{ fontFamily: "var(--font-display)", color: "var(--workshop-900)" }}
        >
          {t("pricing.headline")}
        </h2>
        <p
          className="text-[16px] text-center mb-12"
          style={{ fontFamily: "var(--font-body)", color: "var(--workshop-500)" }}
        >
          {t("pricing.sub")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Free */}
          <PricingCard
            name={t("pricing.free.name")}
            price={t("pricing.free.price")}
            perMonth={t("pricing.perMonth")}
            desc={t("pricing.free.desc")}
            features={[t("pricing.free.f1"), t("pricing.free.f2"), t("pricing.free.f3")]}
            cta={t("pricing.free.cta")}
            href="/sign-up"
            highlight={false}
          />
          {/* Solo */}
          <PricingCard
            name={t("pricing.solo.name")}
            price={t("pricing.solo.price")}
            perMonth={t("pricing.perMonth")}
            desc={t("pricing.solo.desc")}
            features={[t("pricing.solo.f1"), t("pricing.solo.f2"), t("pricing.solo.f3")]}
            cta={t("pricing.solo.cta")}
            href="/sign-up"
            highlight={true}
          />
          {/* Hold */}
          <PricingCard
            name={t("pricing.hold.name")}
            price={t("pricing.hold.price")}
            perMonth={t("pricing.perMonth")}
            desc={t("pricing.hold.desc")}
            features={[t("pricing.hold.f1"), t("pricing.hold.f2"), t("pricing.hold.f3")]}
            cta={t("pricing.hold.cta")}
            href="/sign-up"
            highlight={false}
          />
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-8 text-center"
        style={{ borderColor: "var(--workshop-200)" }}
      >
        <p
          className="text-[13px]"
          style={{ fontFamily: "var(--font-body)", color: "var(--workshop-400)" }}
        >
          <span className="font-semibold" style={{ color: "var(--workshop-700)" }}>
            Håndværk Pro
          </span>
          {" — "}
          {t("footer.tagline")}
        </p>
      </footer>
    </div>
  )
}

function PricingCard({
  name,
  price,
  perMonth,
  desc,
  features,
  cta,
  href,
  highlight,
}: {
  name: string
  price: string
  perMonth: string
  desc: string
  features: string[]
  cta: string
  href: string
  highlight: boolean
}) {
  return (
    <div
      className="rounded-[12px] p-6 border flex flex-col"
      style={{
        backgroundColor: highlight ? "var(--workshop-900)" : "oklch(1.00 0.000 0)",
        borderColor: highlight ? "var(--workshop-900)" : "var(--workshop-200)",
      }}
    >
      <p
        className="text-[12px] font-semibold uppercase tracking-wider mb-1"
        style={{
          fontFamily: "var(--font-body)",
          color: highlight ? "var(--amber-400)" : "var(--workshop-500)",
        }}
      >
        {name}
      </p>
      <div className="flex items-baseline gap-1 mb-1">
        <span
          className="text-[36px] font-bold leading-none"
          style={{
            fontFamily: "var(--font-mono)",
            color: highlight ? "oklch(0.98 0.004 75)" : "var(--workshop-900)",
          }}
        >
          {price}
        </span>
        <span
          className="text-[13px]"
          style={{
            fontFamily: "var(--font-body)",
            color: highlight ? "var(--workshop-400)" : "var(--workshop-400)",
          }}
        >
          {perMonth}
        </span>
      </div>
      <p
        className="text-[13px] mb-6"
        style={{
          fontFamily: "var(--font-body)",
          color: highlight ? "var(--workshop-400)" : "var(--workshop-500)",
        }}
      >
        {desc}
      </p>
      <ul className="space-y-2.5 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2.5">
            <Check
              className="w-4 h-4 shrink-0"
              style={{ color: highlight ? "var(--amber-400)" : "var(--amber-600)" }}
              strokeWidth={2.5}
            />
            <span
              className="text-[14px]"
              style={{
                fontFamily: "var(--font-body)",
                color: highlight ? "oklch(0.88 0.008 70)" : "var(--workshop-700)",
              }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="inline-flex items-center justify-center h-11 rounded-[10px] text-[15px] font-medium transition-all active:scale-[0.98]"
        style={{
          fontFamily: "var(--font-body)",
          backgroundColor: highlight ? "var(--amber-500)" : "var(--workshop-100)",
          color: highlight ? "oklch(0.12 0.005 55)" : "var(--workshop-700)",
          boxShadow: highlight ? "var(--shadow-accent)" : "none",
        }}
      >
        {cta}
      </Link>
    </div>
  )
}
