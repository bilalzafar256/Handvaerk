# SKILL: Motion — Animations
> Source: https://motion.dev/docs
> Package: `motion` (formerly Framer Motion v11)
> Import: `import { motion, AnimatePresence } from 'motion/react'`

---

## PROJECT-SPECIFIC RULES

- Import from `motion/react` (not `framer-motion`).
- Motion components MUST be in Client Components (`'use client'`).
- Prefer CSS transitions for simple hover/color effects — use Motion only for complex animations.
- Mobile-first: use `whileTap` instead of `whileHover` for primary touch interactions.
- Keep animations subtle and fast on mobile (duration 0.15–0.25s) — tradespeople want a fast app.
- Use `layout` animations for list reordering (job lists, invoice lists).
- Use `AnimatePresence` for modal open/close, slide-in sheets, and toast notifications.
- Respect `prefers-reduced-motion` — wrap complex animations in a motion check.

---

## INSTALLATION

```bash
npm install motion
```

---

## BASIC PATTERNS

### Fade in on mount

```tsx
'use client'
import { motion } from 'motion/react'

export function JobCard({ job }: { job: Job }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* card content */}
    </motion.div>
  )
}
```

### Staggered list

```tsx
'use client'
import { motion } from 'motion/react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export function JobList({ jobs }: { jobs: Job[] }) {
  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      {jobs.map((job) => (
        <motion.li key={job.id} variants={item}>
          <JobCard job={job} />
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

---

## MOBILE GESTURE ANIMATIONS

```tsx
'use client'
import { motion } from 'motion/react'

// Primary mobile button — tap feedback
export function PrimaryButton({ children, onClick }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className="..."
    >
      {children}
    </motion.button>
  )
}

// Desktop hover (secondary, never primary on mobile)
export function DesktopCard({ children }: CardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}
```

---

## ANIMATE PRESENCE — modals, sheets, toasts

```tsx
'use client'
import { motion, AnimatePresence } from 'motion/react'

// Bottom sheet (mobile-first)
export function BottomSheet({ isOpen, onClose, children }: SheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-6"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

```tsx
// Toast notification
export function Toast({ message, isVisible }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 ..."
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## LAYOUT ANIMATIONS (list reorder)

```tsx
'use client'
import { motion, Reorder } from 'motion/react'

// Reorderable line items in a quote builder
export function LineItemList({
  items,
  onReorder,
}: {
  items: LineItem[]
  onReorder: (items: LineItem[]) => void
}) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder}>
      {items.map((item) => (
        <Reorder.Item key={item.id} value={item}>
          <LineItemRow item={item} />
        </Reorder.Item>
      ))}
    </Reorder.Group>
  )
}

// Layout animation for items added/removed
export function InvoiceLineItem({ item }: { item: LineItem }) {
  return (
    <motion.div layout transition={{ duration: 0.15 }}>
      {/* row content */}
    </motion.div>
  )
}
```

---

## SCROLL-TRIGGERED ANIMATIONS

```tsx
'use client'
import { motion } from 'motion/react'

// Animate dashboard stats on scroll into view
export function StatCard({ label, value }: StatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.25 }}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </motion.div>
  )
}
```

---

## PAGE TRANSITIONS (App Router)

```tsx
// components/shared/page-transition.tsx
'use client'
import { motion } from 'motion/react'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  )
}
```

---

## REDUCED MOTION

```tsx
'use client'
import { motion, useReducedMotion } from 'motion/react'

export function AnimatedCard({ children }: { children: React.ReactNode }) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduce ? 0 : 0.2 }}
    >
      {children}
    </motion.div>
  )
}
```

---

## SPRING PRESETS (use consistently)

```typescript
// For UI elements that feel snappy on mobile
export const springSnappy = { type: 'spring', stiffness: 400, damping: 30 }

// For sheets/modals that feel natural
export const springSheet = { type: 'spring', stiffness: 300, damping: 30 }

// For subtle fades
export const fadeFast = { duration: 0.15 }
export const fadeMedium = { duration: 0.2 }
```
