import { getGroqClient } from "@/lib/ai/providers/groq"

export interface ExtractedBusinessCard {
  name?: string
  phone?: string
  email?: string
  addressLine1?: string
  addressCity?: string
  addressZip?: string
  cvrNumber?: string
}

const PROMPT = `Extract contact information from this business card image.

Return ONLY a valid JSON object with these fields (omit any field not visible on the card):
{
  "name": "person or company name",
  "phone": "phone number",
  "email": "email address",
  "addressLine1": "street address",
  "addressCity": "city",
  "addressZip": "postal or zip code",
  "cvrNumber": "CVR or VAT registration number"
}

Rules:
- Return ONLY the JSON object, no markdown, no explanation
- Omit fields that are not present on the card
- Return {} if no contact info is found`

export async function extractBusinessCard(
  imageBase64: string,
  mimeType: string
): Promise<ExtractedBusinessCard> {
  const groq = getGroqClient()

  const result = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 512,
  })

  try {
    const text = result.choices[0].message.content ?? "{}"
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    return {}
  }
}
