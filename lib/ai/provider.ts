import * as gemini from "./gemini";
import * as openai from "./openai";

export type AIProvider = "gemini" | "openai" | "auto";

/**
 * Get the preferred AI provider based on available API keys
 * Priority: GEMINI_API_KEY > OPENAI_API_KEY (Gemini first, OpenAI as fallback)
 */
function getPreferredProvider(): "gemini" | "openai" | null {
    if (process.env.GEMINI_API_KEY) {
        return "gemini";
    }
    if (process.env.OPENAI_API_KEY) {
        return "openai";
    }
    return null;
}

/**
 * Unified generateContent function that uses the preferred provider
 * @param systemPrompt - System prompt/instruction
 * @param userContent - User content/prompt
 * @param preferredProvider - Optional provider preference ("gemini", "openai", or "auto")
 * @returns Parsed JSON response or null
 */
export async function generateContent(
    systemPrompt: string,
    userContent: string,
    preferredProvider: AIProvider = "auto"
): Promise<any> {
    let provider: "gemini" | "openai" | null = null;

    if (preferredProvider === "auto") {
        provider = getPreferredProvider();
    } else if (preferredProvider === "openai" && process.env.OPENAI_API_KEY) {
        provider = "openai";
    } else if (preferredProvider === "gemini" && process.env.GEMINI_API_KEY) {
        provider = "gemini";
    } else {
        // Fallback to auto if preferred provider is not available
        provider = getPreferredProvider();
    }

    if (!provider) {
        console.warn("No AI API Key found (neither OPENAI_API_KEY nor GEMINI_API_KEY). Returning null.");
        return null;
    }

    if (provider === "openai") {
        return await openai.generateContent(systemPrompt, userContent);
    } else {
        return await gemini.generateContent(systemPrompt, userContent);
    }
}

/**
 * Unified generateEmbedding function
 */
export async function generateEmbedding(
    text: string,
    preferredProvider: AIProvider = "auto"
): Promise<number[] | null> {
    let provider: "gemini" | "openai" | null = null;

    if (preferredProvider === "auto") {
        provider = getPreferredProvider();
    } else if (preferredProvider === "openai" && process.env.OPENAI_API_KEY) {
        provider = "openai";
    } else if (preferredProvider === "gemini" && process.env.GEMINI_API_KEY) {
        provider = "gemini";
    } else {
        provider = getPreferredProvider();
    }

    if (!provider) {
        console.warn("No AI API Key found. Cannot generate embeddings.");
        return null;
    }

    if (provider === "openai") {
        return await openai.generateEmbedding(text);
    } else {
        return await gemini.generateEmbedding(text);
    }
}

/**
 * Unified generateEmbeddings function
 */
export async function generateEmbeddings(
    texts: string[],
    preferredProvider: AIProvider = "auto"
): Promise<number[][] | null> {
    let provider: "gemini" | "openai" | null = null;

    if (preferredProvider === "auto") {
        provider = getPreferredProvider();
    } else if (preferredProvider === "openai" && process.env.OPENAI_API_KEY) {
        provider = "openai";
    } else if (preferredProvider === "gemini" && process.env.GEMINI_API_KEY) {
        provider = "gemini";
    } else {
        provider = getPreferredProvider();
    }

    if (!provider) {
        console.warn("No AI API Key found. Cannot generate embeddings.");
        return null;
    }

    if (provider === "openai") {
        return await openai.generateEmbeddings(texts);
    } else {
        return await gemini.generateEmbeddings(texts);
    }
}

/**
 * Get the currently active provider
 */
export function getActiveProvider(): "gemini" | "openai" | null {
    return getPreferredProvider();
}
