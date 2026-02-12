import * as gemini from "./gemini";
import * as openai from "./openai";

export type AIProvider = "gemini" | "openai" | "auto";

type ProviderType = "gemini" | "openai" | null;

/**
 * Get the preferred AI provider based on available API keys
 * Priority: GEMINI_API_KEY > OPENAI_API_KEY (Gemini first, OpenAI as fallback)
 */
function getPreferredProvider(): ProviderType {
    if (process.env.GEMINI_API_KEY) return "gemini";
    if (process.env.OPENAI_API_KEY) return "openai";
    return null;
}

/**
 * Resolve provider from preference, with fallback logic
 */
function resolveProvider(preferredProvider: AIProvider): ProviderType {
    if (preferredProvider === "auto") {
        return getPreferredProvider();
    }
    
    // Check if preferred provider is available
    if (preferredProvider === "openai" && process.env.OPENAI_API_KEY) {
        return "openai";
    }
    if (preferredProvider === "gemini" && process.env.GEMINI_API_KEY) {
        return "gemini";
    }
    
    // Fallback to auto if preferred provider is not available
    return getPreferredProvider();
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
    const provider = resolveProvider(preferredProvider);
    
    if (!provider) {
        console.warn("No AI API Key found (neither OPENAI_API_KEY nor GEMINI_API_KEY). Returning null.");
        return null;
    }

    return provider === "openai"
        ? await openai.generateContent(systemPrompt, userContent)
        : await gemini.generateContent(systemPrompt, userContent);
}

/**
 * Unified generateEmbedding function
 */
export async function generateEmbedding(
    text: string,
    preferredProvider: AIProvider = "auto"
): Promise<number[] | null> {
    const provider = resolveProvider(preferredProvider);
    
    if (!provider) {
        console.warn("No AI API Key found. Cannot generate embeddings.");
        return null;
    }

    return provider === "openai"
        ? await openai.generateEmbedding(text)
        : await gemini.generateEmbedding(text);
}

/**
 * Unified generateEmbeddings function
 */
export async function generateEmbeddings(
    texts: string[],
    preferredProvider: AIProvider = "auto"
): Promise<number[][] | null> {
    const provider = resolveProvider(preferredProvider);
    
    if (!provider) {
        console.warn("No AI API Key found. Cannot generate embeddings.");
        return null;
    }

    return provider === "openai"
        ? await openai.generateEmbeddings(texts)
        : await gemini.generateEmbeddings(texts);
}

/**
 * Get the currently active provider
 */
export function getActiveProvider(): ProviderType {
    return getPreferredProvider();
}

// Export for use in advanced.ts
export { getPreferredProvider, resolveProvider };
