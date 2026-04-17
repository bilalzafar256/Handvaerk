# Håndværk Pro — AI Features Specification
> All planned AI-powered features. Phase 10 and beyond. Do not build until Phase 9 is complete.

---

## GUIDING PRINCIPLE

AI features must save real time for tradespeople. If it requires more than 2 taps or 10 seconds to use, it is too complex. Every feature here should feel invisible — it just works.

---

## F-1000 — Business Card → Customer (OCR)

**What:** User photographs a supplier's or customer's business card. The app extracts all contact details and pre-fills the new customer form.

**How:**
1. "Scan business card" button on new customer form
2. Image uploaded to Vercel Blob
3. Server Action sends image to Claude API (`claude-sonnet-4-6`) with extraction prompt
4. Claude returns structured JSON: `{ name, company, phone, email, address_line1, address_city, address_zip, cvr_number }`
5. Form fields pre-populated — user reviews, edits if needed, saves

**Tech:** `@anthropic-ai/sdk`, existing Vercel Blob upload, one Server Action. No new DB schema — fills existing customers fields.

**Confidence:** High. Claude vision handles Danish business cards accurately.

---

## F-1001 — Smart Quote Suggestions

**What:** When creating a new quote, user types a job description (e.g. "bathroom renovation 20m²"). AI suggests relevant line items based on the user's own past quotes.

**How:**
1. On quote creation, user types job title/description
2. Server Action fetches user's last 50 accepted quote line items from DB
3. Sends description + item history to Claude: *"Suggest line items for this job based on this tradesperson's history"*
4. Returns ranked list of suggested items (type, description, quantity, price)
5. User taps to add any suggested item — editable before saving

**Tech:** Claude API, Drizzle query of quote_items history, no new schema needed.

**Confidence:** High after 10+ accepted quotes exist for a user. Low value for new users (graceful degradation: show nothing if < 5 quotes).

---

## F-1002 — Payment Risk Scoring

**What:** On the customer detail page and invoice list, show a subtle risk indicator: likelihood this customer pays late or not at all.

**How:**
1. Background Inngest job re-scores customers weekly
2. Inputs: number of invoices, % paid on time, average days-to-pay, number of reminders sent, total outstanding
3. Claude API classifies: `low` / `medium` / `high` risk with a one-line reason
4. Stored on customer record (`payment_risk` field, `payment_risk_reason` text)
5. Shown as a colored dot on customer list + detail page

**DB Schema additions:**
```sql
ALTER TABLE customers ADD COLUMN payment_risk text;         -- 'low' | 'medium' | 'high'
ALTER TABLE customers ADD COLUMN payment_risk_reason text;
ALTER TABLE customers ADD COLUMN risk_scored_at timestamptz;
```

**Confidence:** Requires at least 3 completed invoices per customer for meaningful signal.

---

## F-1003 — Voice-to-Quote

**What:** User dictates a job description verbally. AI drafts a structured quote with line items ready to review.

**How:**
1. Tap microphone button on quote creation page
2. Web Speech API transcribes voice (da-DK, already used in F-302 for job descriptions)
3. Transcript sent to Claude: *"Convert this spoken job description into structured quote line items for a Danish tradesperson"*
4. Claude returns draft line items (type, description, qty, unit_price)
5. Populates the line items table — user reviews, adjusts, saves

**Tech:** Web Speech API (existing), Claude API text generation.

**Confidence:** High for common tradesperson job types (VVS, el, maler, tømrer).

---

## F-1004 — Auto Line-Item Categorization

**What:** When user pastes or types a description in a line item, AI auto-selects the item type (labour / material / fixed / travel).

**How:**
1. On blur of the description field, if type is still default, call Claude API
2. Input: description text, e.g. "Montering af vandhane"
3. Output: suggested type — `labour`
4. Pre-selects the type dropdown; user can override

**Tech:** Debounced Server Action or edge function. Very low token cost per call.

**Confidence:** High. Simple classification task.

---

## F-1005 — Customer Sentiment Flag

**What:** When user writes or pastes text in the customer notes field, AI detects negative sentiment and flags it with a subtle warning.

**How:**
1. On save of customer notes (or internal invoice notes), run sentiment analysis
2. Claude returns: `positive` / `neutral` / `negative` + one-line summary
3. If negative, show amber warning icon on customer detail page: "Caution: notes suggest a difficult customer relationship"
4. Stored as `customer_sentiment` field on customers table

**Use case:** Klaus writes "very demanding, always disputes invoices" — the flag reminds him to add more detail to quotes for this customer.

**DB Schema additions:**
```sql
ALTER TABLE customers ADD COLUMN customer_sentiment text;   -- 'positive' | 'neutral' | 'negative'
ALTER TABLE customers ADD COLUMN sentiment_summary text;
```

---

## F-1006 — Smart Invoice Reminder Drafting

**What:** Before Inngest sends a payment reminder email, Claude drafts a context-aware message based on the customer relationship, invoice amount, and days overdue.

**How:**
1. Inngest reminder jobs (F-509, F-510) currently send a fixed template
2. Upgrade: before sending, call Claude with: customer name, invoice total, days overdue, number of previous reminders, customer sentiment
3. Claude drafts a tone-appropriate message: friendly (+8d), firm (+15d), assertive (+30d)
4. Sent via Resend as usual — no human review needed unless user opts in

**Confidence:** High value. Direct business impact on cash flow.

---

## F-1007 — Automated Job Description from Photos

**What:** When user uploads a job photo (before/after), AI generates a suggested job description or quote line item from the image.

**How:**
1. After photo upload on job page, option: "Generate description from photo"
2. Image sent to Claude vision
3. Claude identifies work shown (e.g. "broken pipe under sink", "painted wall, approx 15m²")
4. Suggested text pre-fills the job description or a new quote line item

**Confidence:** Medium. Works well for clear before/after photos; less reliable for complex scenes.

---

## ROLLOUT ORDER (recommended)

| Priority | Feature | Reason |
|---|---|---|
| 1 | F-1000 Business card OCR | High wow factor, immediate time savings, simple to build |
| 2 | F-1004 Auto line-item categorization | Invisible, low effort, reduces friction on every quote |
| 3 | F-1003 Voice-to-quote | Extends existing voice feature (F-302), high daily use |
| 4 | F-1001 Smart quote suggestions | Requires quote history; improves with use |
| 5 | F-1006 Smart reminder drafting | Direct cash flow impact |
| 6 | F-1002 Payment risk scoring | Requires invoice history to be meaningful |
| 7 | F-1005 Sentiment flag | Nice-to-have, low urgency |
| 8 | F-1007 Photo → description | Medium confidence, polish feature |

---

## TECHNICAL NOTES

- All Claude API calls go through Server Actions — never expose API key to client
- Use `claude-sonnet-4-6` for all AI features (cost/quality balance)
- Implement prompt caching for repeated system prompts (Anthropic cache headers)
- All AI calls are non-blocking — use optimistic UI or background processing
- Log AI call latency + token usage to PostHog for cost monitoring
- Graceful degradation: if Claude API is unavailable, all forms still work without AI assistance
