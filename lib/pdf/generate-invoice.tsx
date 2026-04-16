import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePdf } from "@/components/pdf/invoice-pdf"

interface GenerateInvoicePdfProps {
  invoiceNumber:   string
  issueDate:       string
  dueDate:         string
  isCreditNote?:   boolean
  companyName:     string
  companyAddress:  string
  companyCity:     string
  companyCvr:      string
  companyLogoUrl?: string
  customerName:    string
  customerAddress: string
  customerCity:    string
  customerEan?:    string
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>
  notes?:          string
  bankAccount?:    string
  mobilepayNumber?: string
}

export async function generateInvoicePdfBuffer(props: GenerateInvoicePdfProps): Promise<Buffer> {
  return renderToBuffer(
    <InvoicePdf
      invoiceNumber={props.invoiceNumber}
      issueDate={props.issueDate}
      dueDate={props.dueDate}
      isCreditNote={props.isCreditNote}
      company={{
        name:     props.companyName,
        address:  props.companyAddress,
        city:     props.companyCity,
        cvr:      props.companyCvr,
        logoUrl:  props.companyLogoUrl,
      }}
      customer={{
        name:    props.customerName,
        address: props.customerAddress,
        city:    props.customerCity,
        ean:     props.customerEan,
      }}
      lineItems={props.lineItems}
      notes={props.notes}
      bankAccount={props.bankAccount}
      mobilepayNumber={props.mobilepayNumber}
    />
  )
}
