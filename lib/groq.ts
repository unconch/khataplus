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

export async function groqChat(prompt: string, model: string = "llama-3.3-70b-versatile", temperature?: number): Promise<string> {
    const client = getGroqClient()
    // Use near-zero temperature for structured JSON mapping/classification tasks.
    // R1 was previously 0.6 which caused hallucinated column names between retries.
    const effectiveTemp = temperature ?? 0.1
    const useJsonMode = !model.includes("r1") && !model.includes("qwen")
    // Groq requires the word "json" to appear somewhere in the prompt when using json_object response_format.
    // Prepend a system-level note to guarantee compliance without rewriting every caller's prompt.
    const finalPrompt = useJsonMode && !prompt.toLowerCase().includes("json")
        ? `Respond with strict JSON only.\n\n${prompt}`
        : prompt
    const response = await client.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: finalPrompt }],
        temperature: effectiveTemp,
        max_tokens: 4096,
        response_format: useJsonMode ? { type: "json_object" } : undefined,
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

export function parseGroqJSON<T>(text: string, fallback: T): { data: T, reasoning?: string } {
    try {
        // Handle DeepSeek-R1 style <think> blocks
        const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/)
        const reasoning = thinkMatch ? thinkMatch[1].trim() : undefined

        // Remove reasoning block for JSON parsing
        let jsonOnly = text.replace(/<think>[\s\S]*?<\/think>/, "").trim()

        // Remove markdown code blocks if present
        jsonOnly = jsonOnly.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

        // Robust JSON extraction: find first '{' and last '}'
        const firstBrace = jsonOnly.indexOf("{")
        const lastBrace = jsonOnly.lastIndexOf("}")

        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonOnly = jsonOnly.substring(firstBrace, lastBrace + 1)
        }

        return {
            data: JSON.parse(jsonOnly) as T,
            reasoning
        }
    } catch (e) {
        console.warn("[Groq] JSON Parse failed:", e)
        return { data: fallback }
    }
}

export const isGroqAvailable = () => !!process.env.GROQ_API_KEY
