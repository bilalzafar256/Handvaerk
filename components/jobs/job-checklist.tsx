"use client"

import { useState, useRef } from "react"
import { Check, Plus, Trash2, Loader2 } from "lucide-react"
import { createJobTaskAction, updateJobTaskAction, deleteJobTaskAction } from "@/lib/actions/job-tasks"
import { toast } from "sonner"
import type { JobTask } from "@/lib/db/schema/job-tasks"

interface JobChecklistProps {
  jobId: string
  initialTasks: JobTask[]
}

export function JobChecklist({ jobId, initialTasks }: JobChecklistProps) {
  const [tasks, setTasks] = useState<JobTask[]>(initialTasks)
  const [newText, setNewText] = useState("")
  const [adding, setAdding] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const completed = tasks.filter(t => t.isCompleted).length

  async function handleToggle(task: JobTask) {
    // Optimistic
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t))
    try {
      await updateJobTaskAction(task.id, jobId, { isCompleted: !task.isCompleted })
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: task.isCompleted } : t))
      toast.error("Could not update task")
    }
  }

  async function handleAdd() {
    const text = newText.trim()
    if (!text) return
    setAdding(true)
    try {
      const { id } = await createJobTaskAction(jobId, text)
      setTasks(prev => [...prev, {
        id,
        jobId,
        userId: "",
        text,
        isCompleted: false,
        sortOrder: prev.length,
        createdAt: new Date(),
      }])
      setNewText("")
      setShowInput(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add task")
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    try {
      await deleteJobTaskAction(taskId, jobId)
    } catch {
      toast.error("Could not delete task")
    }
  }

  return (
    <div className="space-y-1.5">
      {/* Progress summary */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%`,
                backgroundColor: completed === tasks.length && tasks.length > 0 ? "var(--success)" : "var(--primary)",
              }}
            />
          </div>
          <p className="text-[11px] flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
            {completed}/{tasks.length}
          </p>
        </div>
      )}

      {/* Task list */}
      {tasks.map(task => (
        <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
      ))}

      {/* Add task */}
      {showInput ? (
        <div className="flex items-center gap-2 mt-1">
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleAdd()
              if (e.key === "Escape") { setShowInput(false); setNewText("") }
            }}
            placeholder="New task…"
            className="flex-1 h-8 px-3 text-sm rounded-lg border focus:outline-none"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: "var(--border)",
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
            }}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newText.trim()}
            className="h-8 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
          </button>
          <button
            onClick={() => { setShowInput(false); setNewText("") }}
            className="h-8 px-2 rounded-lg text-sm transition-colors cursor-pointer"
            style={{ color: "var(--muted-foreground)" }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="flex items-center gap-1.5 text-sm mt-1 transition-opacity hover:opacity-70 cursor-pointer"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add task
        </button>
      )}
    </div>
  )
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: JobTask
  onToggle: (t: JobTask) => void
  onDelete: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex items-center gap-2.5 group py-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => onToggle(task)}
        className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
        style={{
          borderColor: task.isCompleted ? "var(--success)" : "var(--border)",
          backgroundColor: task.isCompleted ? "var(--success)" : "transparent",
        }}
      >
        {task.isCompleted && <Check className="w-3 h-3 text-white" />}
      </button>
      <p
        className="flex-1 text-sm leading-snug"
        style={{
          fontFamily: "var(--font-body)",
          color: task.isCompleted ? "var(--muted-foreground)" : "var(--foreground)",
          textDecoration: task.isCompleted ? "line-through" : "none",
        }}
      >
        {task.text}
      </p>
      {hovered && (
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="w-6 h-6 flex items-center justify-center rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          style={{ color: "var(--error)" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--error-light)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
