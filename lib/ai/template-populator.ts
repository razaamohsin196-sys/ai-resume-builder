/**
 * Intelligent Template Population Agent
 * 
 * Uses LLM to analyze template structure and intelligently populate
 * CareerProfile data into any template, regardless of CSS selectors.
 */

import { CareerProfile } from '@/types/career';
import { generateContentWithSystem } from './advanced';
import { SYSTEM_PROMPTS } from './prompts';

/**
 * Intelligently populate a template HTML with CareerProfile data
 * 
 * This function uses an LLM agent to:
 * 1. Analyze the template structure
 * 2. Identify where each piece of data should go
 * 3. Map CareerProfile data to the correct locations
 * 4. Preserve all CSS, classes, and layout structure
 * 
 * @param profile - The career profile data to populate
 * @param templateHtml - The template HTML to populate
 * @param intent - Career intent for context
 * @param options - Additional options
 * @returns Populated HTML string
 */
export async function intelligentlyPopulateTemplate(
    profile: CareerProfile,
    templateHtml: string,
    intent: { targetRole: string; targetLocation: string; jobSearchIntent?: string },
    options?: { fitToOnePage?: boolean; hasPhoto?: boolean }
): Promise<string> {
    // Extract and log skills for debugging
    const skillItems = profile.items?.filter(item => item.category === 'skill') || [];
    const skillNames = skillItems.map(item => item.title);
    if (skillNames.length > 0) {
        console.log(`[Template Populator] Found ${skillNames.length} skills to populate:`, skillNames.slice(0, 10));
    } else {
        console.warn('[Template Populator] No skills found in profile!');
    }
    
    // Create a skills summary for the AI prompt
    const skillsSummary = skillNames.length > 0 
        ? `\n\nSKILLS TO POPULATE (${skillNames.length} total):\n${skillNames.join(', ')}\n\nIMPORTANT: These skills MUST appear in the template's skills section. Do not skip any of them.`
        : '\n\nNO SKILLS FOUND - Skip skills section if template has one.';
    
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

    const systemPrompt = `
You are an expert Resume Template Population Agent. Your job is to intelligently analyze HTML resume templates and populate them with real candidate data.

CRITICAL RULES:
1. **PRESERVE EXACT STRUCTURE**: Do NOT change any CSS classes, IDs, or HTML structure. The template's visual design is sacred.
2. **NO DUPLICATION - HARD RULE**: 
   - NEVER duplicate any text content. Each piece of information should appear ONLY ONCE.
   - If you see the same text already in the template, DO NOT add it again.
   - For lists (experience, education, volunteering, etc.), each item should be unique.
   - For bullets/descriptions, do NOT repeat the same bullet point multiple times.
   - For skills, each skill should appear only once.
   - If organization name appears in title, do NOT repeat it in description.
   - If role appears in heading, do NOT repeat it in body text.
3. **INTELLIGENT MAPPING**: Analyze the template structure to understand:
   - Where the name should go (usually in header, h1, or .name)
   - Where contact info goes (email, phone, LinkedIn, GitHub, website)
   - Where the summary/professional summary goes
   - Where experience/work history goes
   - Where education goes
   - Where skills go (CRITICAL: Find ALL skills sections - they may be in lists, groups, or inline)
   - Where projects, certifications, awards, etc. go
4. **DATA MAPPING**: Map CareerProfile data to the template intelligently:
   - Match field names semantically (e.g., "name" → name field, "email" → email field)
   - For experience items, populate title, company, dates, and description/bullets
     * DO NOT duplicate company name in bullets if it's already in the title/company field
     * DO NOT repeat the same bullet point multiple times
   - For education, populate degree, school, dates, and GPA if present
     * DO NOT duplicate school name in description if it's already in the school field
   - **FOR VOLUNTEERING (CRITICAL - NO DUPLICATION)**:
     * Each volunteer role should appear ONLY ONCE
     * Organization name should appear ONLY in the organization field, NOT repeated in description
     * Role title should appear ONLY in the role/title field, NOT repeated in description
     * Bullets/descriptions should be unique - do NOT repeat the same text multiple times
     * If you see "Organization" as placeholder, replace it with actual organization name ONCE
   - **FOR SKILLS (CRITICAL)**: 
     * Extract ALL skills from CareerProfile.items where category === "skill"
     * The skill name is in the "title" field of each skill item
     * **CRITICAL: REMOVE ALL HARDCODED SKILLS FIRST**:
       - Find ALL <ul> elements in the skills section
       - Remove ALL existing <li> items (these contain hardcoded placeholder skills like "Fashion Illustration", "Python Programming", etc.)
       - Clear innerHTML of skills containers before adding real skills
     * If the template has grouped skills (categories), intelligently group them by category if available
     * If the template has a flat list, populate ALL skills as list items or comma-separated
     * DO NOT leave placeholder skills - replace ALL skill placeholders with real skills from the profile
     * Look for skills in: <ul> lists, <li> items, .skills-list, .skills, .expertise-list, or any element containing skill-related text
   - Handle missing data gracefully (don't leave placeholders)
5. **REMOVE PLACEHOLDERS**: Replace ALL placeholder text (like "Becky Shu", "John Doe", "Lorem ipsum", etc.) with real data
6. **PRESERVE CSS**: Keep ALL <style> blocks exactly as they are
7. **OUTPUT FORMAT**: Return ONLY the complete HTML, no markdown, no code blocks
8. **DUPLICATION CHECK**: Before outputting, verify:
   - No text appears twice in the same section
   - No list items are identical
   - No paragraphs contain the same content
   - Organization names appear only once per volunteer/experience item
   - Role titles appear only once per item

TEMPLATE ANALYSIS STRATEGY:
- Look for semantic patterns: section titles, class names that indicate purpose
- Identify list structures for experience, education, skills
- Find contact info sections (usually in header or footer)
- Locate summary sections (often near the top)
- **For skills**: Search for sections with titles like "Skills", "Technical Skills", "Expertise", "Competencies"
- **For skills**: Look for <ul>, <li>, .skills-list, .skills, .skill-item, or any element that contains skill names
- Map data fields to template fields based on context, not just exact class names

${constraint}
`;

    const userPrompt = `
TASK:
Analyze the provided HTML TEMPLATE and intelligently populate it with the Candidate's actual data from the CAREER PROFILE.

CANDIDATE INTENT:
- Target Role: ${intent.targetRole}
- Target Location: ${intent.targetLocation}
${intent.jobSearchIntent ? `- Target Job Description:\n${intent.jobSearchIntent}` : ''}

CAREER PROFILE DATA:
${profileContext}
${skillsSummary}

HTML TEMPLATE TO POPULATE:
${templateHtml}

INSTRUCTIONS:
1. Analyze the template structure to understand its layout and data fields
2. Map each piece of data from the Career Profile to the appropriate location in the template
3. Replace ALL placeholder content with real data
4. **CRITICAL - PREVENT DUPLICATION**:
   - Before adding any text, check if it already exists in the target element
   - For volunteering: Each role should appear once. Organization name should appear once. Do NOT repeat organization name in description.
   - For experience: Do NOT repeat company name in bullets if it's in the title.
   - For all sections: Each list item, bullet point, or paragraph should be unique.
5. Ensure all sections are populated correctly:
   - Personal info (name, location)
   - Contact info (email, phone, LinkedIn, GitHub, website)
   - Professional summary
   - Work experience/roles (with bullets/descriptions)
   - Education
   - **SKILLS (CRITICAL - MUST BE POPULATED)**:
     * Extract ALL skills from profile.items where category === "skill"
     * Each skill item has a "title" field containing the skill name
     * Find the skills section in the template (look for "Skills", "Technical Skills", "Expertise" sections)
     * **STEP 1 - REMOVE PLACEHOLDERS**: 
       - Find ALL <ul> elements in the skills section
       - Remove ALL existing <li> items (these are hardcoded placeholder skills)
       - Clear innerHTML of any skills containers
     * **STEP 2 - POPULATE REAL SKILLS**:
       - If template uses grouped skills, organize by category if available in skill.organization
       - If template uses a flat list, populate ALL skills as <li> items (don't skip any)
       - Replace ALL placeholder skills with real skills from the profile
     * Skills should appear as: list items (<li>), comma-separated text, or in skill-specific containers
   - Projects (if present in profile)
   - Certifications (if present)
   - Languages (if present)
   - Awards (if present)
   - **Volunteering (if present) - NO DUPLICATION**:
     * Find the volunteering section
     * For each volunteer item, populate role, organization, and description ONCE
     * Do NOT repeat organization name in description if it's already in the organization field
     * Do NOT repeat role title in description if it's already in the role field
     * Each bullet point should be unique - do NOT duplicate bullets
     * If you see repeated text like "Present Code for Youth Pakistan" multiple times, keep it ONCE
   - Publications (if present)
6. Preserve ALL CSS, classes, IDs, and HTML structure
7. Remove any remaining placeholder text
8. **Final check**: Scan the output for duplicate text and remove any duplicates

SKILLS EXTRACTION EXAMPLE:
If CareerProfile has:
  items: [
    { category: "skill", title: "JavaScript", organization: "Programming Languages", ... },
    { category: "skill", title: "React", organization: "Frameworks", ... },
    { category: "skill", title: "Node.js", organization: "Frameworks", ... },
    { category: "skill", title: "Python", organization: "Programming Languages", ... }
  ]

Then:
- If template has grouped skills: Group by organization field
  * Programming Languages: JavaScript, Python
  * Frameworks: React, Node.js
- If template has flat list: Populate ALL skills as list items or comma-separated
  * JavaScript, React, Node.js, Python

CRITICAL: You MUST extract ALL skills from profile.items where category === "skill" and populate them in the template. Do not skip any skills!

OUTPUT: Return the complete populated HTML template.
`;

    try {
        const result = await generateContentWithSystem(
            systemPrompt,
            userPrompt,
            { responseMimeType: "text/plain" }
        );

        if (!result) {
            throw new Error("LLM returned no result");
        }

        // Clean up markdown code blocks if present
        let html = result
            .replace(/```html/g, '')
            .replace(/```/g, '')
            .trim();
        
        // Apply deduplication to remove any duplicates created by LLM
        const { deduplicateHtml } = await import('../resume-data/deduplication');
        html = deduplicateHtml(html);

        // Validate that we got HTML back
        if (!html.includes('<html') && !html.includes('<!DOCTYPE') && !html.includes('<style')) {
            // If it doesn't look like HTML, it might be wrapped or have issues
            // Try to extract HTML from the response
            const htmlMatch = html.match(/<style[\s\S]*<\/html>|<style[\s\S]*$/);
            if (htmlMatch) {
                html = htmlMatch[0];
            }
        }

        // Check for placeholder text that wasn't replaced (indicates failure)
        const placeholderPatterns = [
            /becky\s+shu/gi,
            /beckyhsiung96/gi,
            /john\s+doe/gi,
            /jane\s+doe/gi,
            /lorem\s+ipsum/gi,
            /example\.com/gi,
            /placeholder/gi
        ];

        const hasPlaceholders = placeholderPatterns.some(pattern => pattern.test(html));
        
        // Validate that skills were populated (if we had skills)
        let skillsPopulated = true;
        if (skillNames.length > 0) {
            // Check if at least some skills appear in the HTML
            const skillsFound = skillNames.filter(skill => 
                html.toLowerCase().includes(skill.toLowerCase())
            ).length;
            
            if (skillsFound === 0) {
                console.warn(`[intelligentlyPopulateTemplate] None of the ${skillNames.length} skills found in output HTML!`);
                skillsPopulated = false;
            } else if (skillsFound < skillNames.length * 0.5) {
                console.warn(`[intelligentlyPopulateTemplate] Only ${skillsFound}/${skillNames.length} skills found in output HTML`);
                skillsPopulated = false;
            } else {
                console.log(`[intelligentlyPopulateTemplate] Successfully populated ${skillsFound}/${skillNames.length} skills`);
            }
        }
        
        if (hasPlaceholders || !skillsPopulated) {
            console.warn("[intelligentlyPopulateTemplate] Detected issues in output, may need fallback");
            // Don't throw, but log warning - the deterministic fallback will handle it
        }

        return html;
    } catch (error) {
        console.error("[intelligentlyPopulateTemplate] Error:", error);
        throw error;
    }
}

/**
 * Analyze template structure and return a mapping of where data should go
 * This is a helper function that can be used for debugging or optimization
 */
export async function analyzeTemplateStructure(templateHtml: string): Promise<any> {
    const systemPrompt = `
You are a template structure analyzer. Analyze the provided HTML resume template and identify:
1. Where personal info (name, location) is located
2. Where contact info (email, phone, LinkedIn, etc.) is located
3. Where each section (summary, experience, education, skills, etc.) is located
4. The structure of list items (experience items, education items, etc.)
5. Any special patterns or conventions used

Return a JSON object describing the template structure.
`;

    const userPrompt = `
Analyze this HTML template structure:

${templateHtml}

Return a JSON object with:
{
  "nameLocation": "selector or description",
  "contactLocation": "selector or description",
  "summaryLocation": "selector or description",
  "experienceLocation": "selector or description",
  "experienceItemStructure": "description",
  "educationLocation": "selector or description",
  "skillsLocation": "selector or description",
  "otherSections": ["list of other sections found"]
}
`;

    try {
        const result = await generateContentWithSystem(
            systemPrompt,
            userPrompt,
            { responseMimeType: "application/json" }
        );

        if (!result) {
            return null;
        }

        try {
            return JSON.parse(result);
        } catch (e) {
            console.error("[analyzeTemplateStructure] JSON parse error:", e);
            return null;
        }
    } catch (error) {
        console.error("[analyzeTemplateStructure] Error:", error);
        return null;
    }
}
