import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const { userId: clerkId } = await auth()
        if (!clerkId) throw new Error("Unauthorized")

        return {
          addRandomSuffix: true,
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB for job site photos
          tokenPayload: JSON.stringify({ clerkId }),
        }
      },
      onUploadCompleted: async () => {
        // Photo DB record is created separately via addJobPhotoAction
        // after the upload completes client-side
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
