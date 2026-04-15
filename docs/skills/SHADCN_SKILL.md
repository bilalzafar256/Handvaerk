# SKILL: shadcn/ui + Aceternity UI + Tailwind CSS v4
> Source: https://ui.shadcn.com/docs | https://ui.aceternity.com | https://tailwindcss.com/docs
> shadcn/ui llms.txt: https://ui.shadcn.com/llms.txt

---

## PROJECT-SPECIFIC RULES
- shadcn/ui is the BASE component library (buttons, forms, inputs, dialogs).
- Aceternity UI is for PREMIUM/animated components (cards, backgrounds, effects).
- They are compatible — Aceternity is built on top of shadcn.
- All components are in `/components/ui/` (shadcn) and `/components/aceternity/` (Aceternity).
- Tailwind CSS v4 — note: v4 has breaking changes from v3.

---

## INITIALIZING shadcn/ui

```bash
# In project root
npx shadcn@latest init

# Add components as needed
npx shadcn@latest add button
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add badge
npx shadcn@latest add card
npx shadcn@latest add skeleton
npx shadcn@latest add sheet
npx shadcn@latest add select
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add tabs
```

---

## TAILWIND CSS v4 — KEY CHANGES FROM v3

```css
/* globals.css — v4 syntax */
@import "tailwindcss";

/* CSS variables for theme */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --radius: 0.625rem;
}
```

v4 differences:
- No `tailwind.config.js` needed (config in CSS)
- `@apply` still works but less needed
- JIT is always on
- Content detection is automatic

---

## FORM PATTERN (shadcn Form + React Hook Form + Zod)

```tsx
// Standard form pattern used throughout the project
"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
})

type CustomerFormValues = z.infer<typeof customerSchema>

export function CustomerForm({ onSubmit }: { onSubmit: (data: CustomerFormValues) => void }) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", email: "" },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer name</FormLabel>
              <FormControl>
                <Input placeholder="Jens Hansen" {...field} />
              </FormControl>
              <FormMessage />  {/* Shows Zod error */}
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {form.formState.isSubmitting ? "Saving..." : "Save customer"}
        </Button>
      </form>
    </Form>
  )
}
```

---

## TOAST NOTIFICATIONS

```tsx
// Add sonner for toasts (recommended with shadcn)
npx shadcn@latest add sonner

// In root layout
import { Toaster } from "@/components/ui/sonner"
<Toaster position="top-center" />

// Usage anywhere
import { toast } from "sonner"
toast.success("Invoice sent ✓")
toast.error("Failed to save. Try again.")
toast.loading("Sending...")
```

---

## DIALOG / MODAL PATTERN

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function CreateJobDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New job</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new job</DialogTitle>
        </DialogHeader>
        <JobForm />
      </DialogContent>
    </Dialog>
  )
}
```

---

## BADGE PATTERN (Job status)

```tsx
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusColors = {
  new: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  done: "bg-purple-100 text-purple-700",
  invoiced: "bg-orange-100 text-orange-700",
  paid: "bg-green-100 text-green-700",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("capitalize", statusColors[status as keyof typeof statusColors])}>
      {status.replace("_", " ")}
    </Badge>
  )
}
```

---

## SKELETON LOADING (matches real layout)

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function JobCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <Skeleton className="h-5 w-3/4" />     {/* Job title */}
      <Skeleton className="h-4 w-1/2" />     {/* Customer name */}
      <Skeleton className="h-6 w-24" />      {/* Status badge */}
    </div>
  )
}
```

---

## ACETERNITY UI USAGE

Aceternity components are copy-pasted from https://ui.aceternity.com/components

Best components for this project:
- **Card Hover Effect** — customer list cards
- **Background Beams** — auth page background
- **Animated Tabs** — settings page
- **Spotlight** — dashboard hero section

```bash
# Aceternity requires framer-motion (we have it as 'motion')
# Copy component code from ui.aceternity.com into /components/aceternity/
```

---

## THE `cn` UTILITY (always use for className merging)

```typescript
// lib/utils.ts (auto-generated by shadcn init)
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
<div className={cn("base-classes", isActive && "active-classes", className)} />
```
