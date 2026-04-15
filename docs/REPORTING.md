# Håndværk Pro — Reporting & Metrics Specification
> Reporting features, DB query foundations, and product analytics.
> DB queries are built in Phase 6. UI is exposed progressively.

---

## 1. PHILOSOPHY

Klaus doesn't need a business intelligence dashboard. He needs to know three things:

1. **Am I owed money, and by whom?**
2. **How much did I earn this month/quarter?**
3. **Which customers are worth keeping?**

Every report serves one of these three questions. No vanity metrics. No charts for the sake of charts.

---

## 2. BUILT-IN PRODUCT METRICS (Internal — not shown to users)

These are tracked in PostHog + Vercel Analytics from Phase 0. They are for the product team (you), not the user.

### Acquisition
| Metric | Tool | Query |
|---|---|---|
| Signups per week | PostHog | Event: `user_signed_up` |
| Source of signup | PostHog | Property: `$referrer` or `referral_code` |
| Signups by trade type | PostHog | Property: set in onboarding |

### Activation
| Metric | Tool | Target |
|---|---|---|
| % signups → first job created | PostHog | > 60% |
| % signups → first invoice sent | PostHog | > 40% |
| Time to first invoice (minutes) | PostHog | < 7 min |

### Retention
| Metric | Tool | Target |
|---|---|---|
| Week 1 retention | PostHog cohort | > 70% |
| Month 1 retention | PostHog cohort | > 50% |
| Month 3 retention | PostHog cohort | > 35% |

### Revenue
| Metric | Source | Target |
|---|---|---|
| MRR | DB: subscriptions table (Phase 8) | Track weekly |
| ARPU | MRR / active paying users | |
| Churn rate | Cancelled / total paying | < 5%/mo |
| Expansion | Solo → Hold upgrades | |

### Product engagement
| Metric | Tool | Notes |
|---|---|---|
| Jobs created / user / week | DB query | Leading indicator of retention |
| Invoices sent / user / week | DB query | Revenue leading indicator |
| Feature usage heatmap | PostHog | Identify unused features |
| Error rate per route | Sentry | Quality indicator |

---

## 3. USER-FACING REPORTS

These are shown to the tradesperson in the `/reports` section.

### 3.1 Dashboard Summary (Phase 6 — always visible)

**Location:** `/overview` — the main homescreen

| Metric | Calculation | DB Query |
|---|---|---|
| Udestående (Outstanding) | SUM of invoices where status IN ('sent','viewed','overdue') | `SELECT SUM(total_incl_vat) FROM invoices WHERE user_id = $1 AND status IN (...)` |
| Aktive sager (Active jobs) | COUNT jobs where status NOT IN ('paid','invoiced') | |
| Forfaldne fakturaer (Overdue) | COUNT + SUM where due_date < TODAY and status != 'paid' | |
| Denne måned faktureret | SUM invoices issued this calendar month | |

All dashboard queries are **pre-written as Drizzle typed queries** in `/lib/db/queries/reports.ts` even if the UI is not fully built.

### 3.2 Revenue Report (Phase 6+ full view)

**Location:** `/reports`

**Filters:** This month / Last month / This quarter / Last quarter / Custom range / This year

| Report | Description |
|---|---|
| Total billed (ex. VAT) | Sum of invoices issued in period |
| Total billed (incl. VAT) | With 25% moms |
| Total VAT collected | Sum of vat_amount — feeds into SKAT moms export |
| Paid vs outstanding | Split of settled vs open invoices |
| Average invoice value | Total / count |
| Invoices by status | Count per status (paid, overdue, sent, draft) |

**SKAT Moms Export (Phase 7):**
- Quarterly view: Q1/Q2/Q3/Q4
- Shows: output VAT (moms collected), input VAT (moms paid on expenses)
- Net VAT owed to SKAT
- Exportable as structured summary for manual SKAT filing

### 3.3 Customer Report

| Report | Description |
|---|---|
| Revenue by customer | Which customers generate the most |
| Outstanding by customer | Who owes money and how much |
| Jobs by customer | Most active customers |
| Average payment time | How many days customers take to pay |

### 3.4 Job Report

| Report | Description |
|---|---|
| Jobs by status | Current pipeline overview |
| Jobs completed this month | Throughput |
| Average job value | Revenue per completed job |
| Jobs by type | Service vs project vs recurring |

### 3.5 Expense Report (Phase 6+)

| Report | Description |
|---|---|
| Total expenses by period | All logged expenses |
| Expenses by category | Van, tools, materials, subscriptions |
| VAT on expenses (input VAT) | For SKAT moms offset calculation |
| Profit estimate | Billed - logged expenses (not a formal P&L) |

---

## 4. DB FOUNDATION FOR REPORTING

These columns and indexes must be present from the schema creation. They make report queries fast without adding complexity to the write path.

### Required columns on all financial tables
```sql
-- invoices, expenses, quotes, jobs
created_at      timestamptz DEFAULT now()    -- all records
issue_date      date                         -- invoices (for period filtering)
due_date        date                         -- invoices (for overdue detection)
paid_at         timestamptz                  -- invoices (for cash-basis reporting)
status          text                         -- filterable
user_id         uuid                         -- all queries filter by this
```

### Indexes required for report performance
```sql
-- Fast period-based revenue queries
CREATE INDEX idx_invoices_user_issue_date ON invoices(user_id, issue_date);
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status != 'paid';

-- Fast customer reports
CREATE INDEX idx_invoices_customer ON invoices(user_id, customer_id);
CREATE INDEX idx_jobs_customer ON jobs(user_id, customer_id);

-- Fast job status queries
CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);

-- Expenses
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date);
```

### Pre-built Drizzle query: quarterly VAT summary
```typescript
// lib/db/queries/reports.ts
export async function getQuarterlyVatSummary(userId: string, year: number, quarter: 1 | 2 | 3 | 4) {
  const startMonth = (quarter - 1) * 3 + 1
  const startDate = new Date(year, startMonth - 1, 1)
  const endDate = new Date(year, startMonth + 2, 0) // last day of quarter

  const outputVat = await db
    .select({ total: sum(invoices.vatAmount) })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        gte(invoices.issueDate, startDate),
        lte(invoices.issueDate, endDate),
        ne(invoices.status, 'draft')
      )
    )

  const inputVat = await db
    .select({ total: sum(expenses.vatAmount) })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate)
      )
    )

  return {
    period: `Q${quarter} ${year}`,
    outputVat: outputVat[0]?.total ?? 0,   // VAT collected from customers
    inputVat: inputVat[0]?.total ?? 0,     // VAT paid on expenses
    netVatOwed: (outputVat[0]?.total ?? 0) - (inputVat[0]?.total ?? 0)
  }
}
```

---

## 5. EXPENSES TABLE SCHEMA

Required to support VAT reporting (input VAT tracking).

```sql
expenses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  job_id          uuid REFERENCES jobs(id),     -- linked to job if job expense
  description     text NOT NULL,
  category        text,                          -- 'van' | 'tools' | 'materials' | 'phone' | 'office' | 'other'
  amount_ex_vat   numeric(10,2) NOT NULL,
  vat_amount      numeric(10,2) DEFAULT 0,
  amount_incl_vat numeric(10,2),
  receipt_url     text,                          -- Vercel Blob file URL
  expense_date    date NOT NULL DEFAULT CURRENT_DATE,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
)
```

---

## 6. FUTURE REPORTING (Phase 8+)

| Feature | Description |
|---|---|
| PDF report export | Download revenue/expense summary as PDF |
| Accountant data export | Structured CSV/JSON for accountant import |
| Year-end summary | Full-year financial summary for annual report prep |
| Profit & loss estimate | Revenue minus logged expenses per period |
| Customer lifetime value | Total revenue per customer over all time |
| Trend charts | Month-over-month revenue chart |
