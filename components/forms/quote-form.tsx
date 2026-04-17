"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { LayoutTemplate, ChevronDown } from "lucide-react"
import { createQuoteAction, updateQuoteAction } from "@/lib/actions/quotes"
import { LineItemBuilder, type LineItem } from "@/components/shared/line-item-builder"
import type { Quote, QuoteItem, QuoteTemplate } from "@/lib/db/schema/quotes"
import type { Customer } from "@/lib/db/schema/customers"
import type { Job } from "@/lib/db/schema/jobs"

function defaultValidUntil(days = 15): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

interface QuoteFormProps {
  quote?: Quote & { items: QuoteItem[] }
  customers: Pick<Customer, "id" | "name">[]
  jobs?: Pick<Job, "id" | "title" | "jobNumber">[]
  templates?: Pick<QuoteTemplate, "id" | "name" | "items">[]
  defaultJobId?: string
  defaultCustomerId?: string
}

const inputCls = `
  w-full h-12 px-4
  bg-[var(--background)] text-[var(--foreground)]
  border border-[var(--border)]
  rounded-lg
  placeholder:opacity-50
  focus:outline-none focus:ring-2
  transition-colors duration-150 text-base
`
const labelCls = "block text-sm font-medium mb-1.5"

function toLineItems(items: QuoteItem[]): LineItem[] {
  return items.map((item, i) => ({
    id:             item.id,
    itemType:       item.itemType as LineItem["itemType"],
    description:    item.description,
    quantity:       item.quantity ?? "",
    unitPrice:      item.unitPrice ?? "",
    markupPercent:  item.markupPercent ?? "",
    discountType:   (item.discountType as LineItem["discountType"]) ?? "",
    discountValue:  item.discountValue ?? "",
    vatRate:        item.vatRate ?? "25.00",
    sortOrder:      item.sortOrder ?? i,
  }))
}

// Template items are stored as JSONB — same shape as QuoteItem[]
type TemplateItem = {
  itemType: string
  description: string
  quantity?: string | null
  unitPrice?: string | null
  markupPercent?: string | null
  discountType?: string | null
  discountValue?: string | null
  vatRate?: string | null
  sortOrder?: number | null
}

function templateItemsToLineItems(raw: unknown): LineItem[] {
  if (!Array.isArray(raw)) return []
  return (raw as TemplateItem[]).map((item, i) => ({
    id:             crypto.randomUUID(),
    itemType:       (item.itemType ?? "labour") as LineItem["itemType"],
    description:    item.description ?? "",
    quantity:       item.quantity ?? "",
    unitPrice:      item.unitPrice ?? "",
    markupPercent:  item.markupPercent ?? "",
    discountType:   (item.discountType as LineItem["discountType"]) ?? "",
    discountValue:  item.discountValue ?? "",
    vatRate:        item.vatRate ?? "25.00",
    sortOrder:      item.sortOrder ?? i,
  }))
}

export function QuoteForm({
  quote,
  customers,
  jobs,
  templates,
  defaultJobId,
  defaultCustomerId,
}: QuoteFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const [customerId, setCustomerId]       = useState(quote?.customerId ?? defaultCustomerId ?? "")
  const [jobId, setJobId]                 = useState(quote?.jobId ?? defaultJobId ?? "")
  // Always default to +14 days for new quotes; keep existing value when editing
  const [validUntil, setValidUntil]       = useState(quote?.validUntil ?? defaultValidUntil(15))
  const [discountType, setDiscountType]   = useState<"percent" | "fixed" | "">(
    (quote?.discountType as "percent" | "fixed") ?? ""
  )
  const [discountValue, setDiscountValue] = useState(quote?.discountValue ?? "")
  const [notes, setNotes]                 = useState(quote?.notes ?? "")
  const [internalNotes, setInternalNotes] = useState(quote?.internalNotes ?? "")
  const [items, setItems]                 = useState<LineItem[]>(
    quote ? toLineItems(quote.items) : []
  )

  function applyTemplate(template: Pick<QuoteTemplate, "id" | "name" | "items">) {
    setItems(templateItemsToLineItems(template.items))
    // Clear contextual fields — user picks these fresh per-quote
    setCustomerId(defaultCustomerId ?? "")
    setJobId(defaultJobId ?? "")
    setValidUntil(defaultValidUntil(15))
    setShowTemplates(false)
    toast.success(`Template "${template.name}" loaded`)
  }

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
        items: items
          .filter(item => item.description.trim().length > 0)
          .map((item, i) => ({
            itemType:      item.itemType,
            description:   item.description,
            quantity:      item.quantity || undefined,
            unitPrice:     item.unitPrice || undefined,
            markupPercent: item.markupPercent || undefined,
            discountType:  item.discountType || undefined,
            discountValue: item.discountValue || undefined,
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

      {/* Template picker — only on new quotes if templates exist */}
      {!quote && templates && templates.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplates(v => !v)}
            className="w-full h-11 px-4 flex items-center justify-between rounded-[--radius-sm] border text-sm font-medium transition-colors duration-150 cursor-pointer"
            style={{
              backgroundColor: "var(--accent-light)",
              borderColor: "var(--primary)",
              color: "var(--primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            <span className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" />
              Use a template
            </span>
            <ChevronDown
              className="w-4 h-4 transition-transform duration-150"
              style={{ transform: showTemplates ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>
          {showTemplates && (
            <div
              className="absolute z-20 left-0 right-0 mt-1 rounded-[--radius-md] border shadow-lg overflow-hidden"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
            >
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors duration-100 hover:bg-[var(--accent)] cursor-pointer"
                  style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
                >
                  <LayoutTemplate className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Customer */}
      <div>
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
          Customer <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className={inputCls}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
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
          <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
            Link to job (optional)
          </label>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className={inputCls}
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
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
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
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
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
          Discount
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed" | "")}
            className={inputCls}
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
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
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
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
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
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
        <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
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
