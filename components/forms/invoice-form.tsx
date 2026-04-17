"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { FileText, ChevronDown, Check, X } from "lucide-react"
import { createInvoiceAction, updateInvoiceAction } from "@/lib/actions/invoices"
import { LineItemBuilder, type LineItem } from "@/components/shared/line-item-builder"
import type { Invoice, InvoiceItem } from "@/lib/db/schema/invoices"
import type { Customer } from "@/lib/db/schema/customers"
import type { Quote, QuoteItem } from "@/lib/db/schema/quotes"

type QuoteForImport = Pick<Quote, "id" | "quoteNumber" | "status"> & { items: QuoteItem[] }

interface InvoiceFormProps {
  invoice?: Invoice & { items: InvoiceItem[] }
  customers: Pick<Customer, "id" | "name">[]
  /** All quotes keyed by customerId — used for the "load from quotes" picker */
  quotesByCustomer?: Record<string, QuoteForImport[]>
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
    id:            item.id,
    itemType:      item.itemType as LineItem["itemType"],
    description:   item.description,
    quantity:      item.quantity ?? "",
    unitPrice:     item.unitPrice ?? "",
    discountType:  (item.discountType as LineItem["discountType"]) ?? "",
    discountValue: item.discountValue ?? "",
    vatRate:       item.vatRate ?? "25.00",
    sortOrder:     item.sortOrder ?? i,
  }))
}

function quoteItemsToLineItems(items: QuoteItem[]): LineItem[] {
  return items.map((item, i) => ({
    id:            crypto.randomUUID(),
    itemType:      (item.itemType ?? "labour") as LineItem["itemType"],
    description:   item.description,
    quantity:      item.quantity ?? "",
    unitPrice:     item.unitPrice ?? "",
    discountType:  (item.discountType as LineItem["discountType"]) ?? "",
    discountValue: item.discountValue ?? "",
    vatRate:       item.vatRate ?? "25.00",
    sortOrder:     i,
  }))
}

function defaultDueDate(days = 15): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

export function InvoiceForm({
  invoice,
  customers,
  quotesByCustomer = {},
  defaultCustomerId,
  defaultJobId,
  defaultQuoteId,
}: InvoiceFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [showQuotePicker, setShowQuotePicker] = useState(false)
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([])
  // Track the first selected quoteId (stored as FK)
  const [linkedQuoteId, setLinkedQuoteId] = useState<string | undefined>(defaultQuoteId)

  const [customerId, setCustomerId]           = useState(invoice?.customerId ?? defaultCustomerId ?? "")
  const [dueDate, setDueDate]                 = useState(invoice?.dueDate ?? defaultDueDate(15))
  const [paymentTermsDays, setPaymentTermsDays] = useState(invoice?.paymentTermsDays ?? 14)
  const [bankAccount, setBankAccount]         = useState(invoice?.bankAccount ?? "")
  const [mobilepayNumber, setMobilepayNumber] = useState(invoice?.mobilepayNumber ?? "")
  const [notes, setNotes]                     = useState(invoice?.notes ?? "")
  const [items, setItems]                     = useState<LineItem[]>(
    invoice ? toLineItems(invoice.items) : []
  )

  // Quotes available for the currently selected customer
  const availableQuotes = customerId ? (quotesByCustomer[customerId] ?? []) : []

  function toggleQuoteSelection(quote: QuoteForImport) {
    setSelectedQuoteIds(prev =>
      prev.includes(quote.id) ? prev.filter(id => id !== quote.id) : [...prev, quote.id]
    )
  }

  function applySelectedQuotes() {
    if (selectedQuoteIds.length === 0) { setShowQuotePicker(false); return }

    const selectedQuotes = availableQuotes.filter(q => selectedQuoteIds.includes(q.id))
    const newItems: LineItem[] = selectedQuotes.flatMap(q => quoteItemsToLineItems(q.items))

    setItems(prev => [...prev, ...newItems])
    // FK points to first selected quote
    setLinkedQuoteId(selectedQuoteIds[0])
    setShowQuotePicker(false)
    setSelectedQuoteIds([])
    toast.success(
      selectedQuotes.length === 1
        ? `Items from ${selectedQuotes[0].quoteNumber} added`
        : `Items from ${selectedQuotes.length} quotes added`
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { toast.error("Please select a customer"); return }
    if (!dueDate) { toast.error("Due date is required"); return }

    setSaving(true)
    try {
      const data = {
        customerId,
        jobId:            defaultJobId || undefined,
        quoteId:          linkedQuoteId || undefined,
        dueDate,
        paymentTermsDays,
        bankAccount:      bankAccount || undefined,
        mobilepayNumber:  mobilepayNumber || undefined,
        notes:            notes || undefined,
        items: items
          .filter(item => item.description.trim().length > 0)
          .map((item, i) => ({
            itemType:      item.itemType,
            description:   item.description,
            quantity:      item.quantity || undefined,
            unitPrice:     item.unitPrice || undefined,
            discountType:  item.discountType || undefined,
            discountValue: item.discountValue || undefined,
            vatRate:       item.vatRate,
            lineTotal:     undefined,
            sortOrder:     i,
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
          onChange={(e) => {
            setCustomerId(e.target.value)
            setShowQuotePicker(false)
            setSelectedQuoteIds([])
          }}
          className={inputCls}
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
        >
          <option value="">Select customer…</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Load from quotes — only on new invoices when customer has quotes */}
      {!invoice && customerId && availableQuotes.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowQuotePicker(v => !v)}
            className="w-full h-11 px-4 flex items-center justify-between rounded-[--radius-sm] border text-sm font-medium transition-colors duration-150 cursor-pointer"
            style={{
              backgroundColor: "var(--accent-light)",
              borderColor: "var(--primary)",
              color: "var(--primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Load items from quote{availableQuotes.length > 1 ? "s" : ""}
              {selectedQuoteIds.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
                  {selectedQuoteIds.length}
                </span>
              )}
            </span>
            <ChevronDown
              className="w-4 h-4 transition-transform duration-150"
              style={{ transform: showQuotePicker ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {showQuotePicker && (
            <div
              className="absolute z-20 left-0 right-0 mt-1 rounded-[--radius-md] border shadow-lg overflow-hidden"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
            >
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b" style={{ color: "var(--text-tertiary)", borderColor: "var(--border)", backgroundColor: "var(--background-subtle)", fontFamily: "var(--font-body)" }}>
                Select quotes to combine
              </p>
              {availableQuotes.map(q => {
                const selected = selectedQuoteIds.includes(q.id)
                const itemCount = q.items.length
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => toggleQuoteSelection(q)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-100 hover:bg-[--background-subtle] cursor-pointer"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
                      style={{
                        backgroundColor: selected ? "var(--primary)" : "transparent",
                        borderColor: selected ? "var(--primary)" : "var(--border)",
                      }}
                    >
                      {selected && <Check className="w-3 h-3" style={{ color: "var(--primary-foreground)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                        {q.quoteNumber}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {itemCount} item{itemCount !== 1 ? "s" : ""} · {q.status}
                      </p>
                    </div>
                  </button>
                )
              })}
              <div className="px-4 py-3 border-t flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={applySelectedQuotes}
                  disabled={selectedQuoteIds.length === 0}
                  className="flex-1 h-9 rounded-[--radius-sm] text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
                >
                  Add {selectedQuoteIds.length > 0 ? `${selectedQuoteIds.length} quote${selectedQuoteIds.length > 1 ? "s" : ""}` : "quotes"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowQuotePicker(false); setSelectedQuoteIds([]) }}
                  className="h-9 w-9 flex items-center justify-center rounded-[--radius-sm] border transition-colors cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
