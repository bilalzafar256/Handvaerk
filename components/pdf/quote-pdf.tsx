import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"
import { formatDKK } from "@/lib/utils/currency"

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
  vatNote: {
    fontSize: 8,
    color: colors.secondary,
    marginTop: 8,
    textAlign: "right",
  },
})

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  markupPercent?: number
}

interface QuotePdfProps {
  quoteNumber: string
  quoteDate: string
  validUntil?: string
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
  }
  lineItems: LineItem[]
  notes?: string
  discountType?: string
  discountValue?: number
}

function fmtDate(d: string): string {
  const date = new Date(d)
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`
}

export function QuotePdf({
  quoteNumber,
  quoteDate,
  validUntil,
  company,
  customer,
  lineItems,
  notes,
  discountType,
  discountValue = 0,
}: QuotePdfProps) {
  const subtotal = lineItems.reduce((s, i) => {
    const markup = 1 + (i.markupPercent ?? 0) / 100
    return s + i.quantity * i.unitPrice * markup
  }, 0)

  let discount = 0
  if (discountValue > 0) {
    discount = discountType === "percent" ? subtotal * (discountValue / 100) : discountValue
  }

  const afterDiscount = subtotal - discount

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
            <Text style={styles.title}>TILBUD</Text>
            <Text style={{ fontSize: 13, marginTop: 4, color: colors.secondary }}>{quoteNumber}</Text>
          </View>
        </View>

        {/* Addresses + dates */}
        <View style={{ flexDirection: "row", marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Tilbud til</Text>
            <Text style={{ fontWeight: 700, marginBottom: 2 }}>{customer.name}</Text>
            <Text style={{ color: colors.secondary }}>{customer.address}</Text>
            <Text style={{ color: colors.secondary }}>{customer.city}</Text>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={styles.label}>Tilbudsdato</Text>
            <Text style={styles.value}>{fmtDate(quoteDate)}</Text>
            {validUntil && (
              <>
                <Text style={styles.label}>Gyldig til</Text>
                <Text style={styles.value}>{fmtDate(validUntil)}</Text>
              </>
            )}
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
          {lineItems.map((item, i) => {
            const markup = 1 + (item.markupPercent ?? 0) / 100
            const lineTotal = item.quantity * item.unitPrice * markup
            return (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colUnit}>{formatDKK(item.unitPrice * markup)}</Text>
                <Text style={styles.colTotal}>{formatDKK(lineTotal)}</Text>
              </View>
            )
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          {discount > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={{ fontSize: 10, color: colors.secondary }}>Subtotal</Text>
                <Text style={{ fontSize: 10 }}>{formatDKK(subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={{ fontSize: 10, color: colors.secondary }}>
                  Rabat {discountType === "percent" ? `(${discountValue}%)` : ""}
                </Text>
                <Text style={{ fontSize: 10 }}>-{formatDKK(discount)}</Text>
              </View>
            </>
          )}
          <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: colors.primary, paddingTop: 4, marginTop: 4 }]}>
            <Text style={{ fontWeight: 700, fontSize: 12 }}>Total ekskl. moms</Text>
            <Text style={{ fontWeight: 700, fontSize: 12 }}>{formatDKK(afterDiscount)}</Text>
          </View>
        </View>
        <Text style={styles.vatNote}>* Priser er ekskl. moms (25%)</Text>

        {/* Notes */}
        {notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.label}>Bemærkninger</Text>
            <Text style={{ color: colors.secondary }}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{company.name} · CVR: {company.cvr}</Text>
          <Text>{quoteNumber}</Text>
        </View>
      </Page>
    </Document>
  )
}
