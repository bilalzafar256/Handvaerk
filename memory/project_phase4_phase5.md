---
name: Phase 4 & 5 completion
description: Phase 4 (Quote Builder) and Phase 5 (Invoice Engine) fully implemented in session 2026-04-16
type: project
---

Phase 4 and 5 were implemented together in one session on 2026-04-16.

**Why:** User asked to proceed with both phases after confirming Phase 3 was complete.

**Key decisions:**
- Public quote share URL uses `/en/q/[token]` (not `/quotes/[token]`) to avoid App Router route conflict with dashboard `/quotes/[id]`
- PDF generation for Server Actions uses `lib/pdf/generate-invoice.tsx` helper (tsx file) since Server Action files are `.ts` and can't use JSX directly
- Inngest version is `^4.2.4` — function config uses `triggers: [{ event }]` not a separate trigger argument
- Invoice numbering: `FAK-0001`, quote numbering: `TIL-0001`, credit note: `KRE-0001`
- DB migration applied: `0004_harsh_stephen_strange.sql` (quotes, quote_items, quote_templates, materials_catalog, invoices, invoice_items)

**How to apply:** When adding features touching invoices/quotes, know these schema + route patterns are established.
