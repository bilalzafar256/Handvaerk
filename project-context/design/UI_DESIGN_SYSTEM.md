# UI Design System

**Source of truth:** `app/globals.css`  
**Tailwind:** v4 — CSS-first config, no `tailwind.config.js`  
**Components:** shadcn/ui built on Base UI primitives (`@base-ui/react`)

---

## Brand Palette (CSS Custom Properties)

All colors are defined as CSS variables in `:root` using **OKLCH color space** for perceptual uniformity.

### Primary: Electric Amber (CTAs, active states, brand)
```css
--amber-50  through --amber-900  (oklch scale)
--amber-500: oklch(0.720 0.195 58)   /* PRIMARY — use for buttons, active nav, ring */
--amber-600: oklch(0.640 0.180 55)   /* Hover state */
```

### Neutral: Obsidian Slate (text, borders, surfaces)
```css
--slate-50  through --slate-900  (oklch, hue 255)
--slate-900: oklch(0.090 0.004 255)  /* Primary text (light mode) */
--slate-50:  oklch(0.985 0.002 255)  /* Background (light mode) */
```

### Accent Palette (landing page / marketing only)
```css
--cobalt-50 through --cobalt-900   /* Nordic Blueprint blue-gray */
--birch: oklch(0.930 0.022 75)     /* Warm off-white */
--fog / --fog-deep                  /* Muted blue-gray */
--nordic-teal: oklch(0.680 0.120 185)
--fjord-blue:  oklch(0.520 0.130 250)
```

---

## Semantic Tokens

These map to palette values. **Always use semantic tokens in components, never raw palette values.**

### Text
```css
--text-primary:   var(--slate-900)   /* Main content */
--text-secondary: var(--slate-500)   /* Labels, secondary info */
--text-tertiary:  var(--slate-400)   /* Placeholders, hints */
--text-inverse:   var(--slate-50)    /* On dark backgrounds */
```

### Surfaces
```css
--surface:          oklch(1.00 0.000 0)         /* Pure white — elevated cards */
--surface-raised:   oklch(0.990 0.002 255)       /* Slightly elevated */
--background:       var(--slate-50)              /* Page background */
--background-subtle: var(--slate-100)            /* Subtle fills, empty states */
```

### Borders
```css
--border:        var(--slate-200)   /* Default border (light mode) */
--border-strong: var(--slate-300)   /* Emphasis border */
```

### Brand Accent
```css
--accent-brand:            var(--amber-500)               /* Amber for brand elements */
--accent-hover:            var(--amber-600)               /* Amber hover */
--accent-light:            var(--amber-100)               /* Light amber fill (badges) */
--accent-foreground-brand: oklch(0.10 0.005 52)           /* Text ON amber background */
--shadow-accent:           0 4px 16px oklch(0.720 0.195 58 / 0.40)
```

### Error / Success
```css
--error:         oklch(0.52 0.20 25)   /* Red */
--error-light:   oklch(0.94 0.05 25)   /* Red fill */
--success:       oklch(0.52 0.14 145)  /* Green */
--success-light: oklch(0.93 0.06 145)  /* Green fill */
```

---

## Status Colors

All job/invoice/quote statuses have three tokens: `bg`, `text`, `border`:

| Status | `bg` | `text` | `border` |
|---|---|---|---|
| `new` | `--status-new-bg` (teal) | `--status-new-text` | `--status-new-border` |
| `scheduled` | `--status-scheduled-bg` (blue) | `--status-scheduled-text` | `--status-scheduled-border` |
| `in_progress` | `--status-progress-bg` (amber-100) | `--status-progress-text` (amber-800) | `--status-progress-border` (amber-300) |
| `done` | `--status-done-bg` (purple) | `--status-done-text` | `--status-done-border` |
| `invoiced` | `--status-invoiced-bg` (gold) | `--status-invoiced-text` | `--status-invoiced-border` |
| `paid` | `--status-paid-bg` (green) | `--status-paid-text` | `--status-paid-border` |
| `overdue` | `--status-overdue-bg` (red-orange) | `--status-overdue-text` | `--status-overdue-border` |

**Usage pattern for a status badge:**
```tsx
<span style={{
  backgroundColor: `var(--status-${status}-bg)`,
  color: `var(--status-${status}-text)`,
  border: `1px solid var(--status-${status}-border)`,
}}>
  {statusLabel}
</span>
```

---

## Shadcn Semantic Overrides

Shadcn tokens are mapped to the design system in `:root`:

| Shadcn token | Maps to |
|---|---|
| `--primary` | `var(--amber-500)` |
| `--primary-foreground` | `oklch(0.10 0.005 52)` (near-black) |
| `--background` | `var(--slate-50)` |
| `--foreground` | `var(--slate-900)` |
| `--card` | `oklch(1.00 0.000 0)` (white) |
| `--muted` | `var(--slate-100)` |
| `--muted-foreground` | `var(--slate-400)` |
| `--accent` | `var(--slate-100)` ← **CRITICAL: `--accent` is NOT amber — it's a light gray** |
| `--accent-foreground` | `var(--slate-900)` |
| `--border` | `var(--slate-200)` |
| `--ring` | `var(--amber-500)` |
| `--destructive` | `oklch(0.52 0.20 25)` |
| `--radius` | `0.625rem` (10px) |

### ⚠ Critical: `--accent` vs `--primary`
`--accent` = `var(--slate-100)` — a LIGHT NEUTRAL GRAY. Used for hover backgrounds.  
`--primary` = `var(--amber-500)` — amber. Used for CTAs, active nav, focus rings.  
**Never use `var(--accent)` for call-to-action buttons.** Always use `var(--primary)`.

---

## Typography

| Variable | Font | Weights | Use |
|---|---|---|---|
| `--font-display` | Bricolage Grotesque | 400–800 | Page titles, headings, brand name |
| `--font-body` | DM Sans | 300–600 | All UI copy, labels, nav, buttons |
| `--font-mono` | JetBrains Mono | 400–600 | Numbers, prices, codes, timestamps |

**Applied via CSS `@theme inline`:** `--font-heading: var(--font-display)`, `--font-sans: var(--font-body)`.

**Usage:**
```tsx
// Page heading
<h1 style={{ fontFamily: "var(--font-display)" }}>Title</h1>

// Body text / UI labels
<p style={{ fontFamily: "var(--font-body)" }}>Label</p>

// Prices / numbers
<span style={{ fontFamily: "var(--font-mono)" }}>{formatDKK(total)}</span>
```

---

## Border Radius

```css
--radius: 0.625rem (10px)
--radius-sm:  calc(var(--radius) - 4px)   /* 6px */
--radius-md:  calc(var(--radius) - 2px)   /* 8px */
--radius-lg:  var(--radius)               /* 10px */
--radius-xl:  calc(var(--radius) + 4px)   /* 14px */
--radius-2xl: calc(var(--radius) * 1.8)   /* 18px */
--radius-3xl: calc(var(--radius) * 2.2)   /* 22px */
--radius-4xl: calc(var(--radius) * 2.6)   /* 26px */
```

Tailwind tokens: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, etc.  
In code: often written inline as `rounded-[--radius-sm]` or `className="rounded-lg"`.

---

## Shadows

```css
--shadow-xs: 0 1px 2px oklch(0.09 0.004 255 / 0.06)
--shadow-sm: 0 1px 3px oklch(0.09 0.004 255 / 0.10), 0 1px 2px oklch(0.09 0.004 255 / 0.06)
--shadow-md: 0 4px 6px oklch(0.09 0.004 255 / 0.08), 0 2px 4px oklch(0.09 0.004 255 / 0.05)
--shadow-lg: 0 10px 15px oklch(0.09 0.004 255 / 0.10), 0 4px 6px oklch(0.09 0.004 255 / 0.05)
--shadow-accent: 0 4px 16px oklch(0.720 0.195 58 / 0.40)   /* amber glow for primary CTAs */
--shadow-cobalt-lg: 0 12px 32px oklch(0.08 0.035 245 / 0.6), 0 4px 8px oklch(0.08 0.035 245 / 0.3)
```

**Usage:** `style={{ boxShadow: "var(--shadow-md)" }}` or `className="shadow-md"` (Tailwind bridges via `@theme inline` if configured).

---

## Motion Tokens

```css
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  /* Bouncy — element entrances */
--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1)       /* Smooth decelerate — sidebar, sheets */
--ease-snap:   cubic-bezier(0.4, 0, 0.2, 1)         /* Material snap — tabs, toggles */
--duration-fast: 120ms    /* Hover states, color changes */
--duration-base: 180ms    /* State transitions */
--duration-slow: 260ms    /* Enter/exit animations */
```

---

## Dark Mode

Activated by `.dark` class on `<html>` (via `next-themes`). All semantic tokens are re-declared:

- `--background`: `var(--slate-900)` (near-black)
- `--card`: `var(--slate-800)`
- `--foreground`: `var(--slate-50)`
- `--border`: `oklch(1 0 0 / 9%)` (translucent white)
- `--primary`: `var(--amber-500)` — unchanged
- Status colors: translucent overlays on dark backgrounds (e.g., `oklch(0.32 0.10 200 / 25%)`)
- Shadows: opacity-based (`oklch(0 0 0 / 0.30)`)

---

## Component Library

**Base:** `@base-ui/react` — headless, accessible primitives. shadcn/ui uses these as base.  
**Components available:** `components/ui/` — avatar, badge, button, card, dialog, dropdown-menu, form, input, label, select, separator, sheet, skeleton, sonner, tabs

### Button
```tsx
<Button variant="default" size="default">Save</Button>
```
Variants: `default` (amber), `outline`, `secondary`, `ghost`, `destructive`, `link`  
Sizes: `xs`, `sm`, `default`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`

### Badge
```tsx
<Badge variant="default">Active</Badge>
```
Variants: `default` (amber), `secondary`, `destructive`, `outline`, `ghost`, `link`

### Sheet
Used for the Notifications panel (right-side drawer): `<Sheet>`, `<SheetContent side="right">`

---

## Input Styling Pattern

Raw `<input>` and `<select>` elements throughout the codebase (not using shadcn Input for all cases) follow this pattern from `components/shared/line-item-builder.tsx`:

```tsx
const inputCls = `
  h-10 px-3
  bg-[--surface] text-[--text-primary]
  border border-[--border]
  rounded-[--radius-sm]
  placeholder:text-[--text-tertiary]
  focus:outline-none focus:border-[--primary]
  focus:ring-1 focus:ring-[--primary]/20
  transition-colors duration-150 text-sm w-full
`
```

---

## Sidebar Tokens

```css
--sidebar:               oklch(0.975 0.003 255)   /* Light mode sidebar bg */
--sidebar-foreground:    var(--slate-900)
--sidebar-border:        var(--slate-200)
--sidebar-primary:       var(--amber-500)
--sidebar-accent:        var(--amber-50)           /* Active nav item bg */
--sidebar-accent-foreground: var(--slate-900)
--sidebar-ring:          var(--amber-500)
```

Active nav item: `backgroundColor: "oklch(0.720 0.195 58 / 12%)"`, `color: "var(--amber-600)"`  
Active indicator: 3px amber pill on left edge

---

## How to Build a New Component

**Checklist:**

1. Use `var(--font-body)` for all text, `var(--font-display)` for titles, `var(--font-mono)` for numbers
2. Use `var(--text-primary)` / `--text-secondary` / `--text-tertiary` for text colors
3. Use `var(--border)` for all borders
4. Use `var(--surface)` for elevated cards, `var(--background)` for page-level backgrounds
5. Use `var(--primary)` for CTAs — NEVER `var(--accent)`
6. Use `var(--shadow-sm)` / `--shadow-md` for depth
7. Use status tokens `--status-[status]-bg/text/border` for any status badge
8. Wrap hover/focus states in inline `onMouseEnter`/`onMouseLeave` with `style` prop (pattern from sidebar)
9. Use `border-[--radius-sm]` (6px) for inputs, `rounded-[--radius-md]` (8px) for cards, `rounded-lg` for larger containers
10. For animations: import from `motion/react`, use `--ease-smooth` or `--ease-spring` timing
11. Money values: always `formatDKK(value)` from `@/lib/utils/currency`
12. Spacing: standard Tailwind classes (`px-4`, `py-3`, `gap-2`, etc.) — no custom spacing scale

---

→ Related: `codebase/FRONTEND.md`, `INDEX.md`
