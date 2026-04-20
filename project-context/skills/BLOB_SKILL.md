# SKILL: Vercel Blob — File Storage
> Source: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
> Package: `@vercel/blob`

---

## PROJECT-SPECIFIC RULES

- Use `access: 'private'` for ALL financial documents (invoices, quotes, receipts) — never public.
- Use `access: 'public'` only for non-sensitive assets (company logos, profile photos).
- ALWAYS scope blob pathnames to `userId`: `uploads/{userId}/invoices/{filename}`. Never allow a user to access another user's blobs.
- Validate file type and size in `onBeforeGenerateToken` before generating client tokens.
- Store the returned `url` in the Neon DB (never rely on reconstructing the URL).
- Call blob operations from Server Actions or Inngest functions — not client-side (except for `upload()` client uploads with token).
- Use `addRandomSuffix: true` on all uploads to prevent filename collisions.
- For PDF generation: use server-side `put()` from an Inngest function — do not upload from the browser.

---

## INSTALLATION

```bash
npm install @vercel/blob
```

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

---

## SERVER-SIDE UPLOAD (PDF generation from Inngest)

```typescript
// lib/inngest/generate-invoice-pdf.ts
import { put } from '@vercel/blob'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePdf } from '@/components/pdf/invoice-pdf'

export const generateInvoicePdf = inngest.createFunction(
  { id: 'generate-invoice-pdf' },
  { event: 'invoice/pdf.requested' },
  async ({ event }) => {
    const { invoiceId, userId } = event.data

    // Fetch invoice (always scoped to userId)
    const invoice = await getInvoiceForUser(invoiceId, userId)

    // Generate PDF buffer server-side
    const pdfBuffer = await renderToBuffer(<InvoicePdf invoice={invoice} />)

    // Upload to Blob — private, scoped to userId
    const blob = await put(
      `invoices/${userId}/${invoice.invoiceNumber}.pdf`,
      pdfBuffer,
      {
        access: 'private',
        addRandomSuffix: true,
        contentType: 'application/pdf',
        cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year
      }
    )

    // Store URL in DB
    await db.update(invoices)
      .set({ pdfUrl: blob.url, pdfGeneratedAt: new Date() })
      .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))

    return { url: blob.url }
  }
)
```

---

## SERVING PRIVATE BLOBS (authenticated download)

```typescript
// lib/actions/files.ts
'use server'
import { get } from '@vercel/blob'
import { auth } from '@clerk/nextjs/server'

export async function getInvoicePdfStream(invoiceId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Verify invoice belongs to user
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)),
  })
  if (!invoice?.pdfUrl) throw new Error('Not found')

  // Stream private blob through our server
  const blob = await get(invoice.pdfUrl, { access: 'private' })
  return blob  // stream to the response
}
```

```typescript
// app/api/invoices/[id]/pdf/route.ts  (Route handler — ok for file downloads)
import { auth } from '@clerk/nextjs/server'
import { getInvoicePdfStream } from '@/lib/actions/files'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const blob = await getInvoicePdfStream(params.id)
  if (!blob) return new Response('Not found', { status: 404 })

  return new Response(blob.stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice.pdf"`,
    },
  })
}
```

---

## CLIENT UPLOAD (company logo / profile photo)

```typescript
// app/api/upload/route.ts  — token generation endpoint
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // ALWAYS authenticate here — anonymous uploads are a security hole
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        return {
          addRandomSuffix: true,
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB max
          tokenPayload: JSON.stringify({ userId }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { userId } = JSON.parse(tokenPayload!)
        // Update user profile with logo URL
        await db.update(userProfiles)
          .set({ logoUrl: blob.url })
          .where(eq(userProfiles.userId, userId))
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    )
  }
}
```

```tsx
// components/forms/logo-upload.tsx
'use client'
import { upload } from '@vercel/blob/client'
import { useState } from 'react'

export function LogoUpload() {
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })
      // blob.url is the public CDN URL
    } finally {
      setUploading(false)
    }
  }

  return <input type="file" accept="image/*" onChange={handleFileChange} />
}
```

---

## BLOB PATHNAME CONVENTIONS

```
invoices/{userId}/{invoiceNumber}-{random}.pdf     ← private
quotes/{userId}/{quoteNumber}-{random}.pdf         ← private
logos/{userId}/logo-{random}.png                   ← public
```

---

## DELETE ON ACCOUNT DELETION (GDPR)

```typescript
// lib/actions/account.ts — GDPR right to erasure
import { list, del } from '@vercel/blob'

export async function deleteAllUserBlobs(userId: string) {
  // List all blobs for this user across folders
  const prefixes = [`invoices/${userId}/`, `quotes/${userId}/`, `logos/${userId}/`]

  for (const prefix of prefixes) {
    let cursor: string | undefined

    do {
      const { blobs, cursor: nextCursor, hasMore } = await list({
        prefix,
        cursor,
        limit: 100,
      })

      if (blobs.length > 0) {
        await del(blobs.map((b) => b.url))
      }

      cursor = hasMore ? nextCursor : undefined
    } while (cursor)
  }
}
```

---

## SDK METHODS REFERENCE

| Method | Use case |
|---|---|
| `put(pathname, body, options)` | Server-side upload (PDFs, processed files) |
| `get(url, options)` | Stream private blob through server |
| `del(url \| urls)` | Delete one or many blobs |
| `head(url)` | Get blob metadata without body |
| `list({ prefix, limit, cursor })` | List blobs, paginate with cursor |
| `copy(fromUrl, toPathname, options)` | Duplicate a blob (e.g. template → draft) |
| `upload()` (client) | Direct browser-to-blob upload via token |
