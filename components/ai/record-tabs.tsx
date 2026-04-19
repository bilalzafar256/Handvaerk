"use client"

import { useState } from "react"
import { VoiceRecorder } from "./voice-recorder"
import { AudioFileUpload } from "./audio-file-upload"

type Tab = "record" | "upload"

export function RecordTabs() {
  const [tab, setTab] = useState<Tab>("record")

  return (
    <div className="flex flex-col gap-5">
      {/* Tab toggle */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ backgroundColor: "var(--muted)" }}
      >
        {(["record", "upload"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 h-9 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{
              fontFamily: "var(--font-body)",
              backgroundColor: tab === t ? "var(--card)" : "transparent",
              color: tab === t ? "var(--foreground)" : "var(--muted-foreground)",
              boxShadow: tab === t ? "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))" : "none",
            }}
          >
            {t === "record" ? "Record live" : "Upload file"}
          </button>
        ))}
      </div>

      {tab === "record" ? <VoiceRecorder /> : <AudioFileUpload />}
    </div>
  )
}
