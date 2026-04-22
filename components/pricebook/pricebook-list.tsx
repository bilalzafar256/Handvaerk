"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Plus, BookOpen, Pencil, Trash2, Loader2, Check, X, Star } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import { formatDKK } from "@/lib/utils/currency"
import {
  createPricebookItemAction,
  updatePricebookItemAction,
  deletePricebookItemAction,
  togglePricebookItemActiveAction,
  togglePricebookItemFavouriteAction,
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

const UNIT_PRESETS = ["hr", "pcs", "m²", "m", "kg", "day"]

const BLANK = {
  name: "", description: "", unitPrice: "", costPrice: "", unit: "", sku: "",
  category: "", supplierName: "", defaultMarkupPercent: "", defaultQuantity: "",
  notes: "", isFavourite: false,
  itemType: "material" as ItemType, isActive: true,
}

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
    if (form.costPrice && !/^\d+(\.\d{1,2})?$/.test(form.costPrice)) e.costPrice = "Enter a valid cost price"
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
      {/* Row 1: name + sell price */}
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

      {/* Row 2: cost price + unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <input
            value={form.costPrice}
            onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
            placeholder="Cost price (optional)"
            inputMode="decimal"
            className={inp}
            style={inpStyle}
          />
          {errors.costPrice && <p className="text-xs mt-0.5" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>{errors.costPrice}</p>}
          {form.costPrice && !errors.costPrice && form.unitPrice && (() => {
            const sell = parseFloat(form.unitPrice)
            const cost = parseFloat(form.costPrice)
            if (!isNaN(sell) && !isNaN(cost) && cost > 0) {
              const margin = Math.round(((sell - cost) / sell) * 100)
              return <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>{margin}% margin</p>
            }
          })()}
        </div>
        <div>
          <div className="space-y-1.5">
            <input
              value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              placeholder="Unit (hr, m², pcs…)"
              className={inp}
              style={inpStyle}
            />
            <div className="flex items-center gap-1 flex-wrap">
              {UNIT_PRESETS.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, unit: f.unit === u ? "" : u }))}
                  className="h-5 px-2 rounded text-xs border cursor-pointer transition-colors"
                  style={
                    form.unit === u
                      ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderColor: "var(--primary)" }
                      : { backgroundColor: "var(--background)", color: "var(--muted-foreground)", borderColor: "var(--border)" }
                  }
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: description + SKU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description (optional)"
          className={inp}
          style={inpStyle}
        />
        <input
          value={form.sku}
          onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
          placeholder="SKU / supplier code (optional)"
          className={inp}
          style={inpStyle}
        />
      </div>

      {/* Row 4: category + supplier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          placeholder="Category (e.g. Pipe Fittings, Electrical)"
          className={inp}
          style={inpStyle}
        />
        <input
          value={form.supplierName}
          onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
          placeholder="Supplier name (optional)"
          className={inp}
          style={inpStyle}
        />
      </div>

      {/* Row 5: default markup + default quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <input
            value={form.defaultMarkupPercent}
            onChange={e => setForm(f => ({ ...f, defaultMarkupPercent: e.target.value }))}
            placeholder="Default markup % (optional)"
            inputMode="decimal"
            className={inp}
            style={inpStyle}
          />
          {errors.defaultMarkupPercent && <p className="text-xs mt-0.5" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>{errors.defaultMarkupPercent}</p>}
        </div>
        <div>
          <input
            value={form.defaultQuantity}
            onChange={e => setForm(f => ({ ...f, defaultQuantity: e.target.value }))}
            placeholder="Default quantity (optional)"
            inputMode="decimal"
            className={inp}
            style={inpStyle}
          />
          {errors.defaultQuantity && <p className="text-xs mt-0.5" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>{errors.defaultQuantity}</p>}
        </div>
      </div>

      {/* Notes */}
      <textarea
        value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        placeholder="Internal notes (not shown to customers)"
        rows={2}
        className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 w-full transition-colors resize-none"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", fontFamily: "var(--font-body)", color: "var(--foreground)" }}
      />

      {/* Type selector + favourite toggle */}
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
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, isFavourite: !f.isFavourite }))}
          className="ml-auto flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium border transition-colors cursor-pointer"
          style={
            form.isFavourite
              ? { backgroundColor: "oklch(0.93 0.06 55)", color: "oklch(0.38 0.12 55)", borderColor: "oklch(0.82 0.08 55)" }
              : { backgroundColor: "var(--background)", color: "var(--muted-foreground)", borderColor: "var(--border)" }
          }
        >
          <Star className="w-3 h-3" style={{ fill: form.isFavourite ? "currentColor" : "none" }} />
          Favourite
        </button>
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

type StatusFilter = "all" | "active" | "inactive" | "favourites"
type TypeFilter = "all" | ItemType

export function PricebookList({ items: initialItems }: { items: PricebookItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [favouritingId, setFavouritingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const filtered = items
    .filter(i => {
      const q = query.toLowerCase()
      if (q && !i.name.toLowerCase().includes(q) && !i.description?.toLowerCase().includes(q)) return false
      if (statusFilter === "active" && !i.isActive) return false
      if (statusFilter === "inactive" && i.isActive) return false
      if (statusFilter === "favourites" && !i.isFavourite) return false
      if (typeFilter !== "all" && i.itemType !== typeFilter) return false
      return true
    })
    .sort((a, b) => {
      const aActive = a.isActive ? 1 : 0
      const bActive = b.isActive ? 1 : 0
      if (bActive !== aActive) return bActive - aActive
      return (b.isFavourite ? 1 : 0) - (a.isFavourite ? 1 : 0)
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

  async function handleToggleActive(id: string, current: boolean) {
    setTogglingId(id)
    try {
      await togglePricebookItemActiveAction(id, !current)
      setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: !current } : i))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setTogglingId(null)
    }
  }

  async function handleToggleFavourite(id: string, current: boolean) {
    setFavouritingId(id)
    try {
      await togglePricebookItemFavouriteAction(id, !current)
      setItems(prev => prev.map(i => i.id === id ? { ...i, isFavourite: !current } : i))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setFavouritingId(null)
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

  const pillBase = "h-6 px-2.5 rounded-full text-xs font-medium border cursor-pointer transition-colors"
  const pillActive = { backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderColor: "var(--primary)" }
  const pillInactive = { backgroundColor: "var(--background)", color: "var(--muted-foreground)", borderColor: "var(--border)" }

  return (
    <div>
      {/* Search + add row */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
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

      {/* Filter pills */}
      <div className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-2 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
        <div className="flex items-center gap-1.5">
          {(["all", "active", "inactive", "favourites"] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={pillBase}
              style={
                s === "favourites" && statusFilter === s
                  ? { backgroundColor: "oklch(0.93 0.06 55)", color: "oklch(0.38 0.12 55)", borderColor: "oklch(0.82 0.08 55)" }
                  : statusFilter === s ? pillActive : pillInactive
              }
            >
              {s === "all" ? "All" : s === "active" ? "Active" : s === "inactive" ? "Inactive" : "★ Favourites"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTypeFilter("all")}
            className={pillBase}
            style={typeFilter === "all" ? pillActive : pillInactive}
          >
            All types
          </button>
          {ITEM_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
              className={pillBase}
              style={
                typeFilter === t
                  ? { backgroundColor: TYPE_STYLE[t].bg, color: TYPE_STYLE[t].text, borderColor: TYPE_STYLE[t].border }
                  : pillInactive
              }
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
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
            {items.length === 0 ? "Your pricebook is empty" : "No items match your filters"}
          </p>
          {items.length === 0 && (
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
                        name:                 item.name,
                        description:          item.description ?? "",
                        unitPrice:            item.unitPrice,
                        costPrice:            item.costPrice ?? "",
                        unit:                 item.unit ?? "",
                        sku:                  item.sku ?? "",
                        category:             item.category ?? "",
                        supplierName:         item.supplierName ?? "",
                        defaultMarkupPercent: item.defaultMarkupPercent ?? "",
                        defaultQuantity:      item.defaultQuantity ?? "",
                        notes:                item.notes ?? "",
                        isFavourite:          item.isFavourite ?? false,
                        itemType:             (item.itemType ?? "material") as ItemType,
                        isActive:             item.isActive ?? true,
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
                  <div className="px-4 py-3 flex items-center gap-3 transition-opacity" style={{ backgroundColor: "var(--card)", opacity: item.isActive ? 1 : 0.5 }}>
                    <button
                      onClick={() => handleToggleActive(item.id, item.isActive ?? true)}
                      disabled={togglingId === item.id}
                      title={item.isActive ? "Click to deactivate" : "Click to activate"}
                      className="flex-shrink-0 cursor-pointer disabled:opacity-50 transition-transform hover:scale-110"
                      style={{ lineHeight: 0 }}
                    >
                      {togglingId === item.id
                        ? <Loader2 className="w-2.5 h-2.5 animate-spin" style={{ color: "var(--muted-foreground)" }} />
                        : <span className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.isActive ? "oklch(0.65 0.15 145)" : "oklch(0.70 0 0)" }} />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                          {item.name}
                        </p>
                        <TypeBadge type={item.itemType ?? "material"} />
                        {item.category && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                            {item.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.description && (
                          <p className="text-xs truncate" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                            {item.description}
                          </p>
                        )}
                        {item.sku && (
                          <p className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                            #{item.sku}
                          </p>
                        )}
                        {item.supplierName && (
                          <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                            {item.supplierName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                        {formatDKK(parseFloat(item.unitPrice))}{item.unit ? <span className="text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>/{item.unit}</span> : null}
                      </p>
                      {item.costPrice && (
                        <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                          cost {formatDKK(parseFloat(item.costPrice))}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleToggleFavourite(item.id, item.isFavourite ?? false)}
                        disabled={favouritingId === item.id}
                        title={item.isFavourite ? "Remove from favourites" : "Add to favourites"}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
                        style={{ borderColor: "var(--border)", color: item.isFavourite ? "oklch(0.65 0.15 55)" : "var(--muted-foreground)" }}
                      >
                        {favouritingId === item.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Star className="w-3.5 h-3.5" style={{ fill: item.isFavourite ? "currentColor" : "none" }} />
                        }
                      </button>
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
