"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { LayoutTemplate, ChevronDown, BookOpen, Search } from "lucide-react"
import { createQuoteAction, updateQuoteAction } from "@/lib/actions/quotes"
import { LineItemBuilder, type LineItem } from "@/components/shared/line-item-builder"
import type { Quote, QuoteItem, QuoteTemplate } from "@/lib/db/schema/quotes"
import type { Customer } from "@/lib/db/schema/customers"
import type { Job } from "@/lib/db/schema/jobs"
import type { PricebookItem } from "@/lib/db/schema/pricebook"

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
  pricebookItems?: PricebookItem[]
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

function PricebookPicker({
  items,
  onAdd,
}: {
  items: PricebookItem[]
  onAdd: (item: PricebookItem) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const filtered = items
    .filter(i =>
      i.isActive !== false && (
        !query ||
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.description?.toLowerCase().includes(query.toLowerCase()) ||
        i.category?.toLowerCase().includes(query.toLowerCase())
      )
    )
    .sort((a, b) => (b.isFavourite ? 1 : 0) - (a.isFavourite ? 1 : 0))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setQuery("") }}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer hover:bg-[var(--accent)]"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
      >
        <BookOpen className="w-3.5 h-3.5" />
        From pricebook
      </button>
      {open && (
        <div
          className="absolute z-30 right-0 mt-1 w-72 rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="p-2 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search items…"
                className="w-full h-8 pl-7 pr-3 rounded-lg border text-sm focus:outline-none transition-colors"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", fontFamily: "var(--font-body)", color: "var(--foreground)", outline: "none" }}
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-xs text-center" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                {items.length === 0 ? "No items in pricebook yet" : "No matches"}
              </li>
            ) : filtered.map(item => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => { onAdd(item); setOpen(false); setQuery("") }}
                  className="w-full text-left px-3 py-2.5 hover:bg-[var(--accent)] transition-colors cursor-pointer flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      {item.isFavourite && <span style={{ color: "oklch(0.65 0.15 55)", fontSize: "10px" }}>★</span>}
                      <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{item.name}</p>
                    </div>
                    <p className="text-xs truncate" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                      {[item.category, item.description].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                    {parseFloat(item.unitPrice).toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kr
                    {item.unit && <span className="text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>/{item.unit}</span>}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function QuoteForm({
  quote,
  customers,
  jobs,
  templates,
  pricebookItems = [],
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
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls} style={{ fontFamily: "var(--font-body)", color: "var(--foreground)", marginBottom: 0 }}>
            Line items
          </label>
          {pricebookItems.length > 0 && (
            <PricebookPicker
              items={pricebookItems}
              onAdd={item => setItems(prev => [
                ...prev,
                {
                  id:            crypto.randomUUID(),
                  itemType:      (item.itemType ?? "material") as LineItem["itemType"],
                  description:   item.name,
                  quantity:      item.defaultQuantity ?? "1",
                  unitPrice:     item.unitPrice,
                  markupPercent: item.defaultMarkupPercent ?? "",
                  discountType:  "",
                  discountValue: "",
                  vatRate:       "25.00",
                  sortOrder:     prev.length,
                },
              ])}
            />
          )}
        </div>
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
