"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ExtractedJobRecord } from "@/lib/ai"
import { createCustomerAction } from "@/lib/actions/customers"
import { createJobAction } from "@/lib/actions/jobs"
import { createQuoteAction } from "@/lib/actions/quotes"
import { toast } from "sonner"
import { Plus, Trash2, Loader2 } from "lucide-react"
import type { Customer } from "@/lib/db/schema/customers"

type CustomerMode = "new" | "existing"

interface Props {
  customers: Customer[]
  initialData: ExtractedJobRecord
}

export function JobRecordingFlow({ customers, initialData }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Customer fields — pre-filled from AI extraction
  const [customerMode, setCustomerMode] = useState<CustomerMode>("new")
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [customerName, setCustomerName] = useState(initialData.customer.name)
  const [customerPhone, setCustomerPhone] = useState(initialData.customer.phone ?? "")
  const [customerEmail, setCustomerEmail] = useState(initialData.customer.email ?? "")
  const [customerAddress, setCustomerAddress] = useState(initialData.customer.address ?? "")

  // Job fields — pre-filled from AI extraction
  const [jobTitle, setJobTitle] = useState(initialData.job.title)
  const [jobDescription, setJobDescription] = useState(initialData.job.description)
  const [jobType, setJobType] = useState<"service" | "project" | "recurring">(initialData.job.jobType)
  const [scheduledDate, setScheduledDate] = useState(initialData.job.scheduledDate ?? "")
  const [jobNotes, setJobNotes] = useState(initialData.job.notes)

  // Quote items — pre-filled from AI extraction
  const [quoteItems, setQuoteItems] = useState<ExtractedJobRecord["quote"]["items"]>(initialData.quote.items)

  async function handleSubmit(withQuote: boolean) {
    if (customerMode === "new" && !customerName.trim()) {
      toast.error("Customer name is required")
      return
    }
    if (customerMode === "existing" && !selectedCustomerId) {
      toast.error("Please select a customer")
      return
    }
    if (!jobTitle.trim()) {
      toast.error("Job title is required")
      return
    }

    setSubmitting(true)
    try {
      let customerId = selectedCustomerId

      if (customerMode === "new") {
        const result = await createCustomerAction({
          name: customerName,
          phone: customerPhone || undefined,
          email: customerEmail || undefined,
          addressLine1: customerAddress || undefined,
        })
        customerId = result.id
      }

      const job = await createJobAction({
        customerId,
        title: jobTitle,
        description: jobDescription || undefined,
        jobType,
        status: "new",
        scheduledDate: scheduledDate || undefined,
        notes: jobNotes || undefined,
      })

      if (withQuote && quoteItems.length > 0) {
        await createQuoteAction({
          customerId,
          jobId: job.id,
          items: quoteItems.map((item, i) => ({
            itemType: item.type,
            description: item.description,
            quantity: String(item.qty),
            unitPrice: String(item.unitPrice),
            vatRate: "25.00",
            sortOrder: i,
          })),
        })
      }

      router.push(`/jobs/${job.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create job")
      setSubmitting(false)
    }
  }

  function updateItem(index: number, patch: Partial<ExtractedJobRecord["quote"]["items"][number]>) {
    setQuoteItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function removeItem(index: number) {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index))
  }

  function addItem() {
    setQuoteItems((prev) => [...prev, { description: "", qty: 1, unitPrice: 0, type: "labour" }])
  }

  // ── Review phase (always shown — data comes from DB via Inngest) ─────────────
  return (
    <div className="max-w-lg mx-auto space-y-5 pt-2 pb-10">
      <div className="space-y-0.5">
        <h1
          className="text-[22px] font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
        >
          Review & confirm
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
          AI extracted these details. Edit anything before creating.
        </p>
      </div>

      {/* Customer ──────────────────────────────────────────────────────────────── */}
      <Section
        title="Customer"
        action={
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            {(["new", "existing"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setCustomerMode(mode)}
                className="px-3 py-1 text-xs font-medium capitalize transition-colors"
                style={{
                  backgroundColor: customerMode === mode ? "var(--primary)" : "transparent",
                  color: customerMode === mode ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        }
      >
        {customerMode === "existing" ? (
          <Field label="Select customer">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", fontFamily: "var(--font-body)", color: "var(--foreground)" }}
            >
              <option value="">— choose customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" value={customerName} onChange={setCustomerName} className="col-span-2" />
            <Input label="Phone" value={customerPhone} onChange={setCustomerPhone} />
            <Input label="Email" value={customerEmail} onChange={setCustomerEmail} type="email" />
            <Input label="Address" value={customerAddress} onChange={setCustomerAddress} className="col-span-2" />
          </div>
        )}
      </Section>

      {/* Job ───────────────────────────────────────────────────────────────────── */}
      <Section title="Job">
        <div className="space-y-3">
          <Input label="Title" value={jobTitle} onChange={setJobTitle} />
          <Textarea label="Description" value={jobDescription} onChange={setJobDescription} rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as "service" | "project" | "recurring")}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", fontFamily: "var(--font-body)", color: "var(--foreground)" }}
              >
                <option value="service">Service</option>
                <option value="project">Project</option>
                <option value="recurring">Recurring</option>
              </select>
            </Field>
            <Input label="Scheduled date" value={scheduledDate} onChange={setScheduledDate} type="date" />
          </div>
          <Textarea label="Notes" value={jobNotes} onChange={setJobNotes} rows={2} />
        </div>
      </Section>

      {/* Quote items ────────────────────────────────────────────────────────────── */}
      <Section
        title={`Quote items (${quoteItems.length})`}
        action={
          <button
            onClick={addItem}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
          >
            <Plus className="w-3 h-3" /> Add item
          </button>
        }
      >
        {quoteItems.length === 0 ? (
          <p className="text-sm py-2" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
            No quote items extracted. Tap "Add item" to add manually.
          </p>
        ) : (
          <div className="space-y-3">
            {quoteItems.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border p-3 space-y-2"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              >
                <div className="flex gap-2">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    placeholder="Description"
                    className="flex-1 h-8 px-2 rounded border text-sm"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", fontFamily: "var(--font-body)", color: "var(--foreground)" }}
                  />
                  <button
                    onClick={() => removeItem(i)}
                    className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0"
                    style={{ color: "var(--destructive)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Qty</span>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(i, { qty: Number(e.target.value) })}
                      className="w-full h-8 px-2 rounded border text-sm mt-0.5"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", fontFamily: "var(--font-mono)", color: "var(--foreground)" }}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Price (DKK)</span>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                      className="w-full h-8 px-2 rounded border text-sm mt-0.5"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", fontFamily: "var(--font-mono)", color: "var(--foreground)" }}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Type</span>
                    <select
                      value={item.type}
                      onChange={(e) => updateItem(i, { type: e.target.value as "labour" | "material" | "fixed" | "travel" })}
                      className="w-full h-8 px-2 rounded border text-[13px] mt-0.5"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", fontFamily: "var(--font-body)", color: "var(--foreground)" }}
                    >
                      <option value="labour">Labour</option>
                      <option value="material">Material</option>
                      <option value="fixed">Fixed</option>
                      <option value="travel">Travel</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Actions ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-1">
        <button
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="h-12 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            fontFamily: "var(--font-body)",
          }}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create job + draft quote"}
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="h-12 rounded-xl text-sm font-semibold border transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
          style={{
            borderColor: "var(--border)",
            color: "var(--foreground)",
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--card)",
          }}
        >
          Create job only
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({
  title, action, children,
}: {
  title: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <section
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
    >
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ backgroundColor: "var(--muted)", borderColor: "var(--border)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}
        >
          {title}
        </p>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({
  label, value, onChange, type = "text", className = "",
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; className?: string
}) {
  return (
    <div className={className}>
      <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg border text-sm"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          fontFamily: "var(--font-body)",
          color: "var(--foreground)",
        }}
      />
    </div>
  )
}

function Textarea({
  label, value, onChange, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void; rows?: number
}) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          fontFamily: "var(--font-body)",
          color: "var(--foreground)",
        }}
      />
    </div>
  )
}
