# SKILL: Frontend Design System — Håndværk Pro
> Product-specific design system. All UI decisions are made here.
> Claude Code must read this file before building any page, component, or UI element.
> Sources: Google Fonts, Tailwind CSS v4, shadcn/ui theming, Motion docs

---

## DESIGN PHILOSOPHY

**The aesthetic direction: Precision Tool.**

Klaus respects tools that are built to last — Bosch drills, Wera screwdrivers, Knipex pliers. They are serious, purposeful, zero ornamentation without function. They feel trustworthy in the hand. That is what this UI must feel like.

Not a startup app. Not social media. Not a dashboard for a tech company.
A **precision instrument** for running a trade business.

References:
- Danish design tradition (HAY, Fritz Hansen) — clean, functional, nothing without purpose
- Fluke multimeters — amber accent on serious dark body, high-contrast readability
- Bosch Professional tools — the orange of tool handles is our accent color
- Garmin devices — dense, readable, purposeful information display

**One sentence:** *Clean, warm, industrial pracision — built for dirty hands and bright sunlight.*

---

## NEVER USE (hard bans)

```
❌ Inter font
❌ Roboto font
❌ Purple gradients on white
❌ Generic "SaaS dashboard blue" (#3B82F6 as primary)
❌ Cookie-cutter card layouts with rounded corners everywhere
❌ Decorative gradients that serve no function
❌ Animations that delay access to information
❌ Cold gray color palette (use warm grays only)
❌ Comic/playful iconography — this is a professional tool
❌ Dark backgrounds on forms (light mode is primary for outdoor use)
```

---

## FONTS

### Loading (Next.js — in `app/layout.tsx`)

```typescript
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from "next/font/google"

// Display font — headings, dashboard numbers, brand name
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

// Body font — all body text, labels, UI copy
export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  display: "swap",
})

// Mono font — invoice numbers, amounts, job numbers, CVR numbers
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
})

// Apply all three to <html> element
// <html className={`${bricolage.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
```

### Font Roles

| Font | Variable | Use case |
|---|---|---|
| **Bricolage Grotesque** | `--font-display` | Page titles, dashboard stat numbers, brand name, section headers |
| **DM Sans** | `--font-body` | All body text, form labels, button text, navigation, descriptions |
| **JetBrains Mono** | `--font-mono` | Invoice numbers (#1042), money amounts (82.450 kr.), CVR numbers, job numbers |

### Why these fonts
- **Bricolage Grotesque** — variable font (200–800 weight range), slightly condensed at large sizes making it perfect for big dashboard numbers. Has genuine craft character — the name itself references DIY making. Distinctive without being loud.
- **DM Sans** — designed for small screen readability, warm geometric construction, excellent at 14–16px on mobile. Feels approachable but professional.
- **JetBrains Mono** — makes financial numbers look precise and trustworthy. The monospace spacing makes columns of numbers align perfectly. Critical for invoice line items.

### Typography Scale (Tailwind classes mapped to variables)

```css
/* globals.css */
:root {
  --font-display: "Bricolage Grotesque", system-ui;
  --font-body: "DM Sans", system-ui;
  --font-mono: "JetBrains Mono", monospace;
}

/* Usage in Tailwind v4 */
/* font-display → headings, big numbers */
/* font-body → default (set as base font) */
/* font-mono → amounts, IDs */
```

```typescript
// tailwind.config (v4 — in CSS)
// @theme {
//   --font-family-sans: var(--font-body);
//   --font-family-display: var(--font-display);
//   --font-family-mono: var(--font-mono);
// }
```

### Type Sizes

| Token | Size | Weight | Font | Usage |
|---|---|---|---|---|
| `text-stat` | 40px / 2.5rem | 700 | Display | Dashboard big numbers (82.450 kr.) |
| `text-hero` | 28px / 1.75rem | 700 | Display | Page titles |
| `text-title` | 22px / 1.375rem | 600 | Display | Section headers, card titles |
| `text-subtitle` | 18px / 1.125rem | 500 | Body | Subheadings |
| `text-base` | 16px / 1rem | 400 | Body | Body text, descriptions |
| `text-sm` | 14px / 0.875rem | 400 | Body | Labels, secondary info |
| `text-xs` | 12px / 0.75rem | 500 | Body | Captions, metadata (UPPERCASE + tracked) |
| `text-amount` | 20px / 1.25rem | 600 | Mono | Invoice totals, line item amounts |
| `text-ref` | 14px / 0.875rem | 400 | Mono | Invoice numbers, job numbers, CVR |

**Never go below 12px for any visible text.**

---

## COLOR SYSTEM

### Design Direction
Primary palette is **warm** — not cold blue-gray tech. Think:
- Workshop concrete with warm lighting
- The amber of a Bosch tool handle
- Stone, not slate

### Full Color Palette (CSS Variables)

```css
/* globals.css — Håndværk Pro Design Tokens */

:root {
  /* ─────────────────────────────────────
     BRAND COLORS
  ───────────────────────────────────── */

  /* Craftsman Amber — primary accent */
  /* The orange of Bosch tool handles, Danish safety equipment */
  --amber-50:  oklch(0.97 0.03 72);
  --amber-100: oklch(0.94 0.06 72);
  --amber-200: oklch(0.88 0.10 68);
  --amber-300: oklch(0.82 0.14 66);
  --amber-400: oklch(0.76 0.17 64);
  --amber-500: oklch(0.70 0.19 62);   /* Primary brand accent */
  --amber-600: oklch(0.62 0.18 58);
  --amber-700: oklch(0.52 0.16 55);
  --amber-800: oklch(0.40 0.12 52);
  --amber-900: oklch(0.28 0.08 50);

  /* Workshop — near-black with warmth */
  --workshop-50:  oklch(0.98 0.004 75);
  --workshop-100: oklch(0.95 0.006 75);
  --workshop-200: oklch(0.88 0.008 70);
  --workshop-300: oklch(0.75 0.010 68);
  --workshop-400: oklch(0.58 0.012 65);
  --workshop-500: oklch(0.42 0.012 62);
  --workshop-600: oklch(0.30 0.010 60);
  --workshop-700: oklch(0.22 0.008 58);
  --workshop-800: oklch(0.16 0.006 55);
  --workshop-900: oklch(0.10 0.005 50);  /* Primary text */

  /* ─────────────────────────────────────
     SEMANTIC — LIGHT MODE (default)
  ───────────────────────────────────── */

  --background:         var(--workshop-50);    /* Warm near-white */
  --background-subtle:  oklch(0.96 0.006 75);  /* Slightly tinted surfaces */
  --surface:            oklch(1.00 0.000 0);   /* Card / form backgrounds */
  --surface-raised:     oklch(0.99 0.003 75);  /* Elevated surfaces */
  --border:             oklch(0.88 0.008 70);  /* Warm divider lines */
  --border-strong:      oklch(0.78 0.010 68);  /* Emphasized borders */

  --text-primary:       var(--workshop-900);   /* Main body text */
  --text-secondary:     var(--workshop-500);   /* Supporting text */
  --text-tertiary:      var(--workshop-400);   /* Placeholder, disabled */
  --text-inverse:       var(--workshop-50);    /* On dark backgrounds */

  --accent:             var(--amber-500);      /* Primary CTA, active states */
  --accent-hover:       var(--amber-600);      /* Hover state on accent */
  --accent-light:       var(--amber-100);      /* Accent tint backgrounds */
  --accent-foreground:  oklch(0.12 0.005 55);  /* Text ON amber button */

  /* ─────────────────────────────────────
     STATUS COLORS (job & invoice states)
  ───────────────────────────────────── */

  /* new — neutral stone */
  --status-new-bg:      oklch(0.93 0.005 70);
  --status-new-text:    oklch(0.40 0.010 65);
  --status-new-border:  oklch(0.82 0.008 68);

  /* scheduled — craft blue */
  --status-scheduled-bg:      oklch(0.93 0.04 240);
  --status-scheduled-text:    oklch(0.35 0.14 240);
  --status-scheduled-border:  oklch(0.82 0.08 240);

  /* in_progress — craftsman amber (brand color) */
  --status-progress-bg:      var(--amber-100);
  --status-progress-text:    var(--amber-800);
  --status-progress-border:  var(--amber-300);

  /* done — soft purple */
  --status-done-bg:      oklch(0.93 0.04 290);
  --status-done-text:    oklch(0.35 0.12 290);
  --status-done-border:  oklch(0.82 0.08 290);

  /* invoiced — warm orange */
  --status-invoiced-bg:      oklch(0.94 0.06 55);
  --status-invoiced-text:    oklch(0.38 0.14 48);
  --status-invoiced-border:  oklch(0.84 0.10 52);

  /* paid — workshop green */
  --status-paid-bg:      oklch(0.93 0.06 145);
  --status-paid-text:    oklch(0.32 0.14 145);
  --status-paid-border:  oklch(0.82 0.10 145);

  /* overdue — alert red */
  --status-overdue-bg:      oklch(0.94 0.05 25);
  --status-overdue-text:    oklch(0.38 0.18 25);
  --status-overdue-border:  oklch(0.84 0.12 25);

  /* ─────────────────────────────────────
     FUNCTIONAL COLORS
  ───────────────────────────────────── */

  --success:        oklch(0.52 0.14 145);
  --success-light:  oklch(0.93 0.06 145);
  --warning:        var(--amber-500);
  --warning-light:  var(--amber-100);
  --error:          oklch(0.52 0.20 25);
  --error-light:    oklch(0.94 0.05 25);
  --info:           oklch(0.52 0.14 240);
  --info-light:     oklch(0.93 0.04 240);

  /* ─────────────────────────────────────
     SHADOWS (warm-tinted — not cold blue)
  ───────────────────────────────────── */

  --shadow-xs:  0 1px 2px oklch(0.10 0.01 60 / 0.06);
  --shadow-sm:  0 1px 3px oklch(0.10 0.01 60 / 0.10), 0 1px 2px oklch(0.10 0.01 60 / 0.06);
  --shadow-md:  0 4px 6px oklch(0.10 0.01 60 / 0.07), 0 2px 4px oklch(0.10 0.01 60 / 0.06);
  --shadow-lg:  0 10px 15px oklch(0.10 0.01 60 / 0.10), 0 4px 6px oklch(0.10 0.01 60 / 0.05);
  --shadow-xl:  0 20px 25px oklch(0.10 0.01 60 / 0.10), 0 8px 10px oklch(0.10 0.01 60 / 0.04);

  /* Amber glow — for primary CTA buttons */
  --shadow-accent: 0 4px 14px oklch(0.70 0.19 62 / 0.35);

  /* ─────────────────────────────────────
     SPACING SCALE (4px base)
  ───────────────────────────────────── */

  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ─────────────────────────────────────
     BORDER RADIUS
  ───────────────────────────────────── */

  --radius-xs:   4px;   /* Badges, tags */
  --radius-sm:   6px;   /* Inputs, small elements */
  --radius-md:   10px;  /* Cards, buttons */
  --radius-lg:   16px;  /* Modal, sheet */
  --radius-xl:   24px;  /* Large cards */
  --radius-pill: 999px; /* Status badges, chips */
}

/* ─────────────────────────────────────
   DARK MODE
───────────────────────────────────── */
.dark {
  --background:         oklch(0.11 0.006 58);
  --background-subtle:  oklch(0.13 0.006 58);
  --surface:            oklch(0.15 0.007 60);
  --surface-raised:     oklch(0.18 0.007 60);
  --border:             oklch(0.22 0.008 60);
  --border-strong:      oklch(0.30 0.010 60);

  --text-primary:       oklch(0.96 0.004 75);
  --text-secondary:     oklch(0.65 0.010 70);
  --text-tertiary:      oklch(0.45 0.008 68);
  --text-inverse:       oklch(0.10 0.005 50);

  --accent:             var(--amber-400);
  --accent-hover:       var(--amber-300);
  --accent-light:       oklch(0.20 0.06 62);
  --accent-foreground:  oklch(0.10 0.005 50);

  --shadow-sm:  0 1px 3px oklch(0.05 0.005 50 / 0.40);
  --shadow-md:  0 4px 6px oklch(0.05 0.005 50 / 0.50);
  --shadow-lg:  0 10px 15px oklch(0.05 0.005 50 / 0.60);
  --shadow-accent: 0 4px 14px oklch(0.76 0.17 64 / 0.40);
}
```

---

## CSS VARIABLE RULES — READ BEFORE WRITING ANY BUTTON OR ICON

> **NEVER use `var(--accent)` or `var(--accent-foreground)` for CTAs or active states.**
>
> `--accent` is a shadcn/ui mapping → `workshop-100` (a light neutral for hover states).
> It will render as a washed-out near-white, not amber.
>
> Correct variables for amber:
>
> | Purpose | Variable |
> |---|---|
> | CTA button background | `var(--primary)` |
> | Text on CTA button | `var(--primary-foreground)` |
> | Icon / text active tint | `var(--primary)` |
> | Light amber tint background | `var(--accent-light)` |
> | Hover state on CTA | `var(--accent-hover)` |
> | Glow shadow on CTA | `var(--shadow-accent)` |
>
> **The one-line rule:** `--primary` = amber. Use it everywhere amber should appear. Never `--accent`.

---

## COMPONENT PATTERNS

### Cursor Rule

**All interactive elements must use `cursor-pointer`.** This applies to every `<button>`, `<a>`, and any `<div>`/`<span>` with an `onClick`. Never rely on browser defaults — always set it explicitly.

```tsx
// ✅ correct
<button className="cursor-pointer ...">Submit</button>
<a href="/jobs" className="cursor-pointer ...">Jobs</a>

// ❌ wrong — browser default on <button> is auto/default in some contexts
<button className="...">Submit</button>
```

---

### Primary Button
```tsx
// The main CTA — amber, with glow shadow, full-width on mobile
// ⚠️ Use var(--primary) NOT var(--accent) — see CSS VARIABLE RULES above
<button
  className="
    w-full h-12 px-6
    font-body font-medium text-base
    rounded-[--radius-md]
    cursor-pointer
    transition-all duration-200
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center gap-2
  "
  style={{
    backgroundColor: "var(--primary)",
    color: "var(--primary-foreground)",
    boxShadow: "var(--shadow-accent)",
  }}
>
  Create invoice
</button>
```

### Stat Card (Dashboard)
```tsx
// Large financial number display — uses display font + mono for amounts
<div className="
  bg-[--surface] rounded-[--radius-lg]
  p-5 shadow-[--shadow-sm]
  border border-[--border]
">
  <p className="font-body text-xs font-medium uppercase tracking-wider text-[--text-tertiary]">
    Outstanding
  </p>
  <p className="font-display text-[40px] font-bold text-[--text-primary] mt-1 leading-none">
    <span className="font-mono">82.450</span>
    <span className="text-[22px] font-display ml-1 text-[--text-secondary]">kr.</span>
  </p>
  <p className="font-body text-sm text-[--text-secondary] mt-1">
    3 unpaid invoices
  </p>
</div>
```

### Status Badge
```tsx
// Pill badge using status CSS variables
const statusConfig = {
  new:         { bg: "--status-new-bg",        text: "--status-new-text",        border: "--status-new-border",        label: "New" },
  scheduled:   { bg: "--status-scheduled-bg",  text: "--status-scheduled-text",  border: "--status-scheduled-border",  label: "Scheduled" },
  in_progress: { bg: "--status-progress-bg",   text: "--status-progress-text",   border: "--status-progress-border",   label: "In progress" },
  done:        { bg: "--status-done-bg",        text: "--status-done-text",       border: "--status-done-border",       label: "Done" },
  invoiced:    { bg: "--status-invoiced-bg",    text: "--status-invoiced-text",   border: "--status-invoiced-border",   label: "Invoiced" },
  paid:        { bg: "--status-paid-bg",        text: "--status-paid-text",       border: "--status-paid-border",       label: "Paid" },
  overdue:     { bg: "--status-overdue-bg",     text: "--status-overdue-text",    border: "--status-overdue-border",    label: "Overdue" },
}

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const s = statusConfig[status]
  return (
    <span
      className="inline-flex items-center px-3 h-6 rounded-[--radius-pill] text-xs font-medium font-body border"
      style={{
        backgroundColor: `var(${s.bg})`,
        color: `var(${s.text})`,
        borderColor: `var(${s.border})`,
      }}
    >
      {s.label}
    </span>
  )
}
```

### Form Input
```tsx
// Warm, clear, high-contrast — readable in outdoor lighting
<input className="
  w-full h-12 px-4
  bg-[--surface] text-[--text-primary]
  font-body text-base
  border border-[--border]
  rounded-[--radius-sm]
  placeholder:text-[--text-tertiary]
  focus:outline-none focus:border-[--accent]
  focus:ring-2 focus:ring-[--accent]/20
  transition-colors duration-150
" />
```

### Invoice Amount Display
```tsx
// Money amounts use JetBrains Mono for precision feel
export function Amount({ value, size = "base" }: { value: number; size?: "sm" | "base" | "lg" }) {
  const formatted = new Intl.NumberFormat("da-DK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

  const sizes = {
    sm:   "text-sm font-medium",
    base: "text-[18px] font-semibold",
    lg:   "text-[24px] font-bold",
  }

  return (
    <span className={`font-mono text-[--text-primary] ${sizes[size]}`}>
      {formatted} <span className="text-[--text-secondary] font-normal">kr.</span>
    </span>
  )
}
```

---

## NAVIGATION

### Bottom Nav (Mobile — primary)
```tsx
// 4 items max, amber active state, 48px minimum tap target
const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/overview" },
  { icon: Briefcase,       label: "Jobs",     href: "/jobs" },
  { icon: FileText,        label: "Invoices", href: "/invoices" },
  { icon: Menu,            label: "More",     href: "/menu" },
]
// Active: icon filled + amber color + amber dot indicator
// Inactive: icon outline + --text-tertiary
```

### Page Header Pattern
```tsx
<header className="
  sticky top-0 z-40
  bg-[--background]/90 backdrop-blur-md
  border-b border-[--border]
  px-4 h-14
  flex items-center justify-between
">
  <h1 className="font-display text-[18px] font-semibold text-[--text-primary]">
    {title}
  </h1>
  {action}
</header>
```

---

## ANIMATION PATTERNS (Motion v11)

### Page Entry — staggered reveal
```tsx
import { motion } from "motion/react"

// Wrap list items in this for staggered entry
export function FadeUp({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
```

### Status Badge Color Transition
```tsx
// When job status changes, the badge color animates
<motion.span
  key={status}   // key change triggers re-animation
  initial={{ scale: 0.85, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  <StatusBadge status={status} />
</motion.span>
```

### Card Press Feedback (mobile)
```tsx
<motion.div
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.1 }}
>
  {/* Job card, customer card, etc. */}
</motion.div>
```

### Rule: animation budget
- Page load entry: one staggered reveal (max 400ms total including all items)
- Status changes: max 200ms
- Button press: max 100ms
- No animations on: loading skeletons, form inputs, error messages
- Honor `prefers-reduced-motion`: wrap all Motion components with a check

```tsx
// hooks/use-reduced-motion.ts
export function useReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
// If true: pass transition={{ duration: 0 }} to all Motion components
```

---

## EMPTY STATES

Every empty state has: an icon, a message, and one CTA.

```tsx
export function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-4 text-center">
      <div className="w-14 h-14 rounded-[--radius-xl] bg-[--accent-light] flex items-center justify-center">
        <Icon className="w-7 h-7 text-[--accent]" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="font-display text-[17px] font-semibold text-[--text-primary]">{title}</p>
        <p className="font-body text-sm text-[--text-secondary] max-w-[240px]">{description}</p>
      </div>
      {action && (
        <button onClick={onAction} className="/* primary button styles */">
          {action}
        </button>
      )}
    </div>
  )
}
```

---

## TIER GATE PATTERN

```tsx
// Non-aggressive, never blocks viewing — only blocks creation
export function TierGate({ requiredTier, children, fallback }) {
  const { tier } = useTier()
  if (tier === requiredTier || tier === "hold") return children

  return fallback ?? (
    <div className="
      rounded-[--radius-lg] border border-dashed border-[--amber-300]
      bg-[--amber-50] p-6
      flex flex-col items-center gap-3 text-center
    ">
      <Lock className="w-5 h-5 text-[--amber-600]" />
      <p className="font-body text-sm font-medium text-[--amber-800]">
        Available on Solo plan
      </p>
      <p className="font-body text-xs text-[--amber-700]">
        Upgrade when you're ready — payments via MobilePay coming soon.
      </p>
    </div>
  )
}
```

---

## INVOICE PDF DESIGN TOKENS

The PDF must match the app's visual identity. `@react-pdf/renderer` uses inline styles.

```typescript
// components/pdf/design-tokens.ts
export const pdfTokens = {
  colors: {
    primary:      "#1A1208",   // --workshop-900 converted to hex
    secondary:    "#6B5F4A",   // --workshop-500
    accent:       "#C87A1A",   // --amber-500
    border:       "#DDD5C8",   // --border
    background:   "#FDFCFA",   // --background
    muted:        "#F5F2ED",   // --background-subtle
  },
  fonts: {
    // PDFs need embedded fonts — use Helvetica as fallback
    // Register custom fonts if DM Sans is critical
    heading:  "Helvetica-Bold",
    body:     "Helvetica",
    mono:     "Courier",       // For invoice numbers, amounts in PDF
  },
  spacing: {
    page:    { paddingTop: 48, paddingBottom: 48, paddingLeft: 56, paddingRight: 56 },
    section: 24,
    row:     8,
  },
  fontSize: {
    title:   22,
    heading: 14,
    body:    10,
    small:   8,
    amount:  11,
  },
}
```

---

## SHADCN THEME OVERRIDE

Map shadcn's CSS variables to our design tokens in `globals.css`:

```css
/* Map shadcn variables to our design system */
:root {
  --background: var(--workshop-50);
  --foreground: var(--workshop-900);
  --card: oklch(1.00 0.000 0);
  --card-foreground: var(--workshop-900);
  --primary: var(--amber-500);
  --primary-foreground: oklch(0.12 0.005 55);
  --secondary: var(--workshop-100);
  --secondary-foreground: var(--workshop-700);
  --muted: var(--workshop-100);
  --muted-foreground: var(--workshop-400);
  --accent: var(--workshop-100);
  --accent-foreground: var(--workshop-900);
  --destructive: oklch(0.52 0.20 25);
  --border: var(--workshop-200);
  --input: var(--workshop-200);
  --ring: var(--amber-500);
  --radius: 0.625rem;  /* --radius-md */
}
```

---

## QUICK REFERENCE — DO THIS

```
✅ Warm grays, never cold blue-gray
✅ Amber for all interactive/active states
✅ JetBrains Mono for every number, amount, reference ID
✅ Bricolage Grotesque for all headings and big numbers
✅ DM Sans for all body, labels, buttons
✅ 48px minimum tap targets
✅ Full-width primary CTA on mobile
✅ Staggered entry animations on list pages (max 400ms)
✅ Press feedback (scale 0.98) on all tappable cards
✅ Status badge color transitions (200ms)
✅ Warm-tinted shadows (no cold blue box-shadows)
✅ Amber dot/border for active nav item
✅ oklch() color space throughout (perceptually uniform)
✅ cursor-pointer on ALL buttons, links, and clickable elements

❌ NEVER var(--accent) for CTA backgrounds or active icon color → use var(--primary)
❌ NEVER var(--accent-foreground) for text on CTA → use var(--primary-foreground)
```