# Frontend

## Route Structure

All authenticated routes live under `app/[locale]/`. The locale segment is always `en` or `da`.

```
app/
├── layout.tsx                          Root layout — passthrough (no providers)
├── [locale]/
│   ├── layout.tsx                      Locale layout: ClerkProvider + NextIntlClientProvider + fonts + Toaster
│   ├── page.tsx                        Root redirect (→ /overview) [INFERRED]
│   ├── (auth)/
│   │   ├── layout.tsx                  No sidebar, no shell
│   │   ├── sign-in/[[...rest]]/page.tsx
│   │   └── sign-up/[[...rest]]/page.tsx
│   ├── (onboarding)/
│   │   ├── layout.tsx
│   │   └── profile/setup/page.tsx      Company profile form (gated: redirected here if companyName is null)
│   ├── (dashboard)/
│   │   ├── layout.tsx                  Auth guard + profile gate + Sidebar + DashboardShell
│   │   ├── overview/page.tsx
│   │   ├── jobs/
│   │   │   ├── page.tsx                Jobs list
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx           Job detail
│   │   │   ├── [id]/edit/page.tsx
│   │   │   ├── record/page.tsx         AI recording entry point
│   │   │   └── record/[id]/page.tsx    AI extraction review (polls for status)
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── quotes/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── calendar/page.tsx           Calendar — jobs/invoices/quotes (month/week/day/agenda/timeline views)
│   │   ├── time-tracking/page.tsx      Time tracking — 3-zone shell (StatsSidebar + TimerHero + WeekBars + DayView + UnbilledPanel)
│   │   ├── pricebook/page.tsx          Flat-rate pricebook catalog (CRUD, filters, favourites)
│   │   └── profile/page.tsx
│   └── q/[token]/page.tsx              Public shareable quote view (no auth)
├── api/                                API routes (see BACKEND.md)
└── docs/                               Internal docs viewer
```

---

## Layout Hierarchy

```
RootLayout (app/layout.tsx)
  └── LocaleLayout (app/[locale]/layout.tsx)
        ├── ClerkProvider
        ├── NextIntlClientProvider
        ├── AnalyticsProvider (PostHog)
        ├── Toaster (sonner, top-center)
        └── Vercel Analytics
              ├── (auth) layouts — no chrome
              ├── (onboarding) layouts — no sidebar
              └── (dashboard)/layout.tsx
                    ├── auth() → redirect to /sign-in
                    ├── getDbUser() → redirect to /profile/setup if no companyName
                    ├── <Sidebar />
                    └── <DashboardShell>
                          {children}
                        </DashboardShell>
```

---

## Fonts

Loaded in `app/[locale]/layout.tsx` via `next/font/google`:

| Font | CSS Variable | Usage |
|---|---|---|
| Bricolage Grotesque | `--font-display` | Headings, brand name, page titles |
| DM Sans | `--font-body` | All body text, labels, UI copy |
| JetBrains Mono | `--font-mono` | Numbers, prices, codes, timestamps |

**Note:** `app/layout.tsx` also imports Geist into `--font-sans` but LocaleLayout uses the three above — the root layout is effectively a passthrough.

---

## Navigation Structure

### Desktop (≥md)
- `components/shared/sidebar.tsx` — fixed left sidebar, collapsible (64px icon-only ↔ 240px expanded)
- Width controlled by Zustand `sidebarOpen` state
- `components/shared/topbar.tsx` — fixed top bar, left offset tracks sidebar width
- `components/shared/dashboard-shell.tsx` — `<main>` with `marginLeft` matching sidebar width

### Mobile (<md)
- Sidebar slides in as overlay (mobile) with dimmed backdrop
- Bottom navigation: `components/shared/bottom-nav.tsx` — Overview, Jobs, Invoices, Profile

### Nav Items
**Sidebar:** Overview, Jobs, Customers, Quotes, Invoices, Calendar, Time Tracking, Pricebook | Profile (settings section)  
**Bottom nav:** Overview, Jobs, Invoices, Profile

---

## State Management

**Zustand store:** `stores/ui-store.ts`  
Persisted to localStorage as `"handvaerk-ui"`:

| State key | Type | Purpose |
|---|---|---|
| `activeModal` | `"createJob" \| "createCustomer" \| "createInvoice" \| null` | Global modal state |
| `sidebarOpen` | boolean | Desktop sidebar open/closed — persisted |
| `viewPreferences` | `Record<string, ViewMode>` | Per-route list/grid toggle — persisted |

**Ephemeral state (not persisted):** `activeModal`  
**React Hook Form + Zod** for all forms — no global form state in Zustand

---

## Component Organization

```
components/
├── ui/           shadcn/ui primitives (button, card, dialog, badge, etc.)
├── shared/       Cross-feature layout components
├── forms/        One file per entity (customer-form, job-form, quote-form, invoice-form, company-profile-form, logo-upload)
├── dashboard/    Overview page widgets (stat-cards, activity-feed, critical-zone, today-jobs)
├── jobs/         Job-specific (job-list, job-detail-actions, photo-upload, status-changer, inline-notes)
├── customers/    Customer-specific (customer-list, customer-detail-actions)
├── quotes/       Quote-specific (quote-list, quote-detail, public-quote-view)
├── invoices/     Invoice-specific (invoice-list, invoice-detail)
├── ai/           AI recording flow (job-recording-flow, voice-recorder, audio-file-upload, record-tabs, recording-status-view)
├── pdf/          PDF templates for @react-pdf/renderer (invoice-pdf, quote-pdf)
├── notifications/ Notification bell + sheet
├── profile/      Profile sections (bank-accounts-section, google-review-section)
├── calendar/     Calendar feature (calendar-shell, calendar-filters, timeline-view, event-chip, event-popover, unscheduled-panel, types, rbc.css)
├── time-tracking/ Time tracking feature — shell layout: time-tracking-shell (server), timer-hero, week-bars, stats-sidebar (desktop left 200px), unbilled-panel (desktop right 220px), day-view, month-calendar, clock-panel, time-log-panel, time-entry-list, manual-entry-form, add-to-document-modal
└── pricebook/    Pricebook catalog (pricebook-list)
```

---

## How Pages Are Built

All dashboard pages follow this pattern:
1. `page.tsx` is an **async Server Component** — fetches data server-side
2. Passes data as props to Client Components
3. Mutations happen via Server Actions (no fetch() calls from components)
4. `revalidatePath()` is called inside Server Actions to refresh page data

```tsx
// Typical page pattern
export default async function JobsPage() {
  const user = await getDbUser()  // server-side auth
  const jobs = await getJobsForUser(user.id)  // server query
  return <JobList jobs={jobs} />  // client component
}
```

---

## i18n

- `next-intl` with file-based routing via `i18n/routing.ts`
- Locales: `["en", "da"]` — default `"en"`
- Translation files: `messages/en.json` (populated), `messages/da.json` (all keys present, values `""`)
- Navigation: use `@/i18n/navigation` (not `next/navigation`) for `Link`, `useRouter`, `usePathname`
- Server-side: `getLocale()` from `next-intl/server`
- Client-side: `useTranslations("Namespace")` hook

**i18n namespaces in use:** `Sidebar`, `BottomNav` (seen in code — others are [UNKNOWN — needs manual fill])

---

## Animation System

**Library:** `motion/react` (Motion/Framer Motion v12)

Used in:
- `components/shared/sidebar.tsx` — sidebar width, nav label fade in/out with AnimatePresence
- `components/shared/sidebar.tsx` — mobile overlay fade

**Key patterns seen:**
```tsx
// Sidebar width animation
<motion.aside animate={{ width: sidebarOpen ? 240 : 64 }} transition={{ duration: 0.20, ease: [0.16, 1, 0.3, 1] }}>

// Label reveal
<AnimatePresence>
  {expanded && (
    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}>
      {label}
    </motion.span>
  )}
</AnimatePresence>
```

CSS easing variables (from `globals.css`):
- `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` — bouncy spring
- `--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1)` — smooth decelerate
- `--ease-snap: cubic-bezier(0.4, 0, 0.2, 1)` — Material-style snap

---

## Toast Notifications

**Library:** sonner  
Mounted in `app/[locale]/layout.tsx` as `<Toaster position="top-center" />`  
Usage: `toast.error("message")` or `toast.success("message")` — imported from `"sonner"` directly in components

---

## View Toggle

`components/shared/view-toggle.tsx` — renders a list/grid toggle.  
State stored in Zustand `viewPreferences[key]` — persisted across sessions.  
Used on list pages (jobs, customers, quotes, invoices).

---

→ Related: `design/UI_DESIGN_SYSTEM.md`, `codebase/BACKEND.md`, `codebase/SHARED.md`
