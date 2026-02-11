import { IngestionAgent, IngestionSource, CareerProfilePatch, ChatLearning, ProjectUpsert, SkillUpsert } from '../types';
import { CareerIntent } from '@/types/career';
import { fetchPublicGitHubData } from '../github-fetcher';
import { generateContent } from '@/lib/ai/provider';

const SYSTEM_PROMPT = `
You are GitHubIngestionAgent (Enrichment Mode).

GOAL
Enrich the provided "GitHub Facts" (repos, languages) with a career narrative and better descriptions.
Do NOT invent new projects. Only discuss what is present in the facts.

INPUT
1. Facts: List of repos, languages, and raw README content.
2. Intent: User's career goal.

OUTPUT (JSON)
{
  "chat_learnings": {
      "sourceType": "Github",
      "title": "GitHub Analysis",
      "sections": [{ "heading": "Key Projects", "bullets": ["..."] }]
  },
  "enrichments": {
      "projects": [
          { 
              "id": "github:owner/repo", 
              "one_liner": "Concise summary...", 
              "highlights": ["Key technical achievement..."]
          }
      ],
      "professional_summary_draft": "Suggested summary sentence based on code..."
  }
}
`;

export const GitHubIngestionAgent: IngestionAgent = {
    id: 'github-agent',

    accepts: (source: IngestionSource) => {
        // Just check generic URL or explicit type
        return source.type === 'github' || (!!source.url && source.url.includes('github.com/'));
    },

    process: async (source: IngestionSource, intent: CareerIntent) => {
        // 1. Resolve Username
        let username = source.url?.split('github.com/')?.[1]?.split('/')?.[0] || '';
        if (!username && !source.url?.includes('/')) username = source.url || '';
        if (!username) throw new Error("Invalid GitHub URL");

        // 2. Fetch Data (Deterministic)
        const data = await fetchPublicGitHubData(username);
        if (!data) throw new Error(`Could not fetch GitHub data for: ${username}`);

        // [Checklist A] Verify GitHub fetch returns data
        console.log(`[GitHub Agent] Parsed Profile: ${data.profile.login} (${data.profile.name})`);
        console.log(`[GitHub Agent] Repos Fetched: ${data.repos.length}`);

        if (data.repos.length > 0) {
            console.log(`[GitHub Agent] Top Repos: ${data.repos.map((r: any) => r.name).join(', ')}`);
            // Check languages for first repo
            console.log(`[GitHub Agent] First Repo Language: ${data.repos[0].language}`);
            // Check Readme
            console.log(`[GitHub Agent] First Repo README len: ${data.repos[0].readme?.length || 0}`);
        }

        // [Checklist A/B] Validation
        if (data.repos.length === 0) {
            console.error("[GitHub Agent] No repositories found. Aborting.");
            throw new Error("No repositories found for this user.");
        }

        const sourceId = `github:${data.profile.login}`; // Stable Source ID

        // 3. Deterministic Extraction (The "Facts")
        const projectUpserts: ProjectUpsert[] = data.repos.map((repo: any) => ({
            id: `github:${data.profile.login}/${repo.name}`,
            name: repo.name,
            url: { value: repo.html_url },
            description: repo.description ? { value: repo.description } : undefined,
            metrics: { value: [`${repo.stargazers_count} stars`] },
            startDate: { value: repo.updated_at }
        }));

        // Extract Skills from languages
        const skillUpserts: SkillUpsert[] = [];
        const seenSkills = new Set<string>();

        data.repos.forEach((repo: any) => {
            if (repo.language && !seenSkills.has(repo.language)) {
                seenSkills.add(repo.language);
                skillUpserts.push({
                    id: `skill:${repo.language.toLowerCase()}`,
                    name: repo.language,
                    category: 'Language'
                });
            }
        });

        // [Checklist B] Verify facts bundle
        const readmesCount = data.repos.filter((r: any) => r.readme && r.readme.length > 0).length;
        console.log(`[GitHub Agent] Facts Extracted: ${projectUpserts.length} Projects, ${skillUpserts.length} Skills`);
        console.log(`[GitHub Agent] Readmes available: ${readmesCount}`);


        // 4. AI Enrichment (The "Vibe")
        // We send the facts + readme snippets to AI to get nice descriptions and chat narrative
        let enrichment: any = {};
        let learnings: ChatLearning = { sourceType: 'GitHub', title: 'GitHub Analysis', sections: [] };

        try {
            const promptInput = {
                intent,
                facts: {
                    profile: data.profile,
                    repos: data.repos.map((r: any) => ({ name: r.name, description: r.description, readme_snippet: r.readme?.slice(0, 1000) }))
                }
            };

            const aiResult = await generateContent(SYSTEM_PROMPT, JSON.stringify(promptInput));

            if (aiResult) {
                enrichment = aiResult.enrichments || {};
                learnings = aiResult.chat_learnings || learnings;
            }
        } catch (e) {
            console.warn("GitHub AI Enrichment failed, falling back to raw facts", e);
        }

        // 5. Merge Enrichment into Upserts
        if (enrichment.projects) {
            enrichment.projects.forEach((enr: any) => {
                const target = projectUpserts.find(p => p.id === enr.id);
                if (target) {
                    // Enrich description if AI provides a better one
                    if (enr.one_liner) {
                        target.description = {
                            value: enr.one_liner
                        };
                    }
                }
            });
        }

        const patch: CareerProfilePatch = {
            sourceId: sourceId,
            upsert_projects: projectUpserts,
            upsert_skills: skillUpserts,
            personal: {
                name: data.profile.name || data.profile.login,
                location: data.profile.location,
                headshot: (data.profile as any).avatar_url
            },
            contact: {
                github: data.profile.html_url,
                website: data.profile.blog
            },
            professionalSummaryDraft: enrichment.professional_summary_draft ? {
                value: enrichment.professional_summary_draft
            } : undefined
        };

        // [Checklist C] Verify patch content
        console.log("[GitHub Agent] Final Patch Check:");
        if (patch.upsert_projects?.length === 0) console.warn("!! Warning: No projects in patch");
        if (patch.upsert_skills?.length === 0) console.warn("!! Warning: No skills in patch");

        // Sample check (first project name, evidence)
        if (patch.upsert_projects && patch.upsert_projects.length > 0) {
            const p1 = patch.upsert_projects[0];
            console.log(`   - Sample Project: ${p1.name} (ID: ${p1.id})`);
            console.log(`   - Description: ${p1.description?.value?.slice(0, 50)}...`);
        }
        if (patch.upsert_skills && patch.upsert_skills.length > 0) {
            console.log(`   - Sample Skill: ${patch.upsert_skills[0].name} (ID: ${patch.upsert_skills[0].id})`);
        }


        return { patch, learnings };
    }
};
