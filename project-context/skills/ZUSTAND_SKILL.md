# SKILL: Zustand — Client State Management
> Source: https://zustand.docs.pmnd.rs
> Package: `zustand`

---

## PROJECT-SPECIFIC RULES

- Zustand is for **UI state only** — data from the DB always comes from Server Components via Drizzle/Server Actions.
- Do NOT store financial data (invoice amounts, customer PII) in Zustand — server only.
- All stores live in `stores/` directory, one file per domain.
- Use Zustand for: form multi-step state, modal open/close, draft state before submission, UI preferences.
- Always type stores with TypeScript interfaces — no implicit `any`.
- Use the `immer` middleware for stores with nested state updates.
- Keep stores small and focused. If a store has >5 fields, question whether they all belong together.
- Do NOT use Zustand for locale or auth state — those come from next-intl and Clerk.

---

## INSTALLATION

```bash
npm install zustand immer
```

---

## BASIC STORE PATTERN

```typescript
// stores/ui-store.ts
import { create } from 'zustand'

interface UIState {
  // State
  isMobileMenuOpen: boolean
  activeModal: string | null
  // Actions
  openMobileMenu: () => void
  closeMobileMenu: () => void
  openModal: (id: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  isMobileMenuOpen: false,
  activeModal: null,

  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}))
```

---

## STORE WITH IMMER (nested state)

```typescript
// stores/quote-draft-store.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number // stored in øre (minor units)
}

interface QuoteDraftState {
  lineItems: LineItem[]
  notes: string
  validDays: number
  addLineItem: (item: LineItem) => void
  updateLineItem: (id: string, updates: Partial<LineItem>) => void
  removeLineItem: (id: string) => void
  setNotes: (notes: string) => void
  reset: () => void
}

const initialState = {
  lineItems: [],
  notes: '',
  validDays: 30,
}

export const useQuoteDraftStore = create<QuoteDraftState>()(
  immer((set) => ({
    ...initialState,

    addLineItem: (item) =>
      set((state) => {
        state.lineItems.push(item)
      }),

    updateLineItem: (id, updates) =>
      set((state) => {
        const idx = state.lineItems.findIndex((li) => li.id === id)
        if (idx !== -1) Object.assign(state.lineItems[idx], updates)
      }),

    removeLineItem: (id) =>
      set((state) => {
        state.lineItems = state.lineItems.filter((li) => li.id !== id)
      }),

    setNotes: (notes) =>
      set((state) => {
        state.notes = notes
      }),

    reset: () => set(initialState),
  }))
)
```

---

## SELECTIVE SUBSCRIPTIONS (performance)

```tsx
// Only re-render when specific state changes
'use client'
import { useUIStore } from '@/stores/ui-store'

// Good — subscribe to one value
function MobileMenu() {
  const isOpen = useUIStore((state) => state.isMobileMenuOpen)
  const close = useUIStore((state) => state.closeMobileMenu)
  return isOpen ? <MenuPanel onClose={close} /> : null
}

// Bad — subscribes to entire store, re-renders on any change
function MobileMenu() {
  const store = useUIStore() // ❌ subscribes to everything
  return store.isMobileMenuOpen ? <MenuPanel /> : null
}
```

---

## MULTI-STEP FORM STORE

```typescript
// stores/job-creation-store.ts
import { create } from 'zustand'

type Step = 'details' | 'customer' | 'schedule' | 'review'

interface JobCreationState {
  currentStep: Step
  title: string
  description: string
  customerId: string | null
  scheduledDate: Date | null
  // Actions
  setStep: (step: Step) => void
  setDetails: (title: string, description: string) => void
  setCustomer: (customerId: string) => void
  setScheduledDate: (date: Date) => void
  reset: () => void
}

export const useJobCreationStore = create<JobCreationState>()((set) => ({
  currentStep: 'details',
  title: '',
  description: '',
  customerId: null,
  scheduledDate: null,

  setStep: (step) => set({ currentStep: step }),
  setDetails: (title, description) => set({ title, description }),
  setCustomer: (customerId) => set({ customerId }),
  setScheduledDate: (scheduledDate) => set({ scheduledDate }),
  reset: () =>
    set({
      currentStep: 'details',
      title: '',
      description: '',
      customerId: null,
      scheduledDate: null,
    }),
}))
```

---

## NEXT.JS APP ROUTER COMPATIBILITY

Zustand stores are **client-only**. Do not import stores in Server Components.

```tsx
// app/(dashboard)/jobs/new/page.tsx — Server Component wrapper
import { JobCreationFlow } from '@/components/forms/job-creation-flow'

export default function NewJobPage() {
  // ✅ No store access here — this is a Server Component
  return <JobCreationFlow />
}
```

```tsx
// components/forms/job-creation-flow.tsx
'use client'  // ← store access only in Client Components
import { useJobCreationStore } from '@/stores/job-creation-store'

export function JobCreationFlow() {
  const currentStep = useJobCreationStore((s) => s.currentStep)
  // ...
}
```

**SSR note**: Zustand stores initialize fresh on each request for Server Components. For client navigation, store state persists across route changes (React tree stays mounted). Call `reset()` explicitly when leaving a multi-step flow.

---

## STORE DIRECTORY LAYOUT

```
stores/
  ui-store.ts              ← mobile menu, active modal, sidebar state
  quote-draft-store.ts     ← quote builder line items + draft state
  invoice-draft-store.ts   ← invoice builder draft state
  job-creation-store.ts    ← multi-step job creation wizard
```

---

## DEVTOOLS (development only)

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({ ... }),
    { name: 'UIStore' }
  )
)
```

---

## WHAT NOT TO PUT IN ZUSTAND

| Don't store | Use instead |
|---|---|
| Invoice/customer data | Server Components + Drizzle |
| Auth user data | `useUser()` from Clerk |
| Current locale | `useLocale()` from next-intl |
| Server-fetched lists | Server Components or React Query |
| Financial amounts | Server only (GDPR risk on client) |
