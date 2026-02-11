import { IngestionSource, CareerProfilePatch, ChatLearning, RoleUpsert, SkillUpsert, ProjectUpsert, EducationUpsert, GenericUpsert, VolunteerUpsert, CertificationUpsert, AwardUpsert, LanguageUpsert } from '@/lib/ingestion/types';
import { CareerIntent } from '@/types/career';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';



export const PDFIngestionAgent = {
    accepts(source: IngestionSource): boolean {
        // Check for file type or mimetype
        if (source.type === 'pdf' || source.type === 'file' as any) {
            const isPdfMime = source.metadata?.mimeType === 'application/pdf' || source.metadata?.type === 'application/pdf';
            const isPdfExt = source.content && source.content.toLowerCase().endsWith('.pdf');
            // If it's explicitly typed as 'pdf' by the bridge, trust it. Otherwise validation.
            return source.type === 'pdf' || !!(isPdfMime || isPdfExt);
        }
        return false;
    },

    async process(source: IngestionSource, intent: CareerIntent): Promise<{ patch: CareerProfilePatch, learnings: ChatLearning }> {
        console.log(`[PDFAgent] Processing ${source.content || "PDF"}...`);

        if (!source.data && !source.content) {
            throw new Error("No data provided for PDF ingestion");
        }

        // 1. Extract Text
        let textContent = "";
        try {
            let buffer: Buffer;

            // Handle Base64 Data (Priority)
            if (source.data) {
                buffer = Buffer.from(source.data, 'base64');
            } else {
                throw new Error("Local file reading not fully implemented on server - expected base64 data.");
            }

            // Use require to avoid ESM/Default export issues with this legacy lib

            // DIRECT IMPORT: Use local vendored version to avoid 'dynamic expression' errors in Vercel
            const pdf = require('@/lib/vendor/pdf-parse/index.js');

            // v1 API: Function based
            const pdfData = await pdf(buffer);
            textContent = pdfData.text;
            console.log(`[PDFAgent] Extracted ${textContent.length} chars.`);

        } catch (e: any) {
            console.error("[PDFAgent] PDF Parse Error", e);
            throw new Error(`Failed to parse PDF text: ${e.message || e}. Details: ${JSON.stringify(e)}`);
        }

        // 2. AI Extraction (Using unified provider - Gemini first, OpenAI fallback)
        const { generateContentWithSystem } = await import("@/lib/ai/advanced");
        
        // Create a proper system instruction for PDF extraction
        const systemInstruction = SYSTEM_PROMPTS.CAREER_UNDERSTANDING + `
        
        ADDITIONAL INSTRUCTIONS FOR PDF EXTRACTION:
        - You are extracting data from a PDF resume that has been converted to text.
        - The text may have formatting issues or be incomplete.
        - Extract ALL information you can find, even if it seems incomplete.
        - Be thorough and capture every role, skill, education entry, etc.
        `;

        const prompt = `
        TASK:
        Extract structured career data from the provided RESUME TEXT.
        CRITICAL: Separate "Organization" or "Company" names from "Job Titles". Do NOT combine them.
        
        OUTPUT SCHEMA (JSON):
        {
            "items": [
                { 
                    "category": "role" | "education" | "project" | "skill" | "certification" | "award" | "volunteer" | "language", 
                    "title": "string (The Role, Degree, or Award Name ONLY)", 
                    "organization": "string (The Company, School, Issuer, or Organization Name)",
                    "subtitle": "string (Optional: Credential ID, specific constraints, or degree type)",
                    "description": "string (bullet points. Use '• ' separators)", 
                    "dates": "string"
                }
            ],
            "summary": "string (professional summary)",
            "contact": { "email": "string", "phone": "string", "linkedin": "string", "github": "string", "website": "string", "location": "string" },
            "personal": { "name": "string" },
            "gaps": ["string (any missing critical info)"]
        }

        INSTRUCTIONS:
        - ROLES: Title = "Product Manager", Organization = "Google". Description = bullet points.
        - EDUCATION: Title = "BS Computer Science", Organization = "Stanford University".
        - SKILLS: EXPLODE lists. If text says "Frontend: React, Vue, Angular", generate 3 items: {title: "React"}, {title: "Vue"}, {title: "Angular"}. Do NOT create a single item called "Frontend".
        - CERTIFICATIONS: Title = "AWS Certified Architect", Organization = "Amazon", Subtitle = "ID: 12345".
        - AWARDS: Title = "Employee of the Month", Organization = "Company Name".
        - LANGUAGES: Title = "Spanish", Organization = "Native".
        - VOLUNTEERING: Title = "Volunteer", Organization = "Red Cross".

        RESUME TEXT:
        ${textContent.substring(0, 30000)} 
        `; // Cap text to avoid huge context usage if PDF is massive

        try {
            const result = await generateContentWithSystem(
                systemInstruction,
                prompt,
                { responseMimeType: "application/json" }
            );
            
            if (!result) {
                throw new Error("AI provider returned no response");
            }
            
            const extracted = typeof result === 'string' ? JSON.parse(result) : result;
            const items = extracted.items || [];

            // 3. Map to Patch (Manual Mapping to Upserts)
            // Helper to clean descriptions
            const toEnriched = (val: string) => ({ value: val || "" });

            const roles: RoleUpsert[] = items.filter((i: any) => i.category === 'role').map((i: any) => ({
                id: `pdf:role:${crypto.randomUUID()}`,
                title: toEnriched(i.title),
                company: toEnriched(i.organization || "Unknown"),
                startDate: i.dates ? toEnriched(i.dates) : undefined,
                description: toEnriched(i.description)
            }));

            const skills: SkillUpsert[] = items.filter((i: any) => i.category === 'skill').map((i: any) => ({
                id: `pdf:skill:${i.title}`,
                name: i.title,
                category: i.description
            }));

            const education: EducationUpsert[] = items.filter((i: any) => i.category === 'education').map((i: any) => ({
                id: `pdf:edu:${crypto.randomUUID()}`,
                school: toEnriched(i.organization || "Unknown"),
                degree: toEnriched(i.title),
                startDate: i.dates ? toEnriched(i.dates) : undefined,
                description: toEnriched(i.description)
            }));

            const projects: ProjectUpsert[] = items.filter((i: any) => i.category === 'project').map((i: any) => ({
                id: `pdf:proj:${crypto.randomUUID()}`,
                name: i.title,
                description: toEnriched(i.description),
                startDate: i.dates ? toEnriched(i.dates) : undefined,
                url: i.subtitle ? toEnriched(i.subtitle) : undefined // reuse subtitle field for URL if AI detects it
            }));

            const volunteering: VolunteerUpsert[] = items.filter((i: any) => i.category === 'volunteer').map((i: any) => ({
                id: `pdf:vol:${crypto.randomUUID()}`,
                role: toEnriched(i.title),
                organization: toEnriched(i.organization),
                startDate: i.dates ? toEnriched(i.dates) : undefined,
                description: toEnriched(i.description)
            }));

            const certifications: CertificationUpsert[] = items.filter((i: any) => i.category === 'certification').map((i: any) => ({
                id: `pdf:cert:${crypto.randomUUID()}`,
                name: toEnriched(i.title),
                authority: toEnriched(i.organization),
                date: i.dates ? toEnriched(i.dates) : undefined
            }));

            const awards: AwardUpsert[] = items.filter((i: any) => i.category === 'award').map((i: any) => ({
                id: `pdf:award:${crypto.randomUUID()}`,
                title: toEnriched(i.title),
                issuer: toEnriched(i.organization),
                date: i.dates ? toEnriched(i.dates) : undefined,
                description: toEnriched(i.description)
            }));

            const languages: LanguageUpsert[] = items.filter((i: any) => i.category === 'language').map((i: any) => ({
                id: `pdf:lang:${crypto.randomUUID()}`,
                name: i.title,
                category: i.organization // using organization for proficiency level/category
            }));

            const patch: CareerProfilePatch = {
                sourceId: source.id,

                // Mapped Upserts
                upsert_roles: roles,
                upsert_skills: skills,
                upsert_education: education,
                upsert_projects: projects,
                upsert_volunteering: volunteering,
                upsert_certifications: certifications,
                upsert_awards: awards,
                upsert_languages: languages,

                // Globals
                professionalSummaryDraft: extracted.summary ? toEnriched(extracted.summary) : undefined,

                // Personal/Contact Overrides
                personal: extracted.personal,
                contact: extracted.contact,
                gaps: extracted.gaps
            };

            // 4. Create Learning
            const learnings: ChatLearning = {
                sourceType: 'pdf',
                title: `PDF: ${source.content || "Resume"}`,
                sections: [
                    { heading: "Roles Found", bullets: roles.map(r => r.title.value) },
                    { heading: "Skills Found", bullets: skills.map(s => s.name) }
                ]
            };

            return { patch, learnings };

        } catch (e: any) {
            console.error("[PDFAgent] AI Extraction Error", e);
            throw new Error("AI failed to extract structure from PDF text.");
        }
    }
};
