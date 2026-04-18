"use client"

import { useEffect, useRef, useState, useCallback, Fragment } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter as useI18nRouter, usePathname as useI18nPathname } from "@/i18n/navigation"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger, useGSAP)

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return { ref, inView }
}

function usePrefersReduced() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])
  return reduced
}

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  const start = useCallback(() => {
    if (started.current) return
    started.current = true
    const startTime = performance.now()
    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setCount(Math.floor(eased * target))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return { count, start }
}

function useScrolled(threshold = 80) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [threshold])
  return scrolled
}

// ── Smooth scroll helper ───────────────────────────────────────────────────────

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
}

// ── Nordic Blueprint color constants ─────────────────────────────────────────

const S = {
  // Backgrounds — Nordic Blueprint (cobalt, non-black)
  bg: "oklch(0.13 0.035 245)",           // Cobalt Night
  surface: "oklch(0.19 0.04 248)",       // Blueprint surface
  surfaceAlt: "oklch(0.24 0.045 248)",   // Lifted Blueprint
  // Text — birch-warm foreground
  text: "oklch(0.93 0.022 75)",          // Birch White
  textSub: "oklch(0.63 0.03 245)",       // Fog
  textMuted: "oklch(0.42 0.025 245)",    // Fog Deep
  textFaint: "oklch(0.28 0.018 245)",    // Very dim
  // Brand
  amber: "var(--amber-500)",
  amber400: "var(--amber-400)",
  amber600: "var(--amber-600)",
  // Accent
  teal: "oklch(0.68 0.12 185)",          // Nordic Teal (success)
  // Borders
  border: "oklch(1 0 0 / 9%)",
  borderStrong: "oklch(1 0 0 / 16%)",
}

const MAX_W = 1120

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "var(--font-body)",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.10em",
      textTransform: "uppercase",
      color: S.amber,
      marginBottom: 12,
    }}>
      {children}
    </p>
  )
}

// ── Language Switcher ──────────────────────────────────────────────────────────

function LanguageSwitcher() {
  const params = useParams()
  const locale = (params?.locale as string) ?? "en"
  const i18nRouter = useI18nRouter()
  const i18nPathname = useI18nPathname()
  const other = locale === "en" ? "da" : "en"

  return (
    <button
      onClick={() => i18nRouter.replace(i18nPathname, { locale: other })}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 13,
        fontWeight: 600,
        color: S.textSub,
        background: "transparent",
        border: `1px solid ${S.border}`,
        borderRadius: 6,
        padding: "4px 10px",
        cursor: "pointer",
        letterSpacing: "0.06em",
        transition: "color 120ms, border-color 120ms",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.color = S.text
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = S.borderStrong
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.color = S.textSub
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = S.border
      }}
    >
      {other.toUpperCase()}
    </button>
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const scrolled = useScrolled(60)
  const t = useTranslations("Landing")

  const navLinks = [
    [t("nav.features"), "features"],
    [t("nav.pricing"), "pricing"],
    [t("nav.faq"), "faq"],
  ]

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 50,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        backdropFilter: "blur(20px) saturate(200%)",
        backgroundColor: scrolled
          ? `oklch(0.13 0.035 245 / 88%)`
          : "transparent",
        borderBottom: scrolled ? `1px solid ${S.border}` : "1px solid transparent",
        transition: "background-color 200ms ease, border-color 200ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            backgroundColor: S.amber,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="oklch(0.10 0.005 52)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: S.text }}>
            Håndværk Pro
          </span>
        </Link>
        <div className="hidden md:flex" style={{ gap: 4 }}>
          {navLinks.map(([label, id]) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                fontFamily: "var(--font-body)", fontSize: 14, color: S.textSub,
                background: "transparent", border: "none", cursor: "pointer",
                padding: "6px 12px", borderRadius: 6, transition: "color 120ms ease",
                position: "relative",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = S.text}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = S.textSub}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LanguageSwitcher />
        <Link
          href="/sign-in"
          style={{
            fontFamily: "var(--font-body)", fontSize: 14, color: S.textSub,
            textDecoration: "none", padding: "6px 14px", borderRadius: 6,
            transition: "color 120ms ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = S.text)}
          onMouseLeave={e => (e.currentTarget.style.color = S.textSub)}
        >
          {t("nav.signIn")}
        </Link>
        <Link
          href="/sign-up"
          style={{
            fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500,
            color: "oklch(0.10 0.005 52)", backgroundColor: S.amber,
            padding: "7px 16px", borderRadius: 8, textDecoration: "none",
            transition: "box-shadow 120ms, transform 120ms",
            boxShadow: "0 4px 16px oklch(0.720 0.195 58 / 0.35), 0 0 0 0 oklch(0.720 0.195 58 / 0)",
            animation: "ctaPulse 2.5s ease infinite",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"
            ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 20px oklch(0.720 0.195 58 / 0.55)"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = ""
            ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px oklch(0.720 0.195 58 / 0.35)"
          }}
        >
          {t("nav.tryFree")}
        </Link>
      </div>
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function FloatingCard({ text, icon, delay }: { text: string; icon: string; delay: number }) {
  const { ref, inView } = useInView(0.01)
  return (
    <div ref={ref} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "8px 14px", borderRadius: 10,
      background: "oklch(1 0 0 / 6%)", border: `1px solid ${S.border}`,
      backdropFilter: "blur(8px)",
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(12px)",
      transition: `opacity 400ms ${delay}ms var(--ease-smooth), transform 400ms ${delay}ms var(--ease-smooth)`,
      animation: inView ? `cardFloat ${4.5 + delay * 0.002}s ease-in-out ${delay * 0.4}ms infinite` : "none",
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.textSub }}>{text}</span>
    </div>
  )
}

function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const lineRef = useRef<SVGLineElement>(null)
  const [wordsVisible, setWordsVisible] = useState(false)
  const prefersReduced = usePrefersReduced()
  const t = useTranslations("Landing")

  const heroWords1 = t("hero.line1").split(" ")
  const heroWords2 = t("hero.line2").split(" ")

  // GSAP: architect's draft — line draws, then words cascade
  useGSAP(() => {
    if (prefersReduced) { setWordsVisible(true); return }
    const line = lineRef.current
    if (!line) return
    gsap.fromTo(line,
      { strokeDasharray: "100%", strokeDashoffset: "100%" },
      {
        strokeDashoffset: "0%",
        duration: 0.55,
        ease: "power2.out",
        delay: 0.15,
        onComplete: () => setWordsVisible(true),
      }
    )
  }, { scope: heroRef, dependencies: [prefersReduced] })

  function onMouseMove(e: React.MouseEvent) {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    heroRef.current.style.setProperty("--sx", `${x}%`)
    heroRef.current.style.setProperty("--sy", `${y}%`)
  }

  return (
    <section
      ref={heroRef}
      onMouseMove={onMouseMove}
      style={{
        position: "relative", minHeight: "100vh",
        display: "flex", flexDirection: "column",
        backgroundColor: S.bg,
        overflow: "hidden", paddingTop: 60,
      }}
    >
      {/* Blueprint grid — subtle, hue 248 */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(${S.border} 1px, transparent 1px), linear-gradient(90deg, ${S.border} 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at center, black 20%, transparent 80%)",
        maskImage: "radial-gradient(ellipse 80% 80% at center, black 20%, transparent 80%)",
        opacity: 0.6,
      }} />
      {/* Cursor spotlight */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(600px circle at var(--sx, 50%) var(--sy, 40%), oklch(0.720 0.195 58 / 5%), transparent 65%)",
      }} />
      {/* Cobalt depth gradient bottom */}
      <div aria-hidden style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", pointerEvents: "none",
        background: "radial-gradient(ellipse 100% 60% at 50% 100%, oklch(0.52 0.13 250 / 8%), transparent)",
      }} />

      {/* Architect line — GSAP draws this, then words cascade */}
      <svg
        aria-hidden
        style={{ position: "absolute", top: "calc(60px + 180px)", left: 0, width: "100%", height: 2, pointerEvents: "none", zIndex: 5 }}
        preserveAspectRatio="none"
      >
        <line
          ref={lineRef}
          x1="0%" y1="1" x2="100%" y2="1"
          stroke="oklch(0.720 0.195 58 / 18%)"
          strokeWidth="1"
        />
      </svg>

      <div style={{
        position: "relative", zIndex: 10, flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "80px 24px 60px", textAlign: "center",
      }}>
        {/* Eyebrow */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 14px", borderRadius: 999, marginBottom: 32,
          background: "oklch(0.720 0.195 58 / 10%)",
          border: "1px solid oklch(0.720 0.195 58 / 30%)",
          opacity: wordsVisible ? 1 : 0,
          transform: wordsVisible ? "translateY(0)" : "translateY(-8px)",
          transition: prefersReduced ? "none" : "opacity 300ms ease, transform 300ms ease",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: S.amber, display: "inline-block", animation: "pulse 2s ease infinite" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.amber, fontWeight: 500 }}>
            {t("hero.eyebrow")}
          </span>
        </div>

        {/* Headline — word cascade with skew */}
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 800, lineHeight: 1.04,
          letterSpacing: "-0.025em", marginBottom: 8,
          fontSize: "clamp(44px, 8vw, 88px)",
        }}>
          {heroWords1.map((word, i) => (
            <span key={`w1-${i}`} style={{
              display: "inline-block", color: S.text, marginRight: "0.22em",
              opacity: wordsVisible ? 1 : 0,
              transform: wordsVisible ? "translateY(0) skewX(0deg)" : "translateY(14px) skewX(-3deg)",
              transition: prefersReduced ? "none" : `opacity 400ms ${i * 55}ms var(--ease-spring), transform 400ms ${i * 55}ms var(--ease-spring)`,
            }}>{word}</span>
          ))}
          <br />
          {heroWords2.map((word, i) => (
            <span key={`w2-${i}`} style={{
              display: "inline-block",
              color: i === 1 ? S.amber400 : S.text,
              marginRight: "0.22em",
              opacity: wordsVisible ? 1 : 0,
              transform: wordsVisible ? "translateY(0) skewX(0deg)" : "translateY(14px) skewX(-3deg)",
              transition: prefersReduced ? "none" : `opacity 400ms ${(heroWords1.length + i) * 55 + 60}ms var(--ease-spring), transform 400ms ${(heroWords1.length + i) * 55 + 60}ms var(--ease-spring)`,
            }}>{word}</span>
          ))}
        </h1>

        <p style={{
          fontFamily: "var(--font-body)", fontSize: "clamp(17px, 2.2vw, 21px)",
          color: S.textSub, maxWidth: 520, lineHeight: 1.55, marginBottom: 40,
          opacity: wordsVisible ? 1 : 0,
          transform: wordsVisible ? "translateY(0)" : "translateY(8px)",
          transition: prefersReduced ? "none" : "opacity 400ms 520ms ease, transform 400ms 520ms ease",
        }}>
          {t("hero.sub")}
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
          <Link href="/sign-up" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            height: 50, padding: "0 28px", borderRadius: 10,
            fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 500,
            color: "oklch(0.10 0.005 52)", backgroundColor: S.amber,
            textDecoration: "none", boxShadow: "0 4px 16px oklch(0.720 0.195 58 / 0.40)",
            transition: "box-shadow 120ms, transform 120ms",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 24px oklch(0.720 0.195 58 / 0.55)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = ""
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px oklch(0.720 0.195 58 / 0.40)"
            }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "oklch(0.10 0.005 52)", opacity: 0.6, animation: "pulse 2s ease infinite" }} />
            {t("hero.ctaPrimary")}
          </Link>
          <button onClick={() => scrollTo("features")} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            height: 50, padding: "0 28px", borderRadius: 10,
            fontFamily: "var(--font-body)", fontSize: 16, color: S.textSub,
            backgroundColor: "transparent", border: `1px solid ${S.borderStrong}`,
            cursor: "pointer", transition: "border-color 120ms, color 120ms",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = S.textMuted
              ;(e.currentTarget as HTMLButtonElement).style.color = S.text
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = S.borderStrong
              ;(e.currentTarget as HTMLButtonElement).style.color = S.textSub
            }}>
            {t("hero.ctaSecondary")}
          </button>
        </div>

        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textFaint, letterSpacing: "0.02em" }}>
          {t("hero.noCredit")}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 56 }}>
          <FloatingCard text={t("hero.proof1")} icon="✓" delay={0} />
          <FloatingCard text={t("hero.proof2")} icon="💰" delay={150} />
          <FloatingCard text={t("hero.proof3")} icon="📍" delay={300} />
        </div>
      </div>
    </section>
  )
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatWave({ active }: { active: boolean }) {
  // SVG organic wave that grows left-to-right as the counter runs
  return (
    <svg width={80} height={14} viewBox="0 0 80 14" fill="none" style={{ marginTop: 6 }}>
      <path
        d="M0 7 C10 3, 15 11, 25 7 C35 3, 40 11, 50 7 C60 3, 65 11, 75 7 C78 5.5, 79 6, 80 7"
        stroke="var(--amber-500)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        style={{
          strokeDasharray: 120,
          strokeDashoffset: active ? 0 : 120,
          transition: active ? "stroke-dashoffset 1.3s ease-out" : "none",
        }}
      />
    </svg>
  )
}

function StatItem({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { ref, inView } = useInView(0.3)
  const { count, start } = useCountUp(target)
  useEffect(() => { if (inView) start() }, [inView, start])
  const display = count >= 1000
    ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1).replace(".", ",")}`
    : count.toString()

  return (
    <div ref={ref} style={{ textAlign: "center", flex: 1 }}>
      <p style={{
        fontFamily: "var(--font-mono)", fontSize: "clamp(28px, 4vw, 40px)",
        fontWeight: 700, color: S.text, lineHeight: 1,
      }}>
        {display}{suffix}
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.textMuted, marginTop: 6 }}>{label}</p>
      <StatWave active={inView} />
    </div>
  )
}

function StatsBar() {
  const t = useTranslations("Landing")
  return (
    <div style={{
      backgroundColor: S.bg,
      borderTop: `1px solid ${S.border}`,
      borderBottom: `1px solid ${S.border}`,
    }}>
      <div style={{
        maxWidth: MAX_W, margin: "0 auto", padding: "36px 24px",
        display: "flex", alignItems: "flex-start", gap: 0,
      }}>
        <StatItem target={2400} suffix="+" label={t("stats.tradespeople")} />
        <div style={{ width: 1, height: 48, background: S.border, flexShrink: 0, marginTop: 4 }} />
        <StatItem target={48000} suffix="+" label={t("stats.invoicesSent")} />
        <div style={{ width: 1, height: 48, background: S.border, flexShrink: 0, marginTop: 4 }} />
        <StatItem target={1200} suffix=" mio. kr" label={t("stats.invoicedVia")} />
      </div>
    </div>
  )
}

// ── Problem Section — chaos arrival ──────────────────────────────────────────

const CHAOS_ANGLES = ["-4deg", "2deg", "-1.5deg"]
const CHAOS_OFFSETS: [string, string][] = ["-20px", "10px", "20px"].map((x, i) => [x, `${16 + i * 8}px`] as [string, string])

function ProblemSection() {
  const { ref, inView } = useInView(0.1)
  const prefersReduced = usePrefersReduced()
  const t = useTranslations("Landing")

  const problems = [
    {
      n: "01",
      title: t("problem.p1Title"),
      body: t("problem.p1Body"),
      icon: (
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <rect x={3} y={3} width={18} height={18} rx={2} /><path d="M3 9h18M9 21V9" />
        </svg>
      ),
    },
    {
      n: "02",
      title: t("problem.p2Title"),
      body: t("problem.p2Body"),
      icon: (
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={12} cy={12} r={10} /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      n: "03",
      title: t("problem.p3Title"),
      body: t("problem.p3Body"),
      icon: (
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <line x1={3} y1={12} x2={21} y2={12} /><line x1={3} y1={6} x2={21} y2={6} /><line x1={3} y1={18} x2={15} y2={18} />
        </svg>
      ),
    },
  ]

  return (
    <section style={{
      backgroundColor: S.bg,
      minHeight: "100vh",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "80px 24px",
      borderTop: `1px solid ${S.border}`,
    }}>
      <div style={{ maxWidth: MAX_W, margin: "0 auto", width: "100%" }}>
        <SectionLabel>{t("problem.label")}</SectionLabel>
        <h2 style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 800, color: S.text, letterSpacing: "-0.02em",
          maxWidth: 560, lineHeight: 1.1, marginBottom: 56,
        }}>
          {t("problem.headline")}
        </h2>

        <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {problems.map((p, i) => (
            <div key={p.n} style={{
              backgroundColor: S.surface,
              border: `1px solid ${S.border}`, borderRadius: 12, padding: 24, position: "relative",
              // Chaos arrival: different angle + offset per card, settles to flat
              opacity: inView ? 1 : 0,
              transform: inView
                ? "rotate(0deg) translate(0,0)"
                : `rotate(${CHAOS_ANGLES[i]}) translate(${CHAOS_OFFSETS[i][0]}, ${CHAOS_OFFSETS[i][1]})`,
              transition: prefersReduced
                ? "none"
                : `opacity 400ms ${i * 100}ms cubic-bezier(0.34,1.56,0.64,1), transform 500ms ${i * 100}ms cubic-bezier(0.34,1.56,0.64,1)`,
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px oklch(0.08 0.035 245 / 0.5)"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = ""
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
              }}>
              <span style={{ position: "absolute", top: 16, right: 16, fontFamily: "var(--font-mono)", fontSize: 11, color: S.textFaint }}>{p.n}</span>
              <div style={{ color: S.textMuted, marginBottom: 14 }}>{p.icon}</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600, color: S.text, marginBottom: 8 }}>{p.title}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.textSub, lineHeight: 1.6 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Feature Mockups ───────────────────────────────────────────────────────────

function JobsMockup() {
  const ITEMS = [
    { status: "Igangværende", color: "var(--status-progress-text)", bg: "var(--status-progress-bg)", title: "Badeværelse — Jensens vej 12", customer: "Erik Hansen", amount: "8.400 kr" },
    { status: "Ny", color: "var(--status-new-text)", bg: "var(--status-new-bg)", title: "Tagudskiftning — Magleby", customer: "Morten Lund", amount: "42.000 kr" },
    { status: "Planlagt", color: "var(--status-scheduled-text)", bg: "var(--status-scheduled-bg)", title: "El-installation — sommerhus", customer: "Kirsten Bach", amount: "5.200 kr" },
    { status: "Betalt", color: "var(--status-paid-text)", bg: "var(--status-paid-bg)", title: "VVS-eftersyn kontor", customer: "Lasse Møller", amount: "1.800 kr" },
  ]
  return (
    <div style={{
      backgroundColor: S.surface, border: `1px solid ${S.borderStrong}`,
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 20px 48px oklch(0.07 0.035 245 / 0.7)",
      maxWidth: 360,
    }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: S.text }}>Jobs</span>
        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: S.amber, color: "oklch(0.10 0.005 52)", fontFamily: "var(--font-body)", fontWeight: 600 }}>+ Nyt job</span>
      </div>
      {ITEMS.map((item, i) => (
        <div key={item.title} style={{ display: "flex", alignItems: "center", gap: 0, borderBottom: i < ITEMS.length - 1 ? `1px solid ${S.border}` : "none", transition: "background 80ms" }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "oklch(1 0 0 / 4%)"}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ""}>
          <div style={{ width: 3, alignSelf: "stretch", backgroundColor: item.color, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: "10px 14px", minWidth: 0 }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: S.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 999, background: item.bg, color: item.color, fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.status}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: S.textMuted }}>{item.customer}</span>
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: S.textSub, padding: "0 14px", flexShrink: 0 }}>{item.amount}</span>
        </div>
      ))}
    </div>
  )
}

function QuoteMockup() {
  const rows = [
    ["Arbejdsløn", "4 timer", "2.600 kr"],
    ["Materialer", "Kobberrør Ø22", "480 kr"],
    ["Kørsel", "20 km", "120 kr"],
  ]
  return (
    <div style={{
      backgroundColor: S.surface, border: `1px solid ${S.borderStrong}`,
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 20px 48px oklch(0.07 0.035 245 / 0.7)",
      maxWidth: 440,
    }}>
      <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: S.textMuted }}>TILBUD</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: S.textSub, marginLeft: 8 }}>#T-0042</span>
        </div>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: S.amber, padding: "2px 8px", borderRadius: 999, background: "oklch(0.720 0.195 58 / 12%)" }}>Udkast</span>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textMuted, marginBottom: 10 }}>Til: Morten Andersen, Aarhus</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "6px 12px", alignItems: "baseline" }}>
          {rows.map(([label, detail, amount], i) => (
            <Fragment key={i}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.text }}>{label}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textMuted, textAlign: "right" }}>{detail}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: S.text, textAlign: "right" }}>{amount}</span>
            </Fragment>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${S.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: S.text }}>Total inkl. moms</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: S.amber }}>3.950 kr</span>
        </div>
      </div>
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${S.border}`, display: "flex", gap: 8 }}>
        <button style={{ flex: 1, height: 32, borderRadius: 7, border: `1px solid ${S.border}`, background: "transparent", color: S.textSub, fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer" }}>Gem udkast</button>
        <button style={{ flex: 1, height: 32, borderRadius: 7, border: "none", background: S.amber, color: "oklch(0.10 0.005 52)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send tilbud →</button>
      </div>
    </div>
  )
}

function InvoiceMockup() {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        backgroundColor: "oklch(1 0 0)", border: `1px solid oklch(0.88 0.007 255)`,
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 20px 40px oklch(0.07 0.035 245 / 0.6)",
        maxWidth: 400,
        transform: hovered ? "rotate(0deg)" : "rotate(-1deg)",
        transition: "transform 200ms var(--ease-smooth)",
      }}
    >
      {/* Iridescent prismatic sweep on hover */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10,
        background: "linear-gradient(115deg, transparent 0%, oklch(0.75 0.12 240 / 12%) 30%, oklch(0.75 0.10 185 / 10%) 50%, oklch(0.72 0.19 58 / 8%) 70%, transparent 100%)",
        transform: hovered ? "translateX(0%)" : "translateX(-110%)",
        transition: hovered ? "transform 600ms ease-out" : "none",
      }} />
      <div style={{ background: "linear-gradient(135deg, var(--amber-600) 0%, var(--amber-500) 100%)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, color: "oklch(0.20 0.005 52)", letterSpacing: "0.1em", textTransform: "uppercase" }}>FAKTURA</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "oklch(0.12 0.005 52)", fontWeight: 700 }}>#F-1042</p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "oklch(0.10 0.005 52 / 20%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="oklch(0.10 0.005 52)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: "oklch(0.50 0.011 255)", fontFamily: "var(--font-body)" }}>Fra</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.12 0.005 255)", fontFamily: "var(--font-body)" }}>Klaus El-Service ApS</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "oklch(0.50 0.011 255)", fontFamily: "var(--font-body)" }}>Forfaldsdato</p>
            <p style={{ fontSize: 13, color: "oklch(0.12 0.005 255)", fontFamily: "var(--font-mono)" }}>30. april 2026</p>
          </div>
        </div>
        {[["Arbejdsløn", "2.600 kr"], ["Materialer", "480 kr"], ["Kørsel", "120 kr"]].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid oklch(0.94 0.004 255)" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "oklch(0.35 0.009 255)" }}>{l}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "oklch(0.20 0.007 255)" }}>{v}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "8px 0", borderTop: "2px solid oklch(0.88 0.007 255)" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "oklch(0.12 0.005 255)" }}>Total inkl. moms</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "oklch(0.53 0.155 52)" }}>4.000 kr</span>
        </div>
      </div>
    </div>
  )
}

function CustomerMockup() {
  return (
    <div style={{
      backgroundColor: S.surface, border: `1px solid ${S.borderStrong}`,
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 20px 48px oklch(0.07 0.035 245 / 0.7)",
      maxWidth: 380,
    }}>
      <div style={{ padding: "16px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--amber-500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "oklch(0.10 0.005 52)" }}>EH</span>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: S.text }}>Erik Hansen</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textMuted }}>+45 23 45 67 89 · Aarhus</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "12px 16px", gap: 8, borderBottom: `1px solid ${S.border}` }}>
        {[["Faktureret", "142.400 kr", S.text], ["Udestående", "12.800 kr", "oklch(0.78 0.18 25)"], ["Betalt", "129.600 kr", S.teal]].map(([l, v, c]) => (
          <div key={l as string}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: S.textMuted, marginBottom: 2 }}>{l}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: c as string }}>{v}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 16px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: S.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Seneste jobs</p>
        {[
          { title: "Badeværelse renovation", status: "Betalt", c: "var(--status-paid-text)", bg: "var(--status-paid-bg)" },
          { title: "El-installation køkken", status: "Faktureret", c: "var(--status-invoiced-text)", bg: "var(--status-invoiced-bg)" },
        ].map((job, i) => (
          <div key={job.title} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i === 0 ? `1px solid ${S.border}` : "none" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.textSub }}>{job.title}</span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: job.bg, color: job.c, fontFamily: "var(--font-body)", fontWeight: 500 }}>{job.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Feature Sections ──────────────────────────────────────────────────────────

function FeatureRow({
  label, headline, bullets, mockup, reverse, id, extra,
}: {
  label: string; headline: string; bullets: string[]; mockup: React.ReactNode; reverse?: boolean; id?: string; extra?: React.ReactNode
}) {
  const { ref, inView } = useInView(0.15)
  const prefersReduced = usePrefersReduced()
  const textAnim: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? "translateX(0)" : `translateX(${reverse ? "24px" : "-24px"})`,
    transition: prefersReduced ? "none" : "opacity 300ms 60ms var(--ease-smooth), transform 300ms 60ms var(--ease-smooth)",
  }
  const imgAnim: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? "translateX(0)" : `translateX(${reverse ? "-24px" : "24px"})`,
    transition: prefersReduced ? "none" : "opacity 300ms var(--ease-smooth), transform 300ms var(--ease-smooth)",
  }

  return (
    <section id={id} style={{
      backgroundColor: S.bg,
      minHeight: "100vh",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "80px 24px",
      borderTop: `1px solid ${S.border}`,
    }}>
      <div ref={ref} style={{
        maxWidth: MAX_W, margin: "0 auto", width: "100%",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 64, alignItems: "center",
      }}>
        <div style={{ order: reverse ? 2 : 1, ...textAnim }}>
          <SectionLabel>{label}</SectionLabel>
          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 38px)",
            fontWeight: 800, color: S.text, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 24,
          }}>
            {headline}
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {bullets.map((b) => (
              <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={S.amber} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: S.textSub, lineHeight: 1.5 }}>{b}</span>
              </li>
            ))}
          </ul>
          {extra}
        </div>
        <div style={{ order: reverse ? 1 : 2, display: "flex", justifyContent: "center", ...imgAnim }}>
          {mockup}
        </div>
      </div>
    </section>
  )
}

// Quote feature 45-second counter
function QuoteCounter() {
  const { ref, inView } = useInView(0.5)
  const [flickered, setFlickered] = useState(false)
  const { count, start } = useCountUp(45, 1500)
  useEffect(() => {
    if (!inView) return
    start()
    const t = setTimeout(() => setFlickered(true), 1550)
    return () => clearTimeout(t)
  }, [inView, start])

  return (
    <div ref={ref} style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 24 }}>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 48, fontWeight: 700,
        color: S.amber400, lineHeight: 1,
        // brief flicker after landing
        animation: flickered ? "counterFlicker 0.3s ease" : "none",
      }}>
        {count}
      </span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 16, color: S.textSub }}>sekunder</span>
    </div>
  )
}

// Invoice trust line with delayed entrance
function InvoiceTrustLine({ text }: { text: string }) {
  const { ref, inView } = useInView(0.5)
  return (
    <div ref={ref} style={{
      display: "flex", alignItems: "center", gap: 6,
      marginTop: 24,
      opacity: inView ? 1 : 0,
      transition: "opacity 400ms 600ms ease",
    }}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={S.teal} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textMuted }}>{text}</span>
    </div>
  )
}

// ── Demo Section ──────────────────────────────────────────────────────────────

function DemoSection() {
  const [active, setActive] = useState(0)
  const { ref, inView } = useInView(0.2)
  const t = useTranslations("Landing")

  const stages = [0, 1, 2, 3, 4, 5].map(i => ({
    label: t(`demo.s${i}label` as Parameters<typeof t>[0]),
    desc: t(`demo.s${i}desc` as Parameters<typeof t>[0]),
    color: ["var(--status-new-bg)", "var(--status-scheduled-bg)", "var(--status-invoiced-bg)", "var(--status-progress-bg)", "var(--status-done-bg)", "var(--status-paid-bg)"][i],
    textColor: ["var(--status-new-text)", "var(--status-scheduled-text)", "var(--status-invoiced-text)", "var(--status-progress-text)", "var(--status-done-text)", "var(--status-paid-text)"][i],
  }))

  useEffect(() => {
    if (!inView) return
    const timer = setInterval(() => setActive(a => (a + 1) % stages.length), 3000)
    return () => clearInterval(timer)
  }, [inView, stages.length])

  const stage = stages[active]

  return (
    <section id="how" style={{
      backgroundColor: S.surfaceAlt,
      minHeight: "100vh",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "80px 24px",
      borderTop: `1px solid ${S.border}`,
    }}>
      <div style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionLabel>{t("demo.label")}</SectionLabel>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: S.text, letterSpacing: "-0.02em" }}>
            {t("demo.headline")}
          </h2>
        </div>

        <div ref={ref} style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 40 }}>
          {stages.map((s, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              padding: "6px 14px", borderRadius: 999, cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
              backgroundColor: active === i ? s.color : "transparent",
              color: active === i ? s.textColor : S.textMuted,
              border: active === i ? `1px solid transparent` : `1px solid ${S.border}`,
              transition: "all 180ms var(--ease-snap)",
            }}>
              {s.label}
            </button>
          ))}
        </div>

        <div style={{
          backgroundColor: S.bg, border: `1px solid ${S.border}`,
          borderRadius: 16, padding: "40px 48px", textAlign: "center", minHeight: 120,
          transition: "all 180ms var(--ease-snap)",
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 999, marginBottom: 16,
            background: stage.color, color: stage.textColor,
            fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
          }}>
            {active + 1} / {stages.length} — {stage.label}
          </span>
          {/* Sonar pulse on active step */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              backgroundColor: S.amber,
              animation: "sonarPulse 1.2s ease-out infinite",
              margin: "0 auto 12px",
            }} />
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(16px, 2.5vw, 20px)", color: S.textSub, lineHeight: 1.5 }}>
            {stage.desc}
          </p>
        </div>

        <div style={{ height: 2, background: S.border, borderRadius: 999, marginTop: 16, overflow: "hidden" }}>
          <div key={active} style={{ height: "100%", background: S.amber, borderRadius: 999, animation: "progress 3s linear forwards" }} />
        </div>
      </div>
    </section>
  )
}

// ── Who It's For ──────────────────────────────────────────────────────────────

function WhoSection() {
  const { ref, inView } = useInView(0.15)
  const prefersReduced = usePrefersReduced()
  const t = useTranslations("Landing")

  const STAMP_ROTATIONS = [-12, 8, -6, 14, -9, 5, -11, 7]

  const trades = [
    { key: "t1", icon: <path d="M13 2L4.5 13.5H11L9 22l11-13.5H14z" strokeWidth={1.75} /> },
    { key: "t2", icon: <><rect x="5" y="13" width="8" height="8" rx="1.5" /><rect x="16" y="5" width="6" height="6" rx="1.5" /><path d="M13 17H15a3 3 0 003-3V8" /></> },
    { key: "t3", icon: <><rect x="3" y="11" width="16" height="8" rx="1.5" /><path d="M19 13l5-3v8l-5-3" /><line x1="7" y1="19" x2="6" y2="23" /><line x1="14" y1="19" x2="14" y2="23" /></> },
    { key: "t4", icon: <><rect x="5" y="5" width="14" height="8" rx="1.5" /><rect x="8" y="13" width="8" height="2" rx="1" /><line x1="12" y1="15" x2="12" y2="22" /><rect x="5" y="22" width="14" height="2" rx="1" /></> },
    { key: "t5", icon: <><rect x="4" y="6" width="7" height="5" rx="1" /><rect x="13" y="6" width="7" height="5" rx="1" /><rect x="9" y="12" width="7" height="5" rx="1" /><rect x="4" y="18" width="7" height="4" rx="1" /><rect x="13" y="18" width="7" height="4" rx="1" /></> },
    { key: "t6", icon: <><path d="M14.5 4.5L9.5 9.5M20 9.5l-3-3" /><path d="M4.5 19.5l8-8" /><circle cx="17" cy="7" r="3" /></> },
    { key: "t7", icon: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></> },
    { key: "t8", icon: <><path d="M3 18L12 6l9 12" /><path d="M7 18h10" /><path d="M10 18v-5h4v5" /></> },
  ]

  return (
    <section style={{
      backgroundColor: S.bg,
      minHeight: "100vh",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "80px 24px",
      borderTop: `1px solid ${S.border}`,
    }}>
      <div style={{ maxWidth: MAX_W, margin: "0 auto", width: "100%", textAlign: "center" }}>
        <SectionLabel>{t("who.label")}</SectionLabel>
        {/* Billboard blur entrance */}
        <h2 style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 40px)",
          fontWeight: 800, color: S.text, letterSpacing: "-0.02em", marginBottom: 48,
          opacity: inView ? 1 : 0,
          filter: inView ? "blur(0px)" : "blur(20px)",
          transform: inView ? "scale(1)" : "scale(1.08)",
          transition: prefersReduced ? "none" : "opacity 700ms var(--ease-smooth), filter 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)",
        }}>
          {t("who.headline")}
        </h2>

        {/* Trade stamp grid — random rotations settle to 0 */}
        <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, maxWidth: 720, margin: "0 auto 64px", justifyItems: "center" }}>
          {trades.map((trade, i) => (
            <div key={trade.key} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer",
              color: S.textMuted,
              opacity: inView ? 1 : 0,
              transform: inView
                ? "rotate(0deg) scale(1)"
                : `rotate(${STAMP_ROTATIONS[i]}deg) scale(0.7)`,
              transition: prefersReduced
                ? "none"
                : `opacity 350ms ${i * 60}ms var(--ease-spring), transform 450ms ${i * 60}ms var(--ease-spring), color 120ms`,
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.color = S.amber
                ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px) scale(1.08)"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.color = S.textMuted
                ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)"
              }}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                {trade.icon}
              </svg>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {t(`who.${trade.key}` as Parameters<typeof t>[0])}
              </span>
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 540, margin: "0 auto", position: "relative", padding: "0 20px" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 80, fontWeight: 800, color: S.amber, opacity: 0.2, lineHeight: 0.8, display: "block", marginBottom: -20 }}>"</span>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px, 2.5vw, 22px)", fontStyle: "italic", color: S.textSub, lineHeight: 1.55, marginBottom: 20 }}>
            "{t("who.quote")}"
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.textMuted }}>{t("who.quoteAuthor")}</p>
        </div>
      </div>
    </section>
  )
}

// ── Comparison Table — padlock unlock ────────────────────────────────────────

function PadlockSVG({ unlocked }: { unlocked: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={S.amber} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ margin: "0 auto 4px", display: "block", transition: "transform 400ms cubic-bezier(0.34,1.56,0.64,1)" }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d={unlocked ? "M7 11V7a5 5 0 0 1 9.9-1" : "M7 11V7a5 5 0 0 1 10 0v4"}
        style={{ transition: "d 400ms var(--ease-spring)" }} />
    </svg>
  )
}

function ComparisonTable() {
  const { ref, inView } = useInView(0.1)
  const prefersReduced = usePrefersReduced()
  const t = useTranslations("Landing")

  const rows = [
    [t("comparison.row0"), true, false, "Delvist", false],
    [t("comparison.row1"), true, false, false, false],
    [t("comparison.row2"), true, false, true, false],
    [t("comparison.row3"), true, false, false, false],
    [t("comparison.row4"), true, false, false, false],
    [t("comparison.row5"), t("comparison.col1price"), t("comparison.col2price"), t("comparison.col3price"), t("comparison.col4price")],
  ]
  const cols = [" ", "Håndværk Pro", "Excel/Word", "Billy / e-conomic", "Pen & papir"]

  return (
    <section style={{
      backgroundColor: S.surfaceAlt,
      minHeight: "100vh",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "80px 24px",
      borderTop: `1px solid ${S.border}`,
    }}>
      <div style={{ maxWidth: 880, margin: "0 auto", width: "100%" }}>
        <SectionLabel>{t("comparison.label")}</SectionLabel>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, color: S.text, letterSpacing: "-0.02em", marginBottom: 40 }}>
          {t("comparison.headline")}
        </h2>

        <div ref={ref} style={{
          overflowX: "auto",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(16px)",
          transition: prefersReduced ? "none" : "opacity 300ms var(--ease-smooth), transform 300ms var(--ease-smooth)",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr>
                {cols.map((col, i) => (
                  <th key={col} style={{
                    padding: "10px 16px", textAlign: i === 0 ? "left" : "center",
                    fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    color: i === 1 ? S.amber : S.textMuted,
                    borderBottom: `1px solid ${i === 1 ? S.amber : S.border}`,
                    borderTop: i === 1 ? `2px solid ${S.amber}` : "none",
                    backgroundColor: i === 1 ? "oklch(0.720 0.195 58 / 6%)" : "transparent",
                    borderRadius: i === 1 ? "6px 6px 0 0" : 0,
                    position: "relative",
                  }}>
                    {i === 1 && <PadlockSVG unlocked={inView} />}
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: `1px solid ${S.border}` }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: "11px 16px", textAlign: ci === 0 ? "left" : "center",
                      fontFamily: ci === 0 ? "var(--font-body)" : (cell === true || cell === false) ? "inherit" : "var(--font-mono)",
                      fontSize: 13, color: ci === 0 ? S.textSub : S.textMuted,
                      backgroundColor: ci === 1 ? "oklch(0.720 0.195 58 / 4%)" : "transparent",
                      // Competitor columns fade in gray, HP column unlocks with color
                      filter: inView ? "none" : (ci === 0 ? "none" : ci === 1 ? "none" : "grayscale(100%)"),
                      opacity: inView ? 1 : (ci === 0 ? 1 : 0.4),
                      transition: `filter 600ms ${ri * 60}ms ease, opacity 500ms ${ri * 60}ms ease`,
                    }}>
                      {cell === true ? (
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={S.amber} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                          style={{
                            margin: "0 auto", display: "block",
                            opacity: inView ? 1 : 0,
                            transition: `opacity 300ms ${ri * 60 + ci * 40}ms ease`,
                          }}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : cell === false ? (
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={S.textFaint} strokeWidth={2} strokeLinecap="round" style={{ margin: "0 auto", display: "block" }}>
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      ) : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

// ── Testimonials — sine-wave entry + continuous float ────────────────────────

function TestimonialsSection() {
  const { ref, inView } = useInView(0.1)
  const prefersReduced = usePrefersReduced()
  const t = useTranslations("Landing")

  const testimonials = [
    { initials: "MK", name: t("testimonials.t1name"), role: t("testimonials.t1role"), quote: t("testimonials.t1quote") },
    { initials: "LT", name: t("testimonials.t2name"), role: t("testimonials.t2role"), quote: t("testimonials.t2quote") },
    { initials: "PH", name: t("testimonials.t3name"), role: t("testimonials.t3role"), quote: t("testimonials.t3quote") },
  ]

  // Sine-wave entry: different x/y per card
  const WAVE_ENTRIES = [
    { tx: "-40px", ty: "20px" },
    { tx: "0px",   ty: "-24px" },
    { tx: "40px",  ty: "16px" },
  ]

  return (
    <section style={{
      backgroundColor: S.bg,
      minHeight: "100vh",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "80px 24px",
      borderTop: `1px solid ${S.border}`,
    }}>
      <div style={{ maxWidth: MAX_W, margin: "0 auto", width: "100%" }}>
        <SectionLabel>{t("testimonials.label")}</SectionLabel>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: S.text, letterSpacing: "-0.02em", marginBottom: 48 }}>
          {t("testimonials.headline")}
        </h2>
        <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {testimonials.map((t_, i) => (
            <div key={t_.name} style={{
              backgroundColor: S.surface, border: `1px solid ${S.border}`,
              borderRadius: 14, padding: 28, position: "relative",
              opacity: inView ? 1 : 0,
              transform: inView
                ? "translate(0,0)"
                : `translate(${WAVE_ENTRIES[i].tx}, ${WAVE_ENTRIES[i].ty})`,
              transition: prefersReduced
                ? "none"
                : `opacity 400ms ${i * 100}ms var(--ease-smooth), transform 500ms ${i * 100}ms var(--ease-smooth)`,
              // Continuous buoy float after settle
              animation: inView && !prefersReduced
                ? `buoyFloat ${4.5 + i * 1.2}s ease-in-out ${i * 1.5}s infinite`
                : "none",
            }}>
              <span style={{ position: "absolute", top: 16, left: 20, fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 800, color: S.amber, opacity: 0.2, lineHeight: 1 }}>"</span>
              <div style={{ display: "flex", marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <svg key={s} width={14} height={14} viewBox="0 0 24 24" fill={S.amber} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                ))}
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.textSub, lineHeight: 1.65, marginBottom: 20, fontStyle: "italic" }}>
                "{t_.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: S.amber, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "oklch(0.10 0.005 52)" }}>{t_.initials}</span>
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: S.text }}>{t_.name}</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textMuted }}>{t_.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing — shelf lift with Solo overshoot ──────────────────────────────────

function PricingSection() {
  const [annual, setAnnual] = useState(true)
  const { ref, inView } = useInView(0.15)
  const prefersReduced = usePrefersReduced()
  const t = useTranslations("Landing")

  const plans = [
    {
      name: t("pricing.freeName"),
      monthly: "0", annual: "0",
      badge: null, featured: false,
      features: [t("pricing.freeF1"), t("pricing.freeF2"), t("pricing.freeF3"), t("pricing.freeF4")],
      locked: [t("pricing.freeL1"), t("pricing.freeL2"), t("pricing.freeL3"), t("pricing.freeL4")],
      cta: t("pricing.freeCta"), href: "/sign-up",
    },
    {
      name: t("pricing.soloName"),
      monthly: "149", annual: "119",
      badge: t("pricing.recommended"), featured: true,
      features: [t("pricing.soloF1"), t("pricing.soloF2"), t("pricing.soloF3"), t("pricing.soloF4"), t("pricing.soloF5"), t("pricing.soloF6")],
      locked: [],
      cta: t("pricing.soloCta"), href: "/sign-up",
    },
    {
      name: t("pricing.holdName"),
      monthly: "299", annual: "239",
      badge: null, featured: false,
      features: [t("pricing.holdF1"), t("pricing.holdF2"), t("pricing.holdF3"), t("pricing.holdF4")],
      locked: [],
      cta: t("pricing.holdCta"), href: "/sign-up",
    },
  ]

  return (
    <section id="pricing" style={{
      backgroundColor: S.surfaceAlt,
      minHeight: "100vh",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "80px 24px",
      borderTop: `1px solid ${S.border}`,
    }}>
      <div style={{ maxWidth: MAX_W, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionLabel>{t("pricing.label")}</SectionLabel>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 800, color: S.text, letterSpacing: "-0.02em", marginBottom: 8 }}>
            {t("pricing.headline")}
          </h2>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 20, padding: "4px", borderRadius: 10, background: "oklch(1 0 0 / 5%)", border: `1px solid ${S.border}` }}>
            {[{ label: t("pricing.monthly"), val: false }, { label: t("pricing.annual"), val: true }].map(({ label, val }) => (
              <button key={String(val)} onClick={() => setAnnual(val)} style={{
                padding: "6px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                backgroundColor: annual === val ? S.amber : "transparent",
                color: annual === val ? "oklch(0.10 0.005 52)" : S.textMuted,
                transition: "all 150ms var(--ease-snap)",
              }}>
                {label}{val ? <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>{t("pricing.save20")}</span> : ""}
              </button>
            ))}
          </div>
        </div>

        <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {plans.map((plan, i) => (
            <div key={plan.name} style={{
              backgroundColor: S.bg,
              border: plan.featured ? `1px solid ${S.amber}` : `1px solid ${S.border}`,
              borderRadius: 16, overflow: "hidden",
              display: "flex", flexDirection: "column",
              boxShadow: plan.featured ? `0 0 48px oklch(0.720 0.195 58 / 18%)` : "none",
              position: "relative",
              // Shelf lift — Solo overshoots then settles
              opacity: inView ? 1 : 0,
              transform: inView
                ? "translateY(0)"
                : `translateY(30px)`,
              transition: prefersReduced
                ? "none"
                : plan.featured
                  ? `opacity 400ms 100ms var(--ease-spring), transform 600ms 100ms cubic-bezier(0.34,1.56,0.64,1)`
                  : `opacity 400ms ${i * 80}ms var(--ease-smooth), transform 400ms ${i * 80}ms var(--ease-smooth)`,
              // Solo glow pulse
              animation: plan.featured && inView ? "soloPulse 2s ease-in-out infinite" : "none",
            }}>
              {plan.featured && <div style={{ height: 2, background: `linear-gradient(90deg, var(--amber-600), var(--amber-500), var(--amber-400))` }} />}
              {plan.badge && (
                <div style={{
                  position: "absolute", top: plan.featured ? 18 : 14, right: 16,
                  padding: "3px 10px", borderRadius: 999, background: S.amber,
                  fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
                  color: "oklch(0.10 0.005 52)",
                }}>{plan.badge}</div>
              )}
              <div style={{ padding: "24px 24px 28px", flex: 1, display: "flex", flexDirection: "column" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: S.text, marginBottom: 12 }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 48, fontWeight: 700, color: S.text, lineHeight: 1 }}>
                    {annual ? plan.annual : plan.monthly}
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.textMuted }}>{t("pricing.perMonth")}</span>
                </div>
                {annual && plan.featured && <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.amber, marginBottom: 16 }}>{t("pricing.billedAnnually")}</p>}
                <div style={{ height: 1, background: S.border, margin: "20px 0" }} />
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={S.amber} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.textSub }}>{f}</span>
                    </li>
                  ))}
                  {plan.locked.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 9, opacity: 0.35 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={S.textFaint} strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}>
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.textFaint }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: 46, borderRadius: 10,
                  fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500,
                  textDecoration: "none",
                  backgroundColor: plan.featured ? S.amber : "transparent",
                  color: plan.featured ? "oklch(0.10 0.005 52)" : S.textSub,
                  border: plan.featured ? "none" : `1.5px solid ${S.border}`,
                  boxShadow: plan.featured ? "0 4px 16px oklch(0.720 0.195 58 / 0.40)" : "none",
                  transition: "opacity 120ms",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "1"}>
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.textFaint, textAlign: "center", marginTop: 24 }}>
          {t("pricing.noBinding")}
        </p>
      </div>
    </section>
  )
}

// ── FAQ — clip-path ink reveal ────────────────────────────────────────────────

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const t = useTranslations("Landing")

  const faqs = [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({
    q: t(`faq.q${i}` as Parameters<typeof t>[0]),
    a: t(`faq.a${i}` as Parameters<typeof t>[0]),
  }))

  return (
    <section id="faq" style={{
      backgroundColor: S.bg,
      minHeight: "100vh",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "80px 24px",
      borderTop: `1px solid ${S.border}`,
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <SectionLabel>{t("faq.label")}</SectionLabel>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: S.text, letterSpacing: "-0.02em", marginBottom: 40 }}>
          {t("faq.headline")}
        </h2>
        <div>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${S.border}` }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 0", gap: 16, background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
              }}>
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: 15, fontWeight: open === i ? 600 : 500,
                  color: open === i ? S.text : S.textSub,
                  flex: 1, lineHeight: 1.4,
                  transition: "color 120ms, font-weight 120ms",
                }}>
                  {faq.q}
                </span>
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  border: `1px solid ${open === i ? S.amber : S.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: open === i ? S.amber : S.textMuted, flexShrink: 0,
                  transition: "all 180ms var(--ease-snap)",
                  transform: open === i ? "rotate(45deg)" : "none",
                }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </button>
              {/* Ink-reveal: clip-path from top instead of max-height */}
              <div style={{
                overflow: "hidden",
                clipPath: open === i ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
                transition: "clip-path 280ms var(--ease-smooth)",
                maxHeight: open === i ? 300 : 0,
              }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.textMuted, lineHeight: 1.7, paddingBottom: 18 }}>
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Trust Bar ─────────────────────────────────────────────────────────────────

function TrustBar() {
  const t = useTranslations("Landing")
  const { ref, inView } = useInView(0.3)
  const items = [
    { icon: "🔒", text: t("trust.gdpr") },
    { icon: "🇩🇰", text: t("trust.support") },
    { icon: "💳", text: t("trust.noCard") },
    { icon: "⚡", text: t("trust.setup") },
  ]
  return (
    <div style={{ backgroundColor: S.surfaceAlt, borderTop: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}` }}>
      <div ref={ref} style={{ maxWidth: MAX_W, margin: "0 auto", padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "12px 32px" }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(6px)",
            transition: `opacity 300ms ${i * 80}ms ease, transform 300ms ${i * 80}ms ease`,
          }}>
            {i > 0 && <span className="hidden md:inline" style={{ color: S.textFaint, marginRight: 20 }}>|</span>}
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.textMuted }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Footer CTA — ember particles ──────────────────────────────────────────────

function EmberParticles() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const container = containerRef.current
    if (!container) return

    const particles: HTMLDivElement[] = []
    for (let i = 0; i < 48; i++) {
      const p = document.createElement("div")
      const size = Math.random() * 3 + 1.5
      p.style.cssText = `
        position:absolute;
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:oklch(0.10 0.005 52);
        left:${Math.random() * 100}%;
        bottom:${Math.random() * 20}%;
        opacity:${Math.random() * 0.12 + 0.05};
        pointer-events:none;
      `
      container.appendChild(p)
      particles.push(p)

      gsap.to(p, {
        y: -(Math.random() * 200 + 80),
        x: (Math.random() - 0.5) * 60,
        opacity: 0,
        duration: Math.random() * 8 + 12,
        delay: Math.random() * 8,
        repeat: -1,
        ease: "power1.out",
      })
    }

    return () => {
      particles.forEach(p => { if (p.parentNode) p.parentNode.removeChild(p) })
    }
  }, { scope: containerRef })

  return <div ref={containerRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} />
}

function FooterCTA() {
  const t = useTranslations("Landing")
  const { ref, inView } = useInView(0.2)
  const prefersReduced = usePrefersReduced()

  return (
    <footer>
      <div style={{
        background: `linear-gradient(135deg, var(--amber-600) 0%, var(--amber-500) 55%, var(--amber-400) 100%)`,
        padding: "100px 24px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {!prefersReduced && <EmberParticles />}
        <div ref={ref} style={{ maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 800, color: "oklch(0.12 0.005 52)", letterSpacing: "-0.02em",
            lineHeight: 1.1, marginBottom: 16,
            opacity: inView ? 1 : 0,
            transform: inView ? "scale(1)" : "scale(1.6)",
            transition: prefersReduced ? "none" : "opacity 400ms var(--ease-spring), transform 500ms cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            {t("footerCta.headline")}
          </h2>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: 18, color: "oklch(0.25 0.008 52)", marginBottom: 36,
            opacity: inView ? 1 : 0,
            transition: prefersReduced ? "none" : "opacity 400ms 120ms ease",
          }}>
            {t("footerCta.sub")}
          </p>
          <Link href="/sign-up" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            height: 52, padding: "0 36px", borderRadius: 12,
            fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600,
            color: S.text, backgroundColor: S.bg,
            textDecoration: "none", transition: "opacity 120ms, transform 120ms",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"
              ;(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "1"
              ;(e.currentTarget as HTMLAnchorElement).style.transform = ""
            }}>
            {t("footerCta.cta")}
          </Link>
        </div>
      </div>

      <div style={{ backgroundColor: S.bg, borderTop: `1px solid ${S.border}`, padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: MAX_W, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 24, height: 24, borderRadius: 5, background: S.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="oklch(0.10 0.005 52)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: S.text }}>Håndværk Pro</span>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.textFaint, lineHeight: 1.6 }}>{t("footer.tagline")}</p>
            </div>
            {[
              { heading: t("footer.product"), links: [t("footer.features"), t("footer.pricing"), t("footer.changelog")] },
              { heading: t("footer.company"), links: [t("footer.about"), t("footer.contact"), t("footer.blog")] },
              { heading: t("footer.legal"), links: [t("footer.privacy"), t("footer.cookies"), t("footer.terms")] },
            ].map(col => (
              <div key={col.heading}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: S.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>{col.heading}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(link => (
                    <a key={link} href="#" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.textMuted, textDecoration: "none", transition: "color 120ms" }}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = S.textSub}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = S.textMuted}>
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textFaint }}>{t("footer.copyright")}</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textFaint }}>{t("footer.tagline")}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Global keyframes ──────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @keyframes pulse {
      0%,100%{opacity:0.5;transform:scale(1)}
      50%{opacity:1;transform:scale(1.3)}
    }
    @keyframes ctaPulse {
      0%,100%{box-shadow:0 4px 16px oklch(0.720 0.195 58 / 0.35)}
      50%{box-shadow:0 4px 24px oklch(0.720 0.195 58 / 0.55)}
    }
    @keyframes cardFloat {
      0%,100%{transform:translateY(0px)}
      50%{transform:translateY(-6px)}
    }
    @keyframes buoyFloat {
      0%,100%{transform:translateY(0px)}
      50%{transform:translateY(-4px)}
    }
    @keyframes sonarPulse {
      0%{transform:scale(1);opacity:1}
      80%,100%{transform:scale(3.5);opacity:0}
    }
    @keyframes progress {
      from{width:0%} to{width:100%}
    }
    @keyframes soloPulse {
      0%,100%{box-shadow:0 0 0 1px var(--amber-500), 0 0 32px oklch(0.720 0.195 58 / 0.15)}
      50%{box-shadow:0 0 0 1px var(--amber-500), 0 0 48px oklch(0.720 0.195 58 / 0.28)}
    }
    @keyframes counterFlicker {
      0%{opacity:1} 20%{opacity:0.3} 40%{opacity:1} 60%{opacity:0.5} 80%{opacity:1}
    }
    html{scroll-behavior:smooth}
  `}</style>
)

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const t = useTranslations("Landing")

  useEffect(() => {
    if (isLoaded && user) router.replace("/overview")
  }, [isLoaded, user, router])

  return (
    <div style={{ fontFamily: "var(--font-body)", backgroundColor: S.bg }}>
      <GlobalStyles />
      <Nav />
      <Hero />
      <StatsBar />
      <ProblemSection />
      <div id="features">
        <FeatureRow
          label={t("feat.jobs.label")}
          headline={t("feat.jobs.headline")}
          bullets={[t("feat.jobs.b1"), t("feat.jobs.b2"), t("feat.jobs.b3")]}
          mockup={<JobsMockup />}
        />
        <FeatureRow
          label={t("feat.quotes.label")}
          headline={t("feat.quotes.headline")}
          bullets={[t("feat.quotes.b1"), t("feat.quotes.b2"), t("feat.quotes.b3")]}
          mockup={<QuoteMockup />}
          reverse
          extra={<QuoteCounter />}
        />
        <FeatureRow
          label={t("feat.invoices.label")}
          headline={t("feat.invoices.headline")}
          bullets={[t("feat.invoices.b1"), t("feat.invoices.b2"), t("feat.invoices.b3")]}
          mockup={<InvoiceMockup />}
          extra={<InvoiceTrustLine text={t("feat.invoices.trust")} />}
        />
        <FeatureRow
          label={t("feat.customers.label")}
          headline={t("feat.customers.headline")}
          bullets={[t("feat.customers.b1"), t("feat.customers.b2"), t("feat.customers.b3")]}
          mockup={<CustomerMockup />}
          reverse
        />
      </div>
      <DemoSection />
      <WhoSection />
      <ComparisonTable />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <TrustBar />
      <FooterCTA />
    </div>
  )
}
