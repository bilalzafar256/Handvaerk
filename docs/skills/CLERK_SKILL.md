# SKILL: Clerk Authentication
> Source: https://clerk.com/docs/nextjs | https://clerk.com/docs/references/nextjs
> Version: @clerk/nextjs ^6

---

## PROJECT-SPECIFIC RULES
- Sign-in methods: phone OTP and email OTP ONLY. No social logins, no passwords.
- Always get `userId` from Clerk session server-side — never trust client-passed userId.
- Clerk webhook syncs user to our `users` table on first sign-up.
- EU data residency: configure in Clerk dashboard.

---

## SETUP

### Environment variables required
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/overview
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/overview
```

### Root layout: wrap with ClerkProvider
```tsx
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs"

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

---

## MIDDLEWARE

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",  // Webhooks must be public
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
}
```

---

## SERVER-SIDE AUTH

### In Server Components / Server Actions
```typescript
import { auth, currentUser } from "@clerk/nextjs/server"

// Get userId only (fast, no extra network call)
export async function someServerAction() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  // use userId to query DB
}

// Get full user object (extra network call to Clerk)
export async function getUserProfile() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  return user
}
```

---

## CLIENT-SIDE AUTH

```tsx
"use client"
import { useAuth, useUser } from "@clerk/nextjs"

export function ProfileButton() {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()

  if (!isLoaded) return <Skeleton />
  if (!userId) return <SignInButton />

  return <div>{user?.primaryEmailAddress?.emailAddress}</div>
}
```

---

## SIGN IN / SIGN UP PAGES

```tsx
// app/(auth)/sign-in/page.tsx
import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}
```

Clerk UI handles the entire OTP flow. No custom code needed.

---

## WEBHOOK — SYNC USER TO DB

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!SIGNING_SECRET) throw new Error("Missing CLERK_WEBHOOK_SECRET")

  const wh = new Webhook(SIGNING_SECRET)
  const headerPayload = await headers()

  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  const payload = await req.json()
  const body = JSON.stringify(payload)

  let event: WebhookEvent
  try {
    event = wh.verify(body, { "svix-id": svix_id!, "svix-timestamp": svix_timestamp!, "svix-signature": svix_signature! }) as WebhookEvent
  } catch {
    return new Response("Verification failed", { status: 400 })
  }

  if (event.type === "user.created") {
    const { id, email_addresses, phone_numbers } = event.data
    await db.insert(users).values({
      clerkId: id,
      email: email_addresses[0]?.email_address,
      phone: phone_numbers[0]?.phone_number,
      tier: "free",
    }).onConflictDoNothing()
  }

  if (event.type === "user.deleted") {
    await db.update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.clerkId, event.data.id!))
  }

  return new Response("OK", { status: 200 })
}
```

Required: add `CLERK_WEBHOOK_SECRET` from Clerk Dashboard → Webhooks.

---

## GET OUR DB USER FROM CLERK ID

```typescript
// lib/auth/index.ts
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function getDbUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  return db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  })
}
```

---

## SIGN OUT

```tsx
"use client"
import { useClerk } from "@clerk/nextjs"

export function SignOutButton() {
  const { signOut } = useClerk()
  return <button onClick={() => signOut({ redirectUrl: "/" })}>Sign out</button>
}
```
