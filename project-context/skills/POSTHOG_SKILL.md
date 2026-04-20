# SKILL: PostHog — Product Analytics
> Source: https://posthog.com/docs/libraries/next-js
> Packages: `posthog-js` (client), `posthog-node` (server)

---

## PROJECT-SPECIFIC RULES

- Use EU PostHog host: `https://eu.i.posthog.com` (GDPR — Danish users, data must stay in EU).
- **Never** capture PII in event properties: no names, emails, phone numbers, CVR numbers.
- Use `userId` from Clerk as the PostHog `distinctId` for identification.
- Only identify users **after** they log in — never on anonymous sign-up pages.
- Anonymize/reset on sign-out: call `posthog.reset()`.
- Server-side PostHog (`posthog-node`) for tracking financial events (invoice sent, quote accepted).
- Feature flags for progressive feature rollout (free vs pro tier gates).
- Do NOT capture financial amounts in event properties (GDPR sensitivity).

---

## INSTALLATION

```bash
npm install posthog-js posthog-node
```

```env
# .env.local
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

---

## CLIENT-SIDE SETUP

```typescript
// instrumentation-client.ts  (Next.js 15 — runs before app hydrates)
import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
  // GDPR: disable autocapture of input values
  autocapture: {
    dom_event_allowlist: ['click'],
    element_allowlist: ['button', 'a'],
    css_selector_allowlist: ['[data-ph-capture]'], // opt-in only
  },
  // Respect cookie consent
  persistence: 'localStorage',   // switch to 'memory' if no consent
  disable_session_recording: true, // enable only with explicit consent
})
```

```tsx
// app/[locale]/layout.tsx  — PostHog provider wrapper
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

---

## USER IDENTIFICATION (Clerk integration)

```tsx
// components/shared/posthog-identify.tsx
'use client'
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import posthog from 'posthog-js'

export function PostHogIdentify() {
  const { user, isSignedIn } = useUser()

  useEffect(() => {
    if (isSignedIn && user) {
      posthog.identify(user.id, {
        // Only non-PII properties
        plan: user.publicMetadata.plan ?? 'free',
        createdAt: user.createdAt,
      })
    }
  }, [isSignedIn, user])

  return null
}

// On sign-out (in sign-out handler)
posthog.reset()
```

---

## CLIENT-SIDE EVENT TRACKING

```tsx
'use client'
import posthog from 'posthog-js'

// Good — no PII, no financial amounts
posthog.capture('invoice_sent', {
  invoice_type: 'standard',
  has_attachment: true,
})

posthog.capture('quote_created')
posthog.capture('customer_added')
posthog.capture('job_status_changed', { new_status: 'completed' })

// Bad — never do this
posthog.capture('invoice_sent', { amount: 5000, customerEmail: '...' }) // ❌
```

---

## SERVER-SIDE TRACKING (Inngest / Server Actions)

```typescript
// lib/analytics/posthog-server.ts
import { PostHog } from 'posthog-node'

export function getPostHogClient() {
  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,       // flush immediately (serverless)
    flushInterval: 0,
  })
}
```

```typescript
// Usage in a Server Action
import { getPostHogClient } from '@/lib/analytics/posthog-server'

export async function markInvoicePaid(invoiceId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // ... update DB ...

  // Server-side event — no PII
  const client = getPostHogClient()
  client.capture({
    distinctId: userId,
    event: 'invoice_marked_paid',
    properties: { invoice_type: 'standard' },
  })
  await client.shutdown()
}
```

---

## FEATURE FLAGS

```tsx
// Client Component — feature flag hook
'use client'
import { useFeatureFlagEnabled } from 'posthog-js/react'

export function InvoiceActions() {
  const hasBulkExport = useFeatureFlagEnabled('bulk-export')

  return (
    <div>
      {hasBulkExport && <BulkExportButton />}
    </div>
  )
}
```

```typescript
// Server-side feature flag check (e.g. for API route or Server Action)
import { getPostHogClient } from '@/lib/analytics/posthog-server'

const client = getPostHogClient()
const isEnabled = await client.isFeatureEnabled('new-dashboard', userId)
await client.shutdown()
```

---

## GDPR COMPLIANCE

```typescript
// Cookie consent gate — call before init if no consent
import posthog from 'posthog-js'

export function grantAnalyticsConsent() {
  posthog.opt_in_capturing()
}

export function revokeAnalyticsConsent() {
  posthog.opt_out_capturing()
}

export function hasAnalyticsConsent(): boolean {
  return posthog.has_opted_in_capturing()
}
```

**Data retention**: Configure in PostHog dashboard → Project Settings → Data retention. Recommend 90 days for MVP compliance.

**Data deletion**: Use PostHog's person deletion API when a user requests account deletion (GDPR Article 17).

---

## VERCEL REVERSE PROXY (ad-blocker bypass)

```typescript
// next.config.ts
export default {
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}
```

```env
NEXT_PUBLIC_POSTHOG_HOST=/ingest   # use proxy
```

---

## COMMON EVENTS (standard taxonomy)

| Event | When |
|---|---|
| `user_signed_up` | After Clerk webhook syncs new user |
| `user_signed_in` | After successful login |
| `customer_created` | Customer added |
| `job_created` | Job created |
| `quote_created` | Quote drafted |
| `quote_sent` | Quote emailed to customer |
| `invoice_created` | Invoice drafted |
| `invoice_sent` | Invoice emailed |
| `invoice_marked_paid` | Payment recorded |
| `pdf_downloaded` | PDF opened/downloaded |
