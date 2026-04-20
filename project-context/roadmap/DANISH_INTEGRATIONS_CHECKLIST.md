# Håndværk Pro — Danish Integrations & Compliance Checklist

> Status key: ✅ Done | ⚠️ Partial/Stubbed | ❌ Not built | 🚫 Explicitly deferred

---

## Authentication & Identity

- ✅ **Phone OTP sign-in** — Clerk handles; primary DK tradesperson auth method
- ✅ **Email OTP sign-in** — Clerk handles
- ❌ **MitID login** — Not implemented. MitID replaces NemID as the Danish national eID. Required for public sector B2B. Integration via Nets (commercial) or MitID Erhverv broker. [UNVERIFIED — validate demand from target segment]
- ❌ **NemID support** — Deprecated Jan 2023. Do not implement.

---

## Payment & Invoicing

- ✅ **DKK (Danish krone) currency** — formatDKK() utility, all money in DKK
- ✅ **Danish VAT (25% moms)** — Auto-calculated via `lib/utils/vat.ts`; legal DK layout on PDFs
- ✅ **Moms layout on invoices** (excl. moms / moms / incl. moms) — Legal DK format on PDF
- ✅ **Sequential invoice numbering (FAK-XXXX)** — Per user, legally required
- ✅ **Credit note (Kreditnota) — KRE-XXXX numbering** — Legally required format
- ✅ **Bank account on invoice** (reg.nr + kontonr) — DK standard
- ✅ **MobilePay number on invoice** — Static reference displayed; >90% DK penetration
- ⚠️ **MobilePay Erhverv payment link** — Stubbed "coming soon"; requires MobilePay Erhverv API business approval. Dominant payment method in Denmark — without it, tradespeople must manually reconcile
- 🚫 **NemKonto / bank auto-transfer** — Deferred. Requires PSD2 license or Aiia/Nordigen partnership
- 🚫 **Dankort/Nets payment acceptance** — Deferred. For B2C payment acceptance on invoices

---

## Business Registry & Tax

- ✅ **CVR number field** — On users (company) and customers (business clients)
- ✅ **CVR lookup (cvrapi.dk)** — Debounced autocomplete on customer + profile forms
- ❌ **SKAT moms quarterly summary** — F-907/F-1300. Display output VAT − input VAT = net owed per quarter. Required for manual SKAT filing. No actual API integration (too risky pre-revenue)
- 🚫 **SKAT TastSelv API filing** — Explicitly deferred. Requires SKAT developer access approval
- ❌ **Expenses table + input VAT tracking** — Schema designed (F-905), not built. Required for moms offset calculation
- ✅ **Payment terms (betalingsbetingelser)** — Default 14 days; displayed on invoice

---

## Public Sector & NemHandel

- ✅ **EAN number field** — On customers and invoices (DB only)
- ❌ **EAN number in customer form UI** — F-1302. Field exists in DB, not exposed in form yet
- ✅ **OIOUBL/PEPPOL fields in schema** — `oioubl_format`, `peppol_id` on invoices
- ❌ **OIOUBL invoice export (XML)** — F-1303. Required for Danish public sector procurement. Not built
- ❌ **E-boks invoice delivery** — F-1408. National digital mailbox. Required for many public sector and enterprise customers in DK
- ❌ **NemHandel/PEPPOL send** — Full PEPPOL network submission not built

---

## Language & Localization

- ✅ **Danish language infrastructure (da-DK)** — next-intl routing, da.json file with all keys
- ❌ **Danish translations filled** — All da.json values are `""` — Danish UI is broken
- ✅ **Danish date/number formats** — Handled by next-intl locale
- ✅ **Voice input in Danish (da-DK)** — Web Speech API with da-DK locale on job form
- ✅ **AI extraction prompt handles Danish** — Groq/LLaMA prompt supports Danish input

---

## Legal & Compliance

- ❌ **Cookie consent banner** — F-1307. **Required by Danish law** (Cookiebot or equivalent). Datatilsynet actively enforces. Must be in place before any analytics cookies fire
- ❌ **Privacy policy page** — F-1306. Required before public launch
- ❌ **Terms of service page** — F-1308. Required before public launch
- ❌ **GDPR: user data export (right to access)** — F-1304. JSON download of all user data
- ❌ **GDPR: account deletion flow** — F-1305 / KI-002. user.deleted webhook only updates updatedAt — data persists. Datatilsynet can fine up to 4% global turnover
- ✅ **GDPR: audio file deletion after AI processing** — Inngest Step 5 calls del(blobUrl). Audio never persisted
- ❌ **Data Processing Agreement (DPA) template** — [INFERRED need] B2B SaaS in DK; Datatilsynet requires DPA with subprocessors (Clerk, Neon, Vercel, Groq, etc.)
- ❌ **Sentry error tracking** — F-014 not started; optional pre-launch but needed for production incident response

---

## Danish-Specific Trade Compliance

- ❌ **KLS compliance module** — F-1407. Mandatory quality log for authorized VVS (plumbers) and electrical work. Required by Sikkerhedsstyrelsen for IBI/GVB authorization. Significant differentiation — no competitor offers this digitally
- ❌ **APV workplace safety documentation** — F-1409. Per-job risk assessment (arbejdspladsvurdering). Required by Arbejdstilsynet
- ❌ **Job handover report PDF** — F-1104. Professional handover doc (before/after, work description, materials, warranty). AI-generated. No competitor offers this

---

## Communication

- ✅ **Transactional email (Resend)** — 6 templates active
- ⚠️ **Email from domain** — Using onboarding@resend.dev (sandbox). Must configure custom domain pre-launch
- ❌ **SMS notifications** — F-1400. GatewayAPI in stack but stubbed. DK tradespeople prefer SMS over email for job status updates
- ❌ **Auto Google review request** — F-1401. Inngest job 24h after invoice paid. No competitor does this automatically

---

## Reputation & Trust

- ❌ **Trustpilot.dk profile** — [INFERRED need] Danish B2B buyers check Trustpilot before purchase. Profile should be created at launch
- ❌ **CVR-verified company page** — [INFERRED need] Danish buyers often verify on virk.dk
- ✅ **Google review URL on profile** — Stored and sent in post-payment emails; user-managed

---

## Payments — Decision Required

| Option | Status | Notes |
|---|---|---|
| **MobilePay Erhverv** | ⚠️ Stubbed | >90% DK market penetration. Business API requires company approval. Apply NOW — lead time 2–4 weeks |
| **Stripe (DK)** | ❌ Not implemented | Stripe supports DKK, MobilePay via Stripe Payment Methods. Faster to market than direct MobilePay integration |
| **Nets/Dankort** | 🚫 Deferred | Enterprise/retail focus; less relevant for tradespeople |
| **Bank transfer (manual)** | ✅ Complete | Bank reg/konto on invoice; manual reconciliation |
| **Recommended path** | — | Stripe + MobilePay via Stripe (fastest); native MobilePay Erhverv in Phase 2 |

---

## Gaps vs. Market Standard

| Item | Urgency | Why it matters |
|---|---|---|
| Cookie consent | LAUNCH BLOCKER | Datatilsynet actively fines. PostHog fires analytics cookies on landing page today |
| GDPR account deletion | LAUNCH BLOCKER | KI-002 is a legal liability |
| Privacy policy | LAUNCH BLOCKER | Required to have a paying customer |
| Danish translations | HIGH | Core market can't use product in native language |
| EAN number in UI | HIGH | Locks out B2B/public sector segment (20%+ of trade work) |
| MobilePay payment link | HIGH | Danish tradespeople expect to get paid via MobilePay |
| SKAT moms summary | HIGH | Primary reason tradespeople buy software in Denmark |
| KLS compliance | MEDIUM-HIGH | Legal requirement for authorized VVS/electrical; no competitor offers it digitally |

---

Last updated: 2026-04-20
Generated by: ProductStrategist
