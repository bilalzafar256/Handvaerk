# DESIGN_IMPROVEMENTS.md
## Håndværk Pro — UI/UX Redesign Specification

> **How to use this doc:** Start each phase by saying *"Start Phase N"*. Claude will read this spec, internalize the designer references, and implement every change described. Phases are cumulative — complete in order.

---

## Design Philosophy

Think: **Paco Coursey's Linear + Rauno Freiberg's Vercel + Emil Kowalski's motion choreography.**

This app is used by Danish tradespeople — electricians, plumbers, carpenters. They're on-site, one-handed, often dirty-fingered, under time pressure. Every pixel has to earn its place. The aesthetic must feel **premium but earned** — not startup-flashy, not corporate-bland. The closest reference point is Linear: information-dense, fast, respectful of the user's intelligence.

**Five principles that govern every phase:**

1. **Speed over flash** — Interactions must feel instant. Animations communicate state, not decoration. Nothing over 250ms unless it's a page transition.
2. **Earned whitespace** — Not "minimalist" for its own sake. Every element present because it serves a job-to-be-done.
3. **Touch-first, desktop-enhanced** — Mobile is primary. Desktop gets power-user features layered on top.
4. **Typographic hierarchy** — Users should never wonder what's most important on a screen.
5. **Consistent motion language** — Same easing curves, same duration families everywhere. Emil Kowalski's rule: if you can't describe when an animation plays, cut it.

**Easing reference (apply globally):**
```css
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);   /* bouncy, for expand/appear */
--ease-smooth:   cubic-bezier(0.16, 1, 0.3, 1);        /* fast-out, for overlays */
--ease-snap:     cubic-bezier(0.4, 0, 0.2, 1);         /* material-like, for state changes */
--duration-fast: 120ms;
--duration-base: 180ms;
--duration-slow: 260ms;
```

---

## Phase 0 — Color System Overhaul

**Files:** `app/globals.css` only.
**Scope:** Replace every CSS variable value. Zero component changes. Everything downstream inherits automatically.

---

### 0.1 The Decision

The current palette has two problems that no amount of component polish can fix:

**Problem 1 — Warm neutrals feel dated.** `--workshop-*` grays sit at hue 50–75 (yellow-brown territory). On a screen, warm neutrals read as aged or craft-y — fine for a hardware store brand, wrong for a modern SaaS tool. The designers we're emulating — Paco Coursey at Linear, Rauno Freiberg at Vercel — all use cool-biased neutrals (hue 240–260) as their base. The cool hue reads as deliberate and modern without feeling cold.

**Problem 2 — Dark mode is abandoned.** The current `.dark` block is entirely achromatic (`chroma: 0`). That's a placeholder, not a design. Vercel's entire visual identity lives in dark mode. Linear defaulted to dark for years. The product should feel equally intentional on both.

**The solution: Obsidian + Electric Amber.**

Keep the amber brand color — it's distinctive and earns its place as the one warm note. Everything else shifts to **cool slate**: perceptually neutral, slightly blue-biased. The result is the exact tension Vercel and Linear create: cool, restrained canvas with a single warm accent that commands every CTA and active state. Adam Argyle calls this "thermal contrast" — it's why the amber will feel more amber than it does today, even though the amber values barely change.

Dark mode becomes the **primary, flagship experience**. Light mode is clean and fully functional. Neither is an afterthought.

---

### 0.2 New Palette: "Slate" replaces "Workshop"

The `--workshop-*` scale is replaced by `--slate-*`. Hue shifts from 50–75 → **255** (cool blue-gray). Chroma is slightly higher for the mid-tones to avoid the muddy middle that pure gray has — Adam Argyle's OKLCH technique for perceptually rich neutrals.

```css
/* Old workshop (warm, hue 50-75) → New slate (cool, hue 255) */
--slate-50:  oklch(0.985 0.002 255);   /* near-white, breathable */
--slate-100: oklch(0.960 0.004 255);
--slate-200: oklch(0.900 0.007 255);
--slate-300: oklch(0.780 0.009 255);
--slate-400: oklch(0.620 0.011 255);
--slate-500: oklch(0.450 0.011 255);
--slate-600: oklch(0.320 0.009 255);
--slate-700: oklch(0.220 0.007 255);
--slate-800: oklch(0.150 0.005 255);
--slate-900: oklch(0.090 0.004 255);   /* Obsidian */
```

The amber scale stays. It gets a tiny chroma boost (+0.02) and a 4° hue shift toward orange (62→58) — this makes it feel more electric on the new cool backgrounds:

```css
/* Amber — Electric revision */
--amber-50:  oklch(0.975 0.025 72);
--amber-100: oklch(0.945 0.055 68);
--amber-200: oklch(0.890 0.095 65);
--amber-300: oklch(0.830 0.135 62);
--amber-400: oklch(0.770 0.165 60);
--amber-500: oklch(0.720 0.195 58);   /* PRIMARY — was 0.70 0.19 62 */
--amber-600: oklch(0.640 0.180 55);
--amber-700: oklch(0.530 0.155 52);
--amber-800: oklch(0.410 0.115 50);
--amber-900: oklch(0.280 0.075 48);
```

---

### 0.3 Light Mode Token Map

```css
:root {
  /* Base surfaces */
  --background:          var(--slate-50);          /* was workshop-50 */
  --foreground:          var(--slate-900);          /* was workshop-900 */
  --card:                oklch(1.000 0.000 0);      /* pure white */
  --card-foreground:     var(--slate-900);
  --popover:             oklch(1.000 0.000 0);
  --popover-foreground:  var(--slate-900);

  /* Borders & inputs */
  --border:              var(--slate-200);          /* was workshop-200 */
  --input:               var(--slate-200);
  --ring:                var(--amber-500);          /* focus ring stays amber */

  /* Primary (brand) */
  --primary:             var(--amber-500);
  --primary-foreground:  oklch(0.10 0.005 52);      /* near-black on amber */

  /* Secondary / Muted */
  --secondary:           var(--slate-100);          /* was workshop-100 */
  --secondary-foreground: var(--slate-700);
  --muted:               var(--slate-100);
  --muted-foreground:    var(--slate-400);

  /* Shadcn --accent (not brand) */
  --accent:              var(--slate-100);
  --accent-foreground:   var(--slate-900);

  /* Destructive */
  --destructive:         oklch(0.52 0.20 25);
  --destructive-foreground: oklch(0.985 0 0);

  /* Sidebar */
  --sidebar:             oklch(0.975 0.003 255);    /* slightly off-white, not pure white */
  --sidebar-foreground:  var(--slate-900);
  --sidebar-border:      var(--slate-200);
  --sidebar-primary:     var(--amber-500);
  --sidebar-primary-foreground: oklch(0.10 0.005 52);
  --sidebar-accent:      var(--amber-50);
  --sidebar-accent-foreground: var(--slate-900);
  --sidebar-ring:        var(--amber-500);

  /* Semantic text */
  --text-primary:        var(--slate-900);
  --text-secondary:      var(--slate-500);
  --text-tertiary:       var(--slate-400);
  --text-inverse:        var(--slate-50);

  /* Surfaces */
  --surface:             oklch(1.000 0.000 0);
  --surface-raised:      oklch(0.990 0.002 255);
  --background-subtle:   var(--slate-100);
  --border-strong:       var(--slate-300);

  /* Brand accent helpers */
  --accent-brand:        var(--amber-500);
  --accent-hover:        var(--amber-600);
  --accent-light:        var(--amber-100);
  --accent-foreground-brand: oklch(0.10 0.005 52);

  /* Shadows — shift shadow hue to match new cool base */
  --shadow-xs:    0 1px 2px oklch(0.09 0.004 255 / 0.06);
  --shadow-sm:    0 1px 3px oklch(0.09 0.004 255 / 0.10), 0 1px 2px oklch(0.09 0.004 255 / 0.06);
  --shadow-md:    0 4px 6px oklch(0.09 0.004 255 / 0.08), 0 2px 4px oklch(0.09 0.004 255 / 0.05);
  --shadow-lg:    0 10px 15px oklch(0.09 0.004 255 / 0.10), 0 4px 6px oklch(0.09 0.004 255 / 0.05);
  --shadow-accent: 0 4px 16px oklch(0.720 0.195 58 / 0.40);   /* amber glow */
}
```

---

### 0.4 Dark Mode Token Map

The dark mode is fully chromatic — every surface gets the `255` hue with gradually increasing lightness. This is how Linear and Vercel avoid the "gray soup" problem of fully achromatic dark modes.

```css
.dark {
  /* Base surfaces — stacked obsidian layers */
  --background:          var(--slate-900);           /* oklch(0.090 0.004 255) */
  --foreground:          var(--slate-50);            /* near-white */
  --card:                var(--slate-800);           /* oklch(0.150 0.005 255) */
  --card-foreground:     var(--slate-50);
  --popover:             var(--slate-800);
  --popover-foreground:  var(--slate-50);

  /* Borders — semi-transparent white over the slate base */
  --border:              oklch(1 0 0 / 9%);
  --input:               oklch(1 0 0 / 12%);
  --ring:                var(--amber-500);            /* amber focus ring on dark — striking */

  /* Primary — amber stays exactly the same */
  --primary:             var(--amber-500);
  --primary-foreground:  oklch(0.10 0.005 52);

  /* Secondary / Muted */
  --secondary:           var(--slate-700);
  --secondary-foreground: var(--slate-200);
  --muted:               var(--slate-700);
  --muted-foreground:    var(--slate-400);

  /* Shadcn --accent */
  --accent:              var(--slate-700);
  --accent-foreground:   var(--slate-50);

  /* Destructive */
  --destructive:         oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.985 0 0);

  /* Sidebar — one step lighter than background */
  --sidebar:             var(--slate-800);
  --sidebar-foreground:  var(--slate-200);
  --sidebar-border:      oklch(1 0 0 / 8%);
  --sidebar-primary:     var(--amber-500);
  --sidebar-primary-foreground: oklch(0.10 0.005 52);
  --sidebar-accent:      oklch(0.720 0.195 58 / 12%);   /* amber tint at 12% opacity */
  --sidebar-accent-foreground: var(--amber-400);
  --sidebar-ring:        var(--amber-500);

  /* Semantic text */
  --text-primary:        var(--slate-50);
  --text-secondary:      var(--slate-400);
  --text-tertiary:       var(--slate-500);
  --text-inverse:        var(--slate-900);

  /* Surfaces */
  --surface:             var(--slate-800);
  --surface-raised:      var(--slate-700);
  --background-subtle:   var(--slate-700);
  --border-strong:       oklch(1 0 0 / 18%);

  /* Shadows — on dark, use lighter alpha glow not darker shadow */
  --shadow-xs:    0 1px 2px oklch(0 0 0 / 0.30);
  --shadow-sm:    0 1px 3px oklch(0 0 0 / 0.40), 0 1px 2px oklch(0 0 0 / 0.24);
  --shadow-md:    0 4px 8px oklch(0 0 0 / 0.45), 0 2px 4px oklch(0 0 0 / 0.30);
  --shadow-lg:    0 12px 24px oklch(0 0 0 / 0.50), 0 4px 8px oklch(0 0 0 / 0.30);
  --shadow-accent: 0 4px 20px oklch(0.720 0.195 58 / 0.50);   /* amber stronger on dark */
}
```

---

### 0.5 Status Colors — Dark Mode Upgrade

Status colors on dark need to be luminous enough to read but not garish. Increase lightness and reduce chroma versus light mode:

```css
.dark {
  /* Status — all bg values shift to translucent tinted overlays */
  --status-new-bg:           oklch(0.32 0.10 200 / 25%);
  --status-new-text:         oklch(0.78 0.14 200);
  --status-new-border:       oklch(0.50 0.12 200 / 40%);

  --status-scheduled-bg:     oklch(0.32 0.08 240 / 25%);
  --status-scheduled-text:   oklch(0.78 0.12 240);
  --status-scheduled-border: oklch(0.50 0.10 240 / 40%);

  --status-progress-bg:      oklch(0.720 0.195 58 / 15%);
  --status-progress-text:    var(--amber-400);
  --status-progress-border:  oklch(0.720 0.195 58 / 35%);

  --status-done-bg:          oklch(0.32 0.07 290 / 25%);
  --status-done-text:        oklch(0.78 0.10 290);
  --status-done-border:      oklch(0.50 0.09 290 / 40%);

  --status-invoiced-bg:      oklch(0.35 0.10 55 / 25%);
  --status-invoiced-text:    oklch(0.80 0.14 55);
  --status-invoiced-border:  oklch(0.52 0.12 52 / 40%);

  --status-paid-bg:          oklch(0.30 0.10 145 / 25%);
  --status-paid-text:        oklch(0.75 0.14 145);
  --status-paid-border:      oklch(0.48 0.12 145 / 40%);

  --status-overdue-bg:       oklch(0.35 0.12 25 / 25%);
  --status-overdue-text:     oklch(0.78 0.18 25);
  --status-overdue-border:   oklch(0.52 0.16 25 / 40%);
}
```

---

### 0.6 Global Easing Variables

Add these to `:root` alongside the color tokens. Every phase references them:

```css
:root {
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-snap:   cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 120ms;
  --duration-base: 180ms;
  --duration-slow: 260ms;
}
```

---

### 0.7 Rename Workshop → Slate in Globals

Every reference to `var(--workshop-*)` in `globals.css` is replaced with `var(--slate-*)`. The variable names in component files do **not** change — they reference semantic tokens (`--background`, `--border`, `--muted`, etc.) which now point to slate values. No component edits needed.

Remove the `--workshop-*` declarations entirely. Add `--slate-*` in their place.

---

### 0.8 Default to Dark Mode

In `app/[locale]/layout.tsx`, add `className="dark"` to the `<html>` element by default. The user's OS preference can override this via a future theme toggle (Phase 7 enhancement). For now, dark is the experience.

This single line transforms the app. The amber accent will immediately look more electric, text contrast will sharpen, and the product will feel like it belongs next to Linear and Vercel in a screenshot.

---

### 0.9 Visual Before/After Reference

| Element | Before (warm) | After (cool dark) |
|---|---|---|
| App background | `oklch(0.98 0.004 75)` warm off-white | `oklch(0.09 0.004 255)` obsidian |
| Card surface | `oklch(1.00 0 0)` white | `oklch(0.15 0.005 255)` lifted slate |
| Body text | `oklch(0.10 0.005 50)` warm black | `oklch(0.985 0.002 255)` cool white |
| Secondary text | `oklch(0.42 0.012 62)` warm gray | `oklch(0.45 0.011 255)` cool gray |
| Border | `oklch(0.88 0.008 70)` warm line | `oklch(1 0 0 / 9%)` white at 9% alpha |
| Primary button | amber on off-white | amber on obsidian — pops harder |

The amber doesn't change. The world around it changes, making it sing.

---

## Phase 1 — Landing Page

**Pages:** `app/[locale]/page.tsx`
**Inspiration:** Vercel.com, Linear.app marketing, Stripe homepage, Loom.com, Raycast.com

### Section Order (full page, top to bottom)

```
1.  Nav
2.  Hero
3.  Stats Bar
4.  Problem (Pain Points)
5.  Feature: Jobs & Workflow
6.  Feature: Quotes in Seconds
7.  Feature: Invoice & Get Paid
8.  Feature: Customer Intelligence
9.  Product Demo (interactive timeline)
10. Who It's For
11. Comparison Table
12. Testimonials
13. Pricing
14. FAQ
15. Trust Bar
16. Footer CTA
```

The page is **long by design**. Tradespeople have real objections — trust, complexity, cost, data safety. Every section exists to answer a question a skeptical 52-year-old carpenter has before signing up.

---

### 1.1 Navigation Bar

**Current:** Fixed top nav with logo, links, CTA. Functional but generic.

**New:**
- Background: `backdrop-filter: blur(16px) saturate(180%); background: oklch(0.09 0.004 255 / 80%)` — Vercel's exact glass nav technique, now with the new obsidian color.
- Nav links: `var(--slate-400)` default. Hover: `var(--slate-100)`. Transition 120ms `--ease-snap`. No underline — color shift is enough.
- Scroll behavior: after 80px scroll, a `1px solid oklch(1 0 0 / 8%)` bottom border fades in. Communicates depth without being heavy.
- CTA button ("Kom i gang"): amber. On hover, `--shadow-accent` glow activates and button lifts `translateY(-1px)`. 120ms.
- Mobile: hamburger left, logo center, "Prøv gratis" pill button right (24px height, compact). Sheet slides from right, `--ease-smooth` 240ms. Sheet background: `oklch(0.12 0.005 255)`.
- Add nav links: `Funktioner`, `Priser`, `FAQ`, `Log ind`. Anchors to page sections — no separate pages needed.

### 1.2 Hero Section

**Current:** Dark, headline, subheadline, two buttons, grid background.

**New:**

**Layout:** Centered, max-width 760px, plenty of vertical breathing room. Not full-viewport — hero ends and next section is visible, encouraging scroll (Loom's approach).

**Eyebrow label above headline:** Small pill: `● Ny: Fakturaer via email →` in `var(--amber-500)` text, `oklch(0.720 0.195 58 / 12%)` background, `oklch(0.720 0.195 58 / 30%)` border. Link to the invoice feature section. This is the Vercel "Announcing X" badge — it's the highest-CTR element on a hero.

**Headline:** Bricolage Grotesque 800, `clamp(40px, 7vw, 80px)`, tight line-height (1.05). Split into three lines:
```
Spar 3 timer
om ugen. Fokusér
på håndværket.
```
Lines 1 and 3: `var(--slate-50)`. Line 2: `var(--amber-400)`. The amber line is the pivot — it names the benefit.

**Word-by-word entrance:** Each word: `translateY(12px) opacity(0)` → `translateY(0) opacity(1)`, staggered 35ms per word, `--ease-spring`. Emil Kowalski's technique. Feels typed, not loaded.

**Subheadline:** DM Sans 400, `clamp(17px, 2.2vw, 21px)`, `var(--slate-400)`. One sentence. Max 80 chars. Example: `"Tilbud, jobs, fakturaer og kunder — alt samlet på 5 minutter."`.

**CTA row:**
- Primary: amber button, 48px height. Left side: 7px pulsing dot in `var(--amber-300)` — signals "live product." Text: `"Start gratis i dag"`.
- Secondary: ghost, `var(--slate-600)` border, `var(--slate-300)` text. Text: `"Se hvordan det virker →"`. Links to the demo section.
- Micro-trust below buttons: `"Ingen kreditkort · Gratis at starte · Dansk support"` — 12px, `var(--slate-500)`, `·` as separator.

**Background:**
- Cursor-following radial spotlight: `radial-gradient(700px circle at var(--x, 50%) var(--y, 50%), oklch(0.720 0.195 58 / 6%), transparent 65%)`. Updates via `mousemove` → CSS custom property at 30% speed. On mobile: centered static version, no mousemove.
- Background grid: `opacity: 0.035`. Fine lines, CSS background-image pattern.
- Add a `radial-gradient(ellipse 120% 50% at 50% 100%, oklch(0.720 0.195 58 / 4%), transparent)` at the bottom of the hero — a faint amber floor glow that bleeds into the next section.

**Floating proof cards:** 3 cards arranged below the CTA row in a horizontal cluster (desktop) or vertical stack (mobile). Each card is a frosted glass pill:
- `background: oklch(1 0 0 / 5%); border: 1px solid oklch(1 0 0 / 10%); backdrop-filter: blur(8px)`
- Card 1: `✓ Tilbud T-0042 accepteret — Erik Hansen`
- Card 2: `💰 Faktura betalt · 12.800 kr`
- Card 3: `📍 Job afsluttet · Frederiksberg`
- Each card: icon 14px, text 13px DM Sans. Enter animation staggered 500/700/900ms from page load. Slow float loop: `translateY(0px) → translateY(-5px)` 5s ease-in-out, each card offset 1.5s.

### 1.3 Social Proof Stats Bar

**New section — placed immediately below hero.**

A horizontal bar breaking the dark background. Background: `oklch(1 0 0 / 4%)` — barely distinguishable from hero. Separator lines on left and right: `1px solid oklch(1 0 0 / 8%)`.

Three stats, centered, equal width columns:
```
2.400+          48.000+         1,2 mia. kr
Håndværkere     Fakturaer sendt  Faktureret via platformen
```

Numbers: JetBrains Mono 700, `clamp(28px, 4vw, 40px)`, `var(--slate-50)`.
Labels: DM Sans 400, 13px, `var(--slate-500)`.

**Counting animation:** On scroll-into-view, numbers count up from 0 to final value in 1.2s using `requestAnimationFrame`. Easing: ease-out. This is the most-copied hero pattern because it works — the motion draws the eye and the numbers make the claim feel earned.

Vertical `1px` dividers between columns: `oklch(1 0 0 / 10%)`.

### 1.4 Problem Section (Pain Points)

**New design — replaces current 3-card layout.**

Section heading: `"Lyder det bekendt?"` — 13px uppercase, `var(--amber-500)`, letter-spacing: 0.1em. Acts as a category label. Below: a headline in 38px Bricolage Grotesque: `"Papirbunkerne er ikke værd at slæbe med."`.

Three pain points in a **3-column card grid** (1 column mobile, 3 desktop). Each card:
- Top: icon (24px, `var(--slate-600)`)
- Bold 1-line headline: 17px, `var(--slate-200)`
- 2-3 line description: 14px, `var(--slate-400)`
- Number badge top-right: `01`/`02`/`03` — JetBrains Mono 11px, `var(--slate-700)`

Pain points to convey:
1. `"Excel-arket fejler igen"` — sporer ikke betalinger, sender forkerte totaler
2. `"Fakturaen ankom for sent"` — kunden betalte 40 dage for sent, fordi du glemte det
3. `"Du mister overblikket"` — 3 apps, 2 mapper, 1 rodet indbakke

Cards enter with `opacity: 0 translateY(16px)` → fully visible, staggered 80ms, on scroll-into-view.

### 1.5 Feature Section: Jobs & Workflow

**New section — first of 4 feature deep-dives.**

Layout: **two-column alternating** (image left, text right). On mobile: text above, image below.

Left: A product screenshot mockup of the jobs list — real UI inside a phone frame (375×812 artboard). Phone frame: `var(--slate-800)` rounded rect, `--shadow-lg`. Screenshot shows the status-colored job list with amber active state.

Right:
- Section label: `"Jobs"` — 11px uppercase amber
- Headline: `"Alle jobs. Alt overblik."` — 32px Bricolage Grotesque
- 3 bullet points with custom amber checkmark icons:
  - `"Opret, planlæg og afslut jobs på under 30 sekunder"`
  - `"Status-system med 6 trin — fra Ny til Betalt"`
  - `"Upload fotos direkte fra jobstedet"`
- CTA link: `"Udforsk jobs →"` — amber, 14px

On scroll-into-view: image slides in from left (`translateX(-24px) opacity(0)` → default), text from right. 200ms `--ease-smooth`, 100ms delay offset.

### 1.6 Feature Section: Quotes in Seconds

**Layout: text left, image right** (alternating from 1.5).

Right: Product mockup of the quote builder on desktop — showing the document-editor layout with a total panel.

Left:
- Section label: `"Tilbud"`
- Headline: `"Et tilbud på 45 sekunder."` — exact promise, exact number.
- Bullets:
  - `"Præfyldte linjevarer fra dit materialebibliotek"`
  - `"Send direkte til kunden — de accepterer med ét klik"`
  - `"Tilbud konverteres automatisk til faktura"`
- Animated counter below bullets: a `45` in 48px JetBrains Mono `var(--amber-400)` with `"sekunder"` in 16px next to it. The 45 counts down from 99 on first scroll-into-view. Pure showmanship — but it stops the scroll.

### 1.7 Feature Section: Invoice & Get Paid

**Layout: image left, text right.**

Left: Invoice PDF preview inside a laptop frame (16:10 artboard). Shows a real-looking FAKTURA with amber header, line items, moms, total. Laptop frame: thin `var(--slate-700)` border, screen glow from amber header bleeds out faintly.

Right:
- Section label: `"Fakturaer"`
- Headline: `"Fra job til betalt — automatisk."`.
- Bullets:
  - `"Professionelle PDF-fakturaer med dit logo"`
  - `"Automatisk rykker efter 8 og 15 dage"`
  - `"MobilePay og bankoverførsels-detaljer på fakturaen"`
- Trust micro-detail: `"Overholder dansk bogføringslov"` — 12px, `var(--slate-500)`, with a small `✓` icon. This is the most important trust signal for Danish business users.

### 1.8 Feature Section: Customer Intelligence

**Layout: text left, image right.**

Right: Customer detail mockup — shows the profile header with financial summary bar (Faktureret/Udestående/Betalt) and the job history tab.

Left:
- Section label: `"Kunder"`
- Headline: `"Kend din kunde. Husk alt."`
- Bullets:
  - `"CVR-opslag udfylder firma og adresse automatisk"`
  - `"Komplet historik: jobs, tilbud, fakturaer"`
  - `"Se præcis hvad en kunde skylder dig"`

### 1.9 Interactive Product Demo

**Redesign of current workflow timeline.**

Section intro: `"Se det i praksis"` label + `"Fra opkald til betaling — se hele flowet."` headline.

**Desktop layout:** Horizontal stepper across the top (6 steps). Below: a `480×320px` product UI panel that updates as user clicks/hovers each step. The panel shows an animated screenshot transition for each step. Steps: `Opkald → Job oprettet → Tilbud sendt → Accepteret → Faktura sendt → Betalt`.

**Mobile layout:** Vertical timeline. Tap a step to expand and show the product panel for that step. Accordion-style, `--ease-smooth` 220ms.

**The panel transition:** When switching steps, the panel content fades out (`opacity: 0`, 80ms), then the new content fades in (`opacity: 1`, 120ms). No slide — it's a cut with a soft fade. Emil Kowalski's rule: when spatial relationship between states is unclear, fade is cleaner than a slide.

Each step content shows a realistic (mocked) screenshot:
- Step 1 (Job oprettet): Empty new-job form being filled
- Step 2 (Tilbud sendt): Quote document with customer email
- Step 3 (Accepteret): Green "Accepteret" status + customer signature line
- Step 4 (Faktura sendt): Invoice PDF preview
- Step 5 (Betalt): Payment confirmed, invoice green, balance updated

Auto-advances every 3s if user doesn't interact. Pauses on hover. Progress indicator: thin amber progress bar below the stepper, fills from 0→100% over 3s with a CSS animation, resets on step change.

### 1.10 Who It's For

**Redesign of current trade-type section.**

Section heading: `"Bygget til dem der bygger Danmark."` — 38px Bricolage Grotesque.

**Trade icons grid:** 8 trades in a 4×2 grid. Each trade: icon (32px custom SVG or Lucide), trade name below in 13px DM Sans. Hover: card background `oklch(0.720 0.195 58 / 8%)`, icon shifts to amber. 120ms `--ease-snap`.

Trades: Elektriker, VVS-montør, Tømrer, Maler, Murer, Smed, Gulvlægger, Tagdækker.

**Single testimonial below grid (rotates):** Large `"` quote mark in amber, quote text in 20px DM Sans 400 italic `var(--slate-300)`, author name 15px 600 `var(--slate-100)`, trade + city in 13px `var(--slate-500)`. Auto-rotates between 3 quotes every 5s. Transition: `opacity: 0 scale(0.97)` → `opacity: 1 scale(1)`, 200ms `--ease-smooth`.

### 1.11 Competitor Comparison Table

**New section — directly before pricing.**

Section heading: `"Hvorfor ikke bare Excel?"` — disarms the objection by naming it.

Table with 5 rows × 4 columns:

| Funktion | Håndværk Pro | Excel/Word | Billy/e-conomic | Pen & papir |
|---|---|---|---|---|
| Mobilvenlig | ✓ | ✗ | Delvist | ✗ |
| Jobstyring | ✓ | ✗ | ✗ | ✗ |
| Auto-rykkere | ✓ | ✗ | ✓ | ✗ |
| Bygget til håndværkere | ✓ | ✗ | ✗ | ✗ |
| Pris/md | Fra 0 kr | 0 kr | Fra 149 kr | 0 kr |

Håndværk Pro column: header has amber tint background, `var(--amber-500)` top border (2px). Checkmarks: amber SVG. X marks: `var(--slate-600)`. This is Stripe's comparison table pattern — own column stands out without being garish.

On mobile: table scrolls horizontally. Sticky first column (feature names).

### 1.12 Testimonials Section

**New section.**

Section heading: `"Hvad håndværkere siger."` — plain, no hype.

**3-column testimonial card grid** (1 mobile, 2 tablet, 3 desktop). Each card:
- Background: `var(--slate-800)`, `1px solid oklch(1 0 0 / 8%)` border, `--shadow-sm`
- `"` quotation mark: 48px Bricolage Grotesque 800, `var(--amber-600)`, positioned absolute top-left
- Quote text: 15px DM Sans 400, `var(--slate-300)`, italic. 3–4 lines max.
- Author row at bottom: avatar (40px initials circle, amber bg), name 14px 600 `var(--slate-100)`, trade + city 12px `var(--slate-500)`
- Star rating: 5 amber `★` at 13px

Cards enter staggered on scroll-into-view: `translateY(20px) opacity(0)` → default, 100ms offset each, 180ms `--ease-smooth`.

### 1.13 Pricing Section

**Redesign of current 3-tier layout.**

Section heading: `"Enkle priser. Ingen overraskelser."`.

**Annual/Monthly toggle** above the cards: pill toggle switch. Annual selected by default — shows savings badge `"Spar 2 måneder"` in amber.

3 cards: `Gratis`, `Solo`, `Hold`. Same features as today but visually refined:
- **Solo card (recommended):** `box-shadow: 0 0 0 1px var(--amber-500), 0 0 48px oklch(0.720 0.195 58 / 18%)` — amber ring glow, not just a badge. This is the strongest visual highlight in the section.
- `"Anbefalet"` badge: absolute positioned top-center. `var(--amber-500)` background, `var(--slate-900)` text, 11px uppercase.
- Price: JetBrains Mono 700 for the number, DM Sans 400 for `/md`. Annual price shown, monthly in smaller text below.
- Feature list: left-aligned, `var(--amber-400)` checkmark SVG icons. Grey-out unavailable features (slash through, `var(--slate-700)`) rather than hiding — shows what you're upgrading from.
- CTA buttons: primary amber for Solo, ghost for Gratis, ghost for Hold.
- Below all cards: `"Ingen binding · Annullér når som helst · Data eksporteres altid"` — 12px, `var(--slate-500)`, centered.

### 1.14 FAQ Section

**New section — critical for conversion.**

Section heading: `"Ofte stillede spørgsmål"`.

**Accordion layout** — 8 questions, one column, full width up to 720px centered. Each item:
- Question: 16px DM Sans 600 `var(--slate-100)`. Right side: `+` / `×` icon.
- Answer: 15px DM Sans 400 `var(--slate-400)`. Revealed with `height: 0 → auto` + `opacity: 0 → 1`, 200ms `--ease-smooth`.
- Separator: `1px solid oklch(1 0 0 / 8%)`.
- Active item: question text becomes `var(--slate-50)`, `+` becomes amber `×`.

Questions:
1. `"Er det sikkert at gemme mine kundedata her?"` — GDPR, dansk hosting
2. `"Kræver det teknisk indsigt?"` — nej, bygget til håndværkere
3. `"Hvad sker der med mine data hvis jeg stopper?"` — eksport altid tilgængelig
4. `"Overholder fakturaerne bogføringsloven?"` — ja, EAN, moms, CVR
5. `"Kan jeg bruge det på min telefon på jobstedet?"` — ja, mobil-first
6. `"Hvad er forskellen på Gratis og Solo?"` — jobgrænse, PDF-branding, rykkere
7. `"Kan jeg importere mine eksisterende kunder?"` — CSV-import
8. `"Hvad koster det hvis jeg vil stoppe?"` — ingenting, ingen binding

### 1.15 Trust Bar

**New section — immediately before footer CTA.**

A `64px` tall horizontal strip. Background: `oklch(1 0 0 / 3%)`. Three or four trust signals separated by vertical dividers:

`🔒 GDPR-compliant`  `·`  `🇩🇰 Dansk support`  `·`  `💳 Ingen kreditkort kræves`  `·`  `⚡ Opsæt på 5 min`

Each signal: icon + 13px DM Sans `var(--slate-400)`. Simple. This is the "fine print made visible" technique — Stripe does this above their footer on every page.

### 1.16 Footer CTA

**Redesign of current CTA.**

Full-bleed section. Background: a diagonal amber gradient — `linear-gradient(135deg, var(--amber-600) 0%, var(--amber-500) 50%, var(--amber-400) 100%)`. This is the only full-amber section on the page — maximum contrast from the dark sections above.

Headline: `"Begynd i dag."` — Bricolage Grotesque 800, 52px, `var(--slate-900)`. One line, nothing else.
Subline: `"Første job gratis. Ingen binding."` — 18px DM Sans 400, `oklch(0.15 0.005 52)`.
CTA button: dark — `background: oklch(0.10 0.004 255); color: var(--slate-50)`. Hover: `background: oklch(0.15 0.005 255)`. Inverse of all other buttons — signals "final action."

Footer below: standard links. 3 columns: Product (Funktioner, Priser, Vejledning), Virksomhed (Om os, Kontakt, Blog), Legal (Privatlivspolitik, Cookiepolitik, Vilkår). All links `var(--slate-500)`, hover `var(--slate-300)`. Bottom row: `"© 2025 Håndværk Pro · CVR XXXXXXXX"` in `var(--slate-600)` 12px.

---

## Phase 2 — Dashboard Overview + Sidebar

**Pages:** `components/shared/sidebar.tsx`, `components/shared/topbar.tsx`, `app/[locale]/(dashboard)/overview/page.tsx`
**Inspiration:** Linear sidebar, Raycast command palette, Vercel dashboard layout

### 2.1 Sidebar Redesign

**Current:** 240px open / 64px closed. Text nav items with icons.

**New:**

**Collapsed state:**
- Icons get **tooltips** (not native `title`, custom floating label) that appear on hover: `opacity: 0 translateX(-4px) → opacity: 1 translateX(0)`, 120ms `--ease-smooth`. Label is `var(--workshop-900)` on white card, `--shadow-sm`. Exact Linear pattern.
- Icon size: 18px. Active icon: filled variant (swap from outline → filled Lucide icon on active). Inactive: outline, `var(--workshop-500)`. Active: filled, `var(--amber-600)`.

**Expanded state:**
- Add a **user avatar + company name** at the very top of the sidebar (not topbar). Small: 28px avatar circle (Clerk image), company name in 13px DM Sans 500, user email in 11px `var(--workshop-400)`.
- Nav items: left-side `3px` active indicator bar (not background fill). Active item: `border-left: 3px solid var(--amber-500)`, text becomes `var(--workshop-900)` 500 weight. Inactive: no bar, text `var(--workshop-500)` 400 weight. Background on active: `var(--amber-50)` — very subtle.
- Item height: `36px`. Padding: `0 12px 0 16px`. Icon: 16px, right margin: 10px.
- Add a **keyboard shortcut hint** for each nav item: `G then J` for Jobs, `G then C` for Customers, etc. (Linear's `G` global navigation). These hints show on the right side of each nav item at 11px JetBrains Mono, `var(--workshop-400)`. Only visible when sidebar is expanded.

**Bottom of sidebar:**
- Remove the Settings/Sign Out from bottom nav items. Replace with a single **avatar button** that opens a dropdown: Profile, Settings, Sign Out. This is the Vercel/Linear pattern — the nav is for navigation, not utility actions.

**Animation:**
- Sidebar expand/collapse: `width: 64px → 240px`, 200ms `--ease-smooth`. Nav item labels: `opacity: 0 → 1` with 60ms delay after sidebar starts expanding (so labels don't appear mid-animation). This two-phase reveal is Emil Kowalski's technique.

### 2.2 Topbar Redesign

**Current:** Fixed 56px bar with page title and action button.

**New:**
- Reduce height to **48px**.
- Page title: 15px Bricolage Grotesque 600, `var(--workshop-900)`. No large headings in the topbar.
- Add **breadcrumbs** for nested pages: `Kunder / Erik Hansen / Rediger`. Each segment `var(--workshop-500)`, separator `/` `var(--workshop-300)`. Current page: `var(--workshop-900)`. Clicking a parent navigates back. 13px DM Sans.
- Action button ("Ny kunde", "Nyt job", etc.): Move to **top-right, outside the topbar** as a floating action — on mobile this is a circular FAB (56px, amber, `+` icon, `--shadow-lg`). On desktop, a regular button top-right of the content area, not the topbar.
- Topbar on mobile: **no title** — just the hamburger left, logo center, FAB right. Space is too precious.

### 2.3 Overview (Dashboard) Page

**Current:** Stat cards, critical zone, today's jobs, activity feed, status breakdown.

**New:**

**Greeting header:**
- Replace page title "Oversigt" with a **contextual greeting**: `"God morgen, Bilal."` (time-aware: god morgen/eftermiddag/aften). Below it: `"Du har 3 jobs i dag · 2 tilbud afventer svar."` — one-line summary of what needs attention. 15px, `var(--workshop-500)`.
- This is Linear's philosophy: the dashboard tells you what's happening, not just shows data.

**Stat cards redesign:**
- Current 4-column cards feel generic. Make them **data-forward**:
  - Each card: number in 32px JetBrains Mono 600, label in 12px DM Sans uppercase tracking-wide `var(--workshop-400)`.
  - Add a **sparkline** (7-day trend) below each number — tiny 40px × 16px SVG line chart, `var(--amber-400)` stroke, no axes, no labels. Just the shape of the trend. This is Stripe's dashboard pattern.
  - Trend delta: `+12%` or `-3%` in 11px, green/red color, to the right of the number. Always show sign.
  - Card border: remove the ring. Use only `--shadow-xs`. Cards feel lighter.

**Critical zone (overdue invoices):**
- This is the highest-priority information. Make it feel urgent:
  - Background: `oklch(0.96 0.04 25)` (very light red/orange).
  - Left border: `4px solid oklch(0.52 0.20 25)` (red).
  - Icon: `AlertTriangle` with a slow `rotate(-5deg) → rotate(5deg)` pendulum animation, 3s loop, `ease-in-out`. Stops animating after 5 seconds — starts again if user hasn't acted.
  - Each overdue item: amount in JetBrains Mono, days-overdue in a red pill badge.

**Today's jobs:**
- Each job row: left side has a **vertical status color bar** (4px wide, full height of row) in the job's status color. This gives instant visual scanning.
- Job title: 14px DM Sans 500. Customer name: 13px `var(--workshop-500)`. Time: right-aligned JetBrains Mono 13px.
- Tap/click anywhere on the row navigates. Row hover: `background: var(--workshop-50)`, 80ms `--ease-snap`.
- Empty state: not just "ingen jobs" — show a CTA: `"Ingen jobs i dag. Tilføj et job →"` with a subtle dashed border card.

**Activity feed:**
- Each activity item gets a **semantic icon** — not just a generic dot. Invoice paid: green receipt icon. Quote accepted: blue checkmark. Job status change: briefcase. 16px icons.
- Group activities by day: `"I dag"`, `"I går"`, `"Mandag"`. Each group: 11px uppercase label, `var(--workshop-400)`, `--radius` pill background.
- Activity items animate in when scrolled into view: `opacity: 0 translateY(4px) → opacity: 1 translateY(0)`, staggered 40ms, 160ms `--ease-smooth`.

---

## Phase 3 — Jobs Pages

**Pages:** `app/[locale]/(dashboard)/jobs/page.tsx`, `app/[locale]/(dashboard)/jobs/[id]/page.tsx`, `app/[locale]/(dashboard)/jobs/new/page.tsx`
**Inspiration:** Linear issue list, Notion inline editing, Raycast action panel

### 3.1 Jobs List Page

**Current:** Search bar, view toggle (list/card/table), list of job items, pagination.

**New:**

**Filter bar redesign (Linear-inspired):**
- Replace the lone search bar with a **filter token system**. Horizontal bar with: `[🔍 Søg]  [Status: Alle ▾]  [Kunde: Alle ▾]  [Dato ▾]`. Each filter is a pill button. Active filter: `var(--amber-100)` bg, `var(--amber-700)` text, `× ` to remove.
- Status filter opens a popover with checkboxes per status (multi-select). Selecting multiple statuses adds a `(3)` count badge to the filter pill.
- Filters animate in/out with `height: 0 → auto` + `opacity: 0 → 1`, 160ms `--ease-smooth`.

**List item redesign:**
- List view: two-column layout. Left 70%: status bar + job title + customer name. Right 30%: date + amount + action menu.
- The **status color bar** (3px left border) is the primary visual scanner — tradespeople learn to read the colors.
- Amount: JetBrains Mono 13px, right-aligned.
- Hover state: the row background transitions to `var(--workshop-50)` AND the status bar grows to `4px`. 80ms. Micro-detail that Rauno Freiberg would add.
- **Swipe to complete** on mobile: swipe right reveals a green `✓ Afsluttet` action. Swipe left reveals red `Slet`. Uses CSS `translate()` with touch events. Snap back with `--ease-spring` 240ms if threshold not met.

**Table view (desktop only):**
- Linear-style table: `40px` row height, no vertical lines, only subtle `1px` horizontal separator between rows.
- Column headers: 11px uppercase, letter-spacing: 0.06em, `var(--workshop-500)`. Click to sort — adds `↑↓` indicator.
- Checkbox column left for bulk selection. On selecting any: a **bulk action bar** appears at the bottom of the viewport (above mobile nav), sliding up with `--ease-spring`. Contains: `[Status ändern] [Löschen] [Exportieren]`. This is Linear's bulk action UX.

**Empty state:**
- Not just an icon and text. Show a **ghost job card** (10% opacity, blurred) behind the empty state message. Communicates what the page looks like when populated. Notion does this.

### 3.2 Job Detail Page

**Current:** Job info, status changer, photo upload, line items, related quotes/invoices.

**New:**

**Two-column layout (desktop):**
- Left column (65%): Job details, line items, notes, photos.
- Right column (35%): **Command panel** — sticky, contains: status changer, quick actions, related documents (quotes/invoices list), customer contact card.
- On mobile: single column, command panel collapses into an expandable bottom sheet.

**Status changer redesign:**
- Not a dropdown. A **horizontal stepper** showing all 6 states. Current state is highlighted. Past states: `var(--workshop-300)`, checkmark. Future states: `var(--workshop-200)`, dot. Current: `var(--amber-500)` filled.
- Clicking a future state shows a **confirmation tooltip**: `"Ændre til Faktureret? ↵ Enter"`. Pressing Enter or clicking again commits. This prevents accidental status changes. Paco Coursey's pattern from Linear.
- State change animation: the filled indicator slides along the stepper, 200ms `--ease-smooth`. The status badge in the header simultaneously updates with a `scale(0.9) → scale(1)` pop.

**Photo gallery:**
- Photos in a masonry grid (2 columns). Aspect-ratio preserved.
- Hover: `scale(1.02)`, 120ms `--ease-snap`. Overlay shows filename and date in bottom-left.
- Tap opens a **fullscreen lightbox** with swipe navigation. Background: `oklch(0.05 0 0 / 90%)` blur. Close: swipe down or `Esc`.

**Notes section:**
- Inline editing — not a separate form. Click text → it becomes an editable textarea. `contenteditable` feel, but using a real textarea with `border: none; background: transparent; resize: none`.
- Auto-saves on blur with a subtle `"Gemt ✓"` flash (200ms fade in, 1s hold, 400ms fade out) in `var(--workshop-400)`.

### 3.3 Job Create / Edit Form

**Current:** Standard form with labeled inputs in a card.

**New:**

**Stepped form (Linear new-issue style):**
- Break into 3 steps with a minimal progress indicator (dots, not a bar): `● ● ○` style.
- Step 1: Customer + Job title (the essentials). Auto-complete customer search with a popover results list. Results: customer name bold, last job date subtle right-aligned.
- Step 2: Date, status, description. Date input uses a custom inline calendar popover (not native date input).
- Step 3: Line items (optional). Can be skipped.
- **Keyboard-navigable**: Tab through fields, Enter to advance step, Esc to go back. Shortcut hints visible at bottom: `↵ Næste  Esc Tilbage`.

**Field design:**
- Labels: 11px uppercase, letter-spacing: 0.06em, `var(--workshop-500)`. Not above the input — to the **left** on desktop (a 2-column grid: label/input). On mobile: labels above.
- Input focus: `box-shadow: 0 0 0 3px oklch(0.70 0.19 62 / 20%)` — amber focus ring. The border doesn't change color; only the glow appears. Adam Argyle's approach to focus styling.
- Required field indicator: not `*`. Instead, a subtle `"Påkrævet"` in the placeholder text for the very first time a user sees it, replaced by helper text on blur.

---

## Dashboard Component Reference — Implemented Patterns

> These are the **shipped** patterns from Phase 3 (Jobs). All subsequent dashboard pages MUST follow this reference exactly. Do not deviate without updating this doc.

---

### Token Usage — Correct Mapping

Always use these tokens. Never use `--surface`, `--background-subtle`, `--text-primary`, `--text-secondary`, `--text-tertiary` — those are legacy names that no longer exist.

| Purpose | Token |
|---|---|
| Page background | `var(--background)` = slate-50 (very light gray) |
| Card/panel background | `var(--card)` = pure white |
| Section header background | `var(--muted)` = slate-100 (visible gray) |
| Body text | `var(--foreground)` |
| Secondary text | `var(--muted-foreground)` |
| Borders | `var(--border)` |
| Hover background | `var(--accent)` = slate-100 |
| Primary CTA background | `var(--primary)` = amber-500 |
| Primary CTA text | `var(--primary-foreground)` |
| Destructive hover | `var(--error-light)` |
| Destructive text/border | `var(--error)` |
| Amber badge background | `var(--accent-light)` = amber-100 |

---

### Critical Rule — Hover States

**Never set `backgroundColor` in `style={{}}` AND a `hover:bg-*` Tailwind class on the same element.** Inline styles have higher CSS specificity than class-based pseudo-selectors — the hover class will always lose.

**The fix:** Either move the default background to a `bg-[var(--X)]` Tailwind class (so the hover class can override it), or use `onMouseEnter`/`onMouseLeave` JS handlers.

```tsx
// ❌ BROKEN — inline style wins over hover class
<Link style={{ backgroundColor: "var(--card)" }} className="hover:bg-[var(--accent)]">

// ✅ CORRECT — both in className
<Link className="bg-[var(--card)] hover:bg-[var(--accent)] transition-colors">

// ✅ ALSO CORRECT — JS handlers when inline style is unavoidable
onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--accent)"}
onMouseLeave={e => e.currentTarget.style.backgroundColor = ""}
```

---

### Spacing — No Double Padding

`DashboardShell` (`components/shared/dashboard-shell.tsx`) already applies `pt-14` to clear the fixed topbar (h-12). **Pages must NOT add their own top padding to compensate for the topbar.** Add only a small breathing gap if needed (`pt-2`).

```tsx
// ❌ WRONG — DashboardShell already has pt-14 → total 104px gap
<div className="pt-12 pb-8">

// ✅ CORRECT
<div className="pt-2 pb-8">
```

Do NOT use `max-w-* mx-auto` on the inner page container — this adds auto margins on wide screens. Use only `px-4 lg:px-6` for horizontal spacing.

---

### List Page Pattern

**File reference:** `components/jobs/job-list.tsx`

**Filter bar:**
```tsx
<div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap border-b" style={{ borderColor: "var(--border)" }}>
  {/* Search */}
  <div className="relative flex-1 min-w-[140px]">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
    <input className="w-full h-8 pl-8 pr-3 rounded-lg border text-sm focus:ring-2 transition-colors"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }} />
  </div>
  {/* Optional filters (AnimatePresence dropdown, right-0) */}
  {/* View toggle */}
  <div className="flex items-center gap-0.5 rounded-lg border p-0.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
    <button style={{ backgroundColor: viewMode === "list" ? "var(--accent)" : "transparent" }}>
      <LayoutList className="w-3.5 h-3.5" />
    </button>
    <button style={{ backgroundColor: viewMode === "grid" ? "var(--accent)" : "transparent" }}>
      <LayoutGrid className="w-3.5 h-3.5" />
    </button>
  </div>
</div>
```

**List row:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.18), ease: [0.16, 1, 0.3, 1] }}
  className="flex border-b"
  style={{ borderColor: "var(--border)", backgroundColor: hovered ? "var(--accent)" : "transparent",
    transition: "background-color 120ms cubic-bezier(0.4,0,0.2,1)" }}
  onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
>
  {/* Optional status bar (left edge, 3px→4px on hover) */}
  <div style={{ width: hovered ? 4 : 3, backgroundColor: barColor, transition: "width 120ms cubic-bezier(0.4,0,0.2,1)" }} />
  {/* Main link — takes remaining space */}
  <Link href={...} className="flex items-center gap-3 flex-1 px-4 py-3 min-w-0"> ... </Link>
  {/* Inline actions — OUTSIDE the Link, always visible */}
  <div className="flex items-center gap-1.5 pr-3 self-center flex-shrink-0">
    <Link href={`/edit`} className="w-8 h-8 flex items-center justify-center rounded-lg border bg-[var(--background)] hover:bg-[var(--accent)] transition-colors"
      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
      <Pencil className="w-3.5 h-3.5" />
    </Link>
    {/* Delete with inline confirm — see jobs/job-list.tsx */}
  </div>
</motion.div>
```

**Grid card:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.2), ease: [0.16, 1, 0.3, 1] }}
>
  <div className="flex flex-col rounded-xl border overflow-hidden"
    style={{ borderColor: "var(--border)", backgroundColor: hovered ? "var(--accent)" : "var(--card)",
      transition: "background-color 120ms cubic-bezier(0.4,0,0.2,1)" }}>
    {/* Optional top status/identity bar (h-1) */}
    <Link href={...} className="p-3 flex flex-col gap-2"> ... </Link>
    {/* Always-visible action bar at bottom */}
    <div className="flex items-center gap-1.5 px-3 pb-3 border-t pt-2" style={{ borderColor: "var(--border)" }}>
      {/* Edit link + Delete button with confirm */}
    </div>
  </div>
</motion.div>
```

**Empty state — no ghost skeleton background:**
```tsx
<div className="flex flex-col items-center justify-center py-20 px-8 gap-4 text-center">
  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
    <Icon className="w-6 h-6" style={{ color: "var(--primary)" }} />
  </div>
  <p className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>...</p>
  <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>...</p>
  {/* CTA button if !hasFilters */}
</div>
```

---

### Detail Page Pattern

**File reference:** `app/[locale]/(dashboard)/jobs/[id]/page.tsx`

**Topbar actions (Edit + Delete):**
```tsx
<Link href={`/edit`}
  className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium border bg-[var(--background)] hover:bg-[var(--accent)] transition-colors"
  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
  <Pencil className="w-3.5 h-3.5" /> Edit
</Link>
{/* DeleteButton: h-8 rounded-lg bg-[var(--background)] hover:bg-[var(--error-light)] — see job-detail-actions.tsx */}
```

**Card component (section blocks):**
```tsx
const CARD_ACCENTS = {
  blue: "oklch(0.55 0.15 240)", amber: "var(--amber-500)",
  purple: "oklch(0.55 0.12 290)", green: "oklch(0.52 0.14 145)",
}
function Card({ title, children, accent = "blue" }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      {/* Header: muted (gray) background */}
      <div className="px-4 py-2.5 border-b flex items-center gap-2.5"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CARD_ACCENTS[accent] }} />
        <p className="text-xs font-semibold uppercase tracking-wider"
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{title}</p>
      </div>
      {/* Body: pure white */}
      <div className="px-4 py-3" style={{ backgroundColor: "var(--card)" }}>{children}</div>
    </div>
  )
}
```

**Layout:**
- Outer: `pt-2 pb-8 overflow-x-hidden` — no max-width, just `px-4 lg:px-6`
- Two columns desktop: `grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4`
- Left: cards stacked (description → dates → notes → photos)
- Right: `lg:sticky lg:top-16 self-start` — status/actions panel, customer card, related docs

**Related docs section (quotes/invoices/jobs):**
```tsx
<div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
  <div className="px-3 py-2 border-b flex items-center justify-between"
    style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
    <p className="text-[11px] font-semibold uppercase tracking-wider"
      style={{ color: "var(--muted-foreground)" }}>{title}</p>
    <Link href={newHref}
      className="flex items-center gap-1 text-[11px] font-medium px-2 h-6 rounded-md bg-[var(--accent-light)] hover:bg-[var(--amber-200)] transition-colors"
      style={{ color: "var(--primary)" }}>
      <Plus className="w-3 h-3" /> {newLabel}
    </Link>
  </div>
  {/* Items: hover:bg-[var(--accent)] */}
</div>
```

---

## Phase 4 — Customers Pages

**Pages:** `app/[locale]/(dashboard)/customers/page.tsx`, `app/[locale]/(dashboard)/customers/[id]/page.tsx`, `app/[locale]/(dashboard)/customers/new/page.tsx`
**Inspiration:** Linear contacts, Stripe customer profiles, Notion database

### 4.1 Customers List Page

**Current:** List/card/table view, search, pagination.

**New:**

**Card view as default (not list):**
- Card view becomes the default on mobile. Each customer card: avatar (initials circle, amber background) top-left, name 15px 600 weight, phone 13px `var(--workshop-500)`, last-job date bottom-left, total billed bottom-right in JetBrains Mono.
- Card grid: 1 column mobile, 2 columns tablet, 3 columns desktop.
- Card hover: `translateY(-2px)` + `--shadow-md`. 120ms `--ease-snap`.
- "Skylder penge" (owes money) badge: small red pill top-right of card, amount in JetBrains Mono. Stripe does this for payment status.

**Alphabetical grouping:**
- Group customers by first letter. Each group: letter header `A`, `B`, etc. in 11px uppercase `var(--workshop-400)`, with a horizontal line extending to the right. This is the iOS contacts pattern — fast visual scanning.
- Only show groups in list view. Card view is ungrouped.

**Search behavior:**
- As user types, list items that don't match `opacity: 0.3 scale(0.98)`. Items that match stay full opacity. No re-render, no list update — CSS-only filtering on existing rendered elements. Instant feedback. Adam Argyle's CSS filter technique.

### 4.2 Customer Detail Page

**Current:** Customer info, list of related jobs/quotes/invoices.

**New:**

**Profile header:**
- Large (64px) avatar with initials. Name in 24px Bricolage Grotesque 700. Phone + email below as clickable links (`tel:`, `mailto:`).
- Quick action row below header: `[Ring op]  [Send email]  [Nyt job]  [Ny faktura]`. Icon buttons with labels. `var(--workshop-100)` background. These are the most common actions — Linear's quick-action bar pattern.

**Tabbed content:**
- Tabs: `Jobs (8)  Tilbud (3)  Fakturaer (12)  Notater`. Count badges in each tab.
- Active tab: bottom border `2px solid var(--amber-500)`. No background fill — Vercel's tab style.
- Tab content switches with `opacity: 0 → 1`, 100ms `--ease-snap`. No slide — that would feel slow.

**Financial summary bar:**
- Horizontal bar below profile header: `Samlet faktureret: 284.000 kr · Udestående: 12.800 kr · Betalt: 271.200 kr`.
- Numbers in JetBrains Mono. "Udestående" in red if >0.

**Notes tab:**
- Free-form text area, auto-saving. Markdown-lite rendering (bold `**text**`, bullets `-`). Not full Notion, but enough for trade notes like `"Har hund · Parkeringsproblem · Foretrækker SMS"`.

### 4.3 Customer Create / Edit Form

**Current:** Standard labeled form in a card.

**New:**

**Inline validation with real business logic:**
- CVR number field: on blur, call Danish CVR API (virk.dk) to auto-fill company name and address. Show a `"Henter virksomhedsdata..."` spinner on the field, then auto-populate adjacent fields. If not found, just leave fields empty — no error. This is the killer feature that makes the form feel smart.
- Phone field: auto-format Danish numbers as user types: `+45 XX XX XX XX`.
- Name field: first/last split on mobile (two inputs), single full-name input on desktop.

**Address autocomplete:**
- Address field: as user types, show dropdown with Danish address completions (DAWA API). Select an address to auto-fill postal code, city. 

---

## Phase 5 — Quotes Pages

**Pages:** `app/[locale]/(dashboard)/quotes/page.tsx`, `app/[locale]/(dashboard)/quotes/[id]/page.tsx`, `app/[locale]/q/[token]/page.tsx`
**Inspiration:** Stripe quotes, Notion document editor, PandaDoc

### 5.1 Quotes List Page

**Current:** Standard list with status badges.

**New:**
- Quote rows show: quote number (JetBrains Mono), customer name, total amount, status badge, expiry date.
- Expiry date: if within 3 days: `var(--amber-600)` text + clock icon. If expired: red strikethrough.
- Status badge redesign: not just a color pill. Icons inside badges: `⟳` for Udkast, `→` for Sendt, `✓` for Accepteret, `✗` for Afvist. This is Emil Kowalski's principle: motion and icons make states legible without reading.
- Quick-send action: hover a quote row → `Send tilbud →` button appears on right side (absolute positioned). Click sends without navigating to detail. Confirmation toast: `"Tilbud T-0042 sendt til Erik Hansen"`.

### 5.2 Quote Builder (Detail / Edit Page)

**Current:** Form with line items, discount, notes, send/preview controls.

**New:**

**Document-editor aesthetic (Notion-influenced):**
- The quote builder looks like a real document being edited, not a form. Header area is editable inline — click the customer name to change it, click the quote number to see history.
- Line items table: minimal borders, focus on content. Adding a line item: press `↵ Enter` at end of last row to append a new row (spreadsheet UX). Delete: `Backspace` on empty row removes it.
- Description cells: auto-growing textarea, no fixed height. Content determines height.
- Price cells: JetBrains Mono, right-aligned. Tab key moves focus through cells in order: description → qty → unit price → next row description.

**Live total panel:**
- Sticky right sidebar (desktop) or sticky bottom bar (mobile) showing: Subtotal, Moms (25%), Total. Updates live as user edits line items — no round-trip needed.
- Total amount: 24px JetBrains Mono. When it updates: `scale(1.05) → scale(1)` on the number, 150ms `--ease-spring`. Subtle pulse that says "this changed."

**Send flow:**
- Clicking "Send tilbud" opens a **command dialog** (not a page): `Cmd/Ctrl + Enter`. Dialog: email field (pre-filled from customer), short personal message textarea (optional), preview of email subject. Send button is the primary action. This is the Raycast launcher pattern applied to a workflow action.

### 5.3 Public Quote View (`/q/[token]`)

**Current:** Static view of quote with accept/reject buttons.

**New:**

**Immersive document experience:**
- No app chrome. White background, centered content, max-width 720px. Feels like receiving a premium proposal document.
- Company logo top-left, quote number + date top-right.
- Line items table: clean, no borders on cells. Alternating row `var(--workshop-50)` for readability.
- Total: prominent, bottom-right. `"I alt inkl. moms: 24.875,00 kr"` in 20px JetBrains Mono.

**Accept / Reject bar:**
- Sticky bottom bar (100% width, frosted glass): left side `"Gyldig til: 30. april 2026"`. Right side: `[Afvis]  [Acceptér tilbud →]`.
- Accept button: amber, full-weight. On click: **animated checkmark** draws in (stroke-dasharray trick), 400ms, then the bar transforms to a `"Tilbud accepteret ✓"` confirmation with green background. No page reload — purely CSS/state transition.
- Reject: ghost button, opens an optional reason textarea before confirming.

---

## Phase 6 — Invoices Pages

**Pages:** `app/[locale]/(dashboard)/invoices/page.tsx`, `app/[locale]/(dashboard)/invoices/[id]/page.tsx`, `app/[locale]/(dashboard)/invoices/new/page.tsx`
**Inspiration:** Stripe invoices, FreeAgent, Wave

### 6.1 Invoices List Page

**Current:** Standard list with status and amounts.

**New:**

**Financial-first layout:**
- Add a **summary bar at the top** of the list: `Udestående: 48.200 kr  ·  Forfaldent: 12.800 kr  ·  Betalt denne måned: 94.600 kr`. These are always-visible KPIs. Numbers in JetBrains Mono. Forfaldent in red.
- Each row: invoice number (Mono), customer, amount (Mono, right-aligned), due date, status.
- Due date column: color-coded. Overdue: `var(--status-overdue-bg)` row tint + red due date text. Due soon (3 days): amber due date. Paid: normal.
- **Bulk pay marking**: checkboxes left side. Select multiple → bulk action bar appears: `"Marker som betalt"`. Useful for end-of-month reconciliation.

### 6.2 Invoice Detail Page

**Current:** Invoice view with send/download/mark-paid actions.

**New:**

**Two-panel layout:**
- Left (60%): Invoice document preview — exactly what the PDF will look like. Not a form.
- Right (40%): Action panel. Status, payment timeline, action buttons.

**Payment timeline in action panel:**
- Vertical timeline showing: `Oprettet → Sendt → Set af kunde → Betaling forfalder → Betalt`. Each step: date + time. Completed steps: filled amber circle. Future steps: empty circle.
- If overdue: a red warning step inserted: `"Forfalden med X dage"` with `AlertTriangle` icon.

**"Marker som betalt" interaction:**
- Button in action panel. On click: don't just close/reload. Show an inline **amount + method form** (Betalingsmetode: Bankoverførsel / MobilePay / Kontant). Confirm → the timeline animates the last step as filled, the status badge transitions, a green `"Betalt ✓"` toast appears. All within the same view.

### 6.3 Invoice Create / Edit Form

**Current:** Large form with line items.

**New:**

**Same document-editor UX as Quote Builder** (Phase 5.2) — consistency between quotes and invoices is intentional. Users trained on quote building will instantly know invoice building.

**Key difference: "Opret fra tilbud" flow:**
- If creating from a quote, show a **"Importerer fra Tilbud T-0039"** banner at top with the quote items pre-filled. User can edit before saving. The banner has an `×` to dismiss (clears pre-fill, starts blank).
- This makes the quote→invoice flow feel like a first-class feature, not an afterthought.

---

## Phase 7 — Profile + Mobile Polish

**Pages:** `app/[locale]/(dashboard)/profile/page.tsx`, global mobile UX improvements
**Inspiration:** Vercel account settings, Linear preferences, iOS settings UX

### 7.1 Profile / Settings Page

**Current:** Company profile form with logo upload.

**New:**

**Settings sidebar layout:**
- Left rail: 200px. Sections: `"Virksomhed"  "Profil"  "Fakturering"  "Notifikationer"  "Plan & Betaling"`. Each section is a nav item. Active: amber left border (same sidebar pattern).
- Right: the settings content for selected section.
- On mobile: sections are horizontal scrollable chips at top, content below.

**Virksomhed section:**
- Logo upload: Drag-and-drop zone. On hover: amber dashed border. On drag-over: fills with `var(--amber-50)`. Drop: shows image preview immediately (URL.createObjectURL). Uploading: subtle progress ring around the preview.
- CVR field: same auto-fill behavior as customer form (Phase 4.3).
- Color picker for brand color: 8 preset swatches + custom hex input. Selected: amber ring around swatch. This brand color is used on public quote/invoice pages.

**Danger zone:**
- At the bottom, separated by a `--workshop-200` divider: `"Slet konto"` in `var(--destructive)`. Always visible — users need to trust they can leave. Clicking: two-step confirmation: first "Ja, slet" button, then a "Skriv SLET for at bekræfte" text input. This is the GitHub pattern.

### 7.2 Global Mobile Polish

**Applies across all pages.**

**Touch target audit:**
- Every interactive element: minimum `44px × 44px` touch target. Achieved via padding, not size changes. Use `min-h-[44px] flex items-center` pattern.
- Row taps in lists: full-width tap zone, including the whitespace.

**Pull-to-refresh:**
- Jobs and invoices list pages: implement pull-to-refresh using `touch-start`/`touch-move` events. Show a small amber spinner at top of content, 80px pull threshold. On release: trigger `router.refresh()`. This is the most-expected mobile interaction that no web app does well.

**Bottom sheet for actions:**
- Any action menu (the `⋮` 3-dot menus) on mobile opens as a **bottom sheet**, not a dropdown. Bottom sheet slides up from bottom with `--ease-smooth`, 240ms. Backdrop blurs and darkens. Actions are large tappable items, 52px each. Same actions as desktop dropdown — just a different affordance.

**Haptic feedback:**
- On status change, form submit success, invoice marked paid: trigger `navigator.vibrate(12)` — a subtle 12ms pulse. Only on success actions, never on errors (would feel punishing). This is the iOS haptics philosophy.

**Safe area handling:**
- All fixed bottom elements (bottom nav, FAB, bulk action bar, sticky CTA bars) apply `padding-bottom: max(16px, env(safe-area-inset-bottom))`. Test on iPhone 14+ notch.

---

## Implementation Notes for Each Phase

When implementing any phase, follow these rules in addition to the CLAUDE.md rules:

1. **CSS-first for simple interactions** — If it can be done with `:hover`, `:focus-visible`, or CSS transitions, do not use JavaScript.
2. **No new dependencies for animations** — Use `motion/react` (already installed) for JS animations. Use CSS transitions for micro-interactions.
3. **Match existing easing variables** — Add `--ease-spring`, `--ease-smooth`, `--ease-snap` to `globals.css` before Phase 1 begins.
4. **Test at 375px width** — Every layout change must be verified at iPhone SE width.
5. **Amber stays amber** — Never change `var(--primary)`. Brand color is sacred. Only refine how it's applied.
6. **Typography scale is fixed** — Don't add new font sizes. Work within the existing scale.
7. **i18n every string** — All new strings go into both `en.json` and `da.json` (da.json value = `""`). No hardcoded Danish strings in components.

---

*Last updated: Phase specification complete. Ready for implementation.*
