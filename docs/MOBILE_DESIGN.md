# Håndværk Pro — Mobile Design Principles
> Product knowledge file for Claude Code and designers.
> These are not suggestions. They are constraints derived from the target user.

---

## THE USER CONTEXT

Klaus uses this app:
- In his van between jobs
- On a job site with dirty or gloved hands
- At 9pm on his couch watching TV with one eye
- In poor lighting
- Often with low patience

Design for **all four scenarios simultaneously.**

---

## CORE CONSTRAINTS

### 1. Tap Target Minimum: 48×48px
All interactive elements (buttons, links, toggles, list items) must have a minimum tap area of 48×48px regardless of visual size. Small icons get invisible tap padding.

```css
/* Example: small icon button */
.icon-btn {
  min-width: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 2. One Primary Action Per Screen
Each screen has exactly one primary CTA. It is:
- The largest interactive element on screen
- Full-width on mobile
- Uses the primary brand color
- Always visible (sticky bottom bar if below the fold)

Secondary actions are smaller, lower contrast, or behind a "..." menu.

### 3. No Horizontal Scrolling — Ever
Content that doesn't fit must be:
- Truncated with `...` (with full view on tap)
- Wrapped to next line
- Scrolled vertically
- Never: scrolled horizontally

### 4. Auto-Save Everything
Users close apps mid-task constantly. Rules:
- Forms auto-save to Zustand store on every keystroke
- Drafts are persisted to DB (or localStorage if offline) every 30 seconds
- On return, the draft is restored without user doing anything
- Never lose a job note or invoice line item to an accidental close

Implementation pattern:
```typescript
// stores/job-store.ts
const useJobStore = create<JobStore>()(
  persist(
    (set) => ({
      draftJob: null,
      setDraftJob: (job) => set({ draftJob: job }),
      clearDraft: () => set({ draftJob: null }),
    }),
    { name: 'job-draft-storage' }
  )
)
```

### 5. Voice Input for Text Fields
Description fields on jobs, notes fields, quote descriptions — all must have a microphone button.

Uses Web Speech API (`SpeechRecognition`). Appends to existing text (does not replace).

```typescript
// hooks/use-voice-input.ts
export function useVoiceInput(onResult: (text: string) => void) {
  const start = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
    recognition.lang = 'da-DK'  // Danish by default, 'en-US' when in English mode
    recognition.onresult = (event) => {
      onResult(event.results[0][0].transcript)
    }
    recognition.start()
  }
  return { start }
}
```

### 6. Camera Always One Tap Away
Receipt photos, job site photos — never more than one tap from any job or expense screen.

On mobile, use `<input type="file" accept="image/*" capture="environment">` — this opens the camera directly on iOS and Android without requiring app permissions.

### 7. Offline-First for Critical Actions
When signal is lost on a job site:
- Creating/editing job notes: works offline, syncs when back online
- Creating draft invoices: works offline
- Viewing existing jobs and customers: works from cache

Use: Zustand persist + React Query's `staleTime` configuration.

```typescript
// In React Query setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes cache
      gcTime: 30 * 60 * 1000,       // 30 min garbage collection
      retry: 1,
      networkMode: 'offlineFirst',  // serve cache before refetching
    },
  },
})
```

---

## TYPOGRAPHY

### Number Display
Danish number format must be enforced everywhere:

```typescript
// lib/utils/currency.ts
export function formatDKK(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 2,
  }).format(amount)
  // Output: 1.234,56 kr.
}

export function formatDKKShort(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace('.', ',')} t. kr.`
  }
  return formatDKK(amount)
}
```

### Sizes
- **Dashboard numbers (large money amounts):** 32–48px, bold
- **List item primary text:** 16px
- **List item secondary text:** 14px
- **Labels:** 12px, uppercase, tracked
- **Body text:** 15–16px, 1.5 line-height

Never go below 12px for any visible text.

---

## STATUS INDICATORS

Job status must be instantly scannable via color:

```
new          → Gray badge
scheduled    → Blue badge
in_progress  → Yellow/Amber badge
done         → Purple badge
invoiced     → Orange badge
paid         → Green badge
overdue      → Red badge (invoices)
```

Status badges: pill shape, colored background, white text. Minimum 28px height.

---

## LOADING STATES

Every data-fetching screen needs a skeleton loader — not a spinner:

```tsx
// components/shared/loading-skeleton.tsx
// Skeleton matches the exact layout of the loaded content
// Prevents layout shift when data arrives
// Use shadcn/ui Skeleton component as base
```

Rules:
- No full-page spinners
- Skeletons must match the shape of real content
- Loading state triggers immediately — no 300ms delay before showing

---

## ERROR STATES

| Error type | Treatment |
|---|---|
| Network error | Toast: "No connection. Changes saved locally." |
| Validation error | Inline, below the specific field. Red, small text. |
| Server error (500) | Toast: "Something went wrong. Try again." + Sentry capture |
| Empty state | Illustrated empty state with a single CTA. Never just blank. |

Empty state example:
```tsx
// components/shared/empty-state.tsx
<div className="flex flex-col items-center justify-center py-16 gap-4">
  <Icon className="w-12 h-12 text-muted-foreground" />
  <p className="text-muted-foreground text-center">{message}</p>
  <Button onClick={onAction}>{actionLabel}</Button>
</div>
```

---

## NAVIGATION

### Mobile (primary usage)
- Bottom navigation bar: max 4 items
- Items: Overview, Jobs, Invoices, Menu (more)
- Active state: icon filled + label shown
- Inactive: icon outline only

### Desktop (secondary usage)
- Left sidebar: full labels
- Same 4 primary items + expanded secondary items
- Collapses on < 768px → bottom nav takes over

---

## FEEDBACK & MICRO-INTERACTIONS

### Toasts
- Success (green): "Invoice sent ✓"
- Error (red): "Failed to save"
- Info (neutral): "Reminder scheduled"
- Position: top-center on mobile (not bottom — thumb accidentally triggers)
- Duration: 3 seconds for success, 5 seconds for errors

### Button states
All buttons must have:
- Default state
- Hover state (desktop)
- Active/press state (scale down 2–3%)
- Loading state (spinner replaces icon, text grays out)
- Disabled state (50% opacity, no cursor change on mobile)

### Status change animation
When a job status changes:
- Badge color animates from old color → new color (300ms)
- Brief confirmation toast appears
- List item updates optimistically (before server confirms)

---

## TIER GATE UX

When a free-tier user hits a limit (e.g. tries to create 4th active job):

1. Action is blocked (API returns 403)
2. Modal appears — friendly, not aggressive:
   ```
   "You've reached the 3-job limit on the Free plan.
   Upgrade to Solo for unlimited jobs.
   [See plans]  [Maybe later]
   ```
3. "See plans" → Upgrade page (MobilePay billing — future)
4. "Maybe later" → dismisses, does not nag again for 7 days

Never block the user from viewing existing data. Only block creation of new records.

---

## PERFORMANCE TARGETS

| Metric | Target |
|---|---|
| Time to Interactive (mobile, 4G) | < 2.5 seconds |
| Largest Contentful Paint | < 1.5 seconds |
| Dashboard load (cached) | < 300ms |
| Invoice PDF generation | < 3 seconds |
| Form submit → confirmation | < 1 second (optimistic UI) |

### Techniques
- React Server Components for data-heavy pages (no client-side waterfall)
- `next/image` for all images (automatic optimization)
- Optimistic updates with React Query `useMutation`
- Route prefetching on hover (Next.js default)
- Skeleton loaders prevent CLS (Cumulative Layout Shift)

---

## PWA CONFIGURATION

The app is a Progressive Web App — installable on iPhone and Android home screen.

Required in `next.config.ts`:
```typescript
// next-pwa or manual manifest
```

Required `manifest.json`:
```json
{
  "name": "Håndværk Pro",
  "short_name": "HvPro",
  "start_url": "/overview",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a1a1a",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

The "Add to Home Screen" prompt should appear:
- After the user has sent their first invoice
- Not on first visit
- Shown as a soft banner, dismissable
