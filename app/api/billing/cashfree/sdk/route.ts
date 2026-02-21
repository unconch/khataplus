import { NextResponse } from "next/server"

const CASHFREE_SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js"

export async function GET() {
  try {
    const response = await fetch(CASHFREE_SDK_URL, {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      return new NextResponse("/* Cashfree SDK unavailable */", {
        status: 502,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      })
    }

    const body = await response.text()

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    return new NextResponse("/* Cashfree SDK fetch failed */", {
      status: 500,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    })
  }
}

