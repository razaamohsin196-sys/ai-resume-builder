import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateContent(systemPrompt: string, userContent: string) {
    if (!genAI) {
        console.warn("No Gemini API Key found. Returning mock data.");
        return null;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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

        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}
