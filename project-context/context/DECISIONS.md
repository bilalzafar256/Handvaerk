# Technical Decisions

## Architecture

**Why Next.js App Router (not Pages Router)?**  
Server Components enable server-side auth + DB queries without API routes for reads. Server Actions co-locate mutation logic with the UI. The routing model maps cleanly to the feature-per-route structure.

**Why Neon (not Supabase/PlanetScale)?**  
Serverless PostgreSQL scales to zero between requests — appropriate for a product pre-launch with intermittent usage. Neon's HTTP driver via `@neondatabase/serverless` works without persistent connections in serverless environments.

**Why Drizzle (not Prisma)?**  
Drizzle's zero-overhead approach avoids Prisma's connection pooling challenges in serverless. The query builder provides type inference from schema without a separate generated client. `$inferSelect`/`$inferInsert` types eliminate duplication between schema and TypeScript types.

**Why a Proxy singleton for `db`?**  
`lib/db/index.ts` wraps the Drizzle client in a Proxy that defers instantiation to first use. This prevents build-time crashes when `DATABASE_URL` is not set (e.g., during `next build` on Vercel before env vars are configured). [Inferred from code comment: "Lazy singleton — avoids build-time crash"]

**Why Server Actions (not tRPC/REST)?**  
All mutations are internal to one Next.js app with a single user session. tRPC adds client/server type ceremony for no benefit here. REST API routes are used only for: Clerk webhook, Inngest handler, Vercel Blob token, CVR proxy, PDF streams.

---

## Auth

**Why Clerk (not NextAuth/Auth.js)?**  
Danish tradespeople authenticate primarily via phone number OTP. Clerk has first-class phone OTP support. Auth.js requires significant custom code for phone auth. Clerk also provides webhook events for user lifecycle sync.

**Why internal `users` table alongside Clerk?**  
Clerk stores auth identity. The `users` table stores business profile data (CVR, company name, hourly rate, tier, logo). These don't belong in Clerk's metadata. The `clerkId` foreign key bridges the two.

---

## Background Jobs

**Why Inngest (not Vercel Cron/BullMQ)?**  
Invoice reminders need multi-day `waitForEvent` semantics — "wait up to 8 days for payment, then send reminder." This is trivial with Inngest's durable functions. Impossible with stateless cron jobs. BullMQ requires a persistent Redis queue (not Upstash).

---

## AI Pipeline

**Why Groq (not OpenAI/Claude)?**  
Groq provides Whisper transcription + LLaMA extraction as two separate API calls, both extremely fast (~1-2s each). The Groq whisper endpoint accepts audio files directly. The initial implementation used Google Gemini for audio-to-JSON in one call, but was replaced by the Groq two-step pipeline (transcription → extraction). Groq's LLaMA 70b with `json_object` response format is more reliable for structured extraction than Gemini's free-form generation.

**Why two AI steps (transcribe then extract) rather than one audio-to-JSON?**  
Separating transcription from extraction allows: (1) inspecting the transcript for debugging, (2) retrying only the extract step if the extract fails, (3) potentially re-using transcripts for other purposes. The Groq Whisper `response_format: "text"` gives clean plain text that LLaMA processes well.

**Why 0.1 temperature for extraction?**  
Job data extraction needs determinism. Field values must match what was spoken, not be creatively paraphrased. Low temperature minimizes hallucination while preserving language understanding.

---

## File Storage

**Why Vercel Blob (not S3/Cloudflare R2)?**  
Tight Vercel integration. No additional account. Client-side upload via token endpoint means no server memory pressure for large files. Acceptable price for MVP volumes. S3/R2 migration path is straightforward if costs scale.

**Why client-side upload pattern?**  
Large audio files (up to 10-50MB) bypass the server entirely — they go directly from browser to Vercel Blob. The server only issues the upload token and receives a completion callback. This avoids Next.js serverless function memory limits and 30s timeout constraints.

---

## Styling

**Why Tailwind v4 + CSS custom properties (not Tailwind v3 design tokens)?**  
Tailwind v4 is CSS-first. The entire design system lives in `globals.css` as CSS custom properties, usable in both `className` (via `@theme inline`) and `style={}` inline references. This makes dark mode trivial (re-declare tokens in `.dark {}`) and avoids the `theme.extend.colors` mess in `tailwind.config.js`.

**Why Base UI (`@base-ui/react`) as shadcn's primitive (not Radix UI)?**  
shadcn v4 ships with Base UI as the default primitive layer. Base UI provides better composability and the `useRender` pattern for polymorphic components. The Badge and Button components show this pattern.

**Why oklch for all colors?**  
oklch is a perceptually uniform color space. Unlike HSL, equal oklch lightness steps look equal to the human eye. This makes the palette scales (amber-50 through amber-900) actually uniform rather than visually uneven at the extremes.

---

## State Management

**Why Zustand (not Context API/Jotai)?**  
Zustand's `persist` middleware handles localStorage sync for sidebar open/closed and view preferences in one `persist()` call. Redux would be overkill. Context API re-renders entire trees on any state change. Zustand subscriptions are slice-based — components only re-render when their specific slice changes.

---

## Rate Limiting

**Why conditional rate limiting (`if (process.env...)`)? **  
Local development without Upstash configured should not fail. The conditional check allows running the app in local dev without Redis. Production always has the env vars set. The alternative (always requiring Redis) creates friction for onboarding contributors.

---

→ Related: `context/KNOWN_ISSUES.md`, `INDEX.md`, `architecture/OVERVIEW.md`
