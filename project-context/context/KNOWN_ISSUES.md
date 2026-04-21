# Known Issues & Tech Debt

## Data / Logic

### KI-005: Job number format deviation from spec
**Location:** `lib/actions/jobs.ts:67-68`  
**Spec** (`docs/FEATURES.md:149`): "Should be starting as JOB-0001 for every new customer"  
**Actual:** Plain integer string `"1"`, `"2"` — sequential per user, not per customer, not padded.  
**Impact:** Customer-facing job numbers are ugly and not what was specified.  
**Fix:** Change to `JOB-${String(total + 1).padStart(4, "0")}` if per-user, or implement per-customer counter if per-customer is required. Note: existing records will remain as plain integers — no backfill.

---

## Infrastructure

### KI-009: Missing DB migration snapshots (0005–0010)
**Location:** `drizzle/migrations/meta/`  
**Actual snapshots:** 0000–0004, 0011  
**Missing:** 0005, 0006, 0007, 0008, 0009, 0010  
**Impact:** The `0011_snapshot_baseline` covers the full schema state so future migrations work. The gap is historical only — intermediate snapshots cannot be reconstructed without original DB state.  
**Action:** Run `npx drizzle-kit generate` to verify no schema drift. If it produces an empty migration, the baseline is in sync.

### KI-011: `EMAIL_FROM` uses sandbox domain
**Location:** `lib/email/client.ts:4`  
**Value:** `"Håndværk Pro <onboarding@resend.dev>"`  
**Impact:** Emails in production come from `onboarding@resend.dev` — a Resend sandbox address. Customers will see this as the sender. Not professional, potentially marked as spam.  
**Fix:** Verify a custom domain in Resend and update `EMAIL_FROM`.

### KI-012: No CI/CD pipeline configured
**Impact:** No automated tests, no lint checks on PR, no automated deployment validation.  
**Deferred:** Phase 3.

---

---

## Fixed

### ~~KI-013: Time tracking calendar week selection off-by-one (timezone)~~ (RESOLVED)
**Location:** `components/time-tracking/month-calendar.tsx`, `weekly-timesheet.tsx`, `timer-zone.tsx`  
**Root cause:** `toISO` used `toISOString().split("T")[0]` which returns UTC date. In UTC+2 timezone, local midnight is 22:00 UTC the previous day, so dates were shifted back by one. Clicking "week 3 in calendar" navigated to week 2.  
**Fix:** Changed `toISO` in all three files to use local date parts (`getFullYear() / getMonth() / getDate()`). Also updated MonthCalendar `navigateToDay` to include `&day=` param.

---

## Planned (Not Yet Built — High Priority)

These are in `FEATURES.md` with `[ ]` status but affect core functionality:

| Issue | Phase | Feature code |
|---|---|---|
| Rate limiting audit incomplete | 9 | F-1309, F-1310 |
| EAN number on customer form (UI) | 14 | F-1302 |
| Reports page not built | 9 | F-900 through F-907 |
| Danish translations not filled | — | All `da.json` values are `""` |

---

→ Related: `context/DECISIONS.md`, `architecture/INFRASTRUCTURE.md`, `architecture/DATABASE.md`
