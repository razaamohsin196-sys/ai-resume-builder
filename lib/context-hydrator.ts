
import { ApifyClient } from 'apify-client';

// Initialize Client (will use token from env)
// format: APIFY_API_TOKEN=...
const apifyToken = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
const client = apifyToken ? new ApifyClient({ token: apifyToken }) : null;

export async function hydrateContext(url: string): Promise<string | null> {
    try {
        const urlObj = new URL(url);

        // 1. GitHub Strategy
        if (urlObj.hostname.includes('github.com')) {
            return await hydrateGitHub(urlObj);
        }

        // 2. LinkedIn Strategy (Apify Actor: LpVuK3Zozwuipa5bp)
        if (urlObj.hostname.includes('linkedin.com')) {
            return await hydrateLinkedIn(url);
        }

        return `[URL Detected: ${url}] - Content fetching skipped for generic site.`;

    } catch (error) {
        console.error(`Failed to hydrate ${url}`, error);
        return null;
    }
}

async function hydrateLinkedIn(url: string): Promise<string> {
    if (!client) {
        return `[SYSTEM ERROR] Apify Token is missing. Please add APIFY_API_TOKEN to .env.local to enable LinkedIn scraping.`;
    }

    console.log(`[Hydrator] 🚀 calling Apify Actor (LpVuK3Zozwuipa5bp) for: ${url}`);

    try {
        // Prepare Actor input based on User's request
        const input = {
            "profileScraperMode": "Profile details no email ($4 per 1k)",
            "queries": [url] // Map the single URL to the queries array
        };

        // Run the Actor and wait for it to finish
        const run = await client.actor("LpVuK3Zozwuipa5bp").call(input);

        // Fetch results from the dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (!items || items.length === 0) {
            return `[LINKEDIN ERROR] Apify returned no data. The profile might be private or the scraper failed.`;
        }

        const profile = items[0] as any;

        // Debug: Log the keys we got back to help with parsing adjustments if needed
        console.log(`[Hydrator] Data received Keys: ${Object.keys(profile).join(', ')}`);

        return formatLinkedInProfile(profile);

    } catch (e) {
        console.error("[Hydrator] Apify Error:", e);
        return `[LINKEDIN API ERROR] ${(e as Error).message}`;
    }
}

function formatLinkedInProfile(p: any): string {
    // Convert the structured JSON into a dense, readable text for the AI
    let text = `\n--- [START LINKEDIN PROFILE] ---\n`;

    // Core Info
    text += `Name: ${p.firstName || p.name} ${p.lastName || ''}\n`;
    text += `Headline: ${p.headline || p.position}\n`;
    text += `Location: ${p.location?.linkedinText || p.location || p.city}\n`;
    if (p.summary || p.about) text += `About: ${p.summary || p.about}\n`;

    // Experience
    if (p.experience?.length) {
        text += `\n## EXPERIENCE\n`;
        p.experience.forEach((role: any) => {
            text += `- Role: ${role.position || role.title}\n`;
            text += `  Company: ${role.companyName || role.company}\n`;
            text += `  Duration: ${role.duration || `${role.startDate?.text} - ${role.endDate?.text}`}\n`;
            if (role.description) text += `  Details: ${role.description.replace(/\n/g, ' ')}\n`;
        });
    }

    // Education
    if (p.education?.length) {
        text += `\n## EDUCATION\n`;
        p.education.forEach((edu: any) => {
            text += `- School: ${edu.schoolName || edu.school}\n`;
            text += `  Degree: ${edu.degree || ''} ${edu.fieldOfStudy || ''}\n`;
            text += `  Years: ${edu.period || `${edu.startDate?.year || edu.start_year || ''} - ${edu.endDate?.year || edu.end_year || ''}`}\n`;
        });
    }

    // Certifications
    if (p.certifications?.length) {
        text += `\n## CERTIFICATIONS\n`;
        p.certifications.forEach((cert: any) => {
            text += `- ${cert.title} (Issued by ${cert.issuedBy || 'Unknown'})\n`;
        });
    }

    // Skills
    if (p.skills?.length) {
        text += `\n## SKILLS\n`;
        // Handle both simple strings and object formats if they vary
        const skillNames = p.skills.map((s: any) => typeof s === 'string' ? s : s.name).join(', ');
        text += `${skillNames}\n`;
    }

    text += `\n--- [END LINKEDIN PROFILE] ---\n`;
    return text;
}

async function hydrateGitHub(url: URL): Promise<string> {
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
        const [user, repo] = pathParts;
        const branches = ['main', 'master', 'dev'];
        for (const branch of branches) {
            const rawUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/README.md`;
            try {
                const res = await fetch(rawUrl);
                if (res.ok) {
                    return `\n--- [START GITHUB README: ${repo}] ---\n${await res.text()}\n--- [END GITHUB README] ---\n`;
                }
            } catch (e) { continue; }
        }
        return `[GITHUB REPO: ${user}/${repo}] - No README found.`;
    }
    return `[GITHUB LINK: ${url.toString()}]`;
}
