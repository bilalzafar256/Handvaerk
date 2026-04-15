# Håndværk Pro — GDPR Compliance Specification
> EU General Data Protection Regulation requirements for the Danish market.
> Must be completed before public go-live (Phase 7).

---

## 1. WHAT IS GDPR AND WHY IT MATTERS

GDPR (General Data Protection Regulation) applies to all businesses operating in the EU that process personal data of EU residents. As a Danish SaaS product, Håndværk Pro processes personal data of:

1. **Our users** (the tradespeople) — their name, email, phone, company details
2. **Their customers** — names, addresses, phone numbers, emails stored in our DB

Both categories are our legal responsibility.

Non-compliance penalties: up to **4% of annual global turnover or €20 million**, whichever is higher.

**Legal basis for processing:** Contract performance (Art. 6(1)(b)) — we process data to deliver the service the user signed up for.

---

## 2. DATA WE COLLECT & LEGAL BASIS

### User data (the tradesperson)
| Data | Purpose | Legal Basis | Retention |
|---|---|---|---|
| Email | Account + communication | Contract | Account lifetime + 30 days |
| Phone number | Auth (OTP) | Contract | Account lifetime + 30 days |
| Company name | Invoice generation | Contract | Account lifetime + 30 days |
| CVR number | Legal invoice requirement | Contract | Account lifetime + 30 days |
| Company address | Invoice generation | Contract | Account lifetime + 30 days |
| Logo | Invoice branding | Contract | Account lifetime + 30 days |
| Hourly rate | Quote generation | Contract | Account lifetime + 30 days |

### Customer data (stored by the tradesperson, we are data processor)
| Data | Purpose | Legal Basis | Retention |
|---|---|---|---|
| Customer name | Job/invoice identification | Contract (user's contract with us) | Per user account |
| Customer phone | Communication reference | Legitimate interest | Per user account |
| Customer email | Invoice delivery | Contract | Per user account |
| Customer address | Invoice legal requirement | Legal obligation | Per user account |
| CVR / EAN | Business invoice compliance | Legal obligation | Per user account |

**Important distinction:** For customer data, Håndværk Pro acts as a **Data Processor**. The tradesperson (our user) is the **Data Controller**. We process their customers' data on their behalf and according to their instructions.

---

## 3. REQUIRED LEGAL DOCUMENTS

### 3.1 Privacy Policy
Must cover:
- Who we are and contact details (Data Controller info)
- What data we collect
- Why we collect it (purpose + legal basis)
- How long we keep it
- Who we share it with (Clerk, Neon/Vercel, Resend, etc. — listed as sub-processors)
- User rights (access, rectification, erasure, portability, objection)
- How to contact us with privacy requests
- Right to complain to Datatilsynet (Danish DPA)

### 3.2 Data Processing Agreement (DPA)
Required because our users store their customers' personal data with us.
- We are the Data Processor
- The tradesperson is the Data Controller
- Must be agreed to at sign-up (checkbox or implied by ToS)
- Must specify: purpose, data types, retention, sub-processors, security measures

### 3.3 Terms of Service
- Service description and limitations
- Subscription terms and pricing
- User responsibilities (they are responsible for legality of their customer data)
- Termination and data deletion policy

### 3.4 Cookie Policy
Cookies used:
- **Essential:** Clerk session cookie (no consent needed)
- **Analytics:** PostHog, Vercel Analytics (need consent OR configure to be privacy-preserving/cookieless)

**Recommendation:** Configure PostHog in cookieless mode and Vercel Analytics (already privacy-first). This eliminates the need for a cookie banner entirely.

---

## 4. USER RIGHTS IMPLEMENTATION

These must be buildable on request from day one, automated from Phase 7.

### 4.1 Right of Access (Art. 15)
User can request all data we hold about them.

**Implementation:**
- `/settings/privacy/export` page
- Generates JSON file containing: user profile, all customers, all jobs, all quotes, all invoices, all expenses
- Delivered as downloadable `.json` file
- Response time: within 30 days (automate to be instant)

```typescript
// lib/gdpr/export.ts
export async function exportUserData(userId: string) {
  const [user, customers, jobs, quotes, invoices, expenses] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.customers.findMany({ where: eq(customers.userId, userId) }),
    db.query.jobs.findMany({ where: eq(jobs.userId, userId) }),
    db.query.quotes.findMany({ where: eq(quotes.userId, userId) }),
    db.query.invoices.findMany({ where: eq(invoices.userId, userId) }),
    db.query.expenses.findMany({ where: eq(expenses.userId, userId) }),
  ])
  return { exportedAt: new Date().toISOString(), user, customers, jobs, quotes, invoices, expenses }
}
```

### 4.2 Right to Erasure / "Right to be Forgotten" (Art. 17)
User can request deletion of their account and all associated data.

**Implementation — Two-stage process:**

**Stage 1: Soft delete (immediate)**
- All records get `deleted_at = now()`
- User can no longer access the app (Clerk account deactivated)
- Data still in DB for 30 days (in case of accidental deletion or legal dispute)

**Stage 2: Hard delete (30 days later)**
- Inngest scheduled function runs after 30 days
- Permanently deletes all rows for this user from all tables
- Deletes all files from Vercel Blob (receipts, logos, photos)
- Sends confirmation email via Resend

**Exception — Legal retention:** Invoices that have been sent to customers may need to be retained for **5 years** per Danish bogføringsloven. These are retained in anonymized/archived form with customer personal data stripped.

```sql
-- Anonymize invoices before hard delete (not delete)
UPDATE invoices
SET customer_snapshot = jsonb_set(customer_snapshot, '{name}', '"[Deleted]"'),
    -- strip personal fields but keep financial record
    deleted_at = now()
WHERE user_id = $1;
```

### 4.3 Right to Rectification (Art. 16)
User can correct any inaccurate data. Covered by standard edit forms.

### 4.4 Right to Data Portability (Art. 20)
Covered by the data export (4.1) — JSON format is machine-readable.

### 4.5 Right to Object (Art. 21)
Users can opt out of analytics. Implement in settings:
- Toggle: "Share analytics data" (default: on, user can turn off)
- If off: PostHog tracking disabled, Vercel Analytics still runs (it's anonymous by default)

---

## 5. DATA STORAGE & SECURITY

### Where data lives
| Data type | Location | EU Region |
|---|---|---|
| Structured data (users, jobs, invoices) | Neon PostgreSQL | EU (Frankfurt) ✅ |
| Files (photos, logos, PDFs) | Vercel Blob | EU (Frankfurt) ✅ |
| Auth data | Clerk | EU data residency option ✅ |
| Cache | Upstash Redis | EU (Frankfurt) ✅ |
| Emails sent | Resend | US (check DPA) ⚠️ |
| Error logs | Sentry | EU region available ✅ |

**Action for Resend:** Resend's infrastructure is US-based. Use EU data residency option if available, OR ensure DPA is in place with Resend as sub-processor. Alternatively, evaluate Brevo (EU-based).

### Sub-processors list (must be disclosed in Privacy Policy)
- Vercel Inc. — hosting, Blob storage
- Neon Inc. — database
- Clerk Inc. — authentication
- Upstash Inc. — caching
- Inngest Inc. — background jobs
- Resend Inc. — email delivery
- Sentry Inc. — error monitoring
- PostHog Inc. — analytics

### Security measures
- All data encrypted in transit (HTTPS/TLS 1.3, enforced by Vercel)
- All data encrypted at rest (Neon, Vercel Blob, Upstash — all encrypt at rest by default)
- API rate limiting on all routes (Upstash)
- SQL injection prevention: Drizzle ORM uses parameterized queries exclusively
- XSS prevention: React escapes all output by default
- CSRF: handled by Next.js middleware
- Access control: Row-level — every DB query filters by `user_id` from Clerk session

---

## 6. DATA RETENTION POLICY

| Data category | Retention | Basis |
|---|---|---|
| Active user account | Account lifetime | Contract |
| Soft-deleted account | 30 days after deletion request | Legal safety period |
| Sent invoices (financial records) | 5 years (anonymized) | Bogføringsloven |
| Application logs / errors | 90 days | Security/operational |
| Analytics events | 12 months | Legitimate interest |
| Backup snapshots | 30 days rolling | Operational |

---

## 7. INCIDENT RESPONSE

If a data breach occurs:
1. Identify and contain within **24 hours**
2. Assess risk to affected users
3. If risk to users: notify **Datatilsynet within 72 hours**
4. If high risk: also notify affected users "without undue delay"
5. Document the incident in a breach register

**Contact for Danish DPA (Datatilsynet):**
- Website: datatilsynet.dk
- Report portal: anmeldelse.datatilsynet.dk

---

## 8. IMPLEMENTATION CHECKLIST

### Must be done before public launch (Phase 7)
- `[ ]` Privacy Policy written and published (static page)
- `[ ]` Terms of Service written and published
- `[ ]` Cookie assessment done (aim for no consent banner via cookieless analytics)
- `[ ]` DPA with Resend signed
- `[ ]` Data export endpoint working (`/api/gdpr/export`)
- `[ ]` Account deletion flow working (soft + scheduled hard delete via Inngest)
- `[ ]` All sub-processors listed in Privacy Policy
- `[ ]` User settings: analytics opt-out toggle
- `[ ]` Datatilsynet notification: register as data controller if required (check current DK rules)
- `[ ]` Sentry configured to scrub PII from error logs

### Must be done before processing customer data at scale
- `[ ]` DPA accepted by users at sign-up (ToS checkbox)
- `[ ]` Invoice archival logic (anonymize on user delete, retain 5 years)
- `[ ]` Breach response plan documented internally

---

## 9. CONTACT & DPO

For a company of this size, a formal DPO (Data Protection Officer) is not required under GDPR (only required for large-scale systematic processing or processing of sensitive categories). However, designate a **privacy contact**:

```
Privacy contact: [founder email]
Mailing: [company address]
Response time: within 72 hours for requests, 30 days for formal rights exercises
```

Publish this contact in the Privacy Policy.
