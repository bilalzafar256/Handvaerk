"use client"

import { useState } from "react"
import { Plus, Trash2, GripVertical, ChevronDown } from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { formatDKK } from "@/lib/utils/currency"

export type ItemType = "labour" | "material" | "fixed" | "travel"

export interface LineItem {
  id:            string   // client-side only
  itemType:      ItemType
  description:   string
  quantity:      string
  unitPrice:     string
  markupPercent?: string
  vatRate:       string
  sortOrder:     number
}

interface LineItemBuilderProps {
  items:    LineItem[]
  onChange: (items: LineItem[]) => void
  /** Show markup% column (quotes only) */
  showMarkup?: boolean
  /** Optional: async materials search callback */
  searchMaterials?: (q: string) => Promise<Array<{ id: string; name: string; defaultPrice?: string | null; defaultUnit?: string | null; defaultMarkup?: string | null }>>
}

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  labour:   "Labour",
  material: "Material",
  fixed:    "Fixed price",
  travel:   "Travel",
}

const inputCls = `
  h-10 px-3
  bg-[--surface] text-[--text-primary]
  border border-[--border]
  rounded-[--radius-sm]
  placeholder:text-[--text-tertiary]
  focus:outline-none focus:border-[--primary]
  focus:ring-1 focus:ring-[--primary]/20
  transition-colors duration-150 text-sm w-full
`

function calcLine(qty: string, price: string, markup?: string): number {
  const q = parseFloat(qty) || 0
  const p = parseFloat(price) || 0
  const m = markup ? 1 + (parseFloat(markup) || 0) / 100 : 1
  return q * p * m
}

function calcSubtotal(items: LineItem[], showMarkup: boolean): number {
  return items.reduce((s, i) => s + calcLine(i.quantity, i.unitPrice, showMarkup ? i.markupPercent : undefined), 0)
}

// ── Sortable item wrapper ──────────────────────────────────────────────────
interface SortableItemProps {
  item: LineItem
  expandedId: string | null
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: keyof LineItem, value: string) => void
  onDescriptionChange: (id: string, value: string) => void
  materialSuggestions: Record<string, Array<{ id: string; name: string; defaultPrice?: string | null; defaultUnit?: string | null; defaultMarkup?: string | null }>>
  onSelectMaterial: (id: string, mat: { name: string; defaultPrice?: string | null; defaultMarkup?: string | null }) => void
  showMarkup: boolean
}

function SortableItem({
  item,
  expandedId,
  onToggle,
  onRemove,
  onUpdate,
  onDescriptionChange,
  materialSuggestions,
  onSelectMaterial,
  showMarkup,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-[--radius-md] border overflow-hidden"
      {...attributes}
    >
      {/* Row summary (collapsed) */}
      <div className="w-full flex items-center gap-2 px-3 py-3">
        {/* Drag handle */}
        <div
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 -m-1 rounded"
          style={{ color: "var(--text-tertiary)" }}
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Summary — clickable to expand */}
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          className="flex-1 min-w-0 text-left flex items-center gap-2 cursor-pointer"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "var(--accent-light)", color: "var(--primary)", fontFamily: "var(--font-body)" }}
              >
                {ITEM_TYPE_LABELS[item.itemType]}
              </span>
              <span className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                {item.description || <span style={{ color: "var(--text-tertiary)" }}>No description</span>}
              </span>
            </div>
            {(item.unitPrice || item.quantity) && (
              <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                {item.quantity || "—"} × {item.unitPrice ? formatDKK(parseFloat(item.unitPrice)) : "—"}
                {showMarkup && item.markupPercent ? ` +${item.markupPercent}%` : ""}
                {" = "}
                <strong>{formatDKK(calcLine(item.quantity, item.unitPrice, showMarkup ? item.markupPercent : undefined))}</strong>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
              className="w-7 h-7 flex items-center justify-center rounded-[--radius-sm] transition-colors cursor-pointer"
              style={{ color: "var(--error)" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <ChevronDown
              className="w-4 h-4 transition-transform duration-150"
              style={{
                color: "var(--text-tertiary)",
                transform: expandedId === item.id ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </div>
        </button>
      </div>

      {/* Expanded detail */}
      {expandedId === item.id && (
        <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
          {/* Type select */}
          <div className="pt-3">
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              Type
            </label>
            <select
              value={item.itemType}
              onChange={(e) => onUpdate(item.id, "itemType", e.target.value)}
              className={inputCls}
              style={{ fontFamily: "var(--font-body)" }}
            >
              {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map(t => (
                <option key={t} value={t}>{ITEM_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Description with material autocomplete */}
          <div className="relative">
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              Description
            </label>
            <input
              value={item.description}
              onChange={(e) => onDescriptionChange(item.id, e.target.value)}
              placeholder="e.g. Electrical inspection"
              className={inputCls}
            />
            {/* Materials autocomplete dropdown */}
            {materialSuggestions[item.id]?.length > 0 && (
              <div
                className="absolute z-10 left-0 right-0 mt-1 rounded-[--radius-sm] border shadow-lg overflow-hidden"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
              >
                {materialSuggestions[item.id].map(mat => (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => onSelectMaterial(item.id, mat)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-[--background-subtle] transition-colors cursor-pointer"
                    style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
                  >
                    <span className="font-medium">{mat.name}</span>
                    {mat.defaultPrice && (
                      <span className="text-xs ml-2" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                        {formatDKK(parseFloat(mat.defaultPrice))}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Qty + Price */}
          <div className={`grid gap-3 ${showMarkup ? "grid-cols-3" : "grid-cols-2"}`}>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                {item.itemType === "labour" ? "Hours" : "Qty"}
              </label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdate(item.id, "quantity", e.target.value)}
                placeholder="1"
                min="0"
                step="0.25"
                className={inputCls}
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                {item.itemType === "labour" ? "Rate (kr.)" : "Unit price (kr.)"}
              </label>
              <input
                type="number"
                value={item.unitPrice}
                onChange={(e) => onUpdate(item.id, "unitPrice", e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={inputCls}
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
            {showMarkup && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                  Markup %
                </label>
                <input
                  type="number"
                  value={item.markupPercent ?? ""}
                  onChange={(e) => onUpdate(item.id, "markupPercent", e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className={inputCls}
                  style={{ fontFamily: "var(--font-mono)" }}
                />
              </div>
            )}
          </div>

          {/* Line total */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <span className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Line total:</span>
            <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
              {formatDKK(calcLine(item.quantity, item.unitPrice, showMarkup ? item.markupPercent : undefined))}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function LineItemBuilder({
  items,
  onChange,
  showMarkup = false,
  searchMaterials,
}: LineItemBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [materialSuggestions, setMaterialSuggestions] = useState<Record<string, Array<{ id: string; name: string; defaultPrice?: string | null; defaultUnit?: string | null; defaultMarkup?: string | null }>>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      onChange(arrayMove(items, oldIndex, newIndex))
    }
  }

  function addItem(type: ItemType) {
    const newItem: LineItem = {
      id:          crypto.randomUUID(),
      itemType:    type,
      description: type === "travel" ? "Kørsel" : type === "labour" ? "Timer" : "",
      quantity:    "1",
      unitPrice:   "",
      markupPercent: "",
      vatRate:     "25.00",
      sortOrder:   items.length,
    }
    onChange([...items, newItem])
    setExpandedId(newItem.id)
  }

  function removeItem(id: string) {
    onChange(items.filter(i => i.id !== id))
  }

  function updateItem(id: string, field: keyof LineItem, value: string) {
    onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  async function handleDescriptionChange(id: string, value: string) {
    updateItem(id, "description", value)
    const item = items.find(i => i.id === id)
    if (searchMaterials && item?.itemType === "material" && value.length >= 2) {
      const results = await searchMaterials(value)
      setMaterialSuggestions(prev => ({ ...prev, [id]: results }))
    } else {
      setMaterialSuggestions(prev => ({ ...prev, [id]: [] }))
    }
  }

  function selectMaterial(id: string, mat: { name: string; defaultPrice?: string | null; defaultMarkup?: string | null }) {
    onChange(items.map(i => i.id === id ? {
      ...i,
      description:   mat.name,
      unitPrice:     mat.defaultPrice ?? i.unitPrice,
      markupPercent: mat.defaultMarkup ?? i.markupPercent ?? "",
    } : i))
    setMaterialSuggestions(prev => ({ ...prev, [id]: [] }))
  }

  const subtotal = calcSubtotal(items, showMarkup)
  const vat      = subtotal * 0.25
  const total    = subtotal + vat

  return (
    <div className="space-y-2">
      {/* Sortable items */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              expandedId={expandedId}
              onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
              onRemove={removeItem}
              onUpdate={updateItem}
              onDescriptionChange={handleDescriptionChange}
              materialSuggestions={materialSuggestions}
              onSelectMaterial={selectMaterial}
              showMarkup={showMarkup}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add item buttons */}
      <div className="flex flex-wrap gap-2">
        {(["labour", "material", "fixed", "travel"] as ItemType[]).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => addItem(type)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-[--radius-sm] text-sm font-medium border transition-all duration-150 active:scale-[0.97] cursor-pointer"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            {ITEM_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div
          className="mt-4 p-4 rounded-[--radius-md] space-y-2"
          style={{ backgroundColor: "var(--background-subtle)", borderColor: "var(--border)" }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Subtotal ekskl. moms</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{formatDKK(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Moms (25%)</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{formatDKK(vat)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <span style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>Total inkl. moms</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{formatDKK(total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
