import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

export async function generateContent(systemPrompt: string, userContent: string) {
    if (!client) {
        console.warn("No OpenAI API Key found. Returning mock data.");
        return null;
    }

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            response_format: { type: "json_object" }
        });

        const text = response.choices[0]?.message?.content;
        if (!text) {
            console.error("OpenAI returned empty response");
            return null;
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("OpenAI JSON Parse Error. Raw output:", text.slice(0, 500) + "..." + text.slice(-500));
            return null; // Return null instead of throwing to allow graceful fallback
        }
    } catch (error: any) {
        // Handle specific API errors gracefully
        if (error?.status === 429 || error?.message?.includes("rate limit")) {
            console.error("⚠️ OpenAI API Rate Limit Exceeded. Please check your usage at https://platform.openai.com/usage");
        } else if (error?.status === 401 || error?.message?.includes("API key")) {
            console.error("⚠️ OpenAI API Key Invalid. Please check your OPENAI_API_KEY environment variable.");
        } else {
            console.error("⚠️ OpenAI API Error:", error?.message || error);
        }
        
        // Return null to allow the calling code to use fallback/mock data
        return null;
    }
}

/**
 * Generate embeddings using OpenAI Embedding model
 * @param text - The text to generate embeddings for
 * @returns A vector of embeddings (array of numbers)
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
    if (!client) {
        console.warn("No OpenAI API Key found. Cannot generate embeddings.");
        return null;
    }

    try {
        const response = await client.embeddings.create({
            model: "text-embedding-3-small",
            input: text
        });

        return response.data[0]?.embedding || null;
    } catch (error: any) {
        if (error?.status === 429 || error?.message?.includes("rate limit")) {
            console.error("⚠️ OpenAI API Rate Limit Exceeded for embeddings.");
        } else {
            console.error("⚠️ OpenAI Embedding API Error:", error?.message || error);
        }
        return null;
    }
}

/**
 * Generate embeddings for multiple texts in a batch
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][] | null> {
    if (!client) {
        console.warn("No OpenAI API Key found. Cannot generate embeddings.");
        return null;
    }

    try {
        const response = await client.embeddings.create({
            model: "text-embedding-3-small",
            input: texts
        });

        return response.data.map(item => item.embedding);
    } catch (error: any) {
        if (error?.status === 429 || error?.message?.includes("rate limit")) {
            console.error("⚠️ OpenAI API Rate Limit Exceeded for batch embeddings.");
        } else {
            console.error("⚠️ OpenAI Batch Embedding API Error:", error?.message || error);
        }
        return null;
    }
}

/**
 * Generate content with custom model and options
 * @param model - The model to use (e.g., "gpt-4o", "gpt-4o-mini")
 * @param messages - Array of messages (system, user, assistant)
 * @param options - Additional options like temperature, max_tokens, etc.
 */
export async function generateContentAdvanced(
    model: string,
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: {
        temperature?: number;
        max_tokens?: number;
        response_format?: { type: "json_object" | "text" };
    }
) {
    if (!client) {
        console.warn("No OpenAI API Key found. Returning null.");
        return null;
    }

    try {
        const response = await client.chat.completions.create({
            model,
            messages: messages as any,
            ...options
        });

        return response.choices[0]?.message?.content || null;
    } catch (error: any) {
        console.error("⚠️ OpenAI API Error:", error?.message || error);
        return null;
    }
}
