import { NextRequest, NextResponse } from "next/server"

// Sentry tunnel endpoint to bypass ad blockers
// This routes Sentry requests through your own server

const SENTRY_HOST = "o4510831393701888.ingest.de.sentry.io"
const SENTRY_PROJECT_IDS = ["4510831395274832"]

export async function POST(request: NextRequest) {
    try {
        const envelope = await request.text()
        const pieces = envelope.split("\n")

        // Parse the envelope header to get the DSN
        const header = JSON.parse(pieces[0])
        const dsn = new URL(header.dsn)
        const projectId = dsn.pathname.replace("/", "")

        // Validate the project ID
        if (!SENTRY_PROJECT_IDS.includes(projectId)) {
            return NextResponse.json({ error: "Invalid project" }, { status: 400 })
        }

        // Forward the envelope to Sentry
        const sentryUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`

        const response = await fetch(sentryUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-sentry-envelope",
            },
            body: envelope,
        })

        return new NextResponse(response.body, {
            status: response.status,
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (error) {
        console.error("Sentry tunnel error:", error)
        return NextResponse.json({ error: "Tunnel error" }, { status: 500 })
    }
}
