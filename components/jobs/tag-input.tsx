"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { X } from "lucide-react"

interface TagInputProps {
  value: string // comma-separated
  onChange: (value: string) => void
  placeholder?: string
}

export function TagInput({ value, onChange, placeholder = "Add tag…" }: TagInputProps) {
  const tags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : []
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || tags.includes(tag)) { setInput(""); return }
    const next = [...tags, tag].join(",")
    onChange(next)
    setInput("")
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag).join(","))
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(input)
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 min-h-[44px] px-3 py-2 rounded-lg border transition-colors cursor-text"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-xs font-medium"
          style={{ backgroundColor: "var(--accent-light)", color: "var(--primary)", fontFamily: "var(--font-body)" }}
        >
          {tag}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); removeTag(tag) }}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[80px] h-6 bg-transparent text-sm outline-none placeholder:opacity-50"
        style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
      />
    </div>
  )
}
