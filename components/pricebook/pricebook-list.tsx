"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Plus, BookOpen, Pencil, Trash2, Loader2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import { formatDKK } from "@/lib/utils/currency"
import {
  createPricebookItemAction,
  updatePricebookItemAction,
  deletePricebookItemAction,
} from "@/lib/actions/pricebook"
import type { PricebookItem } from "@/lib/db/schema/pricebook"

const ITEM_TYPES = ["labour", "material", "fixed", "travel"] as const
type ItemType = typeof ITEM_TYPES[number]

const TYPE_LABEL: Record<ItemType, string> = {
  labour:   "Labour",
  material: "Material",
  fixed:    "Fixed",
  travel:   "Travel",
}
const TYPE_STYLE: Record<ItemType, { bg: string; text: string; border: string }> = {
  labour:   { bg: "oklch(0.93 0.05 250)", text: "oklch(0.35 0.12 250)", border: "oklch(0.82 0.07 250)" },
  material: { bg: "oklch(0.93 0.06 145)", text: "oklch(0.30 0.12 145)", border: "oklch(0.80 0.08 145)" },
  fixed:    { bg: "oklch(0.93 0.06 55)",  text: "oklch(0.38 0.12 55)",  border: "oklch(0.82 0.08 55)"  },
  travel:   { bg: "oklch(0.93 0.05 290)", text: "oklch(0.35 0.10 290)", border: "oklch(0.82 0.06 290)" },
}

const BLANK = { name: "", description: "", unitPrice: "", itemType: "material" as ItemType, isActive: true }

function TypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLE[type as ItemType] ?? TYPE_STYLE.material
  return (
    <span
      className="inline-flex items-center px-2 h-5 rounded-full text-xs font-medium border"
      style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
    >
      {TYPE_LABEL[type as ItemType] ?? type}
    </span>
  )
}

function ItemForm({
  initial,
  onSave,
  onCancel,
  busy,
}: {
  initial: typeof BLANK
  onSave: (data: typeof BLANK) => Promise<void>
  onCancel: () => void
  busy: boolean
}) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Name is required"
    if (!form.unitPrice.trim() || !/^\d+(\.\d{1,2})?$/.test(form.unitPrice)) e.unitPrice = "Enter a valid price"
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    await onSave(form)
  }

  const inp = "h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 w-full transition-colors"
  const inpStyle = { borderColor: "var(--border)", backgroundColor: "var(--background)", fontFamily: "var(--font-body)", color: "var(--foreground)" }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Item name *"
            className={inp}
            style={inpStyle}
          />
          {errors.name && <p className="text-xs mt-0.5" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>{errors.name}</p>}
        </div>
        <div>
          <input
            value={form.unitPrice}
            onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
            placeholder="Unit price *"
            inputMode="decimal"
            className={inp}
            style={inpStyle}
          />
          {errors.unitPrice && <p className="text-xs mt-0.5" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>{errors.unitPrice}</p>}
        </div>
      </div>
      <input
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Description (optional)"
        className={inp}
        style={inpStyle}
      />
      <div className="flex items-center gap-2 flex-wrap">
        {ITEM_TYPES.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setForm(f => ({ ...f, itemType: t }))}
            className="px-3 h-7 rounded-full text-xs font-medium border transition-colors cursor-pointer"
            style={
              form.itemType === t
                ? { backgroundColor: TYPE_STYLE[t].bg, color: TYPE_STYLE[t].text, borderColor: TYPE_STYLE[t].border }
                : { backgroundColor: "var(--background)", color: "var(--muted-foreground)", borderColor: "var(--border)" }
            }
          >
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={busy}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm border cursor-pointer hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <button type="submit" disabled={busy}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 bg-[var(--primary)] hover:bg-[var(--amber-600)] transition-colors"
          style={{ color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save
        </button>
      </div>
    </form>
  )
}

export function PricebookList({ items: initialItems }: { items: PricebookItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [query, setQuery] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const filtered = items.filter(i => {
    const q = query.toLowerCase()
    return !q || i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
  })

  async function handleCreate(data: typeof BLANK) {
    setBusy(true)
    try {
      await createPricebookItemAction(data)
      toast.success("Item added")
      setShowAdd(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create")
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(id: string, data: typeof BLANK) {
    setBusy(true)
    try {
      await updatePricebookItemAction(id, data)
      toast.success("Item updated")
      setEditingId(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setBusy(true)
    try {
      await deletePricebookItemAction(id)
      setItems(prev => prev.filter(i => i.id !== id))
      setDeletingId(null)
      toast.success("Item removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {/* Filter / add bar */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search items…"
            className="w-full h-8 pl-8 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          />
        </div>
        <button
          onClick={() => { setShowAdd(v => !v); setEditingId(null) }}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium cursor-pointer bg-[var(--primary)] hover:bg-[var(--amber-600)] transition-colors"
          style={{ color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="px-4 py-4" style={{ backgroundColor: "var(--muted)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>New item</p>
              <ItemForm
                initial={BLANK}
                onSave={handleCreate}
                onCancel={() => setShowAdd(false)}
                busy={busy}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--muted)" }}>
            <BookOpen className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
          </div>
          <p className="text-sm font-medium text-center" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
            {query ? "No items match your search" : "Your pricebook is empty"}
          </p>
          {!query && (
            <p className="text-xs text-center" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
              Add standard items to reuse them in quotes.
            </p>
          )}
        </div>
      ) : (
        <ul className="divide-y" style={{ ["--tw-divide-color" as string]: "var(--border)" }}>
          <AnimatePresence initial={false}>
            {filtered.map(item => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                {editingId === item.id ? (
                  <div className="px-4 py-4" style={{ backgroundColor: "var(--muted)" }}>
                    <ItemForm
                      initial={{
                        name:        item.name,
                        description: item.description ?? "",
                        unitPrice:   item.unitPrice,
                        itemType:    (item.itemType ?? "material") as ItemType,
                        isActive:    item.isActive ?? true,
                      }}
                      onSave={data => handleUpdate(item.id, data)}
                      onCancel={() => setEditingId(null)}
                      busy={busy}
                    />
                  </div>
                ) : deletingId === item.id ? (
                  <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--error-light)" }}>
                    <p className="flex-1 text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--error)" }}>
                      Delete <strong>{item.name}</strong>?
                    </p>
                    <button onClick={() => setDeletingId(null)} disabled={busy}
                      className="h-8 px-3 rounded-lg text-sm border cursor-pointer hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}>
                      Cancel
                    </button>
                    <button onClick={() => handleDelete(item.id)} disabled={busy}
                      className="h-8 px-3 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: "var(--error)", color: "#fff", fontFamily: "var(--font-body)" }}>
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--card)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                          {item.name}
                        </p>
                        <TypeBadge type={item.itemType ?? "material"} />
                        {!item.isActive && (
                          <span className="text-xs px-2 h-5 rounded-full border inline-flex items-center"
                            style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)", borderColor: "var(--border)", fontFamily: "var(--font-body)" }}>
                            Inactive
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs mt-0.5 truncate" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-semibold flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                      {formatDKK(parseFloat(item.unitPrice))}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(item.id); setShowAdd(false); setDeletingId(null) }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-[var(--accent)] transition-colors"
                        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeletingId(item.id); setEditingId(null) }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-[var(--error-light)] transition-colors"
                        style={{ borderColor: "var(--border)", color: "var(--error)" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
