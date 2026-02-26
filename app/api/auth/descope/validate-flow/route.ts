import { NextResponse } from "next/server"
import { createSdk } from "@descope/nextjs-sdk/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const flowId = String(searchParams.get("flowId") || "").trim()

    if (!flowId) {
      return NextResponse.json({ ok: false, error: "flowId is required" }, { status: 400 })
    }

    const sdk = createSdk()
    const result = await sdk.flow.start(flowId, {})

    if (result?.ok) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json(
      {
        ok: false,
        error: result?.error?.errorDescription || result?.error?.errorMessage || "Flow validation failed",
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Flow validation failed" },
      { status: 200 }
    )
  }
}

