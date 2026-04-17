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

## Phase 1 — Landing Page

**Pages:** `app/[locale]/page.tsx`
**Inspiration:** Vercel.com hero, Linear.app marketing, Stripe homepage

### 1.1 Navigation Bar

**Current:** Fixed top nav with logo, nav links, CTA button. Functional but generic.

**New:**
- Add a **blur-behind glass** effect: `backdrop-filter: blur(12px) saturate(180%); background: oklch(0.10 0.005 50 / 75%)` — same technique Vercel uses on their site nav.
- Nav links get a subtle **underline-on-hover** that slides in from left to right (width: 0 → 100%, transition 180ms ease-out). No bold, no color change. Just the line.
- The CTA button ("Kom i gang") gets a **shimmer sweep** on hover: a `::before` pseudo-element with a white diagonal gradient, `translate(-100%) → translate(100%)` on hover in 400ms. Subtle. Paco Coursey used this on Cron.
- Add a **1px bottom border** that appears on scroll (IntersectionObserver on hero section exit). The border is `var(--amber-200)` at 40% opacity. Signals "you've left the hero."
- Collapse to **hamburger + sheet** below 768px (already exists, but re-animate: sheet slides in from right with `--ease-smooth`, 260ms).

### 1.2 Hero Section

**Current:** Dark background, logo, headline, subheadline, two buttons, animated background grid.

**New:**

**Typography overhaul:**
- Main headline: Bricolage Grotesque 800 weight, `clamp(36px, 6vw, 72px)`. Split into two lines. First line: white. Second line (the key value prop noun): `var(--amber-400)`. Example: `"Din forretning" / "på ét sted."` The amber word is the hook.
- Subheadline: DM Sans 400, `clamp(16px, 2vw, 20px)`, `var(--workshop-400)`. Max 2 lines. 60 characters max.
- Add a **word-by-word fade-up** on load: each word animates in with `translateY(8px) opacity(0) → translateY(0) opacity(1)`, staggered 40ms per word, `--ease-spring`. Total duration: ~600ms. Emil Kowalski's technique — makes the headline feel written, not loaded.

**CTA button redesign:**
- Primary button ("Prøv gratis"): Add a small pulsing dot to the left (like a live-indicator). `width: 6px; height: 6px; border-radius: 50%; background: var(--amber-400); animation: pulse 2s ease infinite`. This creates urgency without being aggressive.
- Secondary button: Ghost with `var(--workshop-600)` border, `var(--workshop-300)` text. On hover: border brightens to `var(--workshop-400)`.

**Background:**
- Replace the static grid with a **radial gradient spotlight** that follows the cursor at 25% speed (parallax effect). The spotlight is `radial-gradient(600px at var(--x) var(--y), oklch(0.70 0.19 62 / 8%), transparent 70%)`. This is the exact technique used on Vercel's homepage dark sections.
- Keep the grid, but make it `opacity: 0.04` instead of current. The spotlight makes it feel alive.
- Add **3 floating cards** at the bottom of the hero — small, frosted glass, showing real data: `"Tilbud #T-0042 · Accepteret"`, `"Faktura betalt · 12.800 kr"`, `"Job afsluttet · Frederiksberg"`. These cards appear with a staggered fade-up (400ms, 600ms, 800ms after page load). They animate with a very slow float: `translateY(0) → translateY(-6px) → translateY(0)`, 6s loop, each card offset by 2s.

### 1.3 Problem Section

**Current:** 3 cards in a row with icons and text.

**New:**
- Change layout to **horizontal timeline**: 3 "before" states connected by `→` arrows. Each item: icon top-left, 1-line bold problem label, 2-line description.
- On mobile: vertical stack with a left-border accent line connecting items (like Stripe's features section).
- Add a **micro-hover lift**: cards translate `translateY(-2px)` on hover, shadow goes from `--shadow-sm` to `--shadow-md`. 120ms `--ease-snap`.
- Numbers in top-right corner: `01`, `02`, `03` in `var(--workshop-700)` DM Mono 12px. Paco's aesthetic — quiet hierarchical signaling.

### 1.4 Product Demo Section (Workflow Timeline)

**Current:** Horizontal pill-steps showing job lifecycle. Animated on scroll.

**New:**
- Show a **live-looking job card** below the timeline steps. As user scrolls through each step, the job card "updates" — status badge changes, fields appear, amounts fill in. Uses IntersectionObserver on each step to trigger the card update. This transforms a static diagram into a product demo.
- The card is `320px` wide, positioned sticky right side on desktop, flowing below on mobile.
- Each status badge change: `opacity: 0 scale(0.9) → opacity: 1 scale(1)`, 180ms `--ease-spring`. The old badge fades out simultaneously.
- Add a **keyboard shortcut hint** in the corner: `↵ Enter to accept` when hovering the Accepteret state — signals power-user features to come.

### 1.5 Pricing Section

**Current:** 3 tiers with feature lists.

**New:**
- **Solo tier** (recommended) gets a `position: relative` card with a `::before` glow: `box-shadow: 0 0 40px oklch(0.70 0.19 62 / 25%)`. Softly glows amber. Not a badge — the card itself glows.
- Feature list items: add `✓` checkmarks using `var(--amber-400)` SVG icon (not emoji). The icon renders with a stroke-dasharray draw animation on first scroll-into-view: 240ms.
- Add a **"Ingen binding"** (no commitment) micro-label below the CTA buttons: 11px, `var(--workshop-500)`, letter-spacing: 0.05em. Small trust signal, big conversion impact.
- Price numbers: Use JetBrains Mono for the number itself, DM Sans for `/md`. This creates a deliberate typographic contrast — the number feels precise, financial.

### 1.6 Footer CTA

**Current:** Simple CTA with SVG pipeline graphic.

**New:**
- Full-bleed `var(--amber-500)` to `var(--amber-600)` gradient background. High contrast inversion: white headline, white button with `var(--amber-500)` text.
- The button is now **dark on amber**: `background: oklch(0.12 0.005 50); color: white`. This reversal signals "this is the moment."
- Headline: `"Begynd i dag. Første job gratis."` — short, direct, no softness.

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
