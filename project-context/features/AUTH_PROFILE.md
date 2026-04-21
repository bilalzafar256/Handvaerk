# Feature: Auth & User Profile

## Purpose
User authentication via Clerk (email OTP + phone OTP). Company profile setup gates dashboard access. Users have a tier that controls feature availability.

---

## Key Files
| File | Role |
|---|---|
| `lib/db/schema/users.ts` | Schema: `users` |
| `lib/auth/index.ts` | `getDbUser()` helper |
| `app/api/webhooks/clerk/route.ts` | Clerk user sync webhook |
| `app/[locale]/(auth)/` | Sign-in/sign-up pages |
| `app/[locale]/(onboarding)/profile/setup/page.tsx` | Profile completion gate |
| `app/[locale]/(dashboard)/profile/page.tsx` | Profile management |
| `components/forms/company-profile-form.tsx` | Company info form |
| `components/forms/logo-upload.tsx` | Logo upload component |
| `components/profile/bank-accounts-section.tsx` | Bank account management |
| `components/profile/google-review-section.tsx` | Google Review URL |
| `app/api/upload/route.ts` | Logo upload token endpoint |

---

## User Row Lifecycle

```
1. User signs up via Clerk
   → Clerk fires "user.created" webhook to /api/webhooks/clerk
   → Handler inserts users row (clerkId, email, phone, tier: "free")
   → onConflictDoNothing() prevents duplicates

2. [Fallback] If webhook missed:
   → First call to getDbUser() (lib/auth/index.ts)
   → No row found → calls currentUser() from Clerk → inserts row

3. User visits any /(dashboard)/ route
   → DashboardLayout: auth() check → redirect /sign-in if no session
   → getDbUser() → check user.companyName
   → If null → redirect to /profile/setup

4. User completes profile setup (companyName, CVR, address, hourlyRate)
   → Profile completion unlocks dashboard

5. User deleted in Clerk
   → "user.deleted" webhook fires
   → Currently: only updates users.updatedAt — does NOT delete or soft-delete the row
   [INFERRED: incomplete implementation — user data persists after Clerk account deletion]
```

---

## Tier System

| Tier | `activeJobs` limit | Other limits |
|---|---|---|
| `free` | 10 (enforced in actions) | — |
| `solo` | Unlimited | — |
| `hold` | Unlimited | — |

Tier is stored in `users.tier` (text field). No automated upgrade flow — must be manually set. Upgrade UI is planned but not implemented (`F-1205`).

**`TierGate` component** (`components/shared/tier-gate.tsx`): renders children only if `TIER_RANK[userTier] >= TIER_RANK[requiredTier]`. Ranks: `free=0`, `solo=1`, `hold=2`.

**Sidebar tier badge:** `Sidebar` accepts a `tier` prop (passed from `app/[locale]/(dashboard)/layout.tsx` via `user.tier`). A small pill badge ("Free" / "Solo" / "Hold") is shown next to the user's name in the expanded sidebar. Free = gray, Solo = amber, Hold = blue.

---

## Logo Upload

1. Client uses Vercel Blob client-side upload: sends `POST /api/upload` to get token
2. Token grants: 5MB max, `image/jpeg|png|webp` only
3. On upload complete: `onUploadCompleted` callback in route handler updates `users.logoUrl`
4. Logo URL used in: sidebar user avatar, company profile display, invoice PDF header

---

## Bank Accounts

`components/profile/bank-accounts-section.tsx` — manage list of bank accounts.  
`bankAccounts` table: `regNumber` (Danish routing), `accountNumber`, `isDefault` flag.  
One default per user. Format displayed on invoices: `"Reg. {regNumber} | Konto {accountNumber}"`.

---

## Google Review URL

`components/profile/google-review-section.tsx` + `users.google_review_url`.  
Set on profile page. Used in `InvoicePaidThankyouEmail` template — appended when present.

---

## Webhook Security

Clerk webhook verified with svix library:
- Checks: `svix-id`, `svix-timestamp`, `svix-signature` headers
- Uses `CLERK_WEBHOOK_SECRET` — returns 400 if missing
- Webhook secret must be configured in Clerk dashboard to point to `https://{domain}/api/webhooks/clerk`

---

## Edge Cases / Gotchas

1. **User deletion is incomplete.** Clerk `user.deleted` webhook only updates `updatedAt`. All user data remains. This is a GDPR concern — no soft-delete, no cascade. [See `context/KNOWN_ISSUES.md`]
2. **Tier not validated server-side on all operations.** Only `createJobAction` checks tier. Quote/invoice creation has no tier limits enforced.
3. **Profile gate on companyName only.** A user can bypass profile setup by directly navigating to a page that doesn't check the gate — but all `/(dashboard)/layout.tsx` routes are protected.
4. **`hourlyRate` on users** — two-way sync with the pricebook:
   - Saving a profile hourly rate → upserts a `Labour` / `itemType=labour` pricebook item via `syncDefaultLabourRate()` in `lib/actions/profile.ts`. Clearing the rate sets the item price to `0`.
   - Updating that pricebook item's price from the pricebook UI → writes back to `users.hourlyRate` via `updatePricebookItemAction` in `lib/actions/pricebook.ts` (triggered when `name="Labour"` AND `itemType="labour"`).
   - The convention anchor is **name = "Labour" + itemType = "labour"**. If the user renames the item, the sync link is silently broken (by design).

---

→ Related: `architecture/OVERVIEW.md`, `architecture/DATABASE.md`, `features/INVOICES.md`
