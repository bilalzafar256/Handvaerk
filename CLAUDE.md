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