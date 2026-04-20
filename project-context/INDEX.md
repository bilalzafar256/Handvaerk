# Håndværk Pro — Master Index

**Mobile-first SaaS for Danish tradespeople (plumbers, electricians, painters, carpenters).** Manages the full job lifecycle: customer → job → quote → invoice → payment.

---

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js (App Router only — never Pages) | 16.2.3 |
| Runtime | React | 19.2.4 |
| Database | Neon (serverless PostgreSQL) | — |
| ORM | Drizzle ORM | 0.45.2 |
| Auth | Clerk | 6.39.2 |
| Rate limiting / Cache | Upstash Redis | — |
| Background jobs | Inngest | 4.2.4 |
| Email | Resend | 6.12.0 |
| AI — transcription | Groq (whisper-large-v3-turbo) | groq-sdk 1.1.2 |
| AI — extraction | Groq (llama-3.3-70b-versatile) | — |
| AI — fallback | Google Gemini Flash | @google/generative-ai 0.24.1 |
| File storage | Vercel Blob | 2.3.3 |
| PDF generation | @react-pdf/renderer | 4.5.1 |
| UI components | shadcn/ui (Base UI primitives) | — |
| Drag-and-drop | @dnd-kit | — |
| Styling | Tailwind CSS v4 + CSS custom properties | 4 |
| State (client) | Zustand | 5.0.12 |
| Forms | React Hook Form + Zod | — |
| i18n | next-intl (en active, da stubbed) | 4.9.1 |
| Animation | Motion (Framer Motion v11) | 12.38.0 |
| Analytics | Vercel Analytics + PostHog | — |
| Error tracking | Sentry | 10.48.0 |
| Hosting | Vercel | — |

---

## Load-by-Task Reference

| Task type | Files to load |
|---|---|
| New feature end-to-end | `INDEX.md` → `architecture/DATABASE.md` → `codebase/BACKEND.md` → `codebase/FRONTEND.md` |
| DB schema / migration | `architecture/DATABASE.md` + `project-context/skills/DRIZZLE_SKILL.md` |
| New page / route | `codebase/FRONTEND.md` + `project-context/skills/NEXTJS_SKILL.md` |
| New Server Action | `codebase/BACKEND.md` + `conventions/CODING_STANDARDS.md` |
| UI component build | `design/UI_DESIGN_SYSTEM.md` + `codebase/FRONTEND.md` |
| Email / notification | `features/INVOICES.md` + `project-context/skills/RESEND_SKILL.md` |
| AI pipeline | `features/AI_RECORDING.md` + `project-context/skills/INNGEST_SKILL.md` |
| Auth / user data | `features/AUTH_PROFILE.md` + `project-context/skills/CLERK_SKILL.md` |
| Rate limiting | `codebase/BACKEND.md` + `project-context/skills/UPSTASH_SKILL.md` |
| i18n keys | `codebase/SHARED.md` + `project-context/skills/INTL_SKILL.md` |
| PDF generation | `features/INVOICES.md` + `project-context/skills/PDF_SKILL.md` |
| File uploads | `project-context/skills/BLOB_SKILL.md` |
| Animations / motion | `design/UI_DESIGN_SYSTEM.md` + `project-context/skills/MOTION_SKILL.md` |
| Debugging / incidents | `context/KNOWN_ISSUES.md` → `architecture/OVERVIEW.md` |
| Roadmap | `roadmap/COMPETITIVE_ANALYSIS.md` + `roadmap/DANISH_INTEGRATIONS_CHECKLIST.md` + `roadmap/RISKS.md` +`roadmap/RISKS.md` + |
| Work to do / Project progress  | `WORK_TO_DO.md` |

---

## Critical Always-Apply Rules

1. **App Router only.** Never Pages Router. All routes live under `app/[locale]/`.
2. **Auth from server only.** `auth()` from `@clerk/nextjs/server` — never trust client-passed `userId`.
3. **Soft-delete filter.** All queries must include `isNull(table.deletedAt)` — missing this silently shows deleted records.
4. **All money via `formatDKK()`.** Never format numbers inline. Import from `lib/utils/currency.ts`.
5. **Drizzle query builder only.** No raw SQL strings — use `db.query.*` or `db.select()...`.
6. **Rate-limit all mutations.** Call `applyRateLimit(clerkId)` at the top of every Server Action.
7. **i18n both files.** Every new translation key goes in `messages/en.json` (with value) AND `messages/da.json` (value = `""`).
8. **Server Actions for mutations.** Use `"use server"` + Drizzle — not API routes for data mutations.
9. **MobilePay is stubbed.** Do not implement payment processing — show "coming soon".
10. **No manual migration files.** Always run `npx drizzle-kit generate` — never hand-edit `_journal.json`.
11. **VAT is always 25%.** Danish moms. Use `lib/utils/vat.ts` helpers. Never hardcode the rate inline.

---

## Entry Points

| Entry | Path | Purpose |
|---|---|---|
| App root | `app/layout.tsx` | Minimal — passes through to locale layout |
| Locale layout | `app/[locale]/layout.tsx` | ClerkProvider, fonts (Bricolage Grotesque, DM Sans, JetBrains Mono), i18n, Toaster |
| Dashboard layout | `app/[locale]/(dashboard)/layout.tsx` | Auth guard + profile completion gate + Sidebar + DashboardShell |
| Middleware | — | [UNKNOWN — middleware.ts not found in tree; Clerk auth + next-intl routing expected here] |
| DB client | `lib/db/index.ts` | Lazy Proxy singleton — Neon + Drizzle |
| Auth helper | `lib/auth/index.ts` | `getDbUser()` — resolves Clerk session to DB user row |
| Inngest route | `app/api/inngest/route.ts` | Webhook receiver for background functions |
| Clerk webhook | `app/api/webhooks/clerk/route.ts` | `user.created` → insert `users` row |

---

→ Related: `architecture/OVERVIEW.md`, `codebase/FRONTEND.md`, `codebase/BACKEND.md`
