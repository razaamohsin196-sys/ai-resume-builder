"use server";

import { generateContent } from "@/lib/ai/gemini";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { RawInput, CareerIntent, CareerProfile, ResumeDraft, ResumeBullet } from "@/types/career";
import { hydrateContext } from "@/lib/context-hydrator";
import { getTemplateById } from "@/lib/templates"; // Registry import
import { IngestionSource, CareerProfilePatch, ChatLearning } from "@/lib/ingestion/types";
import { GitHubIngestionAgent } from "@/lib/ingestion/agents/github";
import { LinkedInIngestionAgent } from "@/lib/ingestion/agents/linkedin";
// Import Bridge
import { processCareerProfile as processBridge } from "@/lib/bridge-process";

// Mock data for when API key is missing
const MOCK_PROFILE: CareerProfile = {
    analysisReport: "This is a mock analysis report for testing purposes.",
    summary: "Senior Product Designer with 7 years of experience in SaaS and Fintech. specialized in complex system design and design systems.",
    items: [
        {
            id: "mock-1",
            category: "role",
            title: "Senior Product Designer at Fintech Co",
            description: "Led the redesign of the core banking dashboard.",
            sourceIds: ["mock-source"],
            evidenceStrength: "strong",
            dates: "2020 - Present"
        },
        {
            id: "mock-skill-1",
            category: "skill",
            title: "Figma",
            description: "Advanced prototyping",
            sourceIds: ["mock-source"],
            evidenceStrength: "strong"
        }
    ],
    gaps: ["Missing specific metrics for the banking dashboard project"]
};

const MOCK_RESUME: ResumeDraft = {
    sections: [
        {
            id: "exp",
            title: "Experience",
            bullets: [
                {
                    id: "bullet-1",
                    text: "Spearheaded the redesign of the core banking dashboard, resulting in a 20% increase in user retention.",
                    sourceIds: ["mock-1"],
                    evidenceStrength: "strong",
                    skills: ["UX Design", "Product Strategy"]
                },
                {
                    id: "bullet-2",
                    text: "Facilitated design workshops with cross-functional stakeholders to align on product vision.",
                    sourceIds: ["mock-1"],
                    evidenceStrength: "medium",
                    skills: ["Workshop Facilitation"]
                }
            ]
        },
        {
            id: "skills",
            title: "Skills",
            bullets: [
                {
                    id: "bullet-3",
                    text: "Figma, React, TypeScript, Tailwind CSS",
                    sourceIds: ["mock-skill-1"],
                    evidenceStrength: "strong",
                    skills: []
                }
            ]
        }
    ]
};


export async function processCareerProfile(inputs: RawInput[], intent: CareerIntent, overrides?: any) {
    console.log("[BRIDGE] Delegating to Multi-Source Bridge...");
    // We try to use the bridge. If it handles it, great.
    // If it falls back (empty profile), we might want to run legacy?
    // For now, let's just use the bridge entirely as it has basic fallback logic inside.
    return await processBridge(inputs, intent, overrides);
}

// Renamed legacy function
async function processLegacy(inputs: RawInput[], intent: CareerIntent) {
    // Construct the parts for Gemini
    // We will mix text parts and inlineData parts (for files)
    const parts: any[] = [];

    // Add System Context
    const intentContext = `Target Role: ${intent.targetRole}\nTarget Location: ${intent.targetLocation}\nYOE: ${intent.yearsOfExperience}\nGoal: ${intent.jobSearchIntent}`;
    parts.push({ text: `CONTEXT:\n${intentContext}` });

    console.log(`[processCareerProfile] Received ${inputs.length} inputs`);
    inputs.forEach((inp, idx) => console.log(`Input ${idx}: type=${inp.type} content_preview=${inp.content.substring(0, 50)}...`));

    // Add Inputs
    // We explicitly map the inputs to simple, 1-indexed integers so the model can easily cite them.
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const sourceId = i + 1;

        if (input.type === 'file' && input.data && input.mimeType) {
            parts.push({ text: `[Source ID: ${sourceId}] Filename: ${input.content}` });
            parts.push({
                inlineData: {
                    mimeType: input.mimeType,
                    data: input.data
                }
            });
        } else if (input.type === 'url' || input.type === 'linkedin') {
            // HYDRATION: Fetch content!
            // We use a helper to fetch rich content (e.g. GitHub READMEs)
            const hydratedContent = await hydrateContext(input.content);
            parts.push({
                text: `[Source ID: ${sourceId}] [URL: ${input.content}]\nCONTENT:\n${hydratedContent}`
            });
        } else {
            // Text or URL
            parts.push({ text: `[Source ID: ${sourceId}] (${input.type}): ${input.content}` });
        }
    }

    // Since we changed the internal logic to use parts, we need to bypass the simple generateContent helper
    // or update `generateContent` to support parts. Let's update `generateContent` in gemini.ts instead.
    // Actually, for speed, I'll just use the client directly here or update the helper.
    // Let's update the helper to be more flexible. 

    // Wait, I can't update the helper easily without breaking other calls or doing two edits.
    // I'll just do a direct call here for the multimodal support to ensure it works perfect.

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return MOCK_PROFILE;

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        systemInstruction: SYSTEM_PROMPTS.CAREER_UNDERSTANDING
    });

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig: { responseMimeType: "application/json" }
        });
        return JSON.parse(result.response.text()) as CareerProfile;
    } catch (error: any) {
        console.error("Gemini Error", error);
        throw new Error(`AI Processing Failed: ${error.message || "Unknown Error"}`);
    }
}

export async function generateResumeDraft(profile: CareerProfile, intent: CareerIntent, options?: { fitToOnePage?: boolean }) {
    const profileContext = JSON.stringify(profile, null, 2);
    const jobContext = intent.jobSearchIntent ? `TARGET JOB DESCRIPTION:\n${intent.jobSearchIntent}\n\n` : '';
    const intentContext = `Target Role: ${intent.targetRole}\nTarget Location: ${intent.targetLocation}\n${jobContext}`;

    let instruction = "";
    if (options?.fitToOnePage) {
        instruction = `
        CRITICAL CONSTRAINT: FIT TO ONE PAGE.
        - The user specifically requested a 1-page resume.
        - You MUST be aggressive in cutting content.
        - Prioritize: The most recent 3 roles and top 5 items relevant to ${intent.targetRole}.
        - Drop: Old internships, irrelevant volunteering, generic soft skills.
        - Consolidate: Merge "Certifications" and "Awards" if needed.
        - Summarize: Shorten bullet points.
        `;
    }

    const prompt = `
    CONTEXT:
    ${intentContext}

    ${instruction}

    CAREER PROFILE:
    ${profileContext}
  `;

    const result = await generateContent(SYSTEM_PROMPTS.RESUME_TRANSLATION, prompt);

    if (!result) {
        return MOCK_RESUME;
    }

    return result as ResumeDraft;
}

export async function generateHtmlResume(profile: CareerProfile, intent: CareerIntent, templateHtml: string, options?: { fitToOnePage?: boolean }): Promise<string> {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        systemInstruction: SYSTEM_PROMPTS.RESUME_TRANSLATION
    });

    // Provide a simplified profile context to save tokens/reduce noise
    const profileContext = JSON.stringify(profile, null, 2);

    let constraint = "";
    if (options?.fitToOnePage) {
        constraint = `
        STRICT CONSTRAINT: FIT TO ONE PAGE.
        - The output HTML MUST fit on a single A4 page (~450-500 words).
        - OMIT older experience (older than 10 years or irrelevant).
        - OMIT Volunteering if it pushes content to page 2.
        - LIMIT bullets per role to 3-4 max.
        - SHORTEN the summary to 2 lines max.
        `;
    }

    // We want to force the model to output HTML that matches the TEMPLATE structure but with CONTENT from PROFILE.
    const prompt = `
    TASK:
    Take the provided HTML TEMPLATE and replace the "Becky Shu" dummy content with the Candidate's actual data from the CAREER PROFLIE.
    
    ${constraint}

    RULES:
    1. OUTPUT ONLY HTML. No markdown.
    2. STRICTLY PRESERVE the CSS (<style>) and class names.
    3. KEEP the layout EXACTLY the same.
    4. Replace:
        - Name, Locations, Links
        - **EMAIL**: Use the email from the Candidate Profile. WRAP IT in a <a href="mailto:..."> tag.
        - **LINKEDIN / GITHUB**: 
            - MUST BE CLICKABLE.
            - Structure: '<span><a href="https://linkedin.com/..." target="_blank">linkedin.com/...</a></span>'
            - Ensure the 'href' starts with "https://".
            - The visible text should be clean(e.g. "linkedin.com/in/name").
        - ** WEBSITE **: WRAP in <a href="..." target = "_blank" > tags.
        - ** PROJECT LINKS **: If a project has a URL(e.g.in context or description), make it a clickable < a href = "..." target = "_blank" > link.
        - ** Summary ** (Write a new professional summary based on profile)
        - ** Experience Items ** (Map the candidate's roles to the .experience-item divs...)
        - ** PROJECTS **: Map candidate's PROJECTS to the new Projects section.
            - Use.experience - item class for structure.
            - Format Title: "Project Name"
            - Format Context: "Tech Stack" or "Project Link" in the subtitle.If it's a Link, make it clickable.
                - REMOVE the section if the candidate has NO projects.
        - Education(Map education items to.education - item class)
                    - Skills(Map skills to.skills - list)
                    - ** VOLUNTEERING **: Map to the Volunteering section.
            - Use.experience - item class for structure.
            - REMOVE if empty.
        - ** CERTIFICATIONS & AWARDS **:
            - Map Certifications to the "Certifications:" list.
            - Map Awards to the "Awards:" list.
            - REMOVE the entire section if BOTH are empty.
        - ** LANGUAGES **: Map to the "Languages:" list in the Skills section.REMOVE if empty.
    5. If the candidate has multiple items(jobs, projects, schools), generate multiple HTML blocks for them.Duplicate the structure as needed.
    
    CANDIDATE INTENT:
    Target Role: ${intent.targetRole}
    Target Location: ${intent.targetLocation}
    ${intent.jobSearchIntent ? `\nTARGET JOB DESCRIPTION:\n${intent.jobSearchIntent}` : ''}

    CAREER PROFILE QUERY:
    ${profileContext}

    HTML TEMPLATE(Use this structure):
    ${templateHtml}
    `;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```html/g, '').replace(/```/g, '');
        return text;
    } catch (e) {
        console.error("Html Generation Error", e);
        return templateHtml; // Fallback
    }
}

// Helper type for the response
interface ModifiedResumeResponse {
    html: string;
    annotated_html?: string;
    summary: string;
    changes: string[];
}

export async function modifyResumeHtml(currentHtml: string, instruction: string): Promise<ModifiedResumeResponse> {
    if (!process.env.GEMINI_API_KEY) {
        return {
            html: currentHtml.replace('</body>', '<div style="color:red">API Key Missing - Mock Edit</div></body>'),
            summary: "API Key Missing",
            changes: ["Mock edit applied"]
        };
    }

    const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const schema = {
        description: "Modified Resume Response",
        type: SchemaType.OBJECT,
        properties: {
            css_content: { type: SchemaType.STRING, description: "The internal CSS styles (<style> content). Return null if no changes needed." },
            body_content: { type: SchemaType.STRING, description: "The inner HTML content of the <body> tag." },
            summary: { type: SchemaType.STRING, description: "A summary of changes." },
            changes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of specific changes." }
        },
        required: ["body_content", "summary", "changes"]
    };

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            maxOutputTokens: 8192
        },
        systemInstruction: `
       You are an expert HTML Resume Editor. 
       Your job is to take the HTML of a resume and a User Instruction, and output the MODIFIED HTML that satisfies the instruction.
       
       RULES:
       1. Follow the JSON schema strictly.
       2. **OUTPUT OPTIMIZATION**:
          - Return the content of the \`<body>\` tag data in \`body_content\`. Do NOT include the \`<body>\` wrapper tags.
          - Return the content of the \`style\` tag in \`css_content\` ONLY IF YOU CHANGE IT. Otherwise return null.
       3. Preserve the existing CSS classes and structure as much as possible unless asked to change it.
       4. If the user asks to "Move Skills section to bottom", find the div with class="section" covering skills and move it to the end of the container.
       5. If the user asks to "Edit the summary", find the summary div and rewrite the text professionally.
       6. Provide a clear summary of changes.
       `
    });

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

        // With Schema, text() is guaranteed to be valid JSON
        const text = result.response.text();
        console.log("[AI RAW RESPONSE]:", text.substring(0, 500) + "..."); // Log start only

        try {
            const parsed = JSON.parse(text);

            // Reconstruct HTML
            let finalHtml = currentHtml;

            // Regex to replace Body Content
            // Matches <body [attrs]> ... </body>
            // Case insensitive, multiline dotall
            finalHtml = finalHtml.replace(/(<body[^>]*>)([\s\S]*?)(<\/body>)/i, (match, openTag, oldContent, closeTag) => {
                return `${openTag}${parsed.body_content}${closeTag}`;
            });

            // Regex to replace CSS if provided
            if (parsed.css_content) {
                finalHtml = finalHtml.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/i, (match, openTag, oldContent, closeTag) => {
                    return `${openTag}${parsed.css_content}${closeTag}`;
                });
            }

            return {
                html: finalHtml,
                summary: parsed.summary,
                changes: parsed.changes
            };

        } catch (jsonErr) {
            console.error("JSON Parse Failure - Response likely truncated", jsonErr);
            return {
                html: currentHtml,
                summary: "⚠️ The AI response was too large and got cut off.",
                changes: [
                    "Resume is very long; try smaller edits.",
                    "The model output limit was exceeded.",
                    "No changes kept to prevent data loss."
                ]
            };
        }

    } catch (error: any) {
        console.error("Gemini HTML Edit Error", error);
        // Return error as a response so user sees it
        return {
            html: currentHtml,
            summary: `❌ ERROR: ${error.message || "Unknown error"}`,
            changes: ["Check server console for details", "Ensure API Key is valid", String(error)]
        };
    }
}

// Helper to extract URLs from text
function extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}

export async function modifyCareerProfile(currentProfile: CareerProfile, instruction: string): Promise<CareerProfile> {
    const { GoogleGenerativeAI } = require("@google/generative-ai");

    // 1. Context Hydration: Check if instruction contains URLs and fetch them
    let additionalContext = "";
    const urls = extractUrls(instruction);
    if (urls.length > 0) {
        console.log(`[AI Coach] Detected URLs: ${urls.join(', ')}`);
        const hydratedContents = await Promise.all(urls.map(url => hydrateContext(url)));
        additionalContext = `\n\nEXTERNAL RESOURCES PROVIDED BY USER:\n${hydratedContents.filter(Boolean).join('\n\n')}`;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        systemInstruction: `
        You are an expert Senior Career Strategist & Resume Coach.
        Your goal is active improvement, not just passive editing.
        
        Input: 
        1. Current "Career Profile" (Structured JSON)
        2. User Instruction (which may include external links like GitHub/LinkedIn)
        3. External Context (Content fetched from those links)

        YOUR TASK:
        Update the CareerProfile JSON to be more impactful, detailed, and aligned with the user's intent.
        
        CRITICAL RULES:
        1. **INGEST CONTEXT**: If the user provides a link (e.g. GitHub), USE that content to write specific, hard-hitting bullet points. Don't just say "Added GitHub project". Describe the tech stack, the problem solved, and the impact found in the README.
        2. **BE PROACTIVE**: If the user asks to "expand skills", look at their project descriptions and roles to infer skills they missed (e.g. "React", "CI/CD", "System Design") and add them.
        3. **FORMAT**: Return ONLY the valid JSON of the updated CareerProfile.
        4. **INTEGRITY**: Maintain the structure. Do not delete valid data unless asked.
        
        Schema:
        - items: Array of { id, category: 'role'|'education'|'project'|'skill'|..., title, description, ... }
        - summary: string
        `
    });

    try {
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: `INSTRUCTION: ${instruction}` },
                    { text: `ADDITIONAL CONTEXT (FETCHED FROM LINKS): ${additionalContext}` },
                    { text: `CURRENT PROFILE JSON:\n${JSON.stringify(currentProfile, null, 2)}` }
                ]
            }],
            generationConfig: { responseMimeType: "application/json" }
        });

        return JSON.parse(result.response.text()) as CareerProfile;
    } catch (e) {
        console.error("Profile Modification Error", e);
        throw new Error("Failed to modify profile.");
    }
}


export async function swapResumeTemplate(currentHtml: string, targetTemplateId: string): Promise<string> {

    // We are reverting this function to its previous state (AI Based)
    // However, since we removed the "Template Selector" UI, this function is effectively dead code.
    // We will keep it in a minimal state or restored state to prevent build errors if referenced elsewhere.

    const template = getTemplateById(targetTemplateId);
    if (!template) {
        throw new Error(`Template not found: ${targetTemplateId}`);
    }

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        systemInstruction: "You are an expert HTML Resume Formatter."
    });

    // Strategy: 
    // 1. Identify content from currentHtml (which might contain manual edits).
    // 2. Map it into the targetTemplate's structure.

    const prompt = `
    TASK:
    Transplant the resume CONTENT from the CURRENT HTML into the TARGET HTML TEMPLATE structure.
    
    RULES:
    1. EXTRACT ALL text content from the CURRENT HTML (Name, Contact, Summary, Experience, Education, Skills).
    2. USE THE DATA exactly as is. **PRESERVE MANUAL EDITS** made by the user. Do not summarize or rewrite unless necessary for formatting (e.g. date formats).
    3. INSERT the content into the TARGET HTML TEMPLATE.
    4. STRICTLY KEEP the Target Template's CSS (<style>) and class names. Do not break the visual layout.
    5. If the current resume has more jobs than the template shows, DUPLICATE the job item container in the template to fit them.
    6. OUTPUT ONLY the final HTML.
    
    TARGET TEMPLATE ID: ${template.name}
    
    CURRENT HTML (Source of Truth):
    ${currentHtml}

    TARGET HTML TEMPLATE (Structure to use):
    ${template.html}
    `;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```html/g, '').replace(/```/g, '');
        return text;
    } catch (e) {
        console.error("Template Swap Error", e);
        throw new Error("Failed to swap template");
    }
}

export interface InterviewPrepResponse {
    mindmap: {
        related_skills: string[];
        related_experiences: string[];
        key_concepts: string[];
    };
    star_breakdown: {
        situation: string;
        task: string;
        action: string;
        result: string;
    };
    follow_up_questions: string[];
}

export async function generateInterviewPrep(bullet: ResumeBullet, profile: CareerProfile): Promise<InterviewPrepResponse> {
    const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

    // We want a structured output for the UI
    const schema = {
        description: "Interview Defense Preparation Data",
        type: SchemaType.OBJECT,
        properties: {
            mindmap: {
                type: SchemaType.OBJECT,
                properties: {
                    related_skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Skills mentioned in this bullet or implied by it." },
                    related_experiences: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Other items from the career profile that strengthen this claim." },
                    key_concepts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Core concepts (e.g. 'System Design', 'Conflict Resolution') demonstrated." }
                },
                required: ["related_skills", "related_experiences", "key_concepts"]
            },
            star_breakdown: {
                type: SchemaType.OBJECT,
                properties: {
                    situation: { type: SchemaType.STRING, description: "The Context/Problem." },
                    task: { type: SchemaType.STRING, description: "The Goal." },
                    action: { type: SchemaType.STRING, description: "Specific steps taken." },
                    result: { type: SchemaType.STRING, description: "Outcome/Impact." }
                },
                required: ["situation", "task", "action", "result"]
            },
            follow_up_questions: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "3-5 difficult follow-up questions an interviewer might ask."
            }
        },
        required: ["mindmap", "star_breakdown", "follow_up_questions"]
    };

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
        },
        systemInstruction: `
        You are an expert Technical Interview Coach.
        Your goal is to help a candidate defend a specific bullet point on their resume.
        
        INPUT:
        1. A specific Resume Bullet Point (The Claim).
        2. The candidate's full Career Profile (The Context/Evidence).
        
        TASK:
        1. **Mindmap**: Connect this bullet to other parts of their profile. What skills are used? What other projects are relevant?
        2. **STAR**: Reverse-engineer the likely STAR story. If details are missing, infer logical steps based on the role (Senior Product Designer/Engineer etc).
        3. **Follow-ups**: Generate skeptical, deep-dive questions.
        `
    });

    try {
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: `TARGET BULLET POINT: ${bullet.text}` },
                    { text: `FULL PROFILE CONTEXT: ${JSON.stringify(profile)}` }
                ]
            }]
        });

        const text = result.response.text();
        return JSON.parse(text) as InterviewPrepResponse;
    } catch (e) {
        console.error("Interview Prep Generation Error", e);
        // Fallback
        return {
            mindmap: { related_skills: [], related_experiences: [], key_concepts: [] },
            star_breakdown: { situation: "Error generating", task: "", action: "", result: "" },
            follow_up_questions: ["Could not generate questions. Please try again."]
        };
    }
}

export async function ingestSource(source: IngestionSource, intent: CareerIntent): Promise<{ patch: CareerProfilePatch, learnings: ChatLearning }> {
    console.log(`[ingestSource] Ingesting ${source.type} from ${source.url}`);

    // Router Logic (Simple for now)
    try {
        if (GitHubIngestionAgent.accepts(source)) {
            return await GitHubIngestionAgent.process(source, intent);
        } else if (LinkedInIngestionAgent.accepts(source)) {
            return await LinkedInIngestionAgent.process(source, intent);
        } else {
            throw new Error(`No agent found for source type: ${source.type}`);
        }
    } catch (e: any) {
        console.error(`[ingestSource] Error processing ${source.type}:`, e);
        throw new Error(`Ingestion failed: ${e.message}`);
    }
}


export interface ReviewSuggestion {
    id: string;
    type: 'grammar' | 'tailor';
    originalText: string;
    suggestion: string;
    reason: string;
    context: string; // Surrounding text to help locate
    severity: 'critical' | 'suggestion';
}

export async function checkGrammar(html: string): Promise<ReviewSuggestion[]> {
    if (!process.env.GEMINI_API_KEY) {
        return [
            {
                id: "mock-err-1",
                type: "grammar",
                originalText: "specialized in",
                suggestion: "specializing in",
                reason: "Grammar: agreement with previous clause",
                context: "experience in SaaS and Fintech. specialized in complex system design",
                severity: "critical"
            }
        ];
    }

    const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const schema = {
        description: "List of Grammar Issues",
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                originalText: { type: SchemaType.STRING, description: "The exact text segment containing the error." },
                suggestion: { type: SchemaType.STRING, description: "The corrected text." },
                reason: { type: SchemaType.STRING, description: "Why this is an error." },
                context: { type: SchemaType.STRING, description: "5-10 words of surrounding text to help identify location." },
                severity: { type: SchemaType.STRING, enum: ["critical", "suggestion"], description: "Severity level." }
            },
            required: ["originalText", "suggestion", "reason", "context", "severity"]
        }
    };

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
        },
        systemInstruction: `
        You are an expert Copy Editor.
        Your task is to review the text content of an HTML Resume for grammar, spelling, and style issues.
        
        RULES:
        1. Ignore HTML tags, class names, and technical terms (e.g. React, PostgreSQL).
        2. Focus on:
            - Typox (Spelling)
            - Grammar (Subject-verb agreement, tense consistency)
            - Punctuation errors
            - Weak or passive voice (suggestion)
        3. For 'context', provide enough surrounding text (pure text, no tags) to uniquely identify the error location.
        4. Return an empty array [] if the resume is perfect.
        5. Be strict but reasonable. Don't flag stylistic choices as critical errors.
        `
    });

    try {
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [{ text: `REVIEW THIS RESUME HTML FOR GRAMMAR ERRORS:\n${html}` }]
            }]
        });

        const issues = JSON.parse(result.response.text()) as Omit<ReviewSuggestion, 'id' | 'type'>[];
        // Add IDs and Type
        return issues.map((issue, idx) => ({ ...issue, id: `gram-${Date.now()}-${idx}`, type: 'grammar' }));

    } catch (e) {
        console.error("Grammar Check Error", e);
        return [];
    }
}

export async function tailorResume(html: string, instruction: string): Promise<ReviewSuggestion[]> {
    if (!process.env.GEMINI_API_KEY) {
        return [
            {
                id: "mock-tailor-1",
                type: "tailor",
                originalText: "Led development of features",
                suggestion: "Architected scalable cloud-native features for high-throughput data processing",
                reason: "ATS Keyword Injection: 'Cloud-native', 'Scalable'. Strengthens impact.",
                context: "Glacier restore throughput by 10x. Led development of features",
                severity: "suggestion"
            }
        ];
    }

    const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const schema = {
        description: "List of Tailoring Suggestions",
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                originalText: { type: SchemaType.STRING, description: "The exact existing text segment to replace." },
                suggestion: { type: SchemaType.STRING, description: "The new, tailored text." },
                reason: { type: SchemaType.STRING, description: "Explanation of why this change helps (e.g. 'Added keyword X', 'Improved impact')." },
                context: { type: SchemaType.STRING, description: "5-10 words of surrounding text to help identify location." }
            },
            required: ["originalText", "suggestion", "reason", "context"]
        }
    };

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
        },
        systemInstruction: `
        You are an expert ATS (Applicant Tracking System) Strategist.
        Your task is to tailor a resume's HTML content based on a Job Description/Instruction.

        RULES:
        1. **Minimize Formatting Changes**: Only suggest changes to TEXT content within tags. Do not rewrite whole <div> structures.
        2. **Focus on Quality**: Identify 3-5 high-impact improvements. Do not rewrite the whole document.
        3. **Keywords**: Inject relevant keywords from the instruction naturally.
        4. **Matching**: 'originalText' MUST match the existing text *exactly* (including whitespace if possible) so it can be found programmatically.
        5. **Context**: Provide unique surrounding text to help locate the 'originalText'.
        
        OUTPUT:
        Return a list of specific text replacements.
        `
    });

    try {
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: `INSTRUCTION/JOB DESCRIPTION: ${instruction}` },
                    { text: `RESUME HTML:\n${html}` }
                ]
            }]
        });

        const suggestions = JSON.parse(result.response.text()) as Omit<ReviewSuggestion, 'id' | 'type' | 'severity'>[];
        return suggestions.map((s, idx) => ({
            ...s,
            id: `tailor-${Date.now()}-${idx}`,
            type: 'tailor',
            severity: 'suggestion'
        }));

    } catch (e) {
        console.error("Tailor Resume Error", e);
        return [];
    }
}
