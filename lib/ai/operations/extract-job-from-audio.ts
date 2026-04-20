import { geminiFlash } from "@/lib/ai/client"
import { extractedJobRecordSchema, type ExtractedJobRecord } from "@/lib/ai/schemas/recording-result"

const EXTRACTION_PROMPT = `You are an AI assistant for Danish tradespeople (plumbers, electricians, painters, carpenters, roofers, etc.).

The audio or transcript may be in Danish or English — handle both. Extract all information from the on-site conversation.

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "customer": {
    "name": "string",
    "phone": "string (optional)",
    "email": "string (optional)",
    "address": "string (optional)"
  },
  "job": {
    "title": "string — short descriptive title",
    "description": "string — detailed scope of work",
    "jobType": "service | project | recurring",
    "scheduledDate": "YYYY-MM-DD (optional, only if a specific date is mentioned)",
    "notes": "string — any special requirements or instructions",
    "materials": ["array of material names mentioned"]
  },
  "quote": {
    "items": [
      {
        "description": "string",
        "qty": number,
        "unitPrice": number (in DKK, estimate based on Danish trade market rates),
        "type": "labour | material | fixed | travel"
      }
    ],
    "notes": "string (optional)"
  }
}

Rules:
- jobType: "service" for one-off repairs, "project" for renovations/larger work, "recurring" for maintenance
- Estimate realistic DKK unit prices based on Danish market rates for tradespeople
- Omit optional fields if not mentioned — do not invent data
- Return ONLY the JSON object`

export async function geminiExtractFromAudio(audioBase64: string, mimeType: string): Promise<ExtractedJobRecord> {
  const result = await geminiFlash.generateContent([
    { text: EXTRACTION_PROMPT },
    { inlineData: { mimeType, data: audioBase64 } },
    { text: "Extract all job information from this audio recording." },
  ])
  const json = JSON.parse(result.response.text())
  return extractedJobRecordSchema.parse(json)
}

export async function groqTranscribe(audioBase64: string, mimeType: string): Promise<string> {
  const { getGroqClient } = await import("@/lib/ai/providers/groq")
  const groq = getGroqClient()
  const buffer = Buffer.from(audioBase64, "base64")
  const ext = mimeType.includes("mp4") || mimeType.includes("m4a") ? "mp4"
    : mimeType.includes("ogg") ? "ogg"
    : mimeType.includes("wav") ? "wav"
    : mimeType.includes("mpeg") || mimeType.includes("mp3") ? "mp3"
    : mimeType.includes("aiff") ? "aiff"
    : "webm"
  const file = new File([buffer], `recording.${ext}`, { type: mimeType })
  const result = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3-turbo",
    response_format: "text",
  })
  return result as unknown as string
}

export async function geminiExtractFromText(transcript: string): Promise<ExtractedJobRecord> {
  const result = await geminiFlash.generateContent([
    { text: EXTRACTION_PROMPT },
    { text: `Extract job information from this on-site conversation transcript:\n\n${transcript}` },
  ])
  const json = JSON.parse(result.response.text())
  return extractedJobRecordSchema.parse(json)
}

export async function groqExtractFromText(transcript: string): Promise<ExtractedJobRecord> {
  const { getGroqClient } = await import("@/lib/ai/providers/groq")
  const groq = getGroqClient()
  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      { role: "user", content: `Extract job information from this on-site conversation transcript:\n\n${transcript}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  })
  const json = JSON.parse(result.choices[0].message.content!)
  return extractedJobRecordSchema.parse(json)
}

export async function extractJobFromAudio(audioBase64: string, mimeType: string): Promise<ExtractedJobRecord> {
  const transcript = await groqTranscribe(audioBase64, mimeType)
  return await groqExtractFromText(transcript)
}
