# Feature: Notifications

## Purpose

In-app notification system. Notifications are created server-side (by Inngest jobs or Server Actions) and consumed by the `NotificationBell` component in the topbar. Every notification has a click destination — tapping it marks it read, closes the panel, and navigates to the relevant page.

---

## Key Files

| File | Role |
|---|---|
| `lib/db/schema/notifications.ts` | Schema |
| `lib/actions/notifications.ts` | Server Actions (get, markRead, markAllRead, clearAll) |
| `components/notifications/notification-bell.tsx` | UI — bell icon + slide-out sheet |
| `lib/inngest/quote-followup.ts` | Creates `quote_followup_draft` notifications |
| `lib/inngest/process-job-recording.ts` | Creates `ai_*` notifications |

---

## Notification Schema

```
id          uuid (PK)
userId      uuid (FK → users)
type        text
title       text
body        text
metadata    jsonb   ← stores IDs needed to build the click URL
read        boolean
readAt      timestamp
createdAt   timestamp
```

---

## Notification Types

### Rule: every type MUST have a destination URL

The `getNotificationUrl(type, metadata)` function in `notification-bell.tsx` maps each type to its destination. When adding a new notification type you must:
1. Add it to `TYPE_CONFIG` (icon, bg, color)
2. Add a `case` in `getNotificationUrl` that returns the correct path
3. Make sure the relevant `metadata` fields are saved when the notification is inserted

---

### Current Types

| Type | Icon | Destination | metadata fields required |
|---|---|---|---|
| `ai_customer_found` | User (blue) | `/jobs/record/[recordingId]` | `recordingId` |
| `ai_job_found` | Briefcase (green) | `/jobs/record/[recordingId]` | `recordingId` |
| `ai_quote_found` | FileText (amber) | `/jobs/record/[recordingId]` | `recordingId` |
| `quote_followup_draft` | Mail (sky) | `/quotes/[quoteId]` | `quoteId` |

---

### Adding a New Type — Checklist

```
1. Insert notification with metadata:
   await db.insert(notifications).values({
     userId,
     type:     "your_type_name",
     title:    "Human-readable title",
     body:     "One-line description",
     metadata: { entityId: "..." },   ← include every ID needed for the URL
   })

2. In notification-bell.tsx — TYPE_CONFIG:
   your_type_name: { Icon: SomeLucideIcon, bg: "oklch(...)", color: "oklch(...)" },

3. In notification-bell.tsx — getNotificationUrl():
   case "your_type_name":
     return m.entityId ? `/your-route/${m.entityId}` : null

4. Done — click-through works automatically.
```

---

## UX Behaviour

- **Navigable notifications** (have a URL): show a `ChevronRight` on the right; always show hover highlight; click marks read + closes sheet + navigates.
- **Non-navigable notifications** (no URL from `getNotificationUrl`): show an unread dot if unread; click only marks read.
- Marking read is fire-and-forget (optimistic update via `useTransition`).
- Unread count badge on the bell icon is fetched on mount and refreshed when the sheet closes.

---

## Planned Types (not yet implemented)

| Type | Destination | Trigger |
|---|---|---|
| `invoice_overdue` | `/invoices/[invoiceId]` | Inngest cron when invoice passes due date |
| `invoice_paid` | `/invoices/[invoiceId]` | `markInvoicePaidAction` |
| `quote_accepted` | `/quotes/[quoteId]` | `acceptQuoteByTokenAction` |
| `quote_rejected` | `/quotes/[quoteId]` | `rejectQuoteByTokenAction` |
| `job_due_soon` | `/jobs/[jobId]` | Inngest cron 24h before scheduled date |

---

→ Related: `features/AI_RECORDING.md`, `features/QUOTES.md`, `features/INVOICES.md`
