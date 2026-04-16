"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CheckCircle, XCircle, Download } from "lucide-react"
import { formatDKK } from "@/lib/utils/currency"
import { acceptQuoteByTokenAction, rejectQuoteByTokenAction } from "@/lib/actions/quotes"
import type { Quote, QuoteItem } from "@/lib/db/schema/quotes"
import type { Customer } from "@/lib/db/schema/customers"
import type { User } from "@/lib/db/schema/users"

type QuoteWithRelations = Quote & {
  customer: Customer
  items: QuoteItem[]
  user?: User | null
}

export function PublicQuoteView({ quote }: { quote: QuoteWithRelations }) {
  const [status, setStatus] = useState(quote.status ?? "sent")
  const [busy, setBusy]     = useState(false)

  const subtotal = quote.items.reduce((s, item) => {
    const qty    = parseFloat(item.quantity ?? "1")
    const price  = parseFloat(item.unitPrice ?? "0")
    const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
    return s + qty * price * markup
  }, 0)

  let discount = 0
  if (quote.discountValue && parseFloat(quote.discountValue) > 0) {
    discount = quote.discountType === "percent"
      ? subtotal * (parseFloat(quote.discountValue) / 100)
      : parseFloat(quote.discountValue)
  }
  const afterDiscount = subtotal - discount

  async function handleAccept() {
    setBusy(true)
    try {
      await acceptQuoteByTokenAction(quote.shareToken!)
      setStatus("accepted")
      toast.success("Tilbud accepteret!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Noget gik galt")
    } finally {
      setBusy(false)
    }
  }

  async function handleReject() {
    setBusy(true)
    try {
      await rejectQuoteByTokenAction(quote.shareToken!)
      setStatus("rejected")
      toast.success("Tilbud afvist")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Noget gik galt")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="rounded-[--radius-xl] border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                TILBUD
              </h1>
              <p className="text-lg font-medium mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                {quote.quoteNumber}
              </p>
            </div>
            {status === "accepted" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-[--radius-pill]" style={{ backgroundColor: "var(--status-paid-bg)", color: "var(--status-paid-text)" }}>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>Accepteret</span>
              </div>
            )}
            {status === "rejected" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-[--radius-pill]" style={{ backgroundColor: "var(--status-overdue-bg)", color: "var(--status-overdue-text)" }}>
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>Afvist</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4" style={{ borderColor: "var(--border)" }}>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Fra</p>
              {quote.user && (
                <>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{quote.user.companyName}</p>
                  {quote.user.cvrNumber && <p className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>CVR: {quote.user.cvrNumber}</p>}
                </>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Til</p>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{quote.customer.name}</p>
            </div>
          </div>

          {quote.validUntil && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Gyldig til</p>
              <p className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                {new Date(quote.validUntil).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          )}
        </div>

        {/* Line items */}
        <div className="rounded-[--radius-xl] border overflow-hidden" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 py-3 border-b" style={{ backgroundColor: "var(--background-subtle)", borderColor: "var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Ydelser</p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {quote.items.map(item => {
              const qty    = parseFloat(item.quantity ?? "1")
              const price  = parseFloat(item.unitPrice ?? "0")
              const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
              const line   = qty * price * markup
              return (
                <div key={item.id} className="px-5 py-4 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>{item.description}</p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                      {qty} {item.itemType === "labour" ? "timer" : "stk."} × {formatDKK(price * markup)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {formatDKK(line)}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Totals */}
          <div className="px-5 py-4 border-t space-y-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}>
            {discount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Subtotal</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{formatDKK(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Rabat</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--error)" }}>-{formatDKK(discount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-semibold text-base pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <span style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>Total ekskl. moms</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{formatDKK(afterDiscount)}</span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
              Inkl. 25% moms: {formatDKK(afterDiscount * 1.25)}
            </p>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="rounded-[--radius-lg] border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Bemærkninger</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{quote.notes}</p>
          </div>
        )}

        {/* Accept / Reject */}
        {status === "sent" && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleReject}
              disabled={busy}
              className="h-14 flex items-center justify-center gap-2 rounded-[--radius-md] border font-semibold text-base transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-body)", backgroundColor: "var(--surface)" }}
            >
              <XCircle className="w-5 h-5" />
              Afvis
            </button>
            <button
              onClick={handleAccept}
              disabled={busy}
              className="h-14 flex items-center justify-center gap-2 rounded-[--radius-md] font-semibold text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-accent)" }}
            >
              <CheckCircle className="w-5 h-5" />
              Accepter tilbud
            </button>
          </div>
        )}

        {status === "accepted" && (
          <div className="rounded-[--radius-md] p-5 text-center" style={{ backgroundColor: "var(--status-paid-bg)", borderColor: "var(--status-paid-border)" }}>
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--status-paid-text)" }} />
            <p className="font-semibold" style={{ color: "var(--status-paid-text)", fontFamily: "var(--font-display)" }}>Tilbud accepteret</p>
            <p className="text-sm mt-1" style={{ color: "var(--status-paid-text)", fontFamily: "var(--font-body)" }}>Vi tager kontakt snarest.</p>
          </div>
        )}

        {status === "rejected" && (
          <div className="rounded-[--radius-md] p-5 text-center" style={{ backgroundColor: "var(--status-overdue-bg)" }}>
            <XCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--status-overdue-text)" }} />
            <p className="font-semibold" style={{ color: "var(--status-overdue-text)", fontFamily: "var(--font-display)" }}>Tilbud afvist</p>
          </div>
        )}

        {/* Expired */}
        {(status === "expired" || status === "draft") && (
          <div className="rounded-[--radius-md] p-5 text-center" style={{ backgroundColor: "var(--background-subtle)" }}>
            <p className="font-semibold" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>Dette tilbud er ikke længere tilgængeligt</p>
          </div>
        )}
      </div>
    </div>
  )
}
