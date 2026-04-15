# SKILL: Resend — Email Sending
> Source: https://resend.com/docs
> Package: `resend` + `@react-email/components`

---

## PROJECT-SPECIFIC RULES

- ALWAYS call Resend from Server Actions (`lib/actions/`) or Inngest functions — never from client components.
- NEVER use API routes for sending email (project rule: all mutations via Server Actions).
- Store client in `lib/email/client.ts`, templates in `lib/email/templates/`.
- Rate-limit all email-triggering Server Actions via Upstash before calling Resend.
- Use verified domain address in `from:` (e.g. `noreply@haandvaerkpro.dk`). Never use `onboarding@resend.dev` in production.
- Always pass React component as a **function call** (not JSX): `react: InvoiceEmail({ ... })`.
- Log Resend `data.id` to the DB so emails are traceable (GDPR audit trail).
- For GDPR: do not include PII in email subject lines — keep subjects generic.

---

## SETUP

```bash
npm install resend @react-email/components
```

```
RESEND_API_KEY=re_...
```

```typescript
// lib/email/client.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)
```

---

## DIRECTORY LAYOUT

```
lib/email/
  client.ts              ← singleton Resend instance
  templates/
    invoice-sent.tsx     ← React Email template
    quote-sent.tsx
    welcome.tsx
    payment-reminder.tsx
```

---

## TEMPLATE PATTERN

```tsx
// lib/email/templates/invoice-sent.tsx
import {
  Html, Head, Body, Container, Heading, Text, Hr, Section
} from '@react-email/components'

interface InvoiceSentEmailProps {
  customerName: string
  invoiceNumber: string
  amountDKK: string   // pre-formatted via formatDKK()
  dueDate: string
  pdfUrl: string
}

export function InvoiceSentEmail({
  customerName,
  invoiceNumber,
  amountDKK,
  dueDate,
  pdfUrl,
}: InvoiceSentEmailProps) {
  return (
    <Html lang="da">
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container>
          <Heading>Faktura {invoiceNumber}</Heading>
          <Text>Kære {customerName},</Text>
          <Text>Vedhæftet finder du faktura {invoiceNumber} på {amountDKK}.</Text>
          <Text>Forfaldsdato: {dueDate}</Text>
          <Hr />
          <Text>
            <a href={pdfUrl}>Download faktura</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

---

## SENDING FROM A SERVER ACTION

```typescript
// lib/actions/invoices.ts  (excerpt)
'use server'
import { auth } from '@clerk/nextjs/server'
import { resend } from '@/lib/email/client'
import { InvoiceSentEmail } from '@/lib/email/templates/invoice-sent'
import { ratelimit } from '@/lib/upstash/ratelimit'
import { formatDKK } from '@/lib/utils/currency'

export async function sendInvoiceEmail(invoiceId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Rate-limit before any external call
  const { success } = await ratelimit.limit(userId)
  if (!success) throw new Error('Too many requests')

  // Fetch invoice (always filter by userId)
  const invoice = await getInvoiceForUser(invoiceId, userId)

  const { data, error } = await resend.emails.send({
    from: 'Håndværk Pro <noreply@haandvaerkpro.dk>',
    to: [invoice.customerEmail],
    subject: `Faktura ${invoice.invoiceNumber}`,
    react: InvoiceSentEmail({
      customerName: invoice.customerName,
      invoiceNumber: invoice.invoiceNumber,
      amountDKK: formatDKK(invoice.totalAmount),
      dueDate: invoice.dueDate,
      pdfUrl: invoice.pdfUrl,
    }),
  })

  if (error) throw new Error(`Email failed: ${error.message}`)

  // Store email ID for audit trail
  await db.update(invoices)
    .set({ lastEmailId: data.id, lastEmailSentAt: new Date() })
    .where(eq(invoices.id, invoiceId))
}
```

---

## ATTACHMENT PATTERN (PDF)

```typescript
// When attaching a PDF buffer from @react-pdf/renderer
const pdfBuffer = await renderToBuffer(<InvoicePdf invoice={invoice} />)

await resend.emails.send({
  from: 'Håndværk Pro <noreply@haandvaerkpro.dk>',
  to: [invoice.customerEmail],
  subject: `Faktura ${invoice.invoiceNumber}`,
  react: InvoiceSentEmail({ ... }),
  attachments: [
    {
      filename: `faktura-${invoice.invoiceNumber}.pdf`,
      content: pdfBuffer,
    },
  ],
})
```

---

## SCHEDULED EMAIL (payment reminders)

```typescript
// Schedule up to 30 days out
await resend.emails.send({
  from: 'Håndværk Pro <noreply@haandvaerkpro.dk>',
  to: [customer.email],
  subject: 'Betalingspåmindelse',
  react: PaymentReminderEmail({ ... }),
  scheduledAt: reminderDate.toISOString(), // ISO 8601
})
```

---

## ERROR HANDLING

```typescript
const { data, error } = await resend.emails.send({ ... })

if (error) {
  // error.name: 'validation_error' | 'missing_required_field' | etc.
  console.error('Resend error:', error)
  throw new Error(error.message)
}
// data.id is the Resend message ID — store it
```

---

## GDPR CHECKLIST

- [ ] Email addresses stored in Neon DB with `userId` FK — deleted on account deletion.
- [ ] Do not include customer PII (address, CVR) in subject lines.
- [ ] Log `data.id` so emails can be traced for data subject requests.
- [ ] Provide unsubscribe link in marketing emails (not required for transactional).
- [ ] Use EU region if available (check Resend dashboard for region selection).
