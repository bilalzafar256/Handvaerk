"use client"

import { useEffect, useRef, useState } from "react"
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

// ── Pipeline SVG ──────────────────────────────────────────────────────────────

const NODE_ICONS: Record<string, React.ReactNode> = {
  person: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>
  ),
  document: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  invoice: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </>
  ),
  check: <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />,
}

const NODES = [
  { label: "CUSTOMER", icon: "person" },
  { label: "QUOTE", icon: "document" },
  { label: "JOB", icon: "briefcase" },
  { label: "INVOICE", icon: "invoice" },
  { label: "PAID", icon: "check" },
]

function PipelineSVG({ small = false }: { small?: boolean }) {
  const { ref, inView } = useInView(0.1)
  const prefersReduced = usePrefersReduced()
  const nodeX = [60, 240, 450, 660, 840]
  const cy = 50
  const r = 24

  return (
    <div ref={ref} style={{ width: "100%", overflowX: "auto", paddingBottom: 8 }}>
      <svg
        viewBox="0 0 900 120"
        style={{ width: "100%", maxWidth: small ? 400 : 900, minWidth: 480, overflow: "visible" }}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <style>{`
            @keyframes hp-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
            @keyframes hp-pulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.2); } }
          `}</style>
        </defs>

        {/* Base connector */}
        <line x1={nodeX[0]} y1={cy} x2={nodeX[4]} y2={cy} stroke="var(--workshop-700)" strokeWidth={1.5} />

        {/* Animated amber overlay */}
        {(inView || prefersReduced) && (
          <line
            x1={nodeX[0]} y1={cy} x2={nodeX[4]} y2={cy}
            stroke="var(--amber-500)"
            strokeWidth={1.5}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={prefersReduced ? 0 : 1}
            style={prefersReduced ? undefined : { animation: "hp-draw 1.2s ease forwards" }}
          />
        )}

        {/* Nodes */}
        {NODES.map((node, i) => (
          <g key={node.label}>
            <circle cx={nodeX[i]} cy={cy} r={r} fill="var(--workshop-800)" stroke="var(--workshop-600)" strokeWidth={1.5} />
            <g
              transform={`translate(${nodeX[i] - 10}, ${cy - 10})`}
              stroke="var(--workshop-300)"
              strokeWidth={1.5}
              fill="none"
            >
              <svg width={20} height={20} viewBox="0 0 24 24">{NODE_ICONS[node.icon]}</svg>
            </g>
            <text
              x={nodeX[i]} y={cy + r + 18}
              textAnchor="middle"
              fontSize={10}
              letterSpacing={1.5}
              fill="var(--workshop-500)"
              fontFamily="var(--font-body)"
              fontWeight={500}
            >
              {node.label}
            </text>
          </g>
        ))}

        {/* Pulse ring at Paid */}
        {inView && !prefersReduced && (
          <circle
            cx={nodeX[4]} cy={cy} r={r + 8}
            fill="none"
            stroke="var(--amber-500)"
            strokeWidth={1}
            style={{
              animation: "hp-pulse 2s ease-in-out infinite",
              transformOrigin: `${nodeX[4]}px ${cy}px`,
            }}
          />
        )}
      </svg>
    </div>
  )
}

// ── Section 1: Hero ───────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--workshop-900)",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--workshop-800) 1px, transparent 1px), linear-gradient(90deg, var(--workshop-800) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at center, black 30%, transparent 75%)",
          maskImage: "radial-gradient(ellipse 70% 70% at center, black 30%, transparent 75%)",
          pointerEvents: "none",
        }}
      />

      {/* Top nav */}
      <nav
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px",
          maxWidth: 1120,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--workshop-50)",
            }}
          >
            Håndværk Pro
          </span>
          <div style={{ width: 1, height: 18, backgroundColor: "var(--amber-500)", opacity: 0.6 }} />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--workshop-400)",
            }}
            className="hidden sm:inline"
          >
            Job management for Danish tradespeople
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/sign-in"
            className="cursor-pointer"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--workshop-300)",
              textDecoration: "none",
              padding: "6px 12px",
              transition: "color 150ms",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="cursor-pointer"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--primary-foreground)",
              backgroundColor: "var(--primary)",
              padding: "8px 18px",
              borderRadius: 8,
              textDecoration: "none",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* Headline + CTA */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px 40px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}
          className="text-[52px] md:text-[96px]"
        >
          <span style={{ display: "block", color: "var(--workshop-50)" }}>Your invoice</span>
          <span style={{ display: "block" }}>
            <span style={{ color: "var(--workshop-50)" }}>in </span>
            <span
              style={{
                background: "linear-gradient(90deg, var(--workshop-50) 0%, var(--amber-400) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              45 seconds
            </span>
            <span style={{ color: "var(--workshop-50)" }}>.</span>
          </span>
        </h1>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 18,
            color: "var(--workshop-400)",
            marginBottom: 40,
            maxWidth: 480,
          }}
        >
          From quote to paid invoice — without the paperwork.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/sign-up"
            className="cursor-pointer"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              fontWeight: 500,
              color: "var(--primary-foreground)",
              backgroundColor: "var(--primary)",
              padding: "14px 28px",
              borderRadius: 10,
              textDecoration: "none",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            Start for free
          </Link>
          <a
            href="#how"
            className="cursor-pointer"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              color: "var(--workshop-400)",
              backgroundColor: "transparent",
              padding: "14px 28px",
              borderRadius: 10,
              border: "1px solid var(--workshop-700)",
              textDecoration: "none",
            }}
          >
            See how it works ↓
          </a>
        </div>

        {/* Pipeline SVG */}
        <div style={{ marginTop: 80, width: "100%", maxWidth: 900 }}>
          <PipelineSVG />
        </div>
      </div>
    </section>
  )
}

// ── Section 2: Problem ────────────────────────────────────────────────────────

const PROBLEM_CARDS = [
  {
    title: "Quotes on paper",
    body: "You quote verbally. The price lives in your head. By invoice time, you've forgotten half the materials.",
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none" stroke="var(--amber-600)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x={5} y={3} width={18} height={24} rx={2} />
        <line x1={9} y1={10} x2={21} y2={10} />
        <line x1={9} y1={15} x2={21} y2={15} />
        <line x1={9} y1={20} x2={16} y2={20} />
        <path d="M21 20l3-3 2 2-3 3-2.5.5z" />
      </svg>
    ),
  },
  {
    title: "Invoicing from memory",
    body: "9pm on the couch. You're trying to remember what you used on Tuesday's job. Half the work goes unbilled.",
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none" stroke="var(--amber-600)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4C10 4 6 9 6 14c0 4 2 7 6 8v4h8v-4c4-1 6-4 6-8 0-5-4-10-10-10z" />
        <line x1={16} y1={13} x2={16} y2={17} />
        <circle cx={16} cy={12} r={0.75} fill="var(--amber-600)" />
      </svg>
    ),
  },
  {
    title: "Chasing payments",
    body: "You did the work. You sent the invoice. Now you're sending reminders and feeling like the bad guy.",
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none" stroke="var(--amber-600)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x={6} y={4} width={16} height={24} rx={2} />
        <line x1={10} y1={10} x2={18} y2={10} />
        <line x1={10} y1={15} x2={18} y2={15} />
        <line x1={10} y1={20} x2={14} y2={20} />
        <path d="M22 18c2-2 3-5 2-8" strokeLinecap="round" />
        <path d="M24 10l-1 0 0 2" strokeLinecap="round" />
      </svg>
    ),
  },
]

function ProblemSection() {
  const { ref: r0, inView: v0 } = useInView(0.1)
  const { ref: r1, inView: v1 } = useInView(0.1)
  const { ref: r2, inView: v2 } = useInView(0.1)
  const prefersReduced = usePrefersReduced()
  const cards = [
    { ref: r0, inView: v0, indent: 0 },
    { ref: r1, inView: v1, indent: 60 },
    { ref: r2, inView: v2, indent: 120 },
  ]

  return (
    <section style={{ backgroundColor: "var(--background)", padding: "80px 24px 100px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Stat header */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(80px, 12vw, 144px)",
              fontWeight: 800,
              color: "var(--primary)",
              lineHeight: 1,
            }}
          >
            3–4
          </span>
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>
              hours lost
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px, 2vw, 18px)", color: "var(--text-secondary)" }}>
              every single week
            </p>
          </div>
        </div>

        {/* Amber rule */}
        <div style={{ width: "100%", height: 1, backgroundColor: "var(--primary)", opacity: 0.4, marginBottom: 48 }} />

        {/* Problem cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {PROBLEM_CARDS.map((card, i) => (
            <div
              key={card.title}
              ref={cards[i].ref as React.RefObject<HTMLDivElement>}
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderLeft: "3px solid var(--primary)",
                borderRadius: 10,
                padding: 24,
                maxWidth: 680,
                marginLeft: cards[i].indent,
                opacity: cards[i].inView ? 1 : 0,
                transform: cards[i].inView ? "translateX(0)" : "translateX(-20px)",
                transition: prefersReduced ? "none" : `opacity 0.3s ${i * 120}ms ease, transform 0.3s ${i * 120}ms ease`,
              }}
              className="ml-0 md:ml-auto"
            >
              <div style={{ marginBottom: 12 }}>{card.icon}</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                {card.title}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section 3: Product ────────────────────────────────────────────────────────

const STAGES = [
  { status: "New", key: "new", bg: "--status-new-bg", text: "--status-new-text", border: "--status-new-border", desc: "Job received. Customer added. Clock starts." },
  { status: "Scheduled", key: "scheduled", bg: "--status-scheduled-bg", text: "--status-scheduled-text", border: "--status-scheduled-border", desc: "Date set. Customer notified automatically." },
  { status: "In progress", key: "in_progress", bg: "--status-progress-bg", text: "--status-progress-text", border: "--status-progress-border", desc: "On site. Photos attached. Notes added." },
  { status: "Done", key: "done", bg: "--status-done-bg", text: "--status-done-text", border: "--status-done-border", desc: "Work complete. Materials logged." },
  { status: "Invoiced", key: "invoiced", bg: "--status-invoiced-bg", text: "--status-invoiced-text", border: "--status-invoiced-border", desc: "Invoice generated in one tap. Sent instantly." },
  { status: "Paid", key: "paid", bg: "--status-paid-bg", text: "--status-paid-text", border: "--status-paid-border", desc: "Money in. Job closed. On to the next." },
]

function ProductSection() {
  const { ref, inView } = useInView(0.1)
  const prefersReduced = usePrefersReduced()

  return (
    <section
      id="how"
      style={{
        backgroundColor: "var(--background-subtle)",
        padding: "80px 24px 100px",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 48, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Rotated label — desktop only */}
          <div
            style={{ width: 32, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8 }}
            className="hidden md:flex"
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                whiteSpace: "nowrap",
              }}
            >
              HOW IT WORKS
            </span>
            <div style={{ width: 1, flexGrow: 1, minHeight: 120, backgroundColor: "var(--primary)", marginTop: 16, opacity: 0.6 }} />
          </div>

          {/* Timeline */}
          <div ref={ref} style={{ flex: 1, minWidth: 280, position: "relative" }}>
            <p
              className="flex md:hidden"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                marginBottom: 32,
              }}
            >
              HOW IT WORKS
            </p>

            {/* Amber fill line */}
            <div
              style={{
                position: "absolute",
                left: 56,
                top: 0,
                width: 1,
                height: inView ? "100%" : "0%",
                backgroundColor: "var(--primary)",
                zIndex: 1,
                transition: prefersReduced ? "none" : "height 0.8s ease",
                opacity: 0.5,
              }}
            />

            {STAGES.map((stage, i) => (
              <div
                key={stage.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  marginBottom: 28,
                  position: "relative",
                  zIndex: 2,
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(8px)",
                  transition: prefersReduced ? "none" : `opacity 0.3s ${i * 80}ms ease, transform 0.3s ${i * 80}ms ease`,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px 12px",
                    height: 28,
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: "var(--font-body)",
                    backgroundColor: `var(${stage.bg})`,
                    color: `var(${stage.text})`,
                    border: `1px solid var(${stage.border})`,
                    whiteSpace: "nowrap",
                    minWidth: 96,
                    flexShrink: 0,
                  }}
                >
                  {stage.status}
                </span>
                <span style={{ color: "var(--text-tertiary)", fontSize: 14, flexShrink: 0 }}>→</span>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {stage.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section 4: 45-Second Invoice ──────────────────────────────────────────────

const INVOICE_DELAYS: Record<string, number> = {
  header: 0, rule1: 80, company: 160, customer: 240,
  item1: 320, item2: 400, item3: 480, rule2: 540,
  subtotal: 560, moms: 580, total: 600, bar: 680,
}

function InvoiceSection() {
  const { ref, inView } = useInView(0.25)
  const prefersReduced = usePrefersReduced()

  function ls(id: string): React.CSSProperties {
    const d = INVOICE_DELAYS[id] ?? 0
    return {
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(4px)",
      transition: prefersReduced ? "none" : `opacity 0.25s ${d}ms ease, transform 0.25s ${d}ms ease`,
    }
  }

  return (
    <section style={{ backgroundColor: "var(--workshop-900)", padding: "80px 24px 100px", textAlign: "center" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(72px, 12vw, 120px)", fontWeight: 600, color: "var(--amber-400)", lineHeight: 1, marginBottom: 16 }}>
          0:45
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 22, color: "var(--workshop-300)", marginBottom: 8 }}>
          From completed job to sent invoice.
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--workshop-500)", marginBottom: 64, letterSpacing: "0.02em" }}>
          Not an exaggeration. Timed.
        </p>

        {/* Mock invoice */}
        <div
          ref={ref}
          style={{
            maxWidth: 520,
            margin: "0 auto",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            boxShadow: "0 20px 40px oklch(0.05 0.005 50 / 0.6), 0 8px 16px oklch(0.05 0.005 50 / 0.3)",
            transform: "rotate(-1deg)",
            transition: "transform 200ms ease",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "rotate(0deg)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "rotate(-1deg)" }}
        >
          <div style={{ padding: "24px 28px 20px" }}>
            {/* FAKTURA / #1042 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, ...ls("header") }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                FAKTURA
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-primary)" }}>#1042</span>
            </div>

            <div style={{ height: 1, backgroundColor: "var(--border)", marginBottom: 16, ...ls("rule1") }} />

            {/* Company */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, ...ls("company") }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: "var(--primary)", flexShrink: 0 }} />
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>Klaus El-Service ApS</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>CVR: 39781689</p>
              </div>
            </div>

            {/* Customer */}
            <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 20, ...ls("customer") }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-tertiary)" }}>Til:</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-primary)" }}>Morten Andersen, Aarhus</span>
            </div>

            {/* Line items */}
            {([
              { id: "item1", label: "Arbejdsløn", detail: "4 timer × 650 kr.", amount: "2.600,00 kr." },
              { id: "item2", label: "Materialer", detail: "Kobberrør Ø22mm", amount: "480,00 kr." },
              { id: "item3", label: "Kørsel", detail: "20 km", amount: "120,00 kr." },
            ] as const).map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, ...ls(item.id) }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-primary)", flex: 1 }}>{item.label}</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", flex: 1, textAlign: "center" }}>{item.detail}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)" }}>{item.amount}</span>
              </div>
            ))}

            <div style={{ height: 1, backgroundColor: "var(--border)", margin: "16px 0", ...ls("rule2") }} />

            {/* Totals */}
            {([
              { id: "subtotal", label: "Subtotal ex. moms:", amount: "3.200,00 kr.", bold: false },
              { id: "moms", label: "Moms 25%:", amount: "800,00 kr.", bold: false },
              { id: "total", label: "Total inkl. moms:", amount: "4.000,00 kr.", bold: true },
            ] as const).map((row) => (
              <div key={row.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, ...ls(row.id) }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: row.bold ? 14 : 13, fontWeight: row.bold ? 600 : 400, color: row.bold ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  {row.label}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: row.bold ? 14 : 13, fontWeight: row.bold ? 700 : 400, color: row.bold ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  {row.amount}
                </span>
              </div>
            ))}
          </div>

          {/* Amber bottom bar */}
          <div
            style={{
              height: 4,
              backgroundColor: "var(--primary)",
              width: inView ? "100%" : "0%",
              transition: prefersReduced ? "none" : "width 0.35s 680ms ease",
            }}
          />
        </div>
      </div>
    </section>
  )
}

// ── Section 5: Who It's For ───────────────────────────────────────────────────

const TRADES = [
  {
    name: "Elektriker",
    yOffset: 0,
    icon: (
      <svg width={40} height={40} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 5L13 21h9l-4 14 15-19H22L25 5z" />
      </svg>
    ),
  },
  {
    name: "VVS",
    yOffset: -12,
    icon: (
      <svg width={40} height={40} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x={6} y={16} width={10} height={16} rx={2} />
        <rect x={24} y={8} width={10} height={10} rx={2} />
        <path d="M16 24H21a4 4 0 0 0 4-4v-2" />
      </svg>
    ),
  },
  {
    name: "Tømrer",
    yOffset: -20,
    icon: (
      <svg width={40} height={40} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x={5} y={14} width={22} height={10} rx={2} />
        <path d="M27 16l8-4v12l-8-4" />
        <line x1={11} y1={24} x2={10} y2={32} />
        <line x1={20} y1={24} x2={20} y2={32} />
      </svg>
    ),
  },
  {
    name: "Maler",
    yOffset: -12,
    icon: (
      <svg width={40} height={40} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x={8} y={8} width={18} height={10} rx={2} />
        <rect x={10} y={18} width={14} height={3} rx={1} />
        <line x1={17} y1={21} x2={17} y2={33} />
        <rect x={7} y={33} width={20} height={4} rx={2} />
      </svg>
    ),
  },
  {
    name: "Murer",
    yOffset: 0,
    icon: (
      <svg width={40} height={40} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x={7} y={9} width={10} height={6} rx={1} />
        <rect x={21} y={9} width={10} height={6} rx={1} />
        <rect x={14} y={17} width={10} height={6} rx={1} />
        <rect x={7} y={25} width={10} height={6} rx={1} />
        <rect x={21} y={25} width={10} height={6} rx={1} />
      </svg>
    ),
  },
]

function WhoSection() {
  const { ref, inView } = useInView(0.2)
  const prefersReduced = usePrefersReduced()

  return (
    <section style={{ backgroundColor: "var(--background)", padding: "80px 24px 100px", textAlign: "center" }}>
      <div ref={ref} style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Trade icons arc */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "clamp(16px, 4vw, 48px)", marginBottom: 48 }}>
          {TRADES.map((trade, i) => (
            <div
              key={trade.name}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                transform: `translateY(${trade.yOffset}px)`,
                transition: "color 200ms, transform 200ms",
                cursor: "pointer",
                color: "var(--text-tertiary)",
                opacity: inView ? 1 : 0,
                transitionDelay: prefersReduced ? "0ms" : `${i * 80}ms`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.color = "var(--primary)"
                el.style.transform = `translateY(${trade.yOffset - 4}px) scale(1.1)`
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.color = "var(--text-tertiary)"
                el.style.transform = `translateY(${trade.yOffset}px) scale(1)`
              }}
            >
              {trade.icon}
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "inherit" }}>
                {trade.name}
              </span>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, letterSpacing: "-0.01em" }}>
          Built for the trades. Not accountants.
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 56px", lineHeight: 1.6 }}>
          Håndværk Pro speaks your language. Jobs, not ledgers. Quotes, not journal entries. You work — it handles the rest.
        </p>

        {/* Pull quote */}
        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative", textAlign: "left", padding: "32px 32px 32px 60px" }}>
          <svg
            width={48} height={48} viewBox="0 0 48 48" fill="none"
            style={{ position: "absolute", top: 20, left: 4, opacity: 0.3 }}
          >
            <path d="M8 36C8 24 14 16 24 12l-4 6C16 22 14 26 14 30l6 0V36H8z" fill="var(--primary)" />
            <path d="M26 36C26 24 32 16 42 12l-4 6C34 22 32 26 32 30l6 0V36H26z" fill="var(--primary)" />
          </svg>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px, 3vw, 24px)", fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 16 }}>
            "I used to spend Sunday evenings doing invoices. Now it takes me ten minutes on Friday."
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)" }}>
            — Mikkel, Elektriker, Aarhus
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Section 6: Pricing ────────────────────────────────────────────────────────

function CheckMark() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

const PLANS = [
  {
    name: "Gratis",
    price: "0",
    featured: true,
    badge: "Start here",
    features: ["3 active jobs", "Invoices", "Quote builder"],
    cta: "Create free account",
    href: "/sign-up",
  },
  {
    name: "Solo",
    price: "149",
    featured: false,
    badge: null,
    features: ["Unlimited jobs", "Invoices", "Quote builder", "Materials tracker"],
    cta: "Start Solo",
    href: "/sign-up",
  },
  {
    name: "Hold",
    price: "299",
    featured: false,
    badge: null,
    features: ["Up to 5 users", "Everything in Solo", "Team dashboard", "Priority support"],
    cta: "Start Hold",
    href: "/sign-up",
  },
]

function PricingSection() {
  return (
    <section
      style={{
        backgroundColor: "var(--background-subtle)",
        padding: "80px 24px 100px",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 72px)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Simple{" "}
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 72px)", fontWeight: 800, WebkitTextStroke: "2px var(--primary)", color: "transparent", letterSpacing: "-0.02em" }}>
            pricing.
          </span>
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text-secondary)", textAlign: "center", marginBottom: 56 }}>
          Start free. Upgrade when you're ready. Always via MobilePay.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                backgroundColor: "var(--surface)",
                border: plan.featured ? "2px solid var(--primary)" : "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {plan.featured && <div style={{ height: 4, backgroundColor: "var(--primary)" }} />}
              <div style={{ padding: "24px 24px 28px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{plan.name}</span>
                  {plan.badge && (
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, backgroundColor: "var(--primary)", color: "var(--primary-foreground)", padding: "3px 10px", borderRadius: 999 }}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 48, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)" }}>kr./måned</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CheckMark />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-primary)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="cursor-pointer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 44,
                    borderRadius: 10,
                    fontFamily: "var(--font-body)",
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration: "none",
                    backgroundColor: plan.featured ? "var(--primary)" : "transparent",
                    color: plan.featured ? "var(--primary-foreground)" : "var(--primary)",
                    border: plan.featured ? "none" : "1.5px solid var(--primary)",
                    boxShadow: plan.featured ? "var(--shadow-accent)" : "none",
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-tertiary)", textAlign: "center", marginTop: 28 }}>
          💛 Subscription billing via MobilePay — coming soon
        </p>
      </div>
    </section>
  )
}

// ── Section 7: Footer CTA ─────────────────────────────────────────────────────

function FooterCTA() {
  return (
    <section style={{ backgroundColor: "var(--workshop-900)", padding: "120px 24px", textAlign: "center" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}
        >
          <span style={{ display: "block", color: "var(--workshop-50)" }}>Stop chasing invoices.</span>
          <span style={{ display: "block" }}>
            <span style={{ color: "var(--workshop-50)" }}>Start running </span>
            <span style={{ color: "var(--primary)" }}>your business.</span>
          </span>
        </h2>

        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--workshop-400)", marginBottom: 40 }}>
          Free to start. No credit card. Setup in 4 minutes.
        </p>

        <Link
          href="/sign-up"
          className="cursor-pointer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 52,
            padding: "0 32px",
            borderRadius: 10,
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 600,
            color: "var(--primary-foreground)",
            backgroundColor: "var(--primary)",
            boxShadow: "var(--shadow-accent)",
            textDecoration: "none",
            transition: "transform 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.02)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)" }}
        >
          Create your free account
        </Link>

        {/* Footer pipeline SVG */}
        <div style={{ marginTop: 72, maxWidth: 400, margin: "72px auto 0" }}>
          <PipelineSVG small />
        </div>

        {/* Copyright */}
        <div
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: "1px solid var(--workshop-700)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--workshop-600)" }}>Håndværk Pro</span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--workshop-600)" }}>© 2026 · Built for Danish tradespeople</span>
        </div>
      </div>
    </section>
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
    <div style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)", backgroundColor: "var(--background)" }}>
      <Hero />
      <ProblemSection />
      <ProductSection />
      <InvoiceSection />
      <WhoSection />
      <PricingSection />
      <FooterCTA />
    </div>
  )
}
