import { NextResponse } from "next/server"

const RAZORPAY_SDK_URL = "https://checkout.razorpay.com/v1/checkout.js"

export async function GET() {
  try {
    const upstream = await fetch(RAZORPAY_SDK_URL, {
      headers: {
        Accept: "application/javascript,text/javascript,*/*;q=0.1",
        "User-Agent": "KhataPlus-Razorpay-SDK-Proxy/1.0",
      },
      cache: "no-store",
    })

    if (!upstream.ok) {
      return new NextResponse(
        "console.error('Razorpay SDK proxy upstream failed');",
        {
          status: 502,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-store",
          },
        }
      )
    }

    const body = await upstream.text()
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch {
    return new NextResponse(
      "console.error('Razorpay SDK proxy request failed');",
      {
        status: 502,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    )
  }
}

