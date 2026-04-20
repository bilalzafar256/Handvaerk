import { inngest } from "./client"
import { db } from "@/lib/db"
import { quotes, notifications } from "@/lib/db/schema"
import { eq, and, isNull, lte } from "drizzle-orm"

export const quoteFollowup = inngest.createFunction(
  {
    id: "quote-followup-drafts",
    triggers: [{ cron: "0 7 * * *" }],
  },
  async ({ step }: { step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> } }) => {
    await step.run("generate-followup-drafts", async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const staleSentQuotes = await db.query.quotes.findMany({
        where: and(
          eq(quotes.status, "sent"),
          lte(quotes.sentAt, sevenDaysAgo),
          isNull(quotes.followUpDraft),
          isNull(quotes.deletedAt),
        ),
        with: {
          customer: true,
          items: true,
        },
      })

      if (staleSentQuotes.length === 0) return

      const { getGroqClient } = await import("@/lib/ai/providers/groq")
      const groq = getGroqClient()

      for (const quote of staleSentQuotes) {
        const itemSummary = quote.items
          .map((i) => `- ${i.description} (qty: ${i.quantity ?? 1}, unit: ${i.unitPrice})`)
          .join("\n")

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are an assistant helping a tradesperson follow up on a quote. Write a short, professional follow-up email in English. Be friendly and direct. Do not include subject lines or sign-offs — just the body text. Keep it under 100 words.",
            },
            {
              role: "user",
              content: `Quote #${quote.quoteNumber} was sent to ${quote.customer.name} on ${quote.sentAt?.toLocaleDateString("en-GB")} and has not been responded to.\n\nItems quoted:\n${itemSummary}\n\nWrite a follow-up message.`,
            },
          ],
          max_tokens: 200,
        })

        const draft = completion.choices[0]?.message?.content?.trim()
        if (!draft) continue

        await db
          .update(quotes)
          .set({ followUpDraft: draft })
          .where(eq(quotes.id, quote.id))

        await db.insert(notifications).values({
          userId: quote.userId,
          type: "quote_followup_draft",
          title: "Follow-up draft ready",
          body: `A follow-up draft is ready for ${quote.customer.name} (Quote #${quote.quoteNumber}).`,
          metadata: { quoteId: quote.id, quoteNumber: quote.quoteNumber },
        })
      }
    })
  }
)
