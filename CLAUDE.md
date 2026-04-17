# Håndværk Pro

Mobile-first SaaS for Danish tradespeople. Next.js 15 / Neon / Drizzle / Clerk.
Full context in `/docs/CONTEXT.md`. Specs in `/docs/`. Skills in `/docs/skills/`.


---

## RULES — never break these

1. App Router only. Never Pages Router.
2. Filter every DB query by `userId` from `auth()` server-side.
3. `isNull(table.deletedAt)` on all soft-delete queries.
4. Add i18n keys to both `en.json` and `da.json` (da.json value = `""`).
5. `formatDKK()` from `lib/utils/currency.ts` for all money display.
6. Drizzle query builder only. No raw SQL strings.
7. Never trust client-passed `userId` — always from `auth()`.
8. MobilePay is stubbed — do not implement payment processing.
9. All mutations via Server Actions, not API routes.
10. Rate limit all Server Actions and API routes via Upstash.
11. **ALWAYS self-monitor docs for required updates** — whenever any decision, change, or new information affects anything defined in `/docs/`, `CLAUDE.md`, or `README.md`, proactively identify which file needs updating, show exactly what would change (old → new), and wait for explicit approval before applying. Never silently let docs go stale, and never edit without confirmation.
12. **ALWAYS ship frontend AND backend together per feature** — when a feature is in progress, the DB schema, Server Action, and page/component are all completed in the same session. Never leave a feature half-wired.

---

## CURRENT PHASE

**Phase 0 — Foundation** `[~]` in progress
Active: F-001 (Vercel deployment), F-002 (Neon DB), F-014 (Sentry) — require external service setup.
All code-side Phase 0 work is complete. Proceed to Phase 1 once services are provisioned.

**Phase 1 — Authentication & User Profile** `[~]` in progress
Complete: F-104, F-105, F-106, F-107, F-108, F-109.
Remaining: F-100, F-101, F-102, F-103 (Clerk phone/email OTP pages — pending Clerk dashboard config).

**Phase 2 — Customer Management** `[x]` complete
Complete: F-200 through F-209. F-207 "owes money" badge still stubbed at 0 — Phase 5 is done but badge not yet wired to real invoice totals.

**Phase 3 — Job Management** `[x]` complete
Complete: F-300 through F-310. Free tier gate enforced at 10 active jobs (F-307). F-307/F-604 limit updated from 3 → 10.

**Phase 4 — Quote Builder** `[x]` complete
Complete: F-400 through F-414. Schemas + migration applied (0004). Quote PDF (TILBUD), email via Resend, shareable link at /en/q/[token], customer accept/reject, save as template, materials catalog. Public quote route: /[locale]/q/[token].

**Phase 5 — Invoice Engine** `[x]` complete
Complete: F-500 through F-513. Schemas + migration applied (0004). Invoice PDF (FAKTURA), email via Resend with PDF attachment, Inngest payment reminders (+8d, +15d), credit notes (KRE-XXXX), mark as paid, overdue auto-flag. PDF download routes at /api/invoices/[id]/pdf and /api/quotes/[id]/pdf.

**Phase 6 — Quote & Invoice Enhancements** `[ ]` not started
Features: default valid_until (today+15d), per-line discounts, discount carry-over quote→invoice, duplicate invoice guard, action buttons at top of detail pages, inline actions on list pages (⋯ menu), landing page hero fix. Requires DB migration for discount columns on quote_items/invoice_items.

**Phase 7 — Bank Details & Profile Enhancements** `[ ]` not started
Features: bank_accounts table, profile UI for bank/MobilePay management, pre-load defaults into new invoices, bank details on PDF.

**Phase 8 — Merge Documents** `[ ]` not started
Features: merge quotes, merge invoices (same customer), merge conflict UX.

**Phase 9 — Email Notifications & Customer Communication** `[ ]` not started
Features: quote accepted/rejected emails to customer, invoice paid thank-you + Google review request, google_review_url on profile.

**Phase 10 — AI Features** `[ ]` not started
Spec in docs/AI_FEATURES.md. Key: business card OCR → customer, smart quote suggestions, payment risk scoring, voice-to-quote.

**Phase 11 — Dashboard, Free Tier Launch & Tier Gates** `[~]` in progress (previously Phase 6)
Complete: F-1104 (free tier gate), F-1107 (overview queries in lib/db/queries/overview.ts).
Dashboard components built: stat-cards, critical-zone, today-jobs, activity-feed (components/dashboard/).
Remaining: wire real data into dashboard components — F-1100, F-1101, F-1102, F-1103 FE still use stub data. F-1105 (upgrade prompt) not started.

Update this when a phase completes.

---

## SESSION START

No need to say "read CLAUDE.md" — Claude Code reads it automatically.
To start: *"Build F-[XXX] from FEATURES.md. Read relevant skill files first."*

## Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---