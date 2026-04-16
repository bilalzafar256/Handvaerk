"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { createInvoiceAction, updateInvoiceAction } from "@/lib/actions/invoices"
import { LineItemBuilder, type LineItem } from "@/components/shared/line-item-builder"
import type { Invoice, InvoiceItem } from "@/lib/db/schema/invoices"
import type { Customer } from "@/lib/db/schema/customers"

interface InvoiceFormProps {
  invoice?: Invoice & { items: InvoiceItem[] }
  customers: Pick<Customer, "id" | "name">[]
  defaultCustomerId?: string
  defaultJobId?: string
  defaultQuoteId?: string
}

const inputCls = `
  w-full h-12 px-4
  bg-[--surface] text-[--text-primary]
  border border-[--border]
  rounded-[--radius-sm]
  placeholder:text-[--text-tertiary]
  focus:outline-none focus:border-[--primary]
  focus:ring-2 focus:ring-[--primary]/20
  transition-colors duration-150 text-base
`
const labelCls = "block text-sm font-medium mb-1.5"

function toLineItems(items: InvoiceItem[]): LineItem[] {
  return items.map((item, i) => ({
    id:          item.id,
    itemType:    item.itemType as LineItem["itemType"],
    description: item.description,
    quantity:    item.quantity ?? "",
    unitPrice:   item.unitPrice ?? "",
    vatRate:     item.vatRate ?? "25.00",
    sortOrder:   item.sortOrder ?? i,
  }))
}

function defaultDueDate(days = 14): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

export function InvoiceForm({
  invoice,
  customers,
  defaultCustomerId,
  defaultJobId,
  defaultQuoteId,
}: InvoiceFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [customerId, setCustomerId]         = useState(invoice?.customerId ?? defaultCustomerId ?? "")
  const [dueDate, setDueDate]               = useState(invoice?.dueDate ?? defaultDueDate(14))
  const [paymentTermsDays, setPaymentTermsDays] = useState(invoice?.paymentTermsDays ?? 14)
  const [bankAccount, setBankAccount]       = useState(invoice?.bankAccount ?? "")
  const [mobilepayNumber, setMobilepayNumber] = useState(invoice?.mobilepayNumber ?? "")
  const [notes, setNotes]                   = useState(invoice?.notes ?? "")
  const [items, setItems]                   = useState<LineItem[]>(
    invoice ? toLineItems(invoice.items) : []
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { toast.error("Please select a customer"); return }
    if (!dueDate) { toast.error("Due date is required"); return }

    setSaving(true)
    try {
      const data = {
        customerId,
        jobId:            defaultJobId || undefined,
        quoteId:          defaultQuoteId || undefined,
        dueDate,
        paymentTermsDays,
        bankAccount:      bankAccount || undefined,
        mobilepayNumber:  mobilepayNumber || undefined,
        notes:            notes || undefined,
        items: items
          .filter(item => item.description.trim().length > 0)
          .map((item, i) => ({
            itemType:    item.itemType,
            description: item.description,
            quantity:    item.quantity || undefined,
            unitPrice:   item.unitPrice || undefined,
            vatRate:     item.vatRate,
            lineTotal:   undefined,
            sortOrder:   i,
          })),
      }

      if (invoice) {
        await updateInvoiceAction(invoice.id, data)
        toast.success("Invoice updated")
        router.push(`/invoices/${invoice.id}`)
      } else {
        const { id } = await createInvoiceAction(data)
        toast.success("Invoice created")
        router.push(`/invoices/${id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save invoice")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-4 pb-10">
      {/* Customer */}
      <div>
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
          Customer <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className={inputCls}
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
        >
          <option value="">Select customer…</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Due date + payment terms */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
            Due date <span style={{ color: "var(--error)" }}>*</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
            Payment terms (days)
          </label>
          <select
            value={paymentTermsDays}
            onChange={(e) => {
              const days = parseInt(e.target.value)
              setPaymentTermsDays(days)
              setDueDate(defaultDueDate(days))
            }}
            className={inputCls}
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
          >
            <option value={8}>Net 8</option>
            <option value={14}>Net 14</option>
            <option value={30}>Net 30</option>
            <option value={45}>Net 45</option>
          </select>
        </div>
      </div>

      {/* Line items */}
      <div>
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
          Line items
        </label>
        <LineItemBuilder items={items} onChange={setItems} />
      </div>

      {/* Payment info */}
      <div>
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
          Bank account (optional)
        </label>
        <input
          type="text"
          value={bankAccount}
          onChange={(e) => setBankAccount(e.target.value)}
          placeholder="e.g. 1234-5678901234"
          className={inputCls}
          style={{ fontFamily: "var(--font-mono)" }}
        />
      </div>

      <div>
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
          MobilePay number (optional)
        </label>
        <input
          type="text"
          value={mobilepayNumber}
          onChange={(e) => setMobilepayNumber(e.target.value)}
          placeholder="e.g. 12345678"
          className={inputCls}
          style={{ fontFamily: "var(--font-mono)" }}
        />
        <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
          MobilePay Erhverv payment links coming soon.
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Payment instructions, references, etc."
          className={`${inputCls} h-auto py-3 resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 px-6 rounded-[--radius-md] font-medium text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          fontFamily: "var(--font-body)",
          boxShadow: "var(--shadow-accent)",
        }}
      >
        {saving ? "Saving…" : invoice ? "Update invoice" : "Create invoice"}
      </button>
    </form>
  )
}
