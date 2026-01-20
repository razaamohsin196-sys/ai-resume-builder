const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ ERROR: GEMINI_API_KEY is missing");
        return;
    }

    try {
        console.log("Checking SchemaType:", SchemaType);
        // If this logs 'undefined', that's the bug.
    } catch (e) {
        console.error("SchemaType check failed:", e);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const schema = {
        description: "Modified Resume Response",
        type: SchemaType.OBJECT,
        properties: {
            html: { type: SchemaType.STRING, description: "The clean, modified HTML string." },
            annotated_html: { type: SchemaType.STRING, description: "The modified HTML with changes wrapped in <mark> tags." },
            summary: { type: SchemaType.STRING, description: "A summary of changes." },
            changes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of specific changes." }
        },
        required: ["html", "summary", "changes"]
    };

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
        },
        systemInstruction: "You are an expert HTML Resume Editor."
    });

    const instruction = "Make the summary more concise";
    const currentHtml = "<html><body><div class='summary'>Becky Shu is...</div></body></html>";

    console.log("🚀 Sending request...");
    try {
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: `INSTRUCTION: ${instruction}` },
                    { text: `CURRENT HTML:\n${currentHtml}` }
                ]
            }]
        });

        const text = result.response.text();
        console.log("📥 Raw Response:", text);
        const json = JSON.parse(text);
        console.log("✅ Valid JSON:", json);

    } catch (e) {
        console.error("❌ Request Failed:", e);
    }
}

testGemini();
