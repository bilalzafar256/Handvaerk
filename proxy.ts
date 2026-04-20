import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

const intlMiddleware = createIntlMiddleware(routing)

const isPublicRoute = createRouteMatcher([
  "/:locale",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
  "/:locale/privacy",
  "/:locale/terms",
  "/api/webhooks(.*)",
  "/api/inngest(.*)",
  "/docs(.*)",
])

export default clerkMiddleware(async (auth, request) => {
  // API routes must not go through intl middleware — it would redirect
  // /api/upload → /en/api/upload which has no handler
  if (!request.nextUrl.pathname.startsWith("/api/") && !request.nextUrl.pathname.startsWith("/docs")) {
    const intlResponse = intlMiddleware(request)
    if (intlResponse) return intlResponse
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
}
