import { ApifyClient } from 'apify-client';
import { IngestionAgent, IngestionSource, CareerProfilePatch, ChatLearning } from '../types';
import { CareerIntent } from '@/types/career';
import { generateContent } from '@/lib/ai/provider';

const SYSTEM_PROMPT = `
You are LinkedInIngestionAgent.

GOAL
Extract evidence-backed career signals from a LinkedIn profile JSON and output a structured PATCH using atomic upserts.

STABLE ID RULES
- Role: "linkedin:role:<company_clean>:<title_clean>"
- Skill: "skill:<normalized_name>"
- Project: "linkedin:project:<name>"
- Education: "linkedin:edu:<school_clean>:<degree_clean>"
- Volunteer: "linkedin:vol:<org_clean>:<role_clean>"
- Certification: "linkedin:cert:<name_clean>"
- Award: "linkedin:award:<title_clean>"

PROJECT TITLES
- NEVER use "Project Name", "Untitled", or "New Project" as a title.
- If a project lacks a clear title, INFER a descriptive 2-4 word title from the description (e.g. "Hokuyo Sensor Simulation").

OUTPUT FORMAT (JSON)
{
  "chat_learnings": { "sourceType": "LinkedIn", "title": "LinkedIn Analysis", "sections": [{"heading": "Key Strengths", "bullets": ["..."]}] },
  "career_profile_patch": {
      "sourceId": "linkedin:profile",
      "upsert_roles": [
          {
              "id": "linkedin:role:company:title",
              "title": { "value": "Title" },
              "company": { "value": "Company" },
              "description": { "value": "..." },
              "startDate": { "value": "..." },
              "endDate": { "value": "..." }
          }
      ],
      "upsert_skills": [
          { 
              "id": "skill:java", 
              "name": "Java", 
              "category": "Language"
          }
      ],
      "upsert_education": [
          {
              "id": "linkedin:edu:ubc:bcs",
              "school": { "value": "UBC" },
              "degree": { "value": "Bachelor of Computer Science" },
              "startDate": { "value": "2016" },
              "endDate": { "value": "2020" }
          }
      ],
      "upsert_volunteering": [
          {
              "id": "linkedin:vol:spca:walker",
              "role": { "value": "Dog Walker" },
              "organization": { "value": "SPCA" },
              "description": { "value": "..." }
          }
      ],
      "upsert_certifications": [
          {
              "id": "linkedin:cert:aws-sa",
              "name": { "value": "AWS Solutions Architect" },
              "authority": { "value": "Amazon Web Services" },
              "date": { "value": "Issued Dec 2023" }
          }
      ],
      "upsert_awards": [
          {
              "id": "linkedin:award:employee-month",
              "title": { "value": "Employee of the Month" },
              "issuer": { "value": "Company Inc" },
              "date": { "value": "2022" }
          }
      ],
      "upsert_languages": [{ "id": "lang:mandarin", "name": "Mandarin", "category": "Language" }],
      "personal": { "name": "John Doe", "location": "Seattle, WA" },
      "contact": { "linkedin": "https://linkedin.com/in/johndoe", "email": "john@example.com" },
      "professionalSummaryDraft": { "value": "..." }
  }
}
`;

export const LinkedInIngestionAgent: IngestionAgent = {
    id: 'linkedin-agent',

    accepts: (source: IngestionSource) => {
        return source.type === 'linkedin' && !!source.url && source.url.includes('linkedin.com/');
    },

    process: async (source: IngestionSource, intent: CareerIntent) => {
        // 1. Get Apify Token
        const token = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
        if (!token) {
            console.warn("No APIFY_API_TOKEN or APIFY_API_KEY found.");
            throw new Error("Missing APIFY_API_KEY");
        }

        const client = new ApifyClient({ token });

        // 2. Fetch/Run Scraper
        let profileData = source.content ? JSON.parse(source.content) : null;
        if (!profileData && source.url) {
            try {
                // HarvestAPI Scraper (LpVuK3Zozwuipa5bp)
                const run = await client.actor("LpVuK3Zozwuipa5bp").call({
                    "profileScraperMode": "Profile details no email ($4 per 1k)",
                    "queries": [source.url]
                });

                const { items } = await client.dataset(run.defaultDatasetId).listItems();
                if (items.length > 0) profileData = items[0];
            } catch (e: any) {
                console.error("Apify execution failed:", e);
                throw new Error("LinkedIn Scraper failed: " + e.message);
            }
        }

        if (!profileData) throw new Error("Failed to fetch LinkedIn data");

        // [Checklist A] Verify LinkedIn fetch returns data
        console.log(`[LinkedIn Agent] Parsed Profile: ${profileData.publicIdentifier} (${profileData.fullName || profileData.firstName + ' ' + profileData.lastName})`);

        // HarvestAPI uses 'experience' (singular), unlike 'experiences' (plural) in others
        const experienceCount = profileData.experience?.length || profileData.experiences?.length || 0;
        const skillsCount = profileData.skills?.length || 0;
        const educationCount = profileData.education?.length || 0;

        console.log(`[LinkedIn Agent] Raw Data: ${experienceCount} Experiences, ${skillsCount} Skills, ${educationCount} Education entries`);

        // [Checklist B] Verification
        if (experienceCount === 0 && skillsCount === 0) {
            console.warn("[LinkedIn Agent] Warning: sparse profile data.");
        }

        // 3. AI Extraction
        const userContent = JSON.stringify({
            job_intent: intent,
            linkedin_url: source.url,
            linkedin_data: {
                ...profileData,
                // Explicitly pick fields we want to ensure show up if they exist
                experience: profileData.experience || profileData.experiences,
                education: profileData.education,
                headline: profileData.headline,
                location: profileData.location || profileData.geoCountryName,
                publicIdentifier: profileData.publicIdentifier,
                contactInfo: profileData.contactInfo,
                volunteering: profileData.volunteering || profileData.volunteer,
                certifications: profileData.certifications,
                honorsAndAwards: profileData.honorsAndAwards || profileData.awards,
                languages: profileData.languages,
                publications: profileData.publications,
                projects: profileData.projects,
                // Image extraction
                profilePic: profileData.profilePic || profileData.profileImgURL || profileData.pictureUrl || profileData.photo
            }
        });

        const result = await generateContent(SYSTEM_PROMPT, userContent);
        if (!result) {
            console.error("[LinkedIn Agent] AI generation failed - no API key available");
            throw new Error("Generative AI failed: No API key found. Please set GEMINI_API_KEY or OPENAI_API_KEY environment variable.");
        }

        // Force sourceId on the patch to be consistent
        const patch = result.career_profile_patch;
        patch.sourceId = `linkedin:${profileData.publicIdentifier || 'profile'}`;

        // Add extracted image to personal section of patch
        const imageUrl = profileData.profilePic || profileData.profileImgURL || profileData.pictureUrl || profileData.photo;
        if (imageUrl && !patch.personal) {
            patch.personal = { name: profileData.fullName || profileData.firstName + ' ' + profileData.lastName };
        }
        if (imageUrl && patch.personal) {
            patch.personal.headshot = imageUrl;
        }

        // SAFETY: Filter out generic "Project Name" entries that AI might still hallucinate
        if (patch.upsert_projects) {
            patch.upsert_projects = patch.upsert_projects.filter((p: any) => {
                const title = p.name ? p.name.trim().toLowerCase() : '';
                return !["project name", "untitled", "new project", "project"].includes(title);
            });
        }

        // [Checklist C] Verify patch content
        console.log("[LinkedIn Agent] Final Patch Check:");
        if (patch.upsert_roles?.length === 0) console.warn("!! Warning: No roles in patch");
        if (patch.upsert_skills?.length === 0) console.warn("!! Warning: No skills in patch");

        console.log(`   - Extracted: ${patch.upsert_education?.length || 0} Education, ${patch.upsert_volunteering?.length || 0} Volunteer, ${patch.upsert_certifications?.length || 0} Certs`);

        if (patch.upsert_roles && patch.upsert_roles.length > 0) {
            const r1 = patch.upsert_roles[0];
            console.log(`   - Sample Role: ${r1.title.value} @ ${r1.company.value}`);
        }

        return {
            patch: patch,
            learnings: result.chat_learnings
        };
    }
};
