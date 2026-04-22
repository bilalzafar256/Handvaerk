"use client"

import { useState, useTransition, useCallback } from "react"
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
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, LayoutDashboard } from "lucide-react"
import { toast } from "sonner"
import { updateDashboardWidgetsAction } from "@/lib/actions/profile"
import { WIDGET_META, type DashboardWidget } from "@/lib/dashboard-widgets"

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
      style={{
        backgroundColor: enabled ? "var(--primary)" : "var(--border)",
        transitionTimingFunction: "var(--ease-snap)",
      }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-200"
        style={{
          backgroundColor: "white",
          transform: enabled ? "translateX(20px)" : "translateX(0px)",
          transitionTimingFunction: "var(--ease-snap)",
        }}
      />
    </button>
  )
}

function SortableRow({
  widget,
  onToggle,
}: {
  widget: DashboardWidget
  onToggle: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  })

  const meta = WIDGET_META[widget.id]

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
        borderColor: "var(--border)",
      }}
      className="flex items-center gap-3 py-3 px-5 border-b last:border-b-0"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing touch-none p-0.5 rounded"
        style={{ color: "var(--muted-foreground)" }}
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium"
          style={{
            fontFamily: "var(--font-body)",
            color: widget.enabled ? "var(--foreground)" : "var(--muted-foreground)",
          }}
        >
          {meta?.label ?? widget.id}
        </p>
        <p
          className="text-xs mt-0.5 truncate"
          style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}
        >
          {meta?.description}
        </p>
      </div>

      {/* Toggle */}
      <Toggle enabled={widget.enabled} onToggle={() => onToggle(widget.id)} />
    </div>
  )
}

export function DashboardWidgetsSection({ initialWidgets }: { initialWidgets: DashboardWidget[] }) {
  const [widgets, setWidgets] = useState(initialWidgets)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const save = useCallback((next: DashboardWidget[]) => {
    startTransition(async () => {
      try {
        await updateDashboardWidgetsAction(next)
      } catch {
        toast.error("Failed to save dashboard settings")
      }
    })
  }, [])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = widgets.findIndex((w) => w.id === active.id)
    const newIndex = widgets.findIndex((w) => w.id === over.id)
    const next = arrayMove(widgets, oldIndex, newIndex)
    setWidgets(next)
    save(next)
  }

  function handleToggle(id: string) {
    const next = widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    setWidgets(next)
    save(next)
  }

  return (
    <div
      className="mx-4 mt-4 rounded-[--radius-lg] border overflow-hidden"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
        >
          Dashboard widgets
        </p>
      </div>

      <div className="flex items-start gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--background-subtle)" }}
        >
          <LayoutDashboard className="w-4 h-4" style={{ color: "var(--primary)" }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
            Customize your dashboard
          </p>
          <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
            Drag to reorder sections. Toggle to show or hide them.
          </p>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
          {widgets.map((widget) => (
            <SortableRow key={widget.id} widget={widget} onToggle={handleToggle} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
