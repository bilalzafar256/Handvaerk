"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { createQuoteAction, updateQuoteAction } from "@/lib/actions/quotes"
import { LineItemBuilder, type LineItem } from "@/components/shared/line-item-builder"
import type { Quote, QuoteItem } from "@/lib/db/schema/quotes"
import type { Customer } from "@/lib/db/schema/customers"
import type { Job } from "@/lib/db/schema/jobs"

interface QuoteFormProps {
  quote?: Quote & { items: QuoteItem[] }
  customers: Pick<Customer, "id" | "name">[]
  jobs?: Pick<Job, "id" | "title" | "jobNumber">[]
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

function toLineItems(items: QuoteItem[]): LineItem[] {
  return items.map((item, i) => ({
    id:            item.id,
    itemType:      item.itemType as LineItem["itemType"],
    description:   item.description,
    quantity:      item.quantity ?? "",
    unitPrice:     item.unitPrice ?? "",
    markupPercent: item.markupPercent ?? "",
    vatRate:       item.vatRate ?? "25.00",
    sortOrder:     item.sortOrder ?? i,
  }))
}

export function QuoteForm({ quote, customers, jobs }: QuoteFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [customerId, setCustomerId]     = useState(quote?.customerId ?? "")
  const [jobId, setJobId]               = useState(quote?.jobId ?? "")
  const [validUntil, setValidUntil]     = useState(quote?.validUntil ?? "")
  const [discountType, setDiscountType] = useState<"percent" | "fixed" | "">(
    (quote?.discountType as "percent" | "fixed") ?? ""
  )
  const [discountValue, setDiscountValue] = useState(quote?.discountValue ?? "")
  const [notes, setNotes]               = useState(quote?.notes ?? "")
  const [internalNotes, setInternalNotes] = useState(quote?.internalNotes ?? "")
  const [items, setItems]               = useState<LineItem[]>(
    quote ? toLineItems(quote.items) : []
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { toast.error("Please select a customer"); return }

    setSaving(true)
    try {
      const data = {
        customerId,
        jobId:         jobId || undefined,
        validUntil:    validUntil || undefined,
        discountType:  discountType || undefined,
        discountValue: discountValue || undefined,
        notes:         notes || undefined,
        internalNotes: internalNotes || undefined,
        items: items.map((item, i) => ({
          itemType:      item.itemType,
          description:   item.description,
          quantity:      item.quantity || undefined,
          unitPrice:     item.unitPrice || undefined,
          markupPercent: item.markupPercent || undefined,
          vatRate:       item.vatRate,
          sortOrder:     i,
        })),
      }

      if (quote) {
        await updateQuoteAction(quote.id, data)
        toast.success("Quote updated")
        router.push(`/quotes/${quote.id}`)
      } else {
        const { id } = await createQuoteAction(data)
        toast.success("Quote created")
        router.push(`/quotes/${id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save quote")
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

      {/* Link to job (optional) */}
      {jobs && jobs.length > 0 && (
        <div>
          <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
            Link to job (optional)
          </label>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className={inputCls}
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
          >
            <option value="">No linked job</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>#{j.jobNumber} — {j.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Valid until */}
      <div>
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
          Valid until
        </label>
        <input
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          className={inputCls}
        />
      </div>

      {/* Discount */}
      <div>
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
          Discount
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed" | "")}
            className={inputCls}
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
          >
            <option value="">No discount</option>
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed amount (kr.)</option>
          </select>
          {discountType && (
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "percent" ? "e.g. 10" : "e.g. 500"}
              min="0"
              step={discountType === "percent" ? "1" : "0.01"}
              className={inputCls}
              style={{ fontFamily: "var(--font-mono)" }}
            />
          )}
        </div>
      </div>

      {/* Line items */}
      <div>
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
          Line items
        </label>
        <LineItemBuilder
          items={items}
          onChange={setItems}
          showMarkup
        />
      </div>

      {/* Notes to customer */}
      <div>
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
          Notes (shown to customer)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Payment terms, scope of work, etc."
          className={`${inputCls} h-auto py-3 resize-none`}
        />
      </div>

      {/* Internal notes */}
      <div>
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
          Internal notes
        </label>
        <textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={2}
          placeholder="Not visible to customer"
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
        {saving ? "Saving…" : quote ? "Update quote" : "Create quote"}
      </button>
    </form>
  )
}
