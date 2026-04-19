"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter as useI18nRouter, usePathname as useI18nPathname } from "@/i18n/navigation"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { TextPlugin } from "gsap/TextPlugin"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { SplitText } from "gsap/SplitText"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger, useGSAP, TextPlugin, MotionPathPlugin, SplitText)

// ── Hooks ─────────────────────────────────────────────────────────────────────

function usePrefersReduced() {
  const [r, setR] = useState(false)
  useEffect(() => setR(window.matchMedia("(prefers-reduced-motion: reduce)").matches), [])
  return r
}

function useScrolled(t = 60) {
  const [s, setS] = useState(false)
  useEffect(() => {
    const fn = () => setS(window.scrollY > t)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [t])
  return s
}

// ── Color System ──────────────────────────────────────────────────────────────

const S = {
  bg:           "#F7F3EE",
  surface:      "#EFEAE4",
  surfaceAlt:   "#E5DDD3",
  dark:         "#1A140D",
  darkSurface:  "#241B11",
  text:         "#1A140D",
  textSub:      "#6B6158",
  textMuted:    "#9B9188",
  textInverse:  "#F7F3EE",
  textSubInv:   "#B8AFA6",
  amber:        "var(--amber-500)",
  amberRaw:     "oklch(0.720 0.195 58)",
  amberHex:     "#E07B20",
  border:       "rgba(26,20,13,0.09)",
  borderStrong: "rgba(26,20,13,0.16)",
  darkBorder:   "rgba(247,243,238,0.10)",
  darkBorderSt: "rgba(247,243,238,0.18)",
}

const MAX_W = 1140

// ── GSAP text helpers ─────────────────────────────────────────────────────────

// Each word starts dim — GSAP ScrollTrigger scrub brightens them as you scroll
function WordScrub({ text, cls }: { text: string; cls: string }) {
  const words = text.split(" ")
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className={cls} style={{ display: "inline-block", opacity: 0.12 }}>
          {w}{i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </>
  )
}

// ── Language Switcher ─────────────────────────────────────────────────────────

function LanguageSwitcher() {
  const params = useParams()
  const locale = (params?.locale as string) ?? "en"
  const router = useI18nRouter()
  const pathname = useI18nPathname()
  const other = locale === "en" ? "da" : "en"
  return (
    <button
      onClick={() => router.replace(pathname, { locale: other })}
      style={{
        fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
        color: S.textSub, background: "transparent",
        border: `1px solid ${S.border}`, borderRadius: 6,
        padding: "4px 10px", cursor: "pointer", letterSpacing: "0.08em",
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
    >{other.toUpperCase()}</button>
  )
}

// ── Cursor Glow ───────────────────────────────────────────────────────────────

function CursorGlow() {
  const dotRef   = useRef<HTMLDivElement>(null)
  const haloRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pos    = { x: -200, y: -200 }
    const smooth = { x: -200, y: -200 }
    const onMove = (e: MouseEvent) => { pos.x = e.clientX; pos.y = e.clientY }
    window.addEventListener("mousemove", onMove)

    const tick = () => {
      smooth.x += (pos.x - smooth.x) * 0.14
      smooth.y += (pos.y - smooth.y) * 0.14
      if (dotRef.current)  gsap.set(dotRef.current,  { x: pos.x - 5,    y: pos.y - 5 })
      if (haloRef.current) gsap.set(haloRef.current, { x: smooth.x - 20, y: smooth.y - 20 })
    }
    gsap.ticker.add(tick)

    const onEnter = (e: Event) => {
      if ((e.target as HTMLElement).closest("a,button")) {
        gsap.to(haloRef.current, { scale: 2.6, opacity: 0.22, duration: 0.3, ease: "power2.out" })
      }
    }
    const onLeave = () => gsap.to(haloRef.current, { scale: 1, opacity: 0.08, duration: 0.35 })
    document.addEventListener("mouseover",  onEnter)
    document.addEventListener("mouseout",   onLeave)

    return () => {
      window.removeEventListener("mousemove", onMove)
      gsap.ticker.remove(tick)
      document.removeEventListener("mouseover",  onEnter)
      document.removeEventListener("mouseout",   onLeave)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} style={{
        position: "fixed", zIndex: 9998, pointerEvents: "none",
        width: 10, height: 10, borderRadius: "50%",
        background: S.amberRaw, mixBlendMode: "multiply", top: 0, left: 0,
      }} />
      <div ref={haloRef} style={{
        position: "fixed", zIndex: 9997, pointerEvents: "none",
        width: 40, height: 40, borderRadius: "50%",
        border: `1.5px solid ${S.amberRaw}`, opacity: 0.08, top: 0, left: 0,
      }} />
    </>
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const scrolled = useScrolled()
  const t = useTranslations("Landing")
  const navRef = useRef<HTMLElement>(null)
  const links: [string, string][] = [
    [t("nav.features"), "features"],
    [t("nav.pricing"),  "pricing"],
    [t("nav.faq"),      "faq"],
  ]
  useGSAP(() => {
    gsap.from(navRef.current, { y: -28, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.05 })
  }, { scope: navRef })

  return (
    <nav ref={navRef} style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", height: 62,
      background: scrolled ? `${S.bg}f0` : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? `1px solid ${S.border}` : "none",
      transition: "background 220ms, backdrop-filter 220ms, border-color 220ms",
    }}>
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, letterSpacing: "-0.04em", color: S.text }}>Håndværk</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, letterSpacing: "-0.04em", color: S.amber }}>Pro</span>
      </Link>
      <div className="hidden md:flex" style={{ gap: 2 }}>
        {links.map(([label, id]) => (
          <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })} style={{
            fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500,
            color: S.textSub, background: "transparent", border: "none",
            cursor: "pointer", padding: "6px 16px", borderRadius: 8,
            transition: "color 120ms, background 120ms",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = S.text; (e.currentTarget as HTMLButtonElement).style.background = S.surface }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = S.textSub; (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
          >{label}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LanguageSwitcher />
        <Link href="/sign-in" style={{
          fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500,
          color: S.textSub, textDecoration: "none", padding: "7px 16px", transition: "color 120ms",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = S.text)}
        onMouseLeave={e => (e.currentTarget.style.color = S.textSub)}
        >{t("nav.signIn")}</Link>
        <Link href="/sign-up" style={{
          fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700,
          color: "#fff", background: S.dark, textDecoration: "none",
          padding: "8px 20px", borderRadius: 9, letterSpacing: "-0.01em",
          boxShadow: "0 2px 10px rgba(26,20,13,0.22)",
          transition: "transform 140ms, box-shadow 140ms",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 5px 18px rgba(26,20,13,0.32)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 10px rgba(26,20,13,0.22)" }}
        >{t("nav.tryFree")}</Link>
      </div>
    </nav>
  )
}

// ── Hero — GSAP char-by-char "slide up from clip" + parallax scrub ────────────

function Hero() {
  const t = useTranslations("Landing")
  const heroRef         = useRef<HTMLElement>(null)
  const lineRef         = useRef<SVGLineElement>(null)
  const headlineRef     = useRef<HTMLHeadingElement>(null)
  const eyebrowRef      = useRef<HTMLDivElement>(null)
  const subRef          = useRef<HTMLParagraphElement>(null)
  const ctasRef         = useRef<HTMLDivElement>(null)
  const trustRef        = useRef<HTMLParagraphElement>(null)
  const mockupRef       = useRef<HTMLDivElement>(null)
  const textColRef      = useRef<HTMLDivElement>(null)
  const orbRef1         = useRef<HTMLDivElement>(null)
  const orbRef2         = useRef<HTMLDivElement>(null)
  const kineticRef      = useRef<HTMLDivElement>(null)
  const particlesRef    = useRef<HTMLDivElement>(null)
  const signatureRef    = useRef<SVGPathElement>(null)
  const prefersReduced  = usePrefersReduced()

  // Mouse parallax — orbs track cursor at different depths
  useEffect(() => {
    if (prefersReduced) return
    const onMouse = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      gsap.to(orbRef1.current,   { x: x * 70,  y: y * 50,  duration: 1.6, ease: "power2.out" })
      gsap.to(orbRef2.current,   { x: x * -50, y: y * -35, duration: 1.2, ease: "power2.out" })
      gsap.to(kineticRef.current,{ x: x * -22, duration: 1.8, ease: "power2.out" })
    }
    window.addEventListener("mousemove", onMouse)
    return () => window.removeEventListener("mousemove", onMouse)
  }, [prefersReduced])

  useGSAP(() => {
    if (prefersReduced) return
    if (!headlineRef.current) return

    // Workshop dust particles
    const dust: HTMLDivElement[] = []
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div")
      const size = Math.random() * 2.5 + 1
      p.style.cssText = `position:absolute;border-radius:50%;background:${S.amberRaw};pointer-events:none;width:${size}px;height:${size}px;left:${Math.random() * 100}%;bottom:${Math.random() * 40 + 10}%;opacity:0;`
      particlesRef.current?.appendChild(p)
      dust.push(p)
      gsap.to(p, {
        y: -(Math.random() * 320 + 100), x: (Math.random() - 0.5) * 60,
        opacity: Math.random() * 0.12 + 0.03,
        duration: Math.random() * 12 + 14, delay: Math.random() * 8,
        repeat: -1, ease: "power1.out",
      })
    }

    // ── SplitText — the real GSAP char-emerge from below ───────────────────────
    const split = new SplitText(headlineRef.current, {
      type: "lines,chars",
      linesClass: "st-line",
    })
    gsap.set(split.lines, { overflow: "hidden" })

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } })
    tl.from(kineticRef.current, { opacity: 0, duration: 1.2, ease: "power2.out" }, 0)
    tl.fromTo(lineRef.current,
      { strokeDasharray: "0 100%", strokeDashoffset: 0 },
      { strokeDasharray: "100% 0", duration: 0.7 }, 0.2
    )
    .from(eyebrowRef.current, { y: 22, opacity: 0, duration: 0.45 }, "-=0.35")
    // SplitText chars emerge from inside overflow:hidden line containers
    .from(split.chars, {
      y: "115%", stagger: { each: 0.016, from: "start" }, duration: 0.62,
    }, "-=0.25")
    .from(subRef.current, { y: 20, opacity: 0, duration: 0.55, ease: "power3.out" }, "-=0.38")
    .from(ctasRef.current?.children ?? [], {
      y: 18, opacity: 0, stagger: 0.09, duration: 0.48, ease: "back.out(1.7)",
    }, "-=0.32")
    .from(trustRef.current, { opacity: 0, duration: 0.5 }, "-=0.2")
    .from(mockupRef.current, { x: 56, opacity: 0, duration: 0.85, ease: "power2.out" }, 0.35)

    // ── THE most famous GSAP SVG animation: dot draws the path in real time ────
    // Synchronized DrawSVG + MotionPath — the exact technique from gsap.com/svg
    const sigPath = signatureRef.current
    if (sigPath) {
      const sigLen = sigPath.getTotalLength()
      gsap.set(sigPath, { strokeDasharray: sigLen, strokeDashoffset: sigLen, opacity: 0.5 })

      // Initial draw: dot races ahead and "draws" the path (linear = perfect sync)
      const sigTl = gsap.timeline({ delay: 0.7 })
      sigTl.to(sigPath, { strokeDashoffset: 0, duration: 3.4, ease: "linear" }, 0)
      sigTl.to(".sig-dot", {
        motionPath: { path: sigPath, align: sigPath, alignOrigin: [0.5, 0.5] },
        duration: 3.4, ease: "linear",
        onComplete() {
          // After draw completes, dot loops forever at relaxed pace
          gsap.to(".sig-dot", {
            motionPath: { path: sigPath, align: sigPath, alignOrigin: [0.5, 0.5] },
            duration: 20, ease: "none", repeat: -1,
          })
          gsap.to(".sig-halo", {
            motionPath: { path: sigPath, align: sigPath, alignOrigin: [0.5, 0.5], start: -0.015, end: 0.985 },
            duration: 20, ease: "none", repeat: -1,
          })
        },
      }, 0)
      sigTl.to(".sig-halo", {
        motionPath: { path: sigPath, align: sigPath, alignOrigin: [0.5, 0.5], start: -0.015, end: 0.985 },
        duration: 3.4, ease: "linear",
      }, 0)
    }

    // Multi-layer parallax on scroll
    ScrollTrigger.create({
      trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 0.6,
      onUpdate(self) {
        gsap.set(textColRef.current, { y: self.progress * -55 })
        gsap.set(mockupRef.current,  { y: self.progress * -28 })
        gsap.set(kineticRef.current, { y: self.progress * 90 })
        gsap.set(orbRef1.current,    { y: self.progress * -120 })
        gsap.set(orbRef2.current,    { y: self.progress * 60 })
      },
    })

    return () => {
      dust.forEach(p => p.parentNode?.removeChild(p))
      split.revert()
    }
  }, { scope: heroRef })

  const l1 = t("hero.line1")
  const l2 = t("hero.line2")

  return (
    <section ref={heroRef} style={{
      minHeight: "100svh", backgroundColor: S.bg,
      backgroundImage: "radial-gradient(circle at 1px 1px, rgba(26,20,13,0.055) 1px, transparent 0)",
      backgroundSize: "28px 28px",
      paddingTop: 100, paddingBottom: 80,
      display: "flex", alignItems: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* Floating dust particles container */}
      <div ref={particlesRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} />

      {/* Ambient orb 1 — amber, top right */}
      <div ref={orbRef1} style={{
        position: "absolute", top: "-8%", right: "2%",
        width: 640, height: 640, borderRadius: "50%",
        background: `radial-gradient(circle, ${S.amberRaw}12 0%, ${S.amberRaw}04 40%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Ambient orb 2 — teal, bottom left */}
      <div ref={orbRef2} style={{
        position: "absolute", bottom: "0%", left: "-8%",
        width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle, oklch(0.68 0.12 185 / 0.09) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Kinetic background text — drifts on scroll + mouse */}
      <div ref={kineticRef} style={{
        position: "absolute", top: "50%", left: "-2%", transform: "translateY(-50%)",
        fontFamily: "var(--font-display)", fontWeight: 800,
        fontSize: "clamp(100px, 13vw, 190px)",
        color: S.text, opacity: 0.028, letterSpacing: "-0.07em",
        whiteSpace: "nowrap", userSelect: "none", pointerEvents: "none", lineHeight: 1,
      }}>HANDVAERK PRO</div>

      <svg aria-hidden style={{
        position: "absolute", top: 200, left: 0, width: "100%", height: 2, pointerEvents: "none",
      }} viewBox="0 0 1000 2" preserveAspectRatio="none">
        <line ref={lineRef} x1="0" y1="1" x2="1000" y2="1"
          stroke={S.amberRaw} strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.2 }} />
      </svg>

      {/* Signature SVG — synchronized DrawSVG + MotionPath (THE most famous GSAP animation) */}
      <svg aria-hidden viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1,
      }}>
        <path ref={signatureRef}
          d="M 0 630 C 90 490, 190 760, 290 620 C 360 510, 380 380, 450 510 C 520 640, 560 780, 640 640 C 700 520, 720 390, 800 520 C 870 650, 910 790, 990 650 C 1050 530, 1070 400, 1150 530 C 1190 600, 1200 680, 1200 650"
          fill="none" stroke={S.amberRaw} strokeWidth="2.5"
        />
        <circle className="sig-halo" r="12" fill={S.amberRaw} opacity="0.15" />
        <circle className="sig-dot"  r="5"  fill={S.amberRaw} opacity="0.95" />
      </svg>

      <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: "0 28px", width: "100%", position: "relative", zIndex: 2 }}>
        <div className="grid md:grid-cols-2 grid-cols-1" style={{ gap: 64, alignItems: "center" }}>
          {/* Text */}
          <div ref={textColRef}>
            <div ref={eyebrowRef} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: S.surface, border: `1px solid ${S.border}`,
              borderRadius: 100, padding: "5px 14px 5px 6px", marginBottom: 36,
            }}>
              <span style={{
                background: S.amber, color: "#fff", fontSize: 10, fontWeight: 800,
                letterSpacing: "0.10em", textTransform: "uppercase",
                borderRadius: 100, padding: "2px 9px", fontFamily: "var(--font-body)",
              }}>NEW</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.textSub, fontWeight: 500 }}>
                {t("hero.eyebrow")}
              </span>
            </div>

            {/* Headline — SplitText handles char splitting at DOM level */}
            <h1 ref={headlineRef} style={{
              fontFamily: "var(--font-display)", fontWeight: 800, margin: "0 0 28px",
              fontSize: "clamp(48px, 6.5vw, 88px)", lineHeight: 1.0,
              letterSpacing: "-0.05em", color: S.text,
            }}>
              {l1}
              <br />
              <em style={{ fontStyle: "normal", color: S.amberHex }}>{l2}</em>
            </h1>

            <p ref={subRef} style={{
              fontFamily: "var(--font-body)", fontSize: 18, lineHeight: 1.65,
              color: S.textSub, margin: "0 0 44px", maxWidth: 460,
            }}>{t("hero.sub")}</p>

            <div ref={ctasRef} style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              <Link href="/sign-up" style={{
                fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 700,
                color: "#fff", background: S.dark, textDecoration: "none",
                padding: "15px 32px", borderRadius: 11, letterSpacing: "-0.02em",
                boxShadow: "0 4px 24px rgba(26,20,13,0.28)",
                transition: "transform 150ms, box-shadow 150ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(26,20,13,0.38)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 24px rgba(26,20,13,0.28)" }}
              >{t("hero.ctaPrimary")}</Link>

              <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} style={{
                fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600,
                color: S.text, background: "transparent",
                border: `1.5px solid ${S.borderStrong}`,
                padding: "15px 32px", borderRadius: 11, cursor: "pointer",
                transition: "background 150ms",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = S.surface}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >{t("hero.ctaSecondary")}</button>
            </div>

            <p ref={trustRef} style={{
              fontFamily: "var(--font-body)", fontSize: 13, color: S.textMuted, margin: 0,
            }}>{t("hero.noCredit")}</p>
          </div>

          {/* Mockup */}
          <div ref={mockupRef} className="hidden md:block">
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroMockup() {
  return (
    <div>
      <div style={{
        background: "#fff", borderRadius: 20,
        border: `1px solid ${S.borderStrong}`,
        boxShadow: "0 24px 80px rgba(26,20,13,0.12), 0 6px 20px rgba(26,20,13,0.07)",
        overflow: "hidden",
      }}>
        <div style={{ background: S.dark, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#ff5f57","#ffbd2e","#28c840"].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />)}
          </div>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#ffffff50", fontWeight: 500 }}>Handvaerk Pro</span>
          <div style={{ width: 44 }} />
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[{ l: "Active jobs", v: "7" },{ l: "Outstanding", v: "84k" },{ l: "Paid today", v: "2" }].map(({ l, v }) => (
              <div key={l} style={{ background: S.surface, borderRadius: 12, padding: "14px 12px", border: `1px solid ${S.border}` }}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: S.text, letterSpacing: "-0.03em" }}>{v}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: S.textMuted, marginTop: 3, fontWeight: 500 }}>{l}</div>
              </div>
            ))}
          </div>
          {[
            { t: "Bathroom Reno — 12 Jensen St", c: "Erik Hansen", s: "In progress", sc: "var(--amber-600)", sb: "var(--amber-50)", a: "38.400 kr" },
            { t: "Electrical Install — Lake Cottage", c: "Morten Lund", s: "Paid", sc: "#059669", sb: "#ecfdf5", a: "12.800 kr" },
            { t: "Roof Replacement — Oak Lane", c: "Kirsten Bach", s: "Quote sent", sc: "#0ea5e9", sb: "#f0f9ff", a: "84.000 kr" },
          ].map(({ t: title, c: customer, s: status, sc, sb, a }) => (
            <div key={title} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 14px", borderRadius: 12, border: `1px solid ${S.border}`, marginBottom: 8, background: "#fff",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: S.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textMuted, marginTop: 2 }}>{customer}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12 }}>
                <span style={{ background: sb, color: sc, borderRadius: 6, padding: "3px 10px", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700 }}>{status}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: S.text, whiteSpace: "nowrap" }}>{a}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 800, color: "#059669", letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 5 }}>PAID ✓</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: S.text }}>Invoice #0042</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "#059669", marginTop: 2 }}>12,800 kr</div>
        </div>
        <div style={{ background: "var(--amber-50)", border: "1px solid var(--amber-200)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 800, color: "var(--amber-600)", letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 5 }}>ACCEPTED</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: S.text }}>T-0087 · 45 sec</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--amber-600)", marginTop: 2 }}>38,400 kr</div>
        </div>
      </div>
    </div>
  )
}

// ── Stats Strip ───────────────────────────────────────────────────────────────

function StatsStrip() {
  const t = useTranslations("Landing")
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    gsap.from(".stat-item", {
      y: 32, opacity: 0, stagger: 0.14, duration: 0.65, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 82%" },
    })

    const targets = [1200, 48000, 380]
    gsap.utils.toArray<HTMLElement>(".stat-num").forEach((el, i) => {
      const obj = { val: 0 }
      const tgt = targets[i]
      gsap.to(obj, {
        val: tgt, duration: 1.6, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
        onUpdate() {
          const v = Math.floor(obj.val)
          el.textContent = tgt >= 10000 ? `${Math.floor(v / 1000)}k` : tgt >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
        },
      })
    })
  }, { scope: sectionRef })

  const labels = [t("stats.tradespeople"), t("stats.invoicesSent"), t("stats.invoicedVia")]
  const suffixes = ["+", "+", "M kr+"]

  return (
    <section ref={sectionRef} style={{
      background: S.surface, borderTop: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}`,
      padding: "72px 28px",
    }}>
      <div style={{ maxWidth: MAX_W, margin: "0 auto" }}>
        <div className="grid grid-cols-3" style={{ gap: 20 }}>
          {labels.map((label, i) => (
            <div key={label} className="stat-item" style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 800, lineHeight: 1,
                fontSize: "clamp(40px, 5vw, 68px)", letterSpacing: "-0.05em", color: S.text,
              }}>
                <span className="stat-num">0</span>{suffixes[i]}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: S.textSub, marginTop: 10, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Feature: Jobs (dark section) — ScrollTrigger + progress scrub ─────────────

function FeatureDark() {
  const t = useTranslations("Landing")
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: "top 65%" } })
    tl.from(".fd-text", { x: -50, opacity: 0, duration: 0.7, ease: "power2.out" })
      .from(".fd-mockup", { x: 50, opacity: 0, duration: 0.7, ease: "power2.out" }, "<")
      .from(".job-row", { x: -38, opacity: 0, stagger: 0.08, duration: 0.55, ease: "power2.out" }, "-=0.3")

    // Progress bars fill (scrub)
    gsap.utils.toArray<HTMLElement>(".progress-fill").forEach((el, i) => {
      const target = [65, 92, 18, 78][i] ?? 50
      gsap.from(el, {
        scaleX: 0, transformOrigin: "left center", duration: 1, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 55%", scrub: 1 },
        delay: i * 0.08,
      })
      gsap.set(el, { scaleX: target / 100 })
    })

    // ── Blueprint SVG animations ────────────────────────────────────────────────
    // DrawSVG: each decoration path draws itself in sequence
    gsap.utils.toArray<SVGGeometryElement>(".bp-draw").forEach((el, i) => {
      const len = el.getTotalLength()
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(el, {
        strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", delay: 0.2 + i * 0.15,
        scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
      })
    })

    // The main circuit path draws in separately (longer, is the MotionPath guide)
    const circuit = sectionRef.current?.querySelector(".bp-circuit") as SVGGeometryElement | null
    if (circuit) {
      const cLen = circuit.getTotalLength()
      gsap.set(circuit, { strokeDasharray: cLen, strokeDashoffset: cLen })
      gsap.to(circuit, {
        strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut",
        scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
      })
    }

    // MotionPath: amber dot rides the circuit, fades in after path is drawn
    gsap.set(".bp-dot", { opacity: 0 })
    gsap.to(".bp-dot", {
      opacity: 1, duration: 0.5, delay: 1.8,
      scrollTrigger: { trigger: sectionRef.current, start: "top 65%", once: true },
    })
    gsap.to(".bp-dot", {
      motionPath: { path: ".bp-circuit", align: ".bp-circuit", alignOrigin: [0.5, 0.5] },
      duration: 16, ease: "none", repeat: -1,
      scrollTrigger: { trigger: sectionRef.current, start: "top 65%", once: true },
    })
    // Halo (slightly larger, more transparent) follows same path slightly behind
    gsap.set(".bp-halo", { opacity: 0 })
    gsap.to(".bp-halo", {
      opacity: 1, duration: 0.5, delay: 1.8,
      scrollTrigger: { trigger: sectionRef.current, start: "top 65%", once: true },
    })
    gsap.to(".bp-halo", {
      motionPath: { path: ".bp-circuit", align: ".bp-circuit", alignOrigin: [0.5, 0.5], start: -0.02, end: 0.98 },
      duration: 16, ease: "none", repeat: -1,
      scrollTrigger: { trigger: sectionRef.current, start: "top 65%", once: true },
    })
  }, { scope: sectionRef })

  return (
    <section id="features" ref={sectionRef} style={{ background: S.dark, padding: "120px 28px", position: "relative", overflow: "hidden" }}>
      {/* Blueprint floor-plan SVG background — draws in on scroll */}
      <svg aria-hidden viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none",
      }}>
        {/* Subtle blueprint grid */}
        <defs>
          <pattern id="bp-grid" width="70" height="70" patternUnits="userSpaceOnUse">
            <path d="M 70 0 L 0 0 0 70" fill="none" stroke="rgba(247,243,238,0.025)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bp-grid)" />

        {/* Main floor-plan outline — the MotionPath circuit route */}
        <path className="bp-circuit"
          d="M 640 60 L 1170 60 L 1170 640 L 640 640 L 640 380 L 790 380 L 790 270 L 640 270 Z"
          fill="none" stroke="rgba(247,243,238,0.07)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* Interior room dividers */}
        <line className="bp-draw" x1="640" y1="380" x2="1170" y2="380" stroke="rgba(247,243,238,0.05)" strokeWidth="0.8" />
        <line className="bp-draw" x1="900" y1="60" x2="900" y2="380" stroke="rgba(247,243,238,0.05)" strokeWidth="0.8" />
        <line className="bp-draw" x1="900" y1="380" x2="900" y2="640" stroke="rgba(247,243,238,0.05)" strokeWidth="0.8" />

        {/* Corner registration marks — amber accent */}
        <path className="bp-draw" d="M 618 38 L 640 38 L 640 60" fill="none" stroke={S.amberRaw} strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
        <path className="bp-draw" d="M 1192 38 L 1170 38 L 1170 60" fill="none" stroke={S.amberRaw} strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
        <path className="bp-draw" d="M 618 662 L 640 662 L 640 640" fill="none" stroke={S.amberRaw} strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
        <path className="bp-draw" d="M 1192 662 L 1170 662 L 1170 640" fill="none" stroke={S.amberRaw} strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />

        {/* Door swing arcs (engineering drawing detail) */}
        <path className="bp-draw"
          d="M 790 270 A 80 80 0 0 1 870 350"
          fill="none" stroke="rgba(247,243,238,0.06)" strokeWidth="0.8" strokeDasharray="3 5"
        />
        <path className="bp-draw"
          d="M 900 380 A 60 60 0 0 0 840 440"
          fill="none" stroke="rgba(247,243,238,0.06)" strokeWidth="0.8" strokeDasharray="3 5"
        />

        {/* Dimension lines */}
        <line className="bp-draw" x1="640" y1="30" x2="1170" y2="30" stroke="rgba(247,243,238,0.04)" strokeWidth="0.6" />
        <line className="bp-draw" x1="640" y1="22" x2="640" y2="38" stroke="rgba(247,243,238,0.06)" strokeWidth="1" />
        <line className="bp-draw" x1="1170" y1="22" x2="1170" y2="38" stroke="rgba(247,243,238,0.06)" strokeWidth="1" />

        {/* The MotionPath dot (amber glow traveler) */}
        <circle className="bp-halo" r="9" fill={S.amberRaw} opacity="0.12" />
        <circle className="bp-dot"  r="4" fill={S.amberRaw} opacity="0.9" />
      </svg>
      <div style={{
        maxWidth: MAX_W, margin: "0 auto",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center",
        position: "relative", zIndex: 1,
      }}>
        <div className="fd-mockup">
          <div style={{
            background: S.darkSurface, borderRadius: 20, border: `1px solid ${S.darkBorder}`,
            padding: "24px", boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: S.textInverse }}>Jobs</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textSubInv, marginTop: 2 }}>April 2026</div>
              </div>
              <div style={{
                background: "rgba(247,243,238,0.08)", border: `1px solid ${S.darkBorder}`,
                borderRadius: 8, padding: "6px 14px",
                fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: S.textSubInv,
              }}>+ New job</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {["All (12)", "Active (7)", "Done (5)"].map((tab, i) => (
                <div key={tab} style={{
                  fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
                  color: i === 0 ? S.textInverse : S.textSubInv,
                  background: i === 0 ? "rgba(247,243,238,0.12)" : "transparent",
                  border: `1px solid ${i === 0 ? S.darkBorderSt : S.darkBorder}`,
                  borderRadius: 7, padding: "5px 12px",
                }}>{tab}</div>
              ))}
            </div>
            {[
              { title: "Bathroom Reno — Jensen St", amount: "38.400 kr", pct: 65 },
              { title: "Electrical — Lake Cottage", amount: "12.800 kr", pct: 92 },
              { title: "Roof Replacement — Oak Lane", amount: "84.000 kr", pct: 18 },
              { title: "Plumbing Check — Office", amount: "4.200 kr", pct: 78 },
            ].map(({ title, amount, pct }) => (
              <div key={title} className="job-row" style={{
                padding: "14px 16px", borderRadius: 12, border: `1px solid ${S.darkBorder}`,
                marginBottom: 8, background: "rgba(247,243,238,0.04)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: S.textInverse }}>{title}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: S.amberRaw }}>{amount}</span>
                </div>
                <div style={{ height: 3, background: "rgba(247,243,238,0.08)", borderRadius: 2, overflow: "hidden" }}>
                  <div className="progress-fill" style={{
                    height: "100%", width: `${pct}%`, transformOrigin: "left",
                    background: `linear-gradient(90deg, ${S.amberRaw}, oklch(0.77 0.165 60))`,
                    borderRadius: 2,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fd-text">
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 20 }}>
            {t("feat.jobs.label")}
          </div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: "clamp(36px, 4vw, 58px)", lineHeight: 1.02, letterSpacing: "-0.04em",
            color: S.textInverse, margin: "0 0 24px",
          }}>{t("feat.jobs.headline")}</h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 17, lineHeight: 1.65, color: S.textSubInv, margin: "0 0 40px" }}>{t("feat.jobs.b1")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[t("feat.jobs.b2"), t("feat.jobs.b3")].map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(247,243,238,0.08)", border: `1px solid ${S.darkBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke={S.amberRaw} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5, color: S.textSubInv }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Feature: Documents — 3D invoice + clip-path row wipe ─────────────────────

function FeatureLight() {
  const t = useTranslations("Landing")
  const sectionRef  = useRef<HTMLElement>(null)
  const invoiceRef  = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.from(".fl-text", {
      x: -50, opacity: 0, duration: 0.7, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
    })
    // 3D rotateY entry
    gsap.from(invoiceRef.current, {
      rotationY: 24, rotationX: 7, transformPerspective: 1100,
      x: 40, opacity: 0, duration: 1.0, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
    })
    // Invoice rows clip-path wipe
    gsap.utils.toArray<HTMLElement>(".invoice-row").forEach((el, i) => {
      gsap.from(el, {
        clipPath: "inset(0 100% 0 0)", opacity: 1,
        duration: 0.5, ease: "power2.out",
        scrollTrigger: { trigger: invoiceRef.current, start: "top 72%" },
        delay: 0.4 + i * 0.08,
      })
    })

    // ── Drafting SVG animations ─────────────────────────────────────────────────
    // Compass arc + measurement lines draw in
    gsap.utils.toArray<SVGGeometryElement>(".fl-draw").forEach((el, i) => {
      const len = el.getTotalLength()
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(el, {
        strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", delay: 0.3 + i * 0.2,
        scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
      })
    })

    // MotionPath: pen tip traces the compass arc and then loops
    const compassPath = sectionRef.current?.querySelector(".fl-compass") as SVGGeometryElement | null
    if (compassPath) {
      const cLen = compassPath.getTotalLength()
      gsap.set(compassPath, { strokeDasharray: cLen, strokeDashoffset: cLen })
      gsap.to(compassPath, {
        strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut",
        scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
      })
    }

    gsap.set(".fl-pen", { opacity: 0 })
    gsap.to(".fl-pen", {
      opacity: 1, duration: 0.4, delay: 1.6,
      scrollTrigger: { trigger: sectionRef.current, start: "top 65%", once: true },
    })
    gsap.to(".fl-pen", {
      motionPath: { path: ".fl-compass", align: ".fl-compass", alignOrigin: [0.5, 0.5] },
      duration: 18, ease: "none", repeat: -1,
      scrollTrigger: { trigger: sectionRef.current, start: "top 65%", once: true },
    })
    gsap.to(".fl-pen-halo", {
      motionPath: { path: ".fl-compass", align: ".fl-compass", alignOrigin: [0.5, 0.5], start: -0.015, end: 0.985 },
      duration: 18, ease: "none", repeat: -1,
      scrollTrigger: { trigger: sectionRef.current, start: "top 65%", once: true },
    })
  }, { scope: sectionRef })

  return (
    <section ref={sectionRef} style={{ background: S.bg, padding: "120px 28px", position: "relative", overflow: "hidden" }}>
      {/* Drafting / compass SVG background */}
      <svg aria-hidden viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none",
      }}>
        {/* Large compass arc — path (not circle) so MotionPathPlugin can align to it */}
        {/* Circle cx=260 cy=350 r=280 → top(260,70) right(540,350) bottom(260,630) left(-20,350) */}
        <path className="fl-compass fl-draw"
          d="M 260 70 A 280 280 0 0 1 540 350 A 280 280 0 0 1 260 630 A 280 280 0 0 1 -20 350 A 280 280 0 0 1 260 70 Z"
          fill="none" stroke={S.amberRaw} strokeWidth="0.9" opacity="0.10"
        />

        {/* Inner concentric arc — circle is fine here (no MotionPath) */}
        <circle className="fl-draw"
          cx="260" cy="350" r="200"
          fill="none" stroke={S.amberRaw} strokeWidth="0.6"
          strokeDasharray="5 10" opacity="0.06"
        />

        {/* Crosshair — compass center point */}
        <line className="fl-draw" x1="220" y1="350" x2="300" y2="350" stroke={S.amberRaw} strokeWidth="1" opacity="0.18" />
        <line className="fl-draw" x1="260" y1="310" x2="260" y2="390" stroke={S.amberRaw} strokeWidth="1" opacity="0.18" />
        <circle cx="260" cy="350" r="3.5" fill={S.amberRaw} opacity="0.22" />

        {/* Radial measurement lines (drafting compass legs) */}
        <line className="fl-draw" x1="260" y1="350" x2="260" y2="70"  stroke={S.amberRaw} strokeWidth="0.7" opacity="0.08" strokeDasharray="4 6" />
        <line className="fl-draw" x1="260" y1="350" x2="520" y2="185" stroke={S.amberRaw} strokeWidth="0.7" opacity="0.08" strokeDasharray="4 6" />
        <line className="fl-draw" x1="260" y1="350" x2="520" y2="515" stroke={S.amberRaw} strokeWidth="0.7" opacity="0.08" strokeDasharray="4 6" />
        <line className="fl-draw" x1="260" y1="350" x2="0"   y2="185" stroke={S.amberRaw} strokeWidth="0.7" opacity="0.08" strokeDasharray="4 6" />

        {/* Tick marks at the arc radius endpoints */}
        <line className="fl-draw" x1="248" y1="70"  x2="272" y2="70"  stroke={S.amberRaw} strokeWidth="1.2" opacity="0.20" />
        <line className="fl-draw" x1="248" y1="630" x2="272" y2="630" stroke={S.amberRaw} strokeWidth="1.2" opacity="0.20" />
        <line className="fl-draw" x1="540" y1="338" x2="540" y2="362" stroke={S.amberRaw} strokeWidth="1.2" opacity="0.20" />
        <line className="fl-draw" x1="-20" y1="338" x2="-20" y2="362" stroke={S.amberRaw} strokeWidth="1.2" opacity="0.20" />

        {/* Pen tip dot + halo that travels the compass arc */}
        <circle className="fl-pen-halo" r="10" fill={S.amberRaw} opacity="0.10" />
        <circle className="fl-pen"      r="4"  fill={S.amberRaw} opacity="0.85" />
      </svg>
      <div style={{ maxWidth: MAX_W, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", position: "relative", zIndex: 1 }}>
        <div className="fl-text">
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 20 }}>
            {t("feat.quotes.label")} · {t("feat.invoices.label")}
          </div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: "clamp(36px, 4vw, 58px)", lineHeight: 1.02, letterSpacing: "-0.04em",
            color: S.text, margin: "0 0 24px",
          }}>{t("feat.invoices.headline")}</h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 17, lineHeight: 1.65, color: S.textSub, margin: "0 0 40px" }}>
            {t("feat.quotes.b2")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
            {[
              { icon: "⚡", text: t("feat.quotes.headline") },
              { icon: "📄", text: t("feat.invoices.b1") },
              { icon: "🔔", text: t("feat.invoices.b2") },
            ].map(({ icon, text }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "var(--amber-50)", border: "1px solid var(--amber-200)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                }}>{icon}</div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5, color: S.textSub, marginTop: 9 }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: "10px 16px",
          }}>
            <span style={{ fontSize: 18 }}>🇩🇰</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: S.textSub }}>{t("feat.invoices.trust")}</span>
          </div>
        </div>

        <div ref={invoiceRef} style={{ transformStyle: "preserve-3d" }}>
          <div style={{
            background: "#fff", borderRadius: 16, border: `1px solid ${S.borderStrong}`, padding: "28px",
            boxShadow: "0 20px 60px rgba(26,20,13,0.10), 0 4px 16px rgba(26,20,13,0.06)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 20, borderBottom: `1px solid ${S.border}`, marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: S.text, letterSpacing: "-0.03em" }}>INVOICE</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: S.textMuted, marginTop: 4 }}>#F-2024-0087</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: S.text }}>Lars Building Co.</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textMuted, marginTop: 3 }}>CVR: 28 73 91 04</div>
              </div>
            </div>
            {[
              { d: "Brickwork — 24 hrs", q: "24 h", p: "725", tot: "17.400" },
              { d: "Materials — Bricks", q: "1 lot", p: "8.200", tot: "8.200" },
              { d: "Scaffolding rental — 5 days", q: "5 d", p: "420", tot: "2.100" },
            ].map(({ d, q, p, tot }) => (
              <div key={d} className="invoice-row" style={{
                display: "grid", gridTemplateColumns: "1fr auto auto auto",
                gap: 12, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${S.border}`,
              }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.text, fontWeight: 500 }}>{d}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: S.textMuted, textAlign: "right" }}>{q}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: S.textMuted, textAlign: "right" }}>{p} kr</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: S.text, textAlign: "right" }}>{tot} kr</div>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              {[{ l: "Subtotal", v: "27.700 kr" }, { l: "VAT 25%", v: "6.925 kr" }].map(({ l, v }) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.textMuted }}>{l}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: S.textSub }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", borderTop: `2px solid ${S.text}`, marginTop: 8 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: S.text }}>Total</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: S.text }}>34.625 kr</span>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" stroke="#059669" />
                <path d="M4.5 8L6.5 10L11.5 5.5" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#059669" }}>Paid 18 April 2026</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Testimonials — SVG quote draw + word-by-word scroll scrub ─────────────────

function Testimonials() {
  const t = useTranslations("Landing")
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    // SVG opening-quote path draws in
    const path = sectionRef.current?.querySelector(".quote-path") as SVGPathElement | null
    if (path) {
      const len = path.getTotalLength()
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(path, {
        strokeDashoffset: 0, duration: 1.2, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
      })
    }

    // Pull-quote words illuminate one by one as you scroll (Stripe/Linear technique)
    gsap.to(".pq-word", {
      opacity: 1, y: 0,
      stagger: { each: 0.04, from: "start" },
      ease: "none",
      scrollTrigger: {
        trigger: ".pq-container",
        start: "top 70%",
        end: "bottom 35%",
        scrub: 1.2,
      },
    })

    // Attribution slides up after words
    gsap.from(".pull-attribution", {
      y: 14, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: ".pq-container", start: "center 50%" },
    })

    // Cards: scattered chaos entry with rotation (Jessica Walsh)
    gsap.from(".tcard-0", { x: -56, y: 18, rotation: -2.5, opacity: 0, duration: 0.7, ease: "back.out(1.4)", scrollTrigger: { trigger: ".tcard-0", start: "top 80%" } })
    gsap.from(".tcard-1", { x: 56, y: -18, rotation: 2, opacity: 0, duration: 0.7, ease: "back.out(1.4)", scrollTrigger: { trigger: ".tcard-1", start: "top 80%" }, delay: 0.1 })

    // ── Sine wave DrawSVG + MotionPath ──────────────────────────────────────────
    const testWave = sectionRef.current?.querySelector(".test-wave") as SVGGeometryElement | null
    if (testWave) {
      const tLen = testWave.getTotalLength()
      gsap.set(testWave, { strokeDasharray: tLen, strokeDashoffset: tLen })
      gsap.to(testWave, {
        strokeDashoffset: 0, duration: 2.6, ease: "power2.inOut",
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
      })
    }
    gsap.utils.toArray<SVGGeometryElement>(".test-accent").forEach((el, i) => {
      const len = el.getTotalLength()
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(el, {
        strokeDashoffset: 0, duration: 0.7, ease: "power2.out", delay: 1.0 + i * 0.15,
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
      })
    })
    gsap.set([".test-dot", ".test-halo"], { opacity: 0 })
    gsap.to([".test-dot", ".test-halo"], {
      opacity: 1, duration: 0.5, delay: 2.0,
      scrollTrigger: { trigger: sectionRef.current, start: "top 72%", once: true },
    })
    gsap.to(".test-dot", {
      motionPath: { path: ".test-wave", align: ".test-wave", alignOrigin: [0.5, 0.5] },
      duration: 12, ease: "none", repeat: -1, yoyo: true,
      scrollTrigger: { trigger: sectionRef.current, start: "top 72%", once: true },
    })
    gsap.to(".test-halo", {
      motionPath: { path: ".test-wave", align: ".test-wave", alignOrigin: [0.5, 0.5], start: -0.018, end: 0.982 },
      duration: 12, ease: "none", repeat: -1, yoyo: true,
      scrollTrigger: { trigger: sectionRef.current, start: "top 72%", once: true },
    })
  }, { scope: sectionRef })

  const quote1 = t("testimonials.t1quote")

  return (
    <section ref={sectionRef} style={{
      background: S.surface, padding: "120px 28px", borderTop: `1px solid ${S.border}`,
      position: "relative", overflow: "hidden",
    }}>
      {/* Sine-wave background — peak nodes mark each testimonial */}
      <svg aria-hidden viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none",
      }}>
        {/* Primary sine wave — full width */}
        <path className="test-wave"
          d="M -80 400 C 200 140, 400 660, 600 380 C 800 100, 1000 640, 1280 360"
          fill="none" stroke={S.amberRaw} strokeWidth="1.1" opacity="0.09"
        />
        {/* Secondary wave, offset down, darker */}
        <path className="test-wave-b"
          d="M -80 520 C 200 260, 400 780, 600 500 C 800 220, 1000 760, 1280 480"
          fill="none" stroke={S.text} strokeWidth="0.7" opacity="0.03"
        />
        {/* Node circles at wave peaks/troughs — where testimonials "live" */}
        <circle className="test-accent" cx="200"  cy="188" r="6" fill="none" stroke={S.amberRaw} strokeWidth="1.5" opacity="0.18" />
        <circle className="test-accent" cx="200"  cy="188" r="14" fill="none" stroke={S.amberRaw} strokeWidth="0.7" opacity="0.07" />
        <circle className="test-accent" cx="600"  cy="393" r="6" fill="none" stroke={S.amberRaw} strokeWidth="1.5" opacity="0.18" />
        <circle className="test-accent" cx="600"  cy="393" r="14" fill="none" stroke={S.amberRaw} strokeWidth="0.7" opacity="0.07" />
        <circle className="test-accent" cx="1000" cy="570" r="6" fill="none" stroke={S.amberRaw} strokeWidth="1.5" opacity="0.18" />
        <circle className="test-accent" cx="1000" cy="570" r="14" fill="none" stroke={S.amberRaw} strokeWidth="0.7" opacity="0.07" />
        {/* MotionPath traveler */}
        <circle className="test-halo" r="11" fill={S.amberRaw} opacity="0.08" />
        <circle className="test-dot"  r="4"  fill={S.amberRaw} opacity="0.9" />
      </svg>

      <div style={{ maxWidth: MAX_W, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber,
          marginBottom: 60, textAlign: "center",
        }}>{t("testimonials.label")}</div>

        {/* SVG decorative opening-quote mark */}
        <svg aria-hidden viewBox="0 0 100 70" style={{
          position: "absolute", left: 28, top: 140,
          width: 110, height: 77, opacity: 0.09, pointerEvents: "none",
        }}>
          <path className="quote-path"
            d="M10 60 C10 25 30 8 50 5 L50 28 C34 30 26 40 26 55 L26 70 L10 70 Z M54 60 C54 25 74 8 94 5 L94 28 C78 30 70 40 70 55 L70 70 L54 70 Z"
            fill="none" stroke={S.amberHex} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>

        {/* Big editorial pull-quote with word scrub */}
        <div className="pq-container" style={{ marginBottom: 64, paddingLeft: 40 }}>
          <blockquote style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(26px, 3.5vw, 46px)", lineHeight: 1.18,
            letterSpacing: "-0.03em", color: S.text, margin: "0 0 28px",
          }}>
            &ldquo;<WordScrub text={quote1} cls="pq-word" />&rdquo;
          </blockquote>
          <div className="pull-attribution" style={{ paddingLeft: 4 }}>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: S.text }}>{t("testimonials.t1name")}</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.textMuted, marginTop: 2 }}>{t("testimonials.t1role")}</div>
          </div>
        </div>

        {/* Two scattered cards */}
        <div className="grid md:grid-cols-2 grid-cols-1" style={{ gap: 20 }}>
          {[
            { q: t("testimonials.t2quote"), n: t("testimonials.t2name"), r: t("testimonials.t2role"), cls: "tcard-0" },
            { q: t("testimonials.t3quote"), n: t("testimonials.t3name"), r: t("testimonials.t3role"), cls: "tcard-1" },
          ].map(({ q, n, r, cls }) => (
            <div key={n} className={cls} style={{
              background: "#fff", borderRadius: 16, border: `1px solid ${S.border}`,
              padding: "28px 28px 24px", boxShadow: "0 4px 20px rgba(26,20,13,0.06)",
              transformStyle: "preserve-3d", cursor: "default",
            }}
            onMouseMove={(e) => {
              const card = e.currentTarget
              const rect = card.getBoundingClientRect()
              const x = (e.clientX - rect.left) / rect.width - 0.5
              const y = (e.clientY - rect.top)  / rect.height - 0.5
              gsap.to(card, { rotationY: x * 14, rotationX: -y * 9, transformPerspective: 900, ease: "power2.out", duration: 0.35 })
            }}
            onMouseLeave={(e) => {
              gsap.to(e.currentTarget, { rotationY: 0, rotationX: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" })
            }}
            >
              <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                {[0,1,2,3,4].map(i => (
                  <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill={S.amberRaw}>
                    <path d="M7 1l1.6 3.3 3.6.5-2.6 2.5.6 3.6L7 9.3l-3.2 1.7.6-3.6L1.8 4.8l3.6-.5z" />
                  </svg>
                ))}
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.65, color: S.textSub, margin: "0 0 20px" }}>
                &ldquo;{q}&rdquo;
              </p>
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: S.text }}>{n}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: S.textMuted, marginTop: 2 }}>{r}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing — rotating SVG rings + card hover physics + price flip ─────────────

function Pricing() {
  const t = useTranslations("Landing")
  const [annual, setAnnual] = useState(true)
  const sectionRef = useRef<HTMLElement>(null)
  const ringsRef   = useRef<SVGSVGElement>(null)

  useGSAP(() => {
    // Concentric rings rotate at different speeds (Eddie Opara geometry)
    gsap.to(".ring-a", { rotation: 360,  transformOrigin: "50% 50%", duration: 80,  repeat: -1, ease: "none" })
    gsap.to(".ring-b", { rotation: -360, transformOrigin: "50% 50%", duration: 55,  repeat: -1, ease: "none" })
    gsap.to(".ring-c", { rotation: 360,  transformOrigin: "50% 50%", duration: 38,  repeat: -1, ease: "none" })

    // Featured card: animated gradient border sweeps around (3s/revolution)
    gsap.to(".price-ring", { rotation: 360, transformOrigin: "50% 50%", duration: 3, repeat: -1, ease: "none" })

    // ── Wave path DrawSVG + MotionPath ──────────────────────────────────────────
    const priceWave = sectionRef.current?.querySelector(".price-wave") as SVGGeometryElement | null
    if (priceWave) {
      const wLen = priceWave.getTotalLength()
      gsap.set(priceWave, { strokeDasharray: wLen, strokeDashoffset: wLen })
      gsap.to(priceWave, {
        strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      })
    }
    // Accent diamonds draw in
    gsap.utils.toArray<SVGGeometryElement>(".price-accent").forEach((el, i) => {
      const len = el.getTotalLength()
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(el, {
        strokeDashoffset: 0, duration: 0.9, ease: "power2.out", delay: 0.6 + i * 0.18,
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      })
    })
    // Dot bounces back and forth along the wave (yoyo)
    gsap.set([".price-mdot", ".price-mhalo"], { opacity: 0 })
    gsap.to([".price-mdot", ".price-mhalo"], {
      opacity: 1, duration: 0.4, delay: 2.0,
      scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
    })
    gsap.to(".price-mdot", {
      motionPath: { path: ".price-wave", align: ".price-wave", alignOrigin: [0.5, 0.5] },
      duration: 9, ease: "power1.inOut", repeat: -1, yoyo: true,
      scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
    })
    gsap.to(".price-mhalo", {
      motionPath: { path: ".price-wave", align: ".price-wave", alignOrigin: [0.5, 0.5], start: -0.02, end: 0.98 },
      duration: 9, ease: "power1.inOut", repeat: -1, yoyo: true,
      scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
    })

    // Section entrance
    gsap.from(".price-header", { y: 32, opacity: 0, duration: 0.65, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
    })
    gsap.from(".pc-0, .pc-2", { y: 50, opacity: 0, stagger: 0.15, duration: 0.65, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
    })
    gsap.from(".pc-1", { y: 72, opacity: 0, duration: 0.75, ease: "back.out(1.5)",
      scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
      delay: 0.1,
    })
  }, { scope: sectionRef })

  // Card hover physics: hovered card rises, siblings compress
  const onCardEnter = (idx: number) => {
    gsap.utils.toArray<HTMLElement>(".pricing-card").forEach((c, i) => {
      if (i === idx) {
        gsap.to(c, { y: -10, scale: 1.025, duration: 0.3, ease: "power2.out" })
      } else {
        gsap.to(c, { scale: 0.97, opacity: 0.75, duration: 0.3, ease: "power2.out" })
      }
    })
  }
  const onCardLeave = () => {
    gsap.utils.toArray<HTMLElement>(".pricing-card").forEach(c => {
      gsap.to(c, { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" })
    })
  }

  const plans = [
    { name: t("pricing.freeName"),  price: "0",                     cta: t("pricing.freeCta"),  href: "/sign-up",            features: [t("pricing.freeF1"), t("pricing.freeF2"), t("pricing.freeF3"), t("pricing.freeF4")], featured: false },
    { name: t("pricing.soloName"),  price: annual ? "149" : "189",  cta: t("pricing.soloCta"),  href: "/sign-up?plan=solo",  features: [t("pricing.soloF1"), t("pricing.soloF2"), t("pricing.soloF3"), t("pricing.soloF4"), t("pricing.soloF5"), t("pricing.soloF6")], featured: true },
    { name: t("pricing.holdName"),  price: annual ? "349" : "429",  cta: t("pricing.holdCta"),  href: "/sign-up?plan=team",  features: [t("pricing.holdF1"), t("pricing.holdF2"), t("pricing.holdF3"), t("pricing.holdF4")], featured: false },
  ]

  return (
    <section id="pricing" ref={sectionRef} style={{ background: S.bg, padding: "120px 28px", position: "relative", overflow: "hidden" }}>
      {/* Rotating concentric rings — subtle texture (Eddie Opara "Light and Line") */}
      <svg ref={ringsRef} aria-hidden viewBox="0 0 900 900" style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", width: 900, height: 900,
        opacity: 0.035, pointerEvents: "none", zIndex: 0,
      }}>
        <circle className="ring-a" cx="450" cy="450" r="180" fill="none" stroke={S.text} strokeWidth="1" strokeDasharray="8 16" />
        <circle className="ring-b" cx="450" cy="450" r="300" fill="none" stroke={S.text} strokeWidth="0.8" />
        <circle className="ring-c" cx="450" cy="450" r="410" fill="none" stroke={S.text} strokeWidth="0.5" strokeDasharray="3 24" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180
          return <circle key={i} cx={Math.round((450 + 300 * Math.cos(a)) * 100) / 100} cy={Math.round((450 + 300 * Math.sin(a)) * 100) / 100} r="3" fill={S.text} className="ring-b" />
        })}
      </svg>

      {/* Wave path + MotionPath dot — connects the 3 tier positions */}
      <svg aria-hidden viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0,
      }}>
        {/* Flowing S-curve through Free → Solo → Team card positions */}
        <path className="price-wave"
          d="M -60 600 C 150 260, 380 740, 600 490 C 820 180, 1050 700, 1260 420"
          fill="none" stroke={S.text} strokeWidth="1.2" opacity="0.055"
        />
        {/* Diamond accent at each card top */}
        <path className="price-accent" d="M 190 90 L 220 120 L 190 150 L 160 120 Z" fill="none" stroke={S.amberRaw} strokeWidth="1.2" opacity="0.14" />
        <path className="price-accent" d="M 600 50 L 636 86 L 600 122 L 564 86 Z" fill="none" stroke={S.amberRaw} strokeWidth="1.5" opacity="0.20" />
        <path className="price-accent" d="M 1010 90 L 1040 120 L 1010 150 L 980 120 Z" fill="none" stroke={S.amberRaw} strokeWidth="1.2" opacity="0.14" />
        {/* Horizontal tier connector lines */}
        <line className="price-accent" x1="220" y1="120" x2="564" y2="86" stroke={S.amberRaw} strokeWidth="0.6" opacity="0.08" />
        <line className="price-accent" x1="636" y1="86" x2="980" y2="120" stroke={S.amberRaw} strokeWidth="0.6" opacity="0.08" />
        {/* MotionPath traveler */}
        <circle className="price-mhalo" r="11" fill={S.amberRaw} opacity="0.09" />
        <circle className="price-mdot"  r="4.5" fill={S.amberRaw} opacity="0.9" />
      </svg>

      <div style={{ maxWidth: MAX_W, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="price-header" style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 16 }}>
            {t("pricing.label")}
          </div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: "clamp(36px, 4vw, 58px)", lineHeight: 1.02, letterSpacing: "-0.04em",
            color: S.text, margin: "0 0 32px",
          }}>{t("pricing.headline")}</h2>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: !annual ? S.text : S.textMuted }}>{t("pricing.monthly")}</span>
            <button onClick={() => setAnnual(a => !a)} style={{
              width: 48, height: 26, borderRadius: 13, background: annual ? S.dark : S.surfaceAlt,
              border: "none", cursor: "pointer", position: "relative", transition: "background 200ms",
            }}>
              <div style={{
                position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff",
                left: annual ? 25 : 3, boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                transition: "left 200ms cubic-bezier(0.34,1.56,0.64,1)",
              }} />
            </button>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: annual ? S.text : S.textMuted }}>{t("pricing.annual")}</span>
              <span style={{ background: "var(--amber-50)", color: "var(--amber-700)", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, borderRadius: 100, padding: "2px 8px" }}>{t("pricing.save20")}</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 grid-cols-1" style={{ gap: 16 }}>
          {plans.map(({ name, price, cta, href, features, featured }, i) => (
            <div key={name} className={`pc-${i}`} style={{ position: "relative", isolation: "isolate" }}>
              {/* Animated gradient border ring — only on featured card */}
              {featured && (
                <div className="price-ring" style={{
                  position: "absolute", inset: -2, borderRadius: 21, zIndex: -1,
                  background: `conic-gradient(from 0deg, transparent 0%, ${S.amberRaw}90 8%, transparent 16%, transparent 84%, ${S.amberRaw}70 92%, transparent 100%)`,
                }} />
              )}
            <div className="pricing-card"
              onMouseEnter={() => onCardEnter(i)}
              onMouseLeave={onCardLeave}
              style={{
                background: featured ? S.dark : "#fff",
                border: `1.5px solid ${featured ? "transparent" : S.border}`,
                borderRadius: 18, padding: "32px 28px", position: "relative",
                boxShadow: featured
                  ? "0 20px 60px rgba(26,20,13,0.25), 0 4px 12px rgba(26,20,13,0.15)"
                  : "0 4px 16px rgba(26,20,13,0.06)",
                cursor: "default",
              }}>
              {featured && (
                <div style={{
                  position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
                  background: S.amber, color: "#fff",
                  fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 800,
                  letterSpacing: "0.10em", textTransform: "uppercase",
                  borderRadius: "0 0 8px 8px", padding: "4px 14px",
                }}>Recommended</div>
              )}
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: featured ? S.textSubInv : S.textSub, marginBottom: 20, letterSpacing: "0.04em" }}>{name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{
                  fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 52, lineHeight: 1, letterSpacing: "-0.05em",
                  color: featured ? S.textInverse : S.text,
                }}>{price}</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: featured ? S.textSubInv : S.textMuted }}>{t("pricing.perMonth")}</span>
              </div>
              <Link href={href} style={{
                display: "block", textAlign: "center",
                fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700,
                color: featured ? S.dark : S.textInverse, background: featured ? S.amber : S.dark,
                padding: "13px 0", borderRadius: 10, textDecoration: "none", marginBottom: 28,
                boxShadow: featured ? `0 4px 20px ${S.amberRaw}60` : "none",
                transition: "transform 140ms",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform = ""}
              >{cta}</Link>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                      <circle cx="8" cy="8" r="7.5" stroke={featured ? "rgba(247,243,238,0.2)" : S.border} />
                      <path d="M5 8l2 2 4-4" stroke={featured ? S.amberRaw : "#059669"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.5, color: featured ? S.textSubInv : S.textSub }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.textMuted, textAlign: "center", marginTop: 28 }}>
          {t("pricing.noBinding")}
        </p>
      </div>
    </section>
  )
}

// ── FAQ — GSAP height + TextPlugin typing + animated left border ───────────────

function FAQ() {
  const t = useTranslations("Landing")
  const sectionRef   = useRef<HTMLElement>(null)
  const answerRefs   = useRef<(HTMLDivElement | null)[]>([])
  const borderRefs   = useRef<(HTMLDivElement | null)[]>([])
  const pRefs        = useRef<(HTMLParagraphElement | null)[]>([])
  const [open, setOpen] = useState<number | null>(null)

  const items = [0,1,2,3,4].map(i => ({
    q: t(`faq.q${i}` as Parameters<typeof t>[0]),
    a: t(`faq.a${i}` as Parameters<typeof t>[0]),
  }))

  // Initialise all answers collapsed
  useEffect(() => {
    answerRefs.current.forEach(el => {
      if (el) gsap.set(el, { height: 0, overflow: "hidden" })
    })
    borderRefs.current.forEach(el => {
      if (el) gsap.set(el, { scaleY: 0, transformOrigin: "top" })
    })
  }, [])

  useGSAP(() => {
    gsap.from(".faq-item", {
      y: 22, opacity: 0, stagger: 0.07, duration: 0.55, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 76%" },
    })

    // ── Diamond DrawSVG + MotionPath ────────────────────────────────────────────
    const faqDiamond = sectionRef.current?.querySelector(".faq-diamond") as SVGGeometryElement | null
    if (faqDiamond) {
      const dLen = faqDiamond.getTotalLength()
      gsap.set(faqDiamond, { strokeDasharray: dLen, strokeDashoffset: dLen })
      gsap.to(faqDiamond, {
        strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut",
        scrollTrigger: { trigger: sectionRef.current, start: "top 76%" },
      })
    }
    gsap.utils.toArray<SVGGeometryElement>(".faq-cross").forEach((el, i) => {
      const len = el.getTotalLength()
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(el, {
        strokeDashoffset: 0, duration: 0.9, ease: "power2.out", delay: 0.8 + i * 0.14,
        scrollTrigger: { trigger: sectionRef.current, start: "top 76%" },
      })
    })
    gsap.set([".faq-dot", ".faq-halo"], { opacity: 0 })
    gsap.to([".faq-dot", ".faq-halo"], {
      opacity: 1, duration: 0.4, delay: 2.2,
      scrollTrigger: { trigger: sectionRef.current, start: "top 76%", once: true },
    })
    gsap.to(".faq-dot", {
      motionPath: { path: ".faq-diamond", align: ".faq-diamond", alignOrigin: [0.5, 0.5] },
      duration: 14, ease: "none", repeat: -1,
      scrollTrigger: { trigger: sectionRef.current, start: "top 76%", once: true },
    })
    gsap.to(".faq-halo", {
      motionPath: { path: ".faq-diamond", align: ".faq-diamond", alignOrigin: [0.5, 0.5], start: -0.02, end: 0.98 },
      duration: 14, ease: "none", repeat: -1,
      scrollTrigger: { trigger: sectionRef.current, start: "top 76%", once: true },
    })
  }, { scope: sectionRef })

  const toggle = (i: number) => {
    const el     = answerRefs.current[i]
    const border = borderRefs.current[i]
    const p      = pRefs.current[i]
    if (!el) return

    if (open === i) {
      // Close
      gsap.to(el, { height: 0, duration: 0.3, ease: "power2.inOut" })
      if (border) gsap.to(border, { scaleY: 0, duration: 0.25, ease: "power2.inOut" })
      setOpen(null)
    } else {
      // Close previous
      if (open !== null) {
        const prev = answerRefs.current[open]
        const pb   = borderRefs.current[open]
        if (prev) gsap.to(prev, { height: 0, duration: 0.25, ease: "power2.inOut" })
        if (pb)   gsap.to(pb,   { scaleY: 0, duration: 0.22, ease: "power2.inOut" })
      }
      // Open: height first, then type the answer
      gsap.to(el, { height: "auto", duration: 0.35, ease: "power2.out" })
      // Left border "draws down"
      if (border) gsap.to(border, { scaleY: 1, duration: 0.4, ease: "power3.out", delay: 0.05 })
      // TextPlugin: words type out one by one
      if (p) {
        gsap.killTweensOf(p)
        p.textContent = ""
        gsap.to(p, {
          text: { value: items[i].a, delimiter: " " },
          duration: items[i].a.split(" ").length * 0.028,
          ease: "none",
          delay: 0.12,
        })
      }
      setOpen(i)
    }
  }

  return (
    <section id="faq" ref={sectionRef} style={{
      background: S.surface, padding: "100px 28px", borderTop: `1px solid ${S.border}`,
      position: "relative", overflow: "hidden",
    }}>
      {/* Diamond outline — MotionPath dot traces its perimeter */}
      <svg aria-hidden viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none",
      }}>
        {/* Diamond: top(600,80) right(1080,450) bottom(600,820) left(120,450) */}
        <path className="faq-diamond"
          d="M 600 80 L 1080 450 L 600 820 L 120 450 Z"
          fill="none" stroke={S.text} strokeWidth="1" opacity="0.04"
        />
        {/* Interior cross lines */}
        <line className="faq-cross" x1="600" y1="80"  x2="600"  y2="820" stroke={S.text} strokeWidth="0.6" opacity="0.025" />
        <line className="faq-cross" x1="120" y1="450" x2="1080" y2="450" stroke={S.text} strokeWidth="0.6" opacity="0.025" />
        {/* Diagonal bisectors */}
        <line className="faq-cross" x1="360" y1="265" x2="840"  y2="635" stroke={S.text} strokeWidth="0.5" opacity="0.018" strokeDasharray="4 8" />
        <line className="faq-cross" x1="840" y1="265" x2="360"  y2="635" stroke={S.text} strokeWidth="0.5" opacity="0.018" strokeDasharray="4 8" />
        {/* Amber accent marks at diamond tips */}
        <circle cx="600"  cy="80"  r="4" fill="none" stroke={S.amberRaw} strokeWidth="1.4" opacity="0.18" className="faq-cross" />
        <circle cx="1080" cy="450" r="4" fill="none" stroke={S.amberRaw} strokeWidth="1.4" opacity="0.18" className="faq-cross" />
        <circle cx="600"  cy="820" r="4" fill="none" stroke={S.amberRaw} strokeWidth="1.4" opacity="0.18" className="faq-cross" />
        <circle cx="120"  cy="450" r="4" fill="none" stroke={S.amberRaw} strokeWidth="1.4" opacity="0.18" className="faq-cross" />
        {/* MotionPath traveler */}
        <circle className="faq-halo" r="10" fill={S.amberRaw} opacity="0.10" />
        <circle className="faq-dot"  r="4"  fill={S.amberRaw} opacity="0.9" />
      </svg>

      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 16 }}>
            {t("faq.label")}
          </div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: "clamp(30px, 3.5vw, 48px)", lineHeight: 1.05, letterSpacing: "-0.04em",
            color: S.text, margin: 0,
          }}>{t("faq.headline")}</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map(({ q }, i) => (
            <div key={i} className="faq-item" style={{
              background: "#fff", border: `1px solid ${S.border}`, borderRadius: 14, overflow: "hidden",
              position: "relative",
            }}>
              {/* Animated amber left border */}
              <div ref={el => { borderRefs.current[i] = el }} style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                background: S.amber, transformOrigin: "top", borderRadius: "3px 0 0 3px",
              }} />

              <button onClick={() => toggle(i)} style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "20px 22px 20px 26px", background: "transparent", border: "none", cursor: "pointer", gap: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                    color: open === i ? S.amberRaw : S.textMuted, letterSpacing: "0.04em",
                    transition: "color 200ms", minWidth: 24,
                  }}>0{i + 1}</span>
                  <span style={{
                    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15,
                    color: S.text, textAlign: "left", lineHeight: 1.4,
                    transition: "color 200ms",
                  }}>{q}</span>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{
                  flexShrink: 0,
                  transform: open === i ? "rotate(45deg)" : "none",
                  transition: "transform 300ms cubic-bezier(0.16,1,0.3,1)",
                }}>
                  <path d="M10 4V16M4 10H16" stroke={open === i ? S.amberRaw : S.textMuted} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>

              <div ref={el => { answerRefs.current[i] = el }} style={{ overflow: "hidden" }}>
                <p ref={el => { pRefs.current[i] = el }} style={{
                  fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.65,
                  color: S.textSub, margin: 0, padding: "0 22px 20px 64px",
                  minHeight: "1em",
                }}></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer CTA — ember particles + headline slam + magnetic CTA ───────────────

function FooterCTA() {
  const t = useTranslations("Landing")
  const sectionRef   = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const ctaRef       = useRef<HTMLAnchorElement>(null)

  const onCTAMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    gsap.to(e.currentTarget, {
      x: (e.clientX - r.left - r.width  / 2) * 0.32,
      y: (e.clientY - r.top  - r.height / 2) * 0.32,
      duration: 0.25, ease: "power2.out",
    })
  }
  const onCTALeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1,0.5)" })
  }

  useGSAP(() => {
    // 48 ember particles drift upward infinitely
    const particles: HTMLDivElement[] = []
    for (let i = 0; i < 48; i++) {
      const p = document.createElement("div")
      const size = Math.random() * 3 + 1.5
      p.style.cssText = `position:absolute;border-radius:50%;background:${S.amberRaw};pointer-events:none;width:${size}px;height:${size}px;left:${Math.random() * 100}%;bottom:${Math.random() * 30}px;`
      containerRef.current?.appendChild(p)
      particles.push(p)
      gsap.to(p, {
        y: -(Math.random() * 240 + 80), x: (Math.random() - 0.5) * 80,
        opacity: Math.random() * 0.14 + 0.04,
        duration: Math.random() * 8 + 12, delay: Math.random() * 10,
        repeat: -1, ease: "power1.out",
      })
    }

    // Headline words slam in: scale 1.35 → 1 (Paula Scher scale)
    gsap.from(".fcta-word", {
      scale: 1.38, opacity: 0, stagger: 0.07, duration: 0.6, ease: "back.out(1.3)",
      scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
    })
    gsap.from(".fcta-sub", { y: 22, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 68%" }, delay: 0.28,
    })
    gsap.from(ctaRef.current, { scale: 0.86, opacity: 0, duration: 0.55, ease: "back.out(1.7)",
      scrollTrigger: { trigger: sectionRef.current, start: "top 65%" }, delay: 0.5,
    })
    gsap.from(".trust-badge", { y: 12, opacity: 0, stagger: 0.07, duration: 0.4, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 60%" }, delay: 0.7,
    })

    return () => { particles.forEach(p => p.parentNode?.removeChild(p)) }
  }, { scope: sectionRef })

  const headlineWords = t("footerCta.headline").split(" ")

  return (
    <section ref={sectionRef} style={{
      background: S.dark, padding: "120px 28px", textAlign: "center",
      position: "relative", overflow: "hidden",
    }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 700, height: 350,
        background: `radial-gradient(ellipse at center, ${S.amberRaw}1A 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: "clamp(56px, 8vw, 112px)", lineHeight: 1.0, letterSpacing: "-0.05em",
          color: S.textInverse, margin: "0 0 20px",
        }}>
          {headlineWords.map((w, i) => (
            <span key={i} className="fcta-word" style={{ display: "inline-block" }}>
              {w}{i < headlineWords.length - 1 ? "\u00A0" : ""}
            </span>
          ))}
        </h2>
        <p className="fcta-sub" style={{
          fontFamily: "var(--font-body)", fontSize: 18, color: S.textSubInv, margin: "0 auto 48px", maxWidth: 420,
        }}>{t("footerCta.sub")}</p>
        <Link ref={ctaRef} href="/sign-up" style={{
          display: "inline-block",
          fontFamily: "var(--font-body)", fontSize: 17, fontWeight: 700,
          color: S.dark, background: S.amber, padding: "17px 40px", borderRadius: 12,
          textDecoration: "none", letterSpacing: "-0.02em",
          boxShadow: `0 6px 32px ${S.amberRaw}60`,
        }}
        onMouseMove={onCTAMove}
        onMouseLeave={onCTALeave}
        >{t("footerCta.cta")}</Link>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 24, marginTop: 44 }}>
          {[t("trust.gdpr"), t("trust.support"), t("trust.noCard"), t("trust.setup")].map(badge => (
            <div key={badge} className="trust-badge" style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "var(--font-body)", fontSize: 13, color: S.textSubInv, fontWeight: 500,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6.5" stroke="rgba(247,243,238,0.2)" />
                <path d="M4 7l2 2 4-3.5" stroke={S.amberRaw} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {badge}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const t = useTranslations("Landing")
  return (
    <footer style={{ background: S.dark, borderTop: `1px solid ${S.darkBorder}`, padding: "40px 28px 32px" }}>
      <div style={{ maxWidth: MAX_W, margin: "0 auto" }}>
        <div className="grid md:grid-cols-4 grid-cols-2" style={{ gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.04em", marginBottom: 10 }}>
              <span style={{ color: S.textInverse }}>Håndværk</span><span style={{ color: S.amber }}>Pro</span>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: S.textSubInv, margin: 0, lineHeight: 1.6 }}>{t("footer.tagline")}</p>
          </div>
          {[
            { h: t("footer.product"), ls: [t("footer.features"), t("footer.pricing"), t("footer.changelog")] },
            { h: t("footer.company"), ls: [t("footer.about"), t("footer.contact"), t("footer.blog")] },
            { h: t("footer.legal"),   ls: [t("footer.privacy"), t("footer.terms"), t("footer.cookies")] },
          ].map(({ h, ls }) => (
            <div key={h}>
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: S.textSubInv, marginBottom: 16 }}>{h}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ls.map(l => (
                  <a key={l} href="#" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(247,243,238,0.4)", textDecoration: "none", transition: "color 120ms" }}
                  onMouseEnter={e => (e.currentTarget.style.color = S.textInverse)}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(247,243,238,0.4)")}
                  >{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${S.darkBorder}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(247,243,238,0.3)", margin: 0 }}>{t("footer.copyright")}</p>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(247,243,238,0.3)" }}>🇩🇰 Made in Denmark</span>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isLoaded, user } = useUser()
  const router = useRouter()
  useEffect(() => { if (isLoaded && user) router.replace("/overview") }, [isLoaded, user, router])

  return (
    <div style={{ fontFamily: "var(--font-body)", background: S.bg }}>
      <CursorGlow />
      <Nav />
      <Hero />
      <StatsStrip />
      <FeatureDark />
      <FeatureLight />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FooterCTA />
      <Footer />
    </div>
  )
}
