import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import OpenAI from "openai";
import { resolveProvider, type AIProvider } from "./provider";

type ProviderType = "gemini" | "openai" | null;

/**
 * Generate content with system instruction and custom model configuration
 * Supports both Gemini and OpenAI
 */
export async function generateContentWithSystem(
    systemInstruction: string,
    userPrompt: string,
    options?: {
        model?: string;
        responseMimeType?: "application/json" | "text/plain";
        provider?: AIProvider;
    }
): Promise<string | null> {
    const provider = resolveProvider(options?.provider || "auto") as ProviderType;

    if (!provider) {
        console.warn("No AI API Key found.");
        return null;
    }

    if (provider === "openai") {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const model = options?.model || "gpt-4o";
        
        try {
            const response = await client.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ],
                response_format: options?.responseMimeType === "application/json" 
                    ? { type: "json_object" } 
                    : undefined
            });

            return response.choices[0]?.message?.content || null;
        } catch (error: any) {
            console.error("⚠️ OpenAI API Error:", error?.message || error);
            return null;
        }
    } else {
        // Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
            model: options?.model || "gemini-2.0-flash-exp",
            systemInstruction
        });

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                generationConfig: {
                    responseMimeType: options?.responseMimeType || "application/json"
                }
            });

            return result.response.text();
        } catch (error: any) {
            console.error("⚠️ Gemini API Error:", error?.message || error);
            return null;
        }
    }
}

/**
 * Generate content with structured output (JSON schema)
 * Supports both Gemini and OpenAI
 */
export async function generateStructuredContent(
    systemInstruction: string,
    userPrompt: string,
    schema: any,
    options?: {
        model?: string;
        provider?: AIProvider;
    }
): Promise<any> {
    const provider = resolveProvider(options?.provider || "auto") as ProviderType;

    if (!provider) {
        console.warn("No AI API Key found.");
        return null;
    }

    if (provider === "openai") {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const model = options?.model || "gpt-4o";
        
        try {
            const response = await client.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" }
            });

            const text = response.choices[0]?.message?.content;
            if (!text) return null;

            try {
                return JSON.parse(text);
            } catch (e) {
                console.error("OpenAI JSON Parse Error:", e);
                return null;
            }
        } catch (error: any) {
            console.error("⚠️ OpenAI API Error:", error?.message || error);
            return null;
        }
    } else {
        // Gemini with SchemaType
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
            model: options?.model || "gemini-2.0-flash-exp",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            },
            systemInstruction
        });

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: userPrompt }] }]
            });

            const text = result.response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error("Gemini JSON Parse Error:", e);
                return null;
            }
        } catch (error: any) {
            console.error("⚠️ Gemini API Error:", error?.message || error);
            return null;
        }
    }
}

/**
 * Check if any AI provider is available
 */
export function hasAIProvider(): boolean {
    return !!(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
}
