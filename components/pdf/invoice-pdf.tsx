import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"
import { formatDKK } from "@/lib/utils/currency"

const VAT_RATE = 0.25

const colors = {
  primary:    "#1A1208",
  secondary:  "#6B5F4A",
  accent:     "#C87A1A",
  border:     "#DDD5C8",
  background: "#FDFCFA",
  muted:      "#F5F2ED",
}

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    color: colors.primary,
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 56,
    paddingRight: 56,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.primary,
  },
  label: {
    fontSize: 8,
    color: colors.secondary,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 10,
    marginBottom: 8,
  },
  table: {
    marginTop: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    padding: "8 6",
  },
  tableRow: {
    flexDirection: "row",
    padding: "7 6",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colDesc:  { flex: 3 },
  colQty:   { flex: 1, textAlign: "right" },
  colUnit:  { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  totalsSection: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    marginBottom: 4,
  },
  totalLabel: { fontSize: 10, color: colors.secondary },
  totalValue: { fontSize: 10 },
  grandTotal: {
    fontWeight: 700,
    fontSize: 12,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    paddingTop: 4,
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 56,
    right: 56,
    fontSize: 8,
    color: colors.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accentBar: {
    height: 3,
    backgroundColor: colors.accent,
    marginBottom: 32,
  },
})

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
}

interface InvoicePdfProps {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  isCreditNote?: boolean
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
  bankAccount?: string
  mobilepayNumber?: string
}

function fmtDate(d: string): string {
  const date = new Date(d)
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`
}

export function InvoicePdf({
  invoiceNumber,
  issueDate,
  dueDate,
  isCreditNote = false,
  company,
  customer,
  lineItems,
  notes,
  bankAccount,
  mobilepayNumber,
}: InvoicePdfProps) {
  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const vat = Math.round(subtotal * VAT_RATE * 100) / 100
  const total = subtotal + vat

  const docTitle = isCreditNote ? "KREDITNOTA" : "FAKTURA"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            {company.logoUrl && <Image src={company.logoUrl} style={styles.logo} />}
            <Text style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{company.name}</Text>
            <Text style={{ color: colors.secondary, marginTop: 2 }}>{company.address}</Text>
            <Text style={{ color: colors.secondary }}>{company.city}</Text>
            <Text style={{ color: colors.secondary }}>CVR: {company.cvr}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.title}>{docTitle}</Text>
            <Text style={{ fontSize: 13, marginTop: 4, color: colors.secondary }}>{invoiceNumber}</Text>
          </View>
        </View>

        {/* Addresses + dates */}
        <View style={{ flexDirection: "row", marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Faktureres til</Text>
            <Text style={{ fontWeight: 700, marginBottom: 2 }}>{customer.name}</Text>
            <Text style={{ color: colors.secondary }}>{customer.address}</Text>
            <Text style={{ color: colors.secondary }}>{customer.city}</Text>
            {customer.ean && <Text style={{ color: colors.secondary }}>EAN: {customer.ean}</Text>}
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={styles.label}>Fakturadato</Text>
            <Text style={styles.value}>{fmtDate(issueDate)}</Text>
            <Text style={styles.label}>Forfaldsdato</Text>
            <Text style={styles.value}>{fmtDate(dueDate)}</Text>
          </View>
        </View>

        {/* Line items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { fontWeight: 700 }]}>Beskrivelse</Text>
            <Text style={[styles.colQty, { fontWeight: 700 }]}>Antal</Text>
            <Text style={[styles.colUnit, { fontWeight: 700 }]}>Enhedspris</Text>
            <Text style={[styles.colTotal, { fontWeight: 700 }]}>Beløb</Text>
          </View>
          {lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{formatDKK(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatDKK(item.quantity * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal ekskl. moms</Text>
            <Text style={styles.totalValue}>{formatDKK(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Moms 25%</Text>
            <Text style={styles.totalValue}>{formatDKK(vat)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total inkl. moms</Text>
            <Text>{formatDKK(total)}</Text>
          </View>
        </View>

        {/* Payment info */}
        {(bankAccount || mobilepayNumber) && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>Betalingsoplysninger</Text>
            {bankAccount && <Text style={{ color: colors.secondary }}>Bankkonto: {bankAccount}</Text>}
            {mobilepayNumber && <Text style={{ color: colors.secondary }}>MobilePay: {mobilepayNumber}</Text>}
          </View>
        )}

        {/* Notes */}
        {notes && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Bemærkninger</Text>
            <Text style={{ color: colors.secondary }}>{notes}</Text>
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
