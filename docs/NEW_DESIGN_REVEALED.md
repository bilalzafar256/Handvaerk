# NEW_DESIGN_REVEALED — The Council Roundtable

> 10 elite designers. One landing page. One directive: no black. Wow-factor on every section.
> Date: 2026-04-18. Stack confirmed: Next.js 15, motion v12, Tailwind v4, **+gsap @gsap/react (newly installed)**.

---

## I. THE OPENING ROAST

**Paula Scher:** "You gave typography a black turtleneck and told it to sit quietly. This is a SaaS landing page dressed as a funeral for a startup."

**Steve Schoger:** "Spacing inconsistent in seventeen places. But the deeper problem: dark palette screams 'we read Linear's design docs once and stopped there.'"

**Jessica Walsh:** "Black backgrounds are what people use when they don't have a point of view. Every SaaS on Product Hunt launched with obsidian and amber in 2023."

**Tobias van Schneider:** "The product is for craftsmen. There should be at least one pixel on this page that smells like sawdust."

**Gleb Kuznetsov:** "The gradient is `linear-gradient(135deg, amber, amber)`. There is no gradient. This is just orange with ambition."

**Julie Zhuo:** "A 52-year-old Danish carpenter opens this page and feels like he accidentally opened a hacker forum."

**Eddie Opara:** "The stats bar has three numbers. Static. On a page about productivity. I'm physically in pain."

**Luke Wroblewski:** *(on his phone)* "First contentful paint is fine. Animations need intersection-observer-gated or I walk out."

**Leta Sobierajski:** "Every section is a centered box. Another centered box. Where is the tension? Where is the diagonal?"

**Matt Willey:** "There's no craft in the craft app. It feels like reading an IKEA manual."

---

## II. THE COLOR DEBATE & FINAL VERDICT

**Tobias** opens with Nordic workshop blue. **Jessica** fights for terracotta. **Gleb** proposes **Nordic Blueprint** — deep cobalt, like architectural drafting paper. **Steve** solves the surface stacking. **Matt** makes the typographic case for warm birch white. **Julie** confirms it builds trust for the target user.

**Vote: 8 for Nordic Blueprint. 1 abstain (Jessica). 1 conditional yes (Luke).**

---

## III. NEW VISUAL IDENTITY

### Palette: "Nordic Blueprint"

| Name | Role | Value |
|---|---|---|
| **Cobalt Night** | Page background | `oklch(0.13 0.035 245)` |
| **Blueprint** | Card / surface | `oklch(0.19 0.04 248)` |
| **Lifted Blueprint** | Elevated surface | `oklch(0.24 0.045 248)` |
| **Birch White** | Primary text | `oklch(0.93 0.022 75)` |
| **Fog** | Secondary text | `oklch(0.63 0.03 245)` |
| **Fog Deep** | Tertiary text | `oklch(0.42 0.025 245)` |
| **Electric Amber** | Brand / CTA | `oklch(0.72 0.195 58)` *(unchanged)* |
| **Nordic Teal** | Success / paid | `oklch(0.68 0.12 185)` |
| **Fjord Blue** | Links | `oklch(0.52 0.13 250)` |
| **Copper** | Data accent | `oklch(0.64 0.10 52)` |

### Typography (Scher + Willey)
- **Display:** Bricolage Grotesque 400/700/800 — architectural authority
- **Body:** DM Sans 400/500/600 — humanist, warm
- **Mono:** JetBrains Mono 400/700 — technical precision for numbers/data
- Headline `line-height: 1.05`. Body `line-height: 1.6`. Never in between.

---

## IV. WOW ROADMAP — SECTION BY SECTION

### Section 1: NAV
**Animation:** Blueprint Reveal — transparent → glass on scroll (80px). Iridescent shimmer on nav link hover (CSS `background-clip: text` gradient sweep). CTA button breathing glow pulse (2s CSS keyframe). Amber underline draws left-to-right on hover (`stroke-dashoffset` SVG or CSS `scaleX`).

### Section 2: HERO
**Animation:** The Architect's Draft — thin amber SVG line draws horizontally across full width (GSAP `strokeDashoffset`, 600ms), then triggers word cascade. Each word enters `translateY(14px) opacity(0) skewX(-2deg)` → normal with spring stagger 40ms. Cursor-following amber spotlight. Three floating proof cards stagger in and float continuously.

### Section 3: STATS BAR
**Animation:** Living Numbers — count-up triggers simultaneously with a small SVG wave (irregular amplitude, `--amber-500` stroke) that grows left-to-right beneath each number over the same duration. Wave "settles" flat when count completes with spring damping.

### Section 4: PROBLEM (Pain Points)
**Animation:** Chaos Arrival — Card 1 arrives `rotate(-4deg) translateX(-20px)`. Card 2 from `rotate(2deg) translateY(32px)`. Card 3 from `rotate(-1.5deg) translateX(20px)`. All settle to `rotate(0) translate(0)` with spring (`stiffness: 200, damping: 15`). Organized chaos — papers thrown on a desk.

### Section 5: FEATURE — JOBS
**Animation:** The Foreman's Blueprint — phone mockup enters at `perspective(2000px) rotateY(25deg) rotateX(8deg)`. Scrolling rotates it to flat. CSS `perspective` + `useScroll` parallax. Bullet points enter one per line with mechanical 120ms stagger.

### Section 6: FEATURE — QUOTES
**Animation:** The Page Unfurl — quote document bottom half starts `scaleY(0)` (transform-origin: top). Scrolls open like unfolding paper. 45-second counter counts up 0→45 with final flicker before landing.

### Section 7: FEATURE — INVOICE
**Animation:** The Iridescent FAKTURA — prismatic gradient sweep across invoice on scroll entry (GSAP diagonal clip). Amber glow bleeds from invoice header. Trust line enters last with 600ms delay.

### Section 8: FEATURE — CUSTOMERS
**Animation:** Data Assembly — profile fragments (avatar, summary bar, tabs) enter from scattered positions and navigate to correct locations with spring physics. Final simultaneous `scale(1.02)→scale(1)` settle.

### Section 9: PRODUCT DEMO
**Animation:** Living Timeline — connecting SVG path between steps has organic curve (not straight). Amber fill crawls along path on step advance. Active step: concentric pulse ring (sonar). Panel transitions: `clip-path` horizontal wipe.

### Section 10: WHO IT'S FOR
**Animation:** The Billboard Blur — headline enters `blur(40px) scale(1.3)` → sharp over 800ms. Trade icons stamp in with random entry rotations (-15° to +15°) settling to 0°.

### Section 11: COMPARISON TABLE
**Animation:** The Unlock — competitor columns enter at `opacity:0.4 grayscale(100%)`. SVG padlock above Håndværk Pro column unlocks (shackle lifts, 400ms spring) → column floods with color, all columns desaturate simultaneously. Each ✓ draws in sequentially 60ms apart.

### Section 12: TESTIMONIALS
**Animation:** The Swell — cards ride sine-wave entry paths (different x/y combos). After settle: continuous asynchronous float (`translateY -4px → 0`, 1.2s, each card offset 1.5s). Cards breathe like buoys.

### Section 13: PRICING
**Animation:** The Shelf Lift — all cards rise from `translateY(30px)`. Solo card overshoots to `-10px` extra before settling. Amber ring glow on Solo pulses between two intensities on 2s loop. Annual/monthly toggle: sliding pill indicator.

### Section 14: FAQ
**Animation:** The Ink Reveal — answer text hidden behind `clip-path: inset(0 0 100% 0)`. Opening reveals `clip-path: inset(0 0 0% 0)` top-to-bottom, 300ms `ease-out`. Feels like ink bleeding through paper.

### Section 15: TRUST BAR
**Animation:** CSS-only cascade. `animation-timeline: view()` + staggered delays. Zero JavaScript. Luke Wroblewski's rule: if it's decoration, it costs nothing.

### Section 16: FOOTER CTA
**Animation:** The Ember — GSAP particle system: 48 circles (2px), `opacity: 0.10–0.18`, drift upward at randomized speeds (12s–20s). Headline slams in `scale(1.6)→scale(1)` with spring. CTA has magnetic hover (follows cursor at 30% speed within 50px radius).

---

## V. IMPLEMENTATION STACK

| Tool | Handles |
|---|---|
| `gsap` + `@gsap/react` | SVG line draws, ScrollTrigger, particle systems, counters, organic paths, clip-path wipes |
| `motion/react` (already installed) | Spring physics, AnimatePresence, shared layoutId, whileInView |
| Tailwind v4 CSS | Hover states, clip-path, `animation-timeline: view()`, glow pulses |
| `tw-animate-css` (already installed) | Utility keyframes |

**Install required:** `npm install gsap @gsap/react` ✅ (done)

No Spline. No Lottie. Performance budget: `<8kb` gzipped per section for animation JS.

---

*The council adjourns. Matt Willey leaves first without saying goodbye. Jessica Walsh is still arguing for terracotta in Phase 12. Luke Wroblewski has filed a GitHub issue titled "footer particles — remove if LCP degrades."*
