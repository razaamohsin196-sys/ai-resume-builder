import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateContent(systemPrompt: string, userContent: string) {
    if (!genAI) {
        console.warn("No Gemini API Key found. Returning mock data.");
        return null;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        const result = await model.generateContent({
            contents: [
                { role: "model", parts: [{ text: systemPrompt }] },
                { role: "user", parts: [{ text: userContent }] }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const text = result.response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Gemini JSON Parse Error. Raw output:", text.slice(0, 500) + "..." + text.slice(-500));
            return null; // Return null instead of throwing to allow graceful fallback
        }
    } catch (error: any) {
        // Handle specific API errors gracefully
        if (error?.message?.includes("429") || error?.message?.includes("quota")) {
            console.error("⚠️ Gemini API Quota Exceeded. Please check your billing at https://ai.google.dev/");
        } else if (error?.message?.includes("401") || error?.message?.includes("API key")) {
            console.error("⚠️ Gemini API Key Invalid. Please check your GEMINI_API_KEY environment variable.");
        } else {
            console.error("⚠️ Gemini API Error:", error?.message || error);
        }
        
        // Return null to allow the calling code to use fallback/mock data
        return null;
    }
}

/**
 * Generate embeddings using Gemini Embedding model
 * @param text - The text to generate embeddings for
 * @returns A vector of embeddings (array of numbers)
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
    if (!genAI) {
        console.warn("No Gemini API Key found. Cannot generate embeddings.");
        return null;
    }

    // Using text-embedding-004 which is Gemini's latest embedding model
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    try {
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        
        return embedding.values;
    } catch (error: any) {
        if (error?.message?.includes("429") || error?.message?.includes("quota")) {
            console.error("⚠️ Gemini API Quota Exceeded for embeddings.");
        } else {
            console.error("⚠️ Gemini Embedding API Error:", error?.message || error);
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
    if (!genAI) {
        console.warn("No Gemini API Key found. Cannot generate embeddings.");
        return null;
    }

    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    try {
        const results = await Promise.all(
            texts.map(text => model.embedContent(text))
        );
        
        const embeddings = results.map(result => result.embedding.values);
        return embeddings;
    } catch (error: any) {
        if (error?.message?.includes("429") || error?.message?.includes("quota")) {
            console.error("⚠️ Gemini API Quota Exceeded for batch embeddings.");
        } else {
            console.error("⚠️ Gemini Batch Embedding API Error:", error?.message || error);
        }
        return null;
    }
}
