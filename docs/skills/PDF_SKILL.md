# SKILL: @react-pdf/renderer — PDF Generation
> Source: https://react-pdf.org
> Package: `@react-pdf/renderer`

---

## PROJECT-SPECIFIC RULES

- PDFs are always generated **server-side** (Inngest functions or Server Actions) — never in the browser.
- Use `renderToBuffer()` for Inngest jobs that upload to Vercel Blob.
- Use `renderToStream()` for direct HTTP streaming in Route Handlers.
- All money display in PDFs uses `formatDKK()` from `lib/utils/currency.ts` — no exceptions.
- All PDF templates live in `components/pdf/`.
- Danish locale for date formatting in PDFs: `dd.mm.yyyy`.
- Include required Danish VAT fields on invoices: CVR number, VAT amount (25%), EAN if applicable.
- PDFs must include: company logo, company address, customer address, invoice/quote number, issue date, due date, line items, subtotal, VAT (25%), total.
- Mark quotes as "TILBUD" and invoices as "FAKTURA" prominently.

---

## INSTALLATION

```bash
npm install @react-pdf/renderer
```

Register fonts once in `lib/pdf/fonts.ts`:

```typescript
// lib/pdf/fonts.ts
import { Font } from '@react-pdf/renderer'

Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Inter-Medium.ttf', fontWeight: 500 },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 700 },
  ],
})
```

---

## INVOICE PDF TEMPLATE

```tsx
// components/pdf/invoice-pdf.tsx
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { formatDKK } from '@/lib/utils/currency'
import '@/lib/pdf/fonts'  // register fonts

const VAT_RATE = 0.25

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1a1a1a',
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#111',
  },
  label: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 10,
    marginBottom: 8,
  },
  table: {
    marginTop: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: '8 6',
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '6 6',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totalsSection: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 4,
  },
  totalLabel: { fontSize: 10, color: '#444' },
  totalValue: { fontSize: 10 },
  grandTotal: {
    fontWeight: 700,
    fontSize: 12,
    borderTopWidth: 1,
    borderTopColor: '#111',
    paddingTop: 4,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

interface LineItem {
  description: string
  quantity: number
  unitPrice: number // in øre
}

interface InvoicePdfProps {
  invoiceNumber: string
  issueDate: string     // formatted: dd.mm.yyyy
  dueDate: string
  company: {
    name: string
    address: string
    city: string
    cvr: string
    logoUrl?: string
  }
  customer: {
    name: string
    address: string
    city: string
    ean?: string
  }
  lineItems: LineItem[]
  notes?: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

export function InvoicePdf({
  invoiceNumber,
  issueDate,
  dueDate,
  company,
  customer,
  lineItems,
  notes,
}: InvoicePdfProps) {
  const subtotalOre = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const vatOre = Math.round(subtotalOre * VAT_RATE)
  const totalOre = subtotalOre + vatOre

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {company.logoUrl && (
              <Image src={company.logoUrl} style={styles.logo} />
            )}
            <Text style={{ fontWeight: 700, marginTop: 4 }}>{company.name}</Text>
            <Text style={{ color: '#666' }}>{company.address}</Text>
            <Text style={{ color: '#666' }}>{company.city}</Text>
            <Text style={{ color: '#666' }}>CVR: {company.cvr}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.title}>FAKTURA</Text>
            <Text style={{ fontSize: 12, marginTop: 4 }}>{invoiceNumber}</Text>
          </View>
        </View>

        {/* Addresses + meta */}
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Faktureres til</Text>
            <Text style={styles.value}>{customer.name}</Text>
            <Text style={{ color: '#666' }}>{customer.address}</Text>
            <Text style={{ color: '#666' }}>{customer.city}</Text>
            {customer.ean && (
              <Text style={{ color: '#666' }}>EAN: {customer.ean}</Text>
            )}
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.label}>Fakturadato</Text>
            <Text style={styles.value}>{formatDate(issueDate)}</Text>
            <Text style={styles.label}>Forfaldsdato</Text>
            <Text style={styles.value}>{formatDate(dueDate)}</Text>
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Beskrivelse</Text>
            <Text style={styles.colQty}>Antal</Text>
            <Text style={styles.colUnit}>Enhedspris</Text>
            <Text style={styles.colTotal}>Beløb</Text>
          </View>
          {lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{formatDKK(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>
                {formatDKK(item.quantity * item.unitPrice)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal ekskl. moms</Text>
            <Text style={styles.totalValue}>{formatDKK(subtotalOre)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Moms (25%)</Text>
            <Text style={styles.totalValue}>{formatDKK(vatOre)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total inkl. moms</Text>
            <Text>{formatDKK(totalOre)}</Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>Bemærkninger</Text>
            <Text style={{ color: '#444' }}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{company.name} · CVR: {company.cvr}</Text>
          <Text>{invoiceNumber}</Text>
        </View>
      </Page>
    </Document>
  )
}
```

---

## RENDERING PATTERNS

### Server-side buffer (for Vercel Blob upload)

```typescript
// Used in Inngest functions
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePdf } from '@/components/pdf/invoice-pdf'

const buffer = await renderToBuffer(<InvoicePdf {...invoiceProps} />)
// → Buffer — pass to Vercel Blob put()
```

### HTTP stream (for direct download)

```typescript
// app/api/invoices/[id]/pdf/route.ts
import { renderToStream } from '@react-pdf/renderer'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const invoice = await getInvoiceForUser(params.id, userId)
  if (!invoice) return new Response('Not found', { status: 404 })

  const stream = await renderToStream(
    <InvoicePdf {...buildInvoiceProps(invoice)} />
  )

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="faktura-${invoice.invoiceNumber}.pdf"`,
    },
  })
}
```

---

## QUOTE PDF (diff from invoice)

```tsx
// components/pdf/quote-pdf.tsx
// Same structure as InvoicePdf with these changes:
// - Title: "TILBUD" instead of "FAKTURA"
// - "Tilbudsdato" instead of "Fakturadato"
// - "Gyldig til" (valid until) instead of "Forfaldsdato"
// - No VAT on quotes (show subtotal only, note "Priser er ekskl. moms")
// - Add "Tilbudsnummer" field
```

---

## STYLESHEET NOTES

- `@react-pdf/renderer` uses a subset of CSS — no grid, no CSS variables.
- Use `flexDirection: 'row'` for horizontal layouts (Flexbox only).
- Fonts must be registered before rendering — do it once in `lib/pdf/fonts.ts`.
- `position: 'absolute'` works for footers with `fixed` prop on View.
- `objectFit` works on `<Image />` for logos.
- No `rem`/`em` — use numeric pixel values.
- Text wraps automatically; use `numberOfLines` to truncate.

---

## COMPONENT REFERENCE

| Component | Use |
|---|---|
| `<Document>` | Root wrapper |
| `<Page size="A4">` | A4 page |
| `<View>` | Layout container (div equivalent) |
| `<Text>` | All text content |
| `<Image src={url}>` | Logo, images (URL or base64) |
| `<Link src={url}>` | Clickable links in PDF |
| `StyleSheet.create({})` | Define styles (like React Native) |

---

## DANISH INVOICE LEGAL REQUIREMENTS

Invoices must include:
- [ ] Seller CVR number (`CVR: 12345678`)
- [ ] Sequential invoice number
- [ ] Issue date (fakturadato)
- [ ] Due date (forfaldsdato) — typically net 14 or net 30
- [ ] Buyer name and address
- [ ] Description of goods/services
- [ ] Unit price excluding VAT
- [ ] VAT amount (25%)
- [ ] Total including VAT
- [ ] EAN number if billing a public institution
