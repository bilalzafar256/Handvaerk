import { GoogleGenerativeAI } from "@google/generative-ai"

export const gemini = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export const geminiFlash = gemini.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: { responseMimeType: "application/json" },
})
