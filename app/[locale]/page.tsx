"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

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

// ── Shared ────────────────────────────────────────────────────────────────────

const S = {
  obsidian: "var(--slate-900)",
  surface800: "var(--slate-800)",
  surface700: "var(--slate-700)",
  s50: "var(--slate-50)",
  s100: "var(--slate-100)",
  s200: "var(--slate-200)",
  s300: "var(--slate-300)",
  s400: "var(--slate-400)",
  s500: "var(--slate-500)",
  s600: "var(--slate-600)",
  s700: "var(--slate-700)",
  amber: "var(--amber-500)",
  amber400: "var(--amber-400)",
  amber600: "var(--amber-600)",
  amber50: "var(--amber-50)",
  border: "oklch(1 0 0 / 9%)",
  borderStrong: "oklch(1 0 0 / 16%)",
}

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

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const scrolled = useScrolled(60)
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        backdropFilter: "blur(16px) saturate(180%)",
        backgroundColor: scrolled ? "oklch(0.09 0.004 255 / 88%)" : "transparent",
        borderBottom: scrolled ? `1px solid ${S.border}` : "1px solid transparent",
        transition: "background-color 200ms ease, border-color 200ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: S.amber, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="oklch(0.10 0.005 52)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: S.s50 }}>
            Håndværk Pro
          </span>
        </Link>
        <div className="hidden md:flex" style={{ gap: 4 }}>
          {[["Funktioner", "#features"], ["Priser", "#pricing"], ["FAQ", "#faq"]].map(([label, href]) => (
            <a key={href} href={href} style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.s400, textDecoration: "none", padding: "6px 12px", borderRadius: 6, transition: "color 120ms ease" }}
              onMouseEnter={e => (e.currentTarget.style.color = S.s50)}
              onMouseLeave={e => (e.currentTarget.style.color = S.s400)}>
              {label}
            </a>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/sign-in" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.s400, textDecoration: "none", padding: "6px 14px", borderRadius: 6, transition: "color 120ms ease" }}
          onMouseEnter={e => (e.currentTarget.style.color = S.s50)}
          onMouseLeave={e => (e.currentTarget.style.color = S.s400)}>
          Log ind
        </Link>
        <Link href="/sign-up" style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          fontWeight: 500,
          color: "oklch(0.10 0.005 52)",
          backgroundColor: S.amber,
          padding: "7px 16px",
          borderRadius: 8,
          textDecoration: "none",
          transition: "box-shadow 120ms, transform 120ms",
          boxShadow: "var(--shadow-accent)",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 20px oklch(0.720 0.195 58 / 0.50)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-accent)" }}>
          Prøv gratis
        </Link>
      </div>
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

const HERO_WORDS = ["Spar", "3", "timer", "om", "ugen."]
const HERO_WORDS2 = ["Fokusér", "på", "håndværket."]

function FloatingCard({ text, icon, delay }: { text: string; icon: string; delay: number }) {
  const { ref, inView } = useInView(0.01)
  return (
    <div ref={ref} style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 14px",
      borderRadius: 10,
      background: "oklch(1 0 0 / 6%)",
      border: `1px solid ${S.border}`,
      backdropFilter: "blur(8px)",
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(12px)",
      transition: `opacity 400ms ${delay}ms var(--ease-smooth), transform 400ms ${delay}ms var(--ease-smooth)`,
      animation: inView ? `float${delay} 5s ease-in-out ${delay * 0.5}ms infinite` : "none",
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.s300 }}>{text}</span>
    </div>
  )
}

function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const [wordsVisible, setWordsVisible] = useState(false)
  const prefersReduced = usePrefersReduced()

  useEffect(() => {
    const t = setTimeout(() => setWordsVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

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
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: S.obsidian,
        overflow: "hidden",
        paddingTop: 60,
      }}
    >
      {/* Background grid */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(${S.border} 1px, transparent 1px), linear-gradient(90deg, ${S.border} 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at center, black 20%, transparent 80%)",
        maskImage: "radial-gradient(ellipse 80% 80% at center, black 20%, transparent 80%)",
        opacity: 0.5,
      }} />

      {/* Cursor spotlight */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(600px circle at var(--sx, 50%) var(--sy, 40%), oklch(0.720 0.195 58 / 6%), transparent 65%)",
      }} />

      {/* Ambient floor glow */}
      <div aria-hidden style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", pointerEvents: "none",
        background: "radial-gradient(ellipse 100% 60% at 50% 100%, oklch(0.720 0.195 58 / 5%), transparent)",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 10, flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "80px 24px 60px", textAlign: "center",
      }}>
        {/* Eyebrow badge */}
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
            Ny: Fakturaer sendes automatisk
          </span>
        </div>

        {/* Animated headline */}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: "-0.025em",
          marginBottom: 8,
          fontSize: "clamp(44px, 8vw, 88px)",
        }}>
          {HERO_WORDS.map((word, i) => (
            <span key={word} style={{
              display: "inline-block",
              color: S.s50,
              marginRight: "0.22em",
              opacity: wordsVisible ? 1 : 0,
              transform: wordsVisible ? "translateY(0)" : "translateY(14px)",
              transition: prefersReduced ? "none" : `opacity 400ms ${i * 60}ms var(--ease-spring), transform 400ms ${i * 60}ms var(--ease-spring)`,
            }}>{word}</span>
          ))}
          <br />
          {HERO_WORDS2.map((word, i) => (
            <span key={word} style={{
              display: "inline-block",
              color: i === 1 ? S.amber400 : S.s50,
              marginRight: "0.22em",
              opacity: wordsVisible ? 1 : 0,
              transform: wordsVisible ? "translateY(0)" : "translateY(14px)",
              transition: prefersReduced ? "none" : `opacity 400ms ${(HERO_WORDS.length + i) * 60 + 80}ms var(--ease-spring), transform 400ms ${(HERO_WORDS.length + i) * 60 + 80}ms var(--ease-spring)`,
            }}>{word}</span>
          ))}
        </h1>

        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "clamp(17px, 2.2vw, 21px)",
          color: S.s400,
          maxWidth: 520,
          lineHeight: 1.55,
          marginBottom: 40,
          opacity: wordsVisible ? 1 : 0,
          transform: wordsVisible ? "translateY(0)" : "translateY(8px)",
          transition: prefersReduced ? "none" : "opacity 400ms 500ms ease, transform 400ms 500ms ease",
        }}>
          Tilbud, jobs, fakturaer og kunder — alt samlet. Op og køre på 5 minutter.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
          <Link href="/sign-up" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            height: 50, padding: "0 28px", borderRadius: 10,
            fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 500,
            color: "oklch(0.10 0.005 52)", backgroundColor: S.amber,
            textDecoration: "none", boxShadow: "var(--shadow-accent)",
            transition: "box-shadow 120ms, transform 120ms",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 24px oklch(0.720 0.195 58 / 0.55)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-accent)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "oklch(0.10 0.005 52)", opacity: 0.6, animation: "pulse 2s ease infinite" }} />
            Start gratis i dag
          </Link>
          <a href="#features" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            height: 50, padding: "0 28px", borderRadius: 10,
            fontFamily: "var(--font-body)", fontSize: 16, color: S.s300,
            backgroundColor: "transparent", border: `1px solid ${S.borderStrong}`,
            textDecoration: "none", transition: "border-color 120ms, color 120ms",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = S.s400; (e.currentTarget as HTMLAnchorElement).style.color = S.s50 }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = S.borderStrong; (e.currentTarget as HTMLAnchorElement).style.color = S.s300 }}>
            Se hvordan det virker ↓
          </a>
        </div>

        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.s600, letterSpacing: "0.02em" }}>
          Ingen kreditkort · Gratis at starte · Dansk support
        </p>

        {/* Floating proof cards */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 56 }}>
          <FloatingCard text="Tilbud T-0042 accepteret — Erik Hansen" icon="✓" delay={0} />
          <FloatingCard text="Faktura betalt · 12.800 kr" icon="💰" delay={150} />
          <FloatingCard text="Job afsluttet · Frederiksberg" icon="📍" delay={300} />
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes float0 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
        @keyframes float150 { 0%,100%{transform:translateY(-3px)} 50%{transform:translateY(-8px)} }
        @keyframes float300 { 0%,100%{transform:translateY(-1px)} 50%{transform:translateY(-7px)} }
      `}</style>
    </section>
  )
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatItem({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { ref, inView } = useInView(0.3)
  const { count, start } = useCountUp(target)
  useEffect(() => { if (inView) start() }, [inView, start])
  const display = count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1).replace(".", ",")}` : count.toString()

  return (
    <div ref={ref} style={{ textAlign: "center", flex: 1 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: S.s50, lineHeight: 1 }}>
        {display}{suffix}
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.s500, marginTop: 6 }}>{label}</p>
    </div>
  )
}

function StatsBar() {
  return (
    <div style={{
      backgroundColor: S.obsidian,
      borderTop: `1px solid ${S.border}`,
      borderBottom: `1px solid ${S.border}`,
    }}>
      <div style={{
        maxWidth: 900, margin: "0 auto", padding: "32px 24px",
        display: "flex", alignItems: "center", gap: 0,
      }}>
        <StatItem target={2400} suffix="+" label="Håndværkere" />
        <div style={{ width: 1, height: 40, background: S.border, flexShrink: 0 }} />
        <StatItem target={48000} suffix="+" label="Fakturaer sendt" />
        <div style={{ width: 1, height: 40, background: S.border, flexShrink: 0 }} />
        <StatItem target={1200} suffix=" mio. kr" label="Faktureret via platformen" />
      </div>
    </div>
  )
}

// ── Problem Section ───────────────────────────────────────────────────────────

const PROBLEMS = [
  {
    n: "01",
    title: "Excel-arket fejler igen",
    body: "Du taber spor af materialer, glemmer timer og sender fakturaer med forkerte totaler. Det koster dig penge.",
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x={3} y={3} width={18} height={18} rx={2} />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Fakturaen ankom for sent",
    body: "Du sendte fakturaen 3 uger efter jobbet. Kunden har glemt det. Rykkerne føles akavet. Pengene venter.",
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={12} cy={12} r={10} />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Du mister overblikket",
    body: "3 apps, 2 ringbind, 1 rodet indbakke. Du ved ikke hvad der mangler betaling, hvem du skyldte et tilbud, eller hvornår jobbet slutter.",
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <line x1={3} y1={12} x2={21} y2={12} />
        <line x1={3} y1={6} x2={21} y2={6} />
        <line x1={3} y1={18} x2={15} y2={18} />
      </svg>
    ),
  },
]

function ProblemSection() {
  const { ref, inView } = useInView(0.1)
  const prefersReduced = usePrefersReduced()

  return (
    <section style={{ backgroundColor: S.obsidian, padding: "100px 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <SectionLabel>Lyder det bekendt?</SectionLabel>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 800,
          color: S.s50,
          letterSpacing: "-0.02em",
          maxWidth: 560,
          lineHeight: 1.1,
          marginBottom: 56,
        }}>
          Papirbunkerne er ikke værd at slæbe med.
        </h2>

        <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {PROBLEMS.map((p, i) => (
            <div key={p.n} style={{
              backgroundColor: S.surface800,
              border: `1px solid ${S.border}`,
              borderRadius: 12,
              padding: 24,
              position: "relative",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(16px)",
              transition: prefersReduced ? "none" : `opacity 300ms ${i * 80}ms var(--ease-smooth), transform 300ms ${i * 80}ms var(--ease-smooth)`,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "none" }}>
              <span style={{
                position: "absolute", top: 16, right: 16,
                fontFamily: "var(--font-mono)", fontSize: 11, color: S.s600,
              }}>{p.n}</span>
              <div style={{ color: S.s500, marginBottom: 14 }}>{p.icon}</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600, color: S.s200, marginBottom: 8 }}>{p.title}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.s500, lineHeight: 1.6 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Feature Sections ──────────────────────────────────────────────────────────

function JobsMockup() {
  const ITEMS = [
    { status: "Igangværende", color: "var(--status-progress-text)", bg: "var(--status-progress-bg)", title: "Badeværelse — Jensens vej 12", customer: "Erik Hansen", amount: "8.400 kr" },
    { status: "Ny", color: "var(--status-new-text)", bg: "var(--status-new-bg)", title: "Tagudskiftning — Magleby", customer: "Morten Lund", amount: "42.000 kr" },
    { status: "Planlagt", color: "var(--status-scheduled-text)", bg: "var(--status-scheduled-bg)", title: "El-installation — sommerhus", customer: "Kirsten Bach", amount: "5.200 kr" },
    { status: "Betalt", color: "var(--status-paid-text)", bg: "var(--status-paid-bg)", title: "VVS-eftersyn kontor", customer: "Lasse Møller", amount: "1.800 kr" },
  ]
  return (
    <div style={{
      backgroundColor: S.surface800,
      border: `1px solid ${S.borderStrong}`,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "var(--shadow-lg)",
      maxWidth: 360,
    }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: S.s50 }}>Jobs</span>
        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: S.amber, color: "oklch(0.10 0.005 52)", fontFamily: "var(--font-body)", fontWeight: 600 }}>+ Nyt job</span>
      </div>
      {ITEMS.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 0, borderBottom: i < ITEMS.length - 1 ? `1px solid ${S.border}` : "none", transition: "background 80ms" }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "oklch(1 0 0 / 3%)"}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ""}>
          <div style={{ width: 3, alignSelf: "stretch", backgroundColor: item.color, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: "10px 14px", minWidth: 0 }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: S.s200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 999, background: item.bg, color: item.color, fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.status}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: S.s500 }}>{item.customer}</span>
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: S.s400, padding: "0 14px", flexShrink: 0 }}>{item.amount}</span>
        </div>
      ))}
    </div>
  )
}

function QuoteMockup() {
  return (
    <div style={{
      backgroundColor: S.surface800,
      border: `1px solid ${S.borderStrong}`,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "var(--shadow-lg)",
      maxWidth: 440,
    }}>
      <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: S.s500 }}>TILBUD</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: S.s400, marginLeft: 8 }}>#T-0042</span>
        </div>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: S.amber, padding: "2px 8px", borderRadius: 999, background: "oklch(0.720 0.195 58 / 12%)" }}>Udkast</span>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.s500, marginBottom: 10 }}>Til: Morten Andersen, Aarhus</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "6px 12px", alignItems: "baseline" }}>
          {[
            ["Arbejdsløn", "4 timer", "2.600 kr"],
            ["Materialer", "Kobberrør Ø22", "480 kr"],
            ["Kørsel", "20 km", "120 kr"],
          ].map(([label, detail, amount], i) => (
            <>
              <span key={`l${i}`} style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.s200 }}>{label}</span>
              <span key={`d${i}`} style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.s500, textAlign: "right" }}>{detail}</span>
              <span key={`a${i}`} style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: S.s200, textAlign: "right" }}>{amount}</span>
            </>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${S.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: S.s100 }}>Total inkl. moms</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: S.amber }}>3.950 kr</span>
        </div>
      </div>
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${S.border}`, display: "flex", gap: 8 }}>
        <button style={{ flex: 1, height: 32, borderRadius: 7, border: `1px solid ${S.border}`, background: "transparent", color: S.s400, fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer" }}>Gem udkast</button>
        <button style={{ flex: 1, height: 32, borderRadius: 7, border: "none", background: S.amber, color: "oklch(0.10 0.005 52)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send tilbud →</button>
      </div>
    </div>
  )
}

function InvoiceMockup() {
  return (
    <div style={{
      backgroundColor: "oklch(1 0 0)",
      border: `1px solid oklch(0.88 0.007 255)`,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 20px 40px oklch(0 0 0 / 0.5)",
      maxWidth: 400,
      transform: "rotate(-1deg)",
      transition: "transform 200ms var(--ease-smooth)",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "rotate(0deg)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = "rotate(-1deg)"}>
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
        {[["Arbejdsløn", "2.600 kr"], ["Materialer", "480 kr"], ["Kørsel", "120 kr"]].map(([l, v], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid oklch(0.94 0.004 255)" }}>
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
    <div style={{ backgroundColor: S.surface800, border: `1px solid ${S.borderStrong}`, borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-lg)", maxWidth: 380 }}>
      <div style={{ padding: "16px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--amber-500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "oklch(0.10 0.005 52)" }}>EH</span>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: S.s50 }}>Erik Hansen</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.s500 }}>+45 23 45 67 89 · Aarhus</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "12px 16px", gap: 8, borderBottom: `1px solid ${S.border}` }}>
        {[["Faktureret", "142.400 kr", S.s200], ["Udestående", "12.800 kr", "oklch(0.78 0.18 25)"], ["Betalt", "129.600 kr", "oklch(0.75 0.14 145)"]].map(([l, v, c]) => (
          <div key={l as string}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: S.s500, marginBottom: 2 }}>{l}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: c as string }}>{v}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 16px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: S.s500, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Seneste jobs</p>
        {[
          { title: "Badeværelse renovation", status: "Betalt", c: "var(--status-paid-text)", bg: "var(--status-paid-bg)" },
          { title: "El-installation køkken", status: "Faktureret", c: "var(--status-invoiced-text)", bg: "var(--status-invoiced-bg)" },
        ].map((job, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i === 0 ? `1px solid ${S.border}` : "none" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.s300 }}>{job.title}</span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: job.bg, color: job.c, fontFamily: "var(--font-body)", fontWeight: 500 }}>{job.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureRow({
  label, headline, bullets, mockup, reverse, id,
}: {
  label: string; headline: string; bullets: string[]; mockup: React.ReactNode; reverse?: boolean; id?: string
}) {
  const { ref, inView } = useInView(0.15)
  const prefersReduced = usePrefersReduced()
  const textAnim: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? "translateX(0)" : `translateX(${reverse ? "24px" : "-24px"})`,
    transition: prefersReduced ? "none" : "opacity 280ms 60ms var(--ease-smooth), transform 280ms 60ms var(--ease-smooth)",
  }
  const imgAnim: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? "translateX(0)" : `translateX(${reverse ? "-24px" : "24px"})`,
    transition: prefersReduced ? "none" : "opacity 280ms var(--ease-smooth), transform 280ms var(--ease-smooth)",
  }

  return (
    <section id={id} style={{ backgroundColor: S.obsidian, padding: "80px 24px", borderTop: `1px solid ${S.border}` }}>
      <div
        ref={ref}
        style={{
          maxWidth: 1120, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 64,
          alignItems: "center",
        }}
      >
        <div style={{ order: reverse ? 2 : 1, ...textAnim }}>
          <SectionLabel>{label}</SectionLabel>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, color: S.s50, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 24 }}>
            {headline}
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {bullets.map((b, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={S.amber} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: S.s400, lineHeight: 1.5 }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ order: reverse ? 1 : 2, display: "flex", justifyContent: "center", ...imgAnim }}>
          {mockup}
        </div>
      </div>
    </section>
  )
}

// ── Demo Section ──────────────────────────────────────────────────────────────

const STAGES = [
  { label: "Opkald", desc: "Kunden ringer. Du opretter jobbet på 20 sekunder.", color: "var(--status-new-bg)", textColor: "var(--status-new-text)" },
  { label: "Tilbud sendt", desc: "Tilbud genereret og sendt direkte fra din telefon.", color: "var(--status-scheduled-bg)", textColor: "var(--status-scheduled-text)" },
  { label: "Accepteret", desc: "Kunden godkender med ét klik. Dig notificeres.", color: "var(--status-invoiced-bg)", textColor: "var(--status-invoiced-text)" },
  { label: "Job udføres", desc: "Photos, noter og materialeforbrug logges på stedet.", color: "var(--status-progress-bg)", textColor: "var(--status-progress-text)" },
  { label: "Faktura sendt", desc: "Faktura genereres automatisk fra jobbet. Sendes med PDF.", color: "var(--status-done-bg)", textColor: "var(--status-done-text)" },
  { label: "Betalt", desc: "Betaling modtaget. Bogen lukket. Videre til næste.", color: "var(--status-paid-bg)", textColor: "var(--status-paid-text)" },
]

function DemoSection() {
  const [active, setActive] = useState(0)
  const { ref, inView } = useInView(0.2)

  useEffect(() => {
    if (!inView) return
    const t = setInterval(() => setActive(a => (a + 1) % STAGES.length), 3000)
    return () => clearInterval(t)
  }, [inView])

  const stage = STAGES[active]

  return (
    <section id="how" style={{ backgroundColor: S.surface800, padding: "100px 24px", borderTop: `1px solid ${S.border}` }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionLabel>Se det i praksis</SectionLabel>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: S.s50, letterSpacing: "-0.02em" }}>
            Fra opkald til betaling.
          </h2>
        </div>

        {/* Stepper */}
        <div ref={ref} style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 40 }}>
          {STAGES.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                padding: "6px 14px", borderRadius: 999, cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                backgroundColor: active === i ? s.color : "transparent",
                color: active === i ? s.textColor : S.s500,
                border: active === i ? `1px solid transparent` : `1px solid ${S.border}`,
                transition: "all 180ms var(--ease-snap)",
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div style={{
          backgroundColor: S.obsidian,
          border: `1px solid ${S.border}`,
          borderRadius: 16,
          padding: "40px 48px",
          textAlign: "center",
          minHeight: 120,
          transition: "all 180ms var(--ease-snap)",
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 999, marginBottom: 16,
            background: stage.color, color: stage.textColor,
            fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
          }}>
            {active + 1} / {STAGES.length} — {stage.label}
          </span>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(16px, 2.5vw, 20px)", color: S.s300, lineHeight: 1.5 }}>
            {stage.desc}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: S.border, borderRadius: 999, marginTop: 16, overflow: "hidden" }}>
          <div key={active} style={{
            height: "100%", background: S.amber, borderRadius: 999,
            animation: "progress 3s linear forwards",
          }} />
        </div>
      </div>
      <style>{`@keyframes progress { from{width:0%} to{width:100%} }`}</style>
    </section>
  )
}

// ── Who It's For ──────────────────────────────────────────────────────────────

const TRADES = [
  { name: "Elektriker", icon: <path d="M13 2L4.5 13.5H11L9 22l11-13.5H14z" strokeWidth={1.75} /> },
  { name: "VVS", icon: <><rect x="5" y="13" width="8" height="8" rx="1.5" /><rect x="16" y="5" width="6" height="6" rx="1.5" /><path d="M13 17H15a3 3 0 003-3V8" /></> },
  { name: "Tømrer", icon: <><rect x="3" y="11" width="16" height="8" rx="1.5" /><path d="M19 13l5-3v8l-5-3" /><line x1="7" y1="19" x2="6" y2="23" /><line x1="14" y1="19" x2="14" y2="23" /></> },
  { name: "Maler", icon: <><rect x="5" y="5" width="14" height="8" rx="1.5" /><rect x="8" y="13" width="8" height="2" rx="1" /><line x1="12" y1="15" x2="12" y2="22" /><rect x="5" y="22" width="14" height="2" rx="1" /></> },
  { name: "Murer", icon: <><rect x="4" y="6" width="7" height="5" rx="1" /><rect x="13" y="6" width="7" height="5" rx="1" /><rect x="9" y="12" width="7" height="5" rx="1" /><rect x="4" y="18" width="7" height="4" rx="1" /><rect x="13" y="18" width="7" height="4" rx="1" /></> },
  { name: "Smed", icon: <><path d="M14.5 4.5L9.5 9.5M20 9.5l-3-3" /><path d="M4.5 19.5l8-8" /><circle cx="17" cy="7" r="3" /></> },
  { name: "Gulvlægger", icon: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></> },
  { name: "Tagdækker", icon: <><path d="M3 18L12 6l9 12" /><path d="M7 18h10" /><path d="M10 18v-5h4v5" /></> },
]

function WhoSection() {
  const { ref, inView } = useInView(0.15)
  const prefersReduced = usePrefersReduced()

  return (
    <section style={{ backgroundColor: S.obsidian, padding: "100px 24px", borderTop: `1px solid ${S.border}` }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" }}>
        <SectionLabel>Hvem er det for</SectionLabel>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: S.s50, letterSpacing: "-0.02em", marginBottom: 48 }}>
          Bygget til dem der bygger Danmark.
        </h2>

        <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, maxWidth: 720, margin: "0 auto 64px", justifyItems: "center" }}>
          {TRADES.map((trade, i) => (
            <div key={trade.name} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer",
              color: S.s500,
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(12px)",
              transition: prefersReduced ? "none" : `opacity 280ms ${i * 50}ms var(--ease-smooth), transform 280ms ${i * 50}ms var(--ease-smooth), color 120ms`,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = S.amber; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px) scale(1.05)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = S.s500; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)" }}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                {trade.icon}
              </svg>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{trade.name}</span>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div style={{ maxWidth: 540, margin: "0 auto", position: "relative", padding: "0 20px" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 80, fontWeight: 800, color: S.amber, opacity: 0.2, lineHeight: 0.8, display: "block", marginBottom: -20 }}>"</span>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px, 2.5vw, 22px)", fontStyle: "italic", color: S.s300, lineHeight: 1.55, marginBottom: 20 }}>
            "Jeg brugte søndagsaftener på fakturaer. Nu tager det mig ti minutter på fredag fra jobstedet."
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.s500 }}>— Mikkel R., Elektriker, Aarhus</p>
        </div>
      </div>
    </section>
  )
}

// ── Comparison Table ──────────────────────────────────────────────────────────

function ComparisonTable() {
  const { ref, inView } = useInView(0.1)
  const prefersReduced = usePrefersReduced()
  const rows = [
    ["Mobilvenlig", true, false, "Delvist", false],
    ["Jobstyring", true, false, false, false],
    ["Auto-rykkere", true, false, true, false],
    ["CVR-opslag", true, false, false, false],
    ["Bygget til håndværkere", true, false, false, false],
    ["Pris/md", "Fra 0 kr", "0 kr", "Fra 149 kr", "0 kr"],
  ]
  const cols = ["Funktion", "Håndværk Pro", "Excel/Word", "Billy / e-conomic", "Pen & papir"]

  return (
    <section style={{ backgroundColor: S.surface800, padding: "100px 24px", borderTop: `1px solid ${S.border}` }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <SectionLabel>Sammenligning</SectionLabel>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, color: S.s50, letterSpacing: "-0.02em", marginBottom: 40 }}>
          Hvorfor ikke bare Excel?
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
                    padding: "10px 16px",
                    textAlign: i === 0 ? "left" : "center",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: i === 1 ? S.amber : S.s500,
                    borderBottom: `1px solid ${i === 1 ? S.amber : S.border}`,
                    borderTop: i === 1 ? `2px solid ${S.amber}` : "none",
                    backgroundColor: i === 1 ? "oklch(0.720 0.195 58 / 6%)" : "transparent",
                    borderRadius: i === 1 ? "6px 6px 0 0" : 0,
                  }}>
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
                      padding: "11px 16px",
                      textAlign: ci === 0 ? "left" : "center",
                      fontFamily: ci === 0 ? "var(--font-body)" : (cell === true || cell === false) ? "inherit" : "var(--font-mono)",
                      fontSize: 13,
                      color: ci === 0 ? S.s300 : S.s400,
                      backgroundColor: ci === 1 ? "oklch(0.720 0.195 58 / 4%)" : "transparent",
                    }}>
                      {cell === true ? (
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={S.amber} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto", display: "block" }}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : cell === false ? (
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={S.s600} strokeWidth={2} strokeLinecap="round" style={{ margin: "0 auto", display: "block" }}>
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

// ── Testimonials ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { initials: "MK", name: "Mads Kristiansen", role: "VVS-montør, Odense", quote: "Jeg sendte min første faktura fra jobstedet. Kunden betalte samme dag. Aldrig gjort det hurtigere." },
  { initials: "LT", name: "Lene Thomsen", role: "Malermester, København", quote: "Tilbud tog en time i Word. Nu er de færdige på 5 minutter og ser ti gange mere professionelle ud." },
  { initials: "PH", name: "Peter Holm", role: "Tømrer, Aalborg", quote: "Rykkerne sender sig selv. Jeg har fået 3 betaling­er ind den uge jeg ellers ville have glemt at følge op." },
]

function TestimonialsSection() {
  const { ref, inView } = useInView(0.1)
  const prefersReduced = usePrefersReduced()

  return (
    <section style={{ backgroundColor: S.obsidian, padding: "100px 24px", borderTop: `1px solid ${S.border}` }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <SectionLabel>Udtalelser</SectionLabel>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: S.s50, letterSpacing: "-0.02em", marginBottom: 48 }}>
          Hvad håndværkere siger.
        </h2>
        <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              backgroundColor: S.surface800,
              border: `1px solid ${S.border}`,
              borderRadius: 14,
              padding: 28,
              position: "relative",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(16px)",
              transition: prefersReduced ? "none" : `opacity 280ms ${i * 80}ms var(--ease-smooth), transform 280ms ${i * 80}ms var(--ease-smooth)`,
            }}>
              <span style={{ position: "absolute", top: 16, left: 20, fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 800, color: S.amber, opacity: 0.25, lineHeight: 1 }}>"</span>
              <div style={{ display: "flex", marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <svg key={s} width={14} height={14} viewBox="0 0 24 24" fill={S.amber} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                ))}
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.s400, lineHeight: 1.65, marginBottom: 20, fontStyle: "italic" }}>
                "{t.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: S.amber, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "oklch(0.10 0.005 52)" }}>{t.initials}</span>
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: S.s100 }}>{t.name}</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.s500 }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing ───────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Gratis",
    monthly: "0",
    annual: "0",
    badge: null,
    featured: false,
    features: ["Op til 10 aktive jobs", "Fakturaer & tilbud", "Kundekartotek", "Mobil-app"],
    locked: ["Ubegrænsede jobs", "PDF-branding (dit logo)", "Auto-rykkere", "Prioriteret support"],
    cta: "Opret gratis konto",
    href: "/sign-up",
  },
  {
    name: "Solo",
    monthly: "149",
    annual: "119",
    badge: "Anbefalet",
    featured: true,
    features: ["Ubegrænsede jobs", "Fakturaer & tilbud", "PDF med dit logo", "Auto-rykkere +8d/+15d", "Materialebibliotek", "CVR-opslag"],
    locked: [],
    cta: "Start Solo",
    href: "/sign-up",
  },
  {
    name: "Hold",
    monthly: "299",
    annual: "239",
    badge: null,
    featured: false,
    features: ["Alt i Solo", "Op til 5 brugere", "Team-dashboard", "Prioriteret support"],
    locked: [],
    cta: "Start Hold",
    href: "/sign-up",
  },
]

function PricingSection() {
  const [annual, setAnnual] = useState(true)
  return (
    <section id="pricing" style={{ backgroundColor: S.surface800, padding: "100px 24px", borderTop: `1px solid ${S.border}` }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionLabel>Priser</SectionLabel>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 800, color: S.s50, letterSpacing: "-0.02em", marginBottom: 8 }}>
            Enkle priser. Ingen overraskelser.
          </h2>
          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginTop: 20, padding: "4px", borderRadius: 10, background: "oklch(1 0 0 / 5%)", border: `1px solid ${S.border}` }}>
            {[["Månedlig", false], ["Årlig", true]].map(([label, val]) => (
              <button key={label as string} onClick={() => setAnnual(val as boolean)} style={{
                padding: "6px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                backgroundColor: annual === val ? S.amber : "transparent",
                color: annual === val ? "oklch(0.10 0.005 52)" : S.s400,
                transition: "all 150ms var(--ease-snap)",
              }}>
                {label}{val ? <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>Spar 20%</span> : ""}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {PLANS.map((plan) => (
            <div key={plan.name} style={{
              backgroundColor: S.obsidian,
              border: plan.featured ? `1px solid ${S.amber}` : `1px solid ${S.border}`,
              borderRadius: 16,
              overflow: "hidden",
              display: "flex", flexDirection: "column",
              boxShadow: plan.featured ? `0 0 48px oklch(0.720 0.195 58 / 18%)` : "none",
              position: "relative",
            }}>
              {plan.featured && <div style={{ height: 2, background: `linear-gradient(90deg, ${S.amber600}, ${S.amber}, ${S.amber400})` }} />}
              {plan.badge && (
                <div style={{
                  position: "absolute", top: plan.featured ? 18 : 14, right: 16,
                  padding: "3px 10px", borderRadius: 999, background: S.amber,
                  fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
                  color: "oklch(0.10 0.005 52)",
                }}>{plan.badge}</div>
              )}
              <div style={{ padding: "24px 24px 28px", flex: 1, display: "flex", flexDirection: "column" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: S.s50, marginBottom: 12 }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 48, fontWeight: 700, color: S.s50, lineHeight: 1 }}>
                    {annual ? plan.annual : plan.monthly}
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.s500 }}>kr./md</span>
                </div>
                {annual && plan.featured && <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.amber, marginBottom: 16 }}>Faktureres årligt</p>}
                <div style={{ height: 1, background: S.border, margin: "20px 0" }} />
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={S.amber} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.s300 }}>{f}</span>
                    </li>
                  ))}
                  {plan.locked.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 9, opacity: 0.35 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={S.s600} strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}>
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.s600 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: 46, borderRadius: 10,
                  fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500,
                  textDecoration: "none",
                  backgroundColor: plan.featured ? S.amber : "transparent",
                  color: plan.featured ? "oklch(0.10 0.005 52)" : S.s300,
                  border: plan.featured ? "none" : `1.5px solid ${S.border}`,
                  boxShadow: plan.featured ? "var(--shadow-accent)" : "none",
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
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.s600, textAlign: "center", marginTop: 24 }}>
          Ingen binding · Annullér når som helst · Data eksporteres altid
        </p>
      </div>
    </section>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "Er det sikkert at gemme mine kundedata her?", a: "Ja. Vi benytter krypteret lagring og følger GDPR-reglerne. Dine data opbevares på europæiske servere og deles aldrig med tredjeparter." },
  { q: "Kræver det teknisk indsigt?", a: "Slet ikke. Håndværk Pro er bygget til folk der arbejder med hænderne — ikke computere. Du er kørende på under 5 minutter." },
  { q: "Hvad sker der med mine data hvis jeg stopper?", a: "Du kan til enhver tid eksportere alle dine kunder, jobs, fakturaer og tilbud som CSV. Vi ejer aldrig dine data." },
  { q: "Overholder fakturaerne bogføringsloven?", a: "Ja. Vores fakturaer inkluderer CVR-nummer, EAN, moms-specifikation og alle de felter der kræves i henhold til dansk bogføringslov." },
  { q: "Kan jeg bruge det på min telefon på jobstedet?", a: "Ja — det er det primære use-case. Appen er bygget mobil-first. Opret job, tag fotos og send fakturaer direkte fra stedet." },
  { q: "Hvad er forskellen på Gratis og Solo?", a: "Gratis giver op til 10 aktive jobs og basisfunktioner. Solo fjerner grænsen, tilføjer dit eget logo på PDF, automatiske rykkere og materialebibliotek." },
  { q: "Kan jeg importere mine eksisterende kunder?", a: "Ja, du kan importere kunder via CSV-fil. Vi arbejder desuden på direkte import fra Billy og e-conomic." },
  { q: "Hvad koster det at stoppe?", a: "Ingenting. Du betaler kun for aktive måneder. Du kan annullere dit abonnement til enhver tid, og din konto forbliver aktiv til periodens udløb." },
]

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="faq" style={{ backgroundColor: S.obsidian, padding: "100px 24px", borderTop: `1px solid ${S.border}` }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <SectionLabel>FAQ</SectionLabel>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: S.s50, letterSpacing: "-0.02em", marginBottom: 40 }}>
          Ofte stillede spørgsmål
        </h2>
        <div>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${S.border}` }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "18px 0", gap: 16, background: "transparent", border: "none", cursor: "pointer",
                  textAlign: "left",
                }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: open === i ? S.s50 : S.s200, flex: 1, lineHeight: 1.4 }}>
                  {faq.q}
                </span>
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  border: `1px solid ${open === i ? S.amber : S.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: open === i ? S.amber : S.s500, flexShrink: 0,
                  transition: "all 180ms var(--ease-snap)",
                  transform: open === i ? "rotate(45deg)" : "none",
                }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </button>
              <div style={{
                overflow: "hidden",
                maxHeight: open === i ? 300 : 0,
                transition: "max-height 200ms var(--ease-smooth)",
              }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.s400, lineHeight: 1.7, paddingBottom: 18 }}>
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
  const items = [
    { icon: "🔒", text: "GDPR-compliant" },
    { icon: "🇩🇰", text: "Dansk support" },
    { icon: "💳", text: "Ingen kreditkort kræves" },
    { icon: "⚡", text: "Opsæt på 5 min" },
  ]
  return (
    <div style={{ backgroundColor: S.surface800, borderTop: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}` }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "12px 32px" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i > 0 && <span className="hidden md:inline" style={{ color: S.s700, marginRight: 20 }}>|</span>}
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.s400 }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Footer CTA ────────────────────────────────────────────────────────────────

function FooterCTA() {
  return (
    <footer>
      {/* CTA section */}
      <div style={{ background: `linear-gradient(135deg, var(--amber-600) 0%, var(--amber-500) 55%, var(--amber-400) 100%)`, padding: "100px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, color: "oklch(0.12 0.005 52)", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 16 }}>
            Begynd i dag.
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 18, color: "oklch(0.25 0.008 52)", marginBottom: 36 }}>
            Første job gratis. Ingen binding.
          </p>
          <Link href="/sign-up" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            height: 52, padding: "0 36px", borderRadius: 12,
            fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600,
            color: S.s50, backgroundColor: "oklch(0.09 0.004 255)",
            textDecoration: "none",
            transition: "opacity 120ms",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "1"}>
            Opret gratis konto →
          </Link>
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ backgroundColor: S.obsidian, borderTop: `1px solid ${S.border}`, padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 24, height: 24, borderRadius: 5, background: S.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="oklch(0.10 0.005 52)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>
                </div>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: S.s50 }}>Håndværk Pro</span>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.s600, lineHeight: 1.6 }}>Bygget til danske håndværkere.</p>
            </div>
            {[
              { heading: "Produkt", links: ["Funktioner", "Priser", "Changelog"] },
              { heading: "Virksomhed", links: ["Om os", "Kontakt", "Blog"] },
              { heading: "Legal", links: ["Privatlivspolitik", "Cookiepolitik", "Vilkår"] },
            ].map(col => (
              <div key={col.heading}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: S.s500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>{col.heading}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(link => (
                    <a key={link} href="#" style={{
                      fontFamily: "var(--font-body)", fontSize: 14, color: S.s500, textDecoration: "none",
                      transition: "color 120ms",
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = S.s300}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = S.s500}>
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.s600 }}>© 2026 Håndværk Pro</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.s600 }}>Bygget til danske håndværkere</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) router.replace("/overview")
  }, [isLoaded, user, router])

  return (
    <div style={{ fontFamily: "var(--font-body)", backgroundColor: S.obsidian }}>
      <Nav />
      <Hero />
      <StatsBar />
      <ProblemSection />
      <div id="features">
        <FeatureRow
          label="Jobs"
          headline="Alle jobs. Alt overblik."
          bullets={[
            "Opret og planlæg jobs på under 30 sekunder",
            "6-trins status — fra Ny til Betalt",
            "Upload fotos direkte fra jobstedet",
          ]}
          mockup={<JobsMockup />}
        />
        <FeatureRow
          label="Tilbud"
          headline="Et tilbud på 45 sekunder."
          bullets={[
            "Præfyldte linjevarer fra dit materialebibliotek",
            "Send direkte til kunden — de accepterer med ét klik",
            "Tilbud konverteres automatisk til faktura",
          ]}
          mockup={<QuoteMockup />}
          reverse
        />
        <FeatureRow
          label="Fakturaer"
          headline="Fra job til betalt — automatisk."
          bullets={[
            "Professionelle PDF-fakturaer med dit logo",
            "Automatisk rykker efter 8 og 15 dage",
            "Overholder dansk bogføringslov",
          ]}
          mockup={<InvoiceMockup />}
        />
        <FeatureRow
          label="Kunder"
          headline="Kend din kunde. Husk alt."
          bullets={[
            "CVR-opslag udfylder firma og adresse automatisk",
            "Komplet historik: jobs, tilbud, fakturaer",
            "Se præcis hvad en kunde skylder dig",
          ]}
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
