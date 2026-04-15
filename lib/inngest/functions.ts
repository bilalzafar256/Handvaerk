import { inngest } from "./client"

// Test function — verifies Inngest is connected
export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    triggers: [{ event: "test/hello.world" }],
  },
  async ({ event, step }: { event: { data: { email?: string } }; step: { sleep: (id: string, duration: string) => Promise<void> } }) => {
    await step.sleep("wait-a-moment", "1s")
    return { message: `Hello ${event.data.email ?? "world"}!` }
  }
)
