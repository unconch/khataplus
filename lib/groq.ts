import Groq from "groq-sdk"

if (!process.env.GROQ_API_KEY) {
    console.warn("[Groq] GROQ_API_KEY not set - AI analysis disabled")
}

let groqInstance: Groq | null = null

function getGroqClient(): Groq {
    if (!groqInstance) {
        if (!process.env.GROQ_API_KEY) throw new Error("Groq not configured")
        groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY })
    }
    return groqInstance
}

export async function groqChat(prompt: string): Promise<string> {
    const client = getGroqClient()
    const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.05,
        max_tokens: 1024,
        response_format: { type: "json_object" },
    })
    return response.choices[0]?.message?.content || "{}"
}

export async function groqWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3
): Promise<T> {
    let lastError: any
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error: any) {
            lastError = error
            if (error.status === 401) {
                throw new Error("Invalid Groq API key")
            }
            if (error.status === 429) {
                await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)))
                continue
            }
            if (attempt < maxRetries - 1) {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
            }
        }
    }
    throw lastError
}

export function parseGroqJSON<T>(text: string, fallback: T): T {
    try {
        const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        return JSON.parse(clean) as T
    } catch {
        return fallback
    }
}

export const isGroqAvailable = () => !!process.env.GROQ_API_KEY
