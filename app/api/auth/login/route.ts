export const runtime = "nodejs"
export const maxDuration = 10

export async function POST(request: Request) {
  console.log("[LOGIN] TEST POST hit")
  return Response.json({ ok: true, test: true })
}

export async function GET() {
  return Response.json({ ok: true, warm: true })
}
