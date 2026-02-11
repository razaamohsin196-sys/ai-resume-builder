"use server";

import { generateContent } from "@/lib/ai/provider";
import { generateContentWithSystem, generateStructuredContent, hasAIProvider } from "@/lib/ai/advanced";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { RawInput, CareerIntent, CareerProfile, ResumeDraft, ResumeBullet } from "@/types/career";
import { CareerProfileFormData } from "@/types/form";
import { hydrateContext } from "@/lib/context-hydrator";
import { getTemplateById } from "@/lib/templates";
import { processCareerProfile as processBridge } from "@/lib/bridge-process";
import { careerProfileToResumeData, renderToTemplate, SectionType } from "@/lib/resume-data";

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
            dates: "2020 - Present"
        },
        {
            id: "mock-skill-1",
            category: "skill",
            title: "Figma",
            description: "Advanced prototyping",
            sourceIds: ["mock-source"]
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
                    skills: ["UX Design", "Product Strategy"]
                },
                {
                    id: "bullet-2",
                    text: "Facilitated design workshops with cross-functional stakeholders to align on product vision.",
                    sourceIds: ["mock-1"],
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
                    skills: []
                }
            ]
        }
    ]
};

export async function processCareerProfile(inputs: RawInput[], intent: CareerIntent, overrides?: any) {
    return await processBridge(inputs, intent, overrides);
}

// NEW: Step 1 - Raw Ingestion (Fast)
import { ingestRawProfile as ingestBridge } from '@/lib/bridge-process';
import { refineProfile as refineBridge } from '@/lib/ingestion/refinement';
import { careerProfileToFormData } from '@/lib/form-converter';

export async function ingestCareerProfile(inputs: RawInput[], intent: CareerIntent, overrides?: any) {
    return await ingestBridge(inputs, intent, overrides);
}

/**
 * Extract form data from uploaded content
 * This is the main function called when user clicks "Analyze Career & Suggest Resume"
 */
export async function extractFormData(inputs: RawInput[], intent: CareerIntent): Promise<CareerProfileFormData> {
    // First, ingest the profile using existing logic
    const profile = await ingestCareerProfile(inputs, intent);
    
    // Convert to form data format
    return careerProfileToFormData(profile);
}

// NEW: Step 2 - Refinement (Slow)
export async function refineCareerProfile(profile: CareerProfile, intent: CareerIntent, overrides?: any) {
    return await refineBridge(profile, intent, overrides || {});
}

export async function generateProfileFromIntent(intent: CareerIntent): Promise<CareerProfile> {
    const prompt = `
    GENERATE PROFILE FOR:
    Target Role: ${intent.targetRole}
    Target Location: ${intent.targetLocation}
    Years of Experience: ${intent.yearsOfExperience}
    Goal: ${intent.jobSearchIntent}
    `;

    try {
        const result = await generateContentWithSystem(
            SYSTEM_PROMPTS.PROFILE_GENERATION,
            prompt,
            { responseMimeType: "application/json" }
        );

        if (!result) {
            throw new Error("No response from AI provider");
        }

        return JSON.parse(result) as CareerProfile;
    } catch (e) {
        console.error("Profile Generation Error", e);
        throw new Error("Failed to generate profile from intent");
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

export async function generateHtmlResume(profile: CareerProfile, intent: CareerIntent, templateHtml: string, options?: { fitToOnePage?: boolean; hasPhoto?: boolean }): Promise<string> {
    // First, try the intelligent template population agent
    try {
        const { intelligentlyPopulateTemplate } = await import('@/lib/ai/template-populator');
        const intelligentResult = await intelligentlyPopulateTemplate(
            profile,
            templateHtml,
            {
                targetRole: intent.targetRole,
                targetLocation: intent.targetLocation,
                jobSearchIntent: intent.jobSearchIntent
            },
            options
        );

        // Validate the result
        if (intelligentResult && intelligentResult.trim().length > 0) {
            // Check for placeholder text that wasn't replaced
            const placeholderPatterns = [
                /becky\s+shu/gi,
                /beckyhsiung96/gi,
                /john\s+doe/gi,
                /jane\s+doe/gi
            ];
            
            const hasPlaceholders = placeholderPatterns.some(pattern => pattern.test(intelligentResult));
            
            // Check if the result contains actual data (name from profile)
            const profileName = profile.personal?.name || '';
            if (!hasPlaceholders && (profileName ? intelligentResult.includes(profileName) : intelligentResult.length > 1000)) {
                // Success - intelligent population worked
                return intelligentResult;
            } else {
                console.warn("[generateHtmlResume] Intelligent population detected placeholders, falling back to deterministic");
            }
        }
    } catch (error) {
        console.warn("[generateHtmlResume] Intelligent population failed, falling back to deterministic:", error);
    }

    // Fallback to deterministic rendering
    return generateDeterministicHtml(profile, templateHtml);
}

function generateDeterministicHtml(profile: CareerProfile, templateHtml: string): string {
    try {
        const resumeData = careerProfileToResumeData(profile);
        const template = {
            id: 'current',
            name: 'Current Template',
            html: templateHtml,
            hasPhoto: false,
            supportedSections: ['profile', 'summary', 'experience', 'education', 'skills', 'projects', 'languages', 'certifications', 'volunteering', 'awards', 'publications'] as SectionType[],
            sectionOrder: ['profile', 'summary', 'experience', 'education', 'skills', 'projects', 'languages', 'certifications', 'volunteering', 'awards', 'publications'] as SectionType[],
            pageSize: 'A4' as const,
        };
        return renderToTemplate(resumeData, template);
    } catch (error) {
        console.error('[generateDeterministicHtml] Error:', error);
        return templateHtml;
    }
}

export async function modifyCareerProfile(currentProfile: CareerProfile, instruction: string): Promise<CareerProfile> {
    let additionalContext = "";
    const urls = extractUrls(instruction);
    if (urls.length > 0) {
        const hydratedContents = await Promise.all(urls.map(url => hydrateContext(url)));
        additionalContext = `\n\nEXTERNAL RESOURCES PROVIDED BY USER:\n${hydratedContents.filter(Boolean).join('\n\n')}`;
    }

    const systemInstruction = `
        You are an expert Senior Career Strategist & Resume Coach.
        Your goal is active improvement, not just passive editing.
        
        Input: 
        1. Current "Career Profile" (Structured JSON)
        2. User Instruction (which may include external links like GitHub/LinkedIn)
        3. External Context (Content fetched from those links)

        YOUR TASK:
        Update the CareerProfile JSON to be more impactful, detailed, and aligned with the user's intent.
        
        CRITICAL RULES:
        1. **INGEST CONTEXT**: If the user provides a link (e.g. GitHub), USE that content to write specific, hard-hitting bullet points.
        2. **BE PROACTIVE**: If the user asks to "expand skills", look at their project descriptions and roles to infer skills they missed.
        3. **FORMAT**: Return ONLY the valid JSON of the updated CareerProfile.
        4. **INTEGRITY**: Maintain the structure. Do not delete valid data unless asked.
        `;

    const userPrompt = `INSTRUCTION: ${instruction}\n\nADDITIONAL CONTEXT (FETCHED FROM LINKS): ${additionalContext}\n\nCURRENT PROFILE JSON:\n${JSON.stringify(currentProfile, null, 2)}`;

    try {
        const result = await generateContentWithSystem(
            systemInstruction,
            userPrompt,
            { responseMimeType: "application/json" }
        );

        if (!result) {
            throw new Error("No response from AI provider");
        }

        return JSON.parse(result) as CareerProfile;
    } catch (e) {
        console.error("Profile Modification Error", e);
        throw new Error("Failed to modify profile.");
    }
}

function extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}

export async function modifyResumeHtml(currentHtml: string, instruction: string): Promise<{ html: string; summary: string; changes: string[] }> {
    if (!hasAIProvider()) {
        return {
            html: currentHtml.replace('</body>', '<div style="color:red">API Key Missing - Mock Edit</div></body>'),
            summary: "API Key Missing",
            changes: ["Mock edit applied"]
        };
    }

    const { SchemaType } = require("@google/generative-ai");
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

    const systemInstruction = `
       You are an expert HTML Resume Editor. 
       Your job is to take the HTML of a resume and a User Instruction, and output the MODIFIED HTML that satisfies the instruction.
       
       RULES:
       1. Follow the JSON schema strictly.
       2. Return the content of the <body> tag data in body_content. Do NOT include the <body> wrapper tags.
       3. Return the content of the style tag in css_content ONLY IF YOU CHANGE IT. Otherwise return null.
       4. Preserve the existing CSS classes and structure as much as possible unless asked to change it.
       5. Provide a clear summary of changes.
       `;

    const userPrompt = `INSTRUCTION: ${instruction}\n\nCURRENT HTML:\n${currentHtml}`;

    try {
        const parsed = await generateStructuredContent(systemInstruction, userPrompt, schema);
        if (!parsed) throw new Error("No response from AI provider");

        let finalHtml = currentHtml;
        finalHtml = finalHtml.replace(/(<body[^>]*>)([\s\S]*?)(<\/body>)/i, (match: string, openTag: string, oldContent: string, closeTag: string) => {
            return `${openTag}${parsed.body_content}${closeTag}`;
        });

        if (parsed.css_content) {
            finalHtml = finalHtml.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/i, (match: string, openTag: string, oldContent: string, closeTag: string) => {
                return `${openTag}${parsed.css_content}${closeTag}`;
            });
        }

        return {
            html: finalHtml,
            summary: parsed.summary,
            changes: parsed.changes
        };
    } catch (error: any) {
        console.error("HTML Edit Error", error);
        return {
            html: currentHtml,
            summary: `❌ ERROR: ${error.message || "Unknown error"}`,
            changes: ["Check server console for details", "Ensure API Key is valid", String(error)]
        };
    }
}

export interface InterviewPrepResponse {
    mindmap: { related_skills: string[]; related_experiences: string[]; key_concepts: string[] };
    star_breakdown: { situation: string; task: string; action: string; result: string };
    follow_up_questions: string[];
}

export async function generateInterviewPrep(bullet: ResumeBullet, profile: CareerProfile): Promise<InterviewPrepResponse> {
    const { SchemaType } = require("@google/generative-ai");
    const schema = {
        description: "Interview Defense Preparation Data",
        type: SchemaType.OBJECT,
        properties: {
            mindmap: {
                type: SchemaType.OBJECT,
                properties: {
                    related_skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    related_experiences: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    key_concepts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                },
                required: ["related_skills", "related_experiences", "key_concepts"]
            },
            star_breakdown: {
                type: SchemaType.OBJECT,
                properties: {
                    situation: { type: SchemaType.STRING },
                    task: { type: SchemaType.STRING },
                    action: { type: SchemaType.STRING },
                    result: { type: SchemaType.STRING }
                },
                required: ["situation", "task", "action", "result"]
            },
            follow_up_questions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["mindmap", "star_breakdown", "follow_up_questions"]
    };

    const systemInstruction = `
        You are an expert Technical Interview Coach.
        Your goal is to help a candidate defend a specific bullet point on their resume.
        
        INPUT:
        1. A specific Resume Bullet Point (The Claim).
        2. The candidate's full Career Profile (The Context/Evidence).
        
        TASK:
        1. **Mindmap**: Connect this bullet to other parts of their profile.
        2. **STAR**: Reverse-engineer the likely STAR story.
        3. **Follow-ups**: Generate skeptical, deep-dive questions.
        `;

    const userPrompt = `TARGET BULLET POINT: ${bullet.text}\n\nFULL PROFILE CONTEXT: ${JSON.stringify(profile)}`;

    try {
        const result = await generateStructuredContent(systemInstruction, userPrompt, schema);
        if (!result) throw new Error("No response from AI provider");
        return result as InterviewPrepResponse;
    } catch (e) {
        console.error("Interview Prep Generation Error", e);
        return {
            mindmap: { related_skills: [], related_experiences: [], key_concepts: [] },
            star_breakdown: { situation: "Error generating", task: "", action: "", result: "" },
            follow_up_questions: ["Could not generate questions. Please try again."]
        };
    }
}

export interface ReviewSuggestion {
    id: string;
    type: 'grammar' | 'tailor';
    originalText: string;
    suggestion: string;
    reason: string;
    context: string;
    severity: 'critical' | 'suggestion';
}

export async function checkGrammar(html: string): Promise<ReviewSuggestion[]> {
    if (!hasAIProvider()) {
        return [{
            id: "mock-err-1",
            type: "grammar",
            originalText: "specialized in",
            suggestion: "specializing in",
            reason: "Grammar: agreement with previous clause",
            context: "experience in SaaS and Fintech. specialized in complex system design",
            severity: "critical"
        }];
    }

    const { SchemaType } = require("@google/generative-ai");
    const schema = {
        description: "List of Grammar Issues",
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                originalText: { type: SchemaType.STRING },
                suggestion: { type: SchemaType.STRING },
                reason: { type: SchemaType.STRING },
                context: { type: SchemaType.STRING },
                severity: { type: SchemaType.STRING, enum: ["critical", "suggestion"] }
            },
            required: ["originalText", "suggestion", "reason", "context", "severity"]
        }
    };

    const systemInstruction = `
        You are an expert Copy Editor.
        Your task is to review the text content of an HTML Resume for grammar, spelling, and style issues.
        
        RULES:
        1. Ignore HTML tags, class names, and technical terms.
        2. Focus on: Typos, Grammar, Punctuation errors, Weak or passive voice.
        3. Return an empty array [] if the resume is perfect.
        `;

    const userPrompt = `REVIEW THIS RESUME HTML FOR GRAMMAR ERRORS:\n${html}`;

    try {
        const issues = await generateStructuredContent(systemInstruction, userPrompt, schema);
        if (!issues || !Array.isArray(issues)) return [];
        return issues.map((issue: any, idx: number) => ({ ...issue, id: `gram-${Date.now()}-${idx}`, type: 'grammar' }));
    } catch (e) {
        console.error("Grammar Check Error", e);
        return [];
    }
}

export async function tailorResume(html: string, instruction: string): Promise<ReviewSuggestion[]> {
    if (!hasAIProvider()) {
        return [{
            id: "mock-tailor-1",
            type: "tailor",
            originalText: "Led development of features",
            suggestion: "Architected scalable cloud-native features for high-throughput data processing",
            reason: "ATS Keyword Injection: 'Cloud-native', 'Scalable'. Strengthens impact.",
            context: "Glacier restore throughput by 10x. Led development of features",
            severity: "suggestion"
        }];
    }

    const { SchemaType } = require("@google/generative-ai");
    const schema = {
        description: "List of Tailoring Suggestions",
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                originalText: { type: SchemaType.STRING },
                suggestion: { type: SchemaType.STRING },
                reason: { type: SchemaType.STRING },
                context: { type: SchemaType.STRING }
            },
            required: ["originalText", "suggestion", "reason", "context"]
        }
    };

    const systemInstruction = `
        You are an expert ATS (Applicant Tracking System) Strategist.
        Your task is to tailor a resume's HTML content based on a Job Description/Instruction.

        RULES:
        1. Only suggest changes to TEXT content within tags.
        2. Identify 3-5 high-impact improvements.
        3. Inject relevant keywords from the instruction naturally.
        4. 'originalText' MUST match the existing text exactly.
        `;

    const userPrompt = `INSTRUCTION/JOB DESCRIPTION: ${instruction}\n\nRESUME HTML:\n${html}`;

    try {
        const suggestions = await generateStructuredContent(systemInstruction, userPrompt, schema);
        if (!suggestions || !Array.isArray(suggestions)) return [];
        return suggestions.map((s: any, idx: number) => ({
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
