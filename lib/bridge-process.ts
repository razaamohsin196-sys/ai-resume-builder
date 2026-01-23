import { CareerProfileAggregator } from '@/lib/ingestion/aggregator';
import { RawInput, CareerIntent, CareerProfile } from '@/types/career';
import { IngestionSource, CareerProfilePatch, ChatLearning } from '@/lib/ingestion/types';
import { refineProfile } from './ingestion/refinement';
import { GitHubIngestionAgent } from "@/lib/ingestion/agents/github";
import { LinkedInIngestionAgent } from "@/lib/ingestion/agents/linkedin";
import { PDFIngestionAgent } from "@/lib/ingestion/agents/pdf";

export async function ingestSource(source: IngestionSource, intent: CareerIntent): Promise<{ patch: CareerProfilePatch, learnings: ChatLearning }> {
    console.log(`[ingestSource] Ingesting ${source.type} from ${source.url || source.content}`);

    // Router Logic
    try {
        if (PDFIngestionAgent.accepts(source)) {
            return await PDFIngestionAgent.process(source, intent);
        } else if (GitHubIngestionAgent.accepts(source)) {
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

// NEW: Step 1 - Raw Ingestion Only
export async function ingestRawProfile(inputs: RawInput[], intent: CareerIntent, overrides?: any): Promise<CareerProfile> {
    // 1. Convert RawInput to IngestionSource
    const sources: IngestionSource[] = inputs.map((input, idx) => {
        let type: IngestionSource['type'] = 'text'; // Default

        if (input.type === 'url' || input.type === 'linkedin') {
            type = input.type === 'linkedin' ? 'linkedin' : 'url';
            if (input.content.includes('github.com')) type = 'github';
        } else if (input.type === 'file') {
            if (input.mimeType === 'application/pdf' || input.content.toLowerCase().endsWith('.pdf')) {
                type = 'pdf';
            } else {
                type = 'text'; // Fallback for txt files
            }
        } else if (input.type === 'text') {
            type = 'text';
        }

        return {
            id: input.id || `source-${idx}`,
            type,
            url: (input.type === 'url' || input.type === 'linkedin') ? input.content : undefined,
            content: (input.type === 'text' || input.type === 'file') ? input.content : undefined,
            data: input.data, // IMPORTANT: Pass Base64 data for files
            metadata: { mimeType: input.mimeType, ...input.metadata }
        };
    });

    let currentProfile: CareerProfile | null = overrides ? {
        analysisReport: '',
        summary: '',
        items: [],
        gaps: [],
        manualOverrides: overrides
    } : null;
    let aggregateReports = "";

    // 2. Iterate and Ingest (Concurrent)
    const errors: string[] = [];

    const promises = sources.map(async (source) => {
        try {
            let patch: any = null;
            let learning: any = null;

            // Robust Router: Check Type OR URL pattern
            const isPdf = PDFIngestionAgent.accepts(source);
            const isGitHub = !isPdf && (source.type === 'github' || (source.url && source.url.includes('github.com')));
            const isLinkedIn = !isPdf && (source.type === 'linkedin' || (source.url && source.url.includes('linkedin.com')));

            if (isPdf) {
                const result = await ingestSource(source, intent);
                patch = result.patch;
                learning = result.learnings;
            } else if (isGitHub) {
                source.type = 'github'; // Enforce type
                const result = await ingestSource(source, intent);
                patch = result.patch;
                learning = result.learnings;
            } else if (isLinkedIn) {
                source.type = 'linkedin'; // Enforce type
                const result = await ingestSource(source, intent);
                patch = result.patch;
                learning = result.learnings;
            } else {
                console.log(`[Bridge] Skipping unsupported source: ${source.type} ${source.url}`);
                return null;
            }

            return { patch, learning, sourceId: source.id };

        } catch (e: any) {
            console.error(`[Bridge] Failed to ingest source ${source.id}:`, e);
            errors.push(`${source.type}: ${e.message}`);
            return null;
        }
    });

    const results = await Promise.all(promises);

    // 3. Aggregate Results
    for (const res of results) {
        if (!res) continue;

        if (res.learning && Array.isArray(res.learning.sections)) {
            const sections = res.learning.sections.map((s: any) => `**${s.heading}**\n${s.bullets.map((b: any) => `- ${b}`).join('\n')}`).join('\n\n');
            aggregateReports += `\n\n### Analysis of ${res.learning.title}\n${sections}`;
        }

        if (res.patch) {
            currentProfile = CareerProfileAggregator.merge(currentProfile, res.patch);
        }
    }

    if (!currentProfile) {
        // Fallback if no specialized agents ran
        const errorDetails = errors.length > 0 ? ` Errors: ${errors.join('; ')}` : "";

        return {
            analysisReport: `Ingestion failed. ${errorDetails} Please check your URL or try again.`,
            summary: "",
            items: [],
            gaps: []
        };
    }

    // Update the report
    currentProfile.analysisReport = aggregateReports || "Analysis complete.";

    return currentProfile;
}

// Keep legacy wrapper for backward compatibility but use new flow
export async function processCareerProfile(inputs: RawInput[], intent: CareerIntent, overrides?: any): Promise<CareerProfile> {
    const rawProfile = await ingestRawProfile(inputs, intent, overrides);

    // If raw profile is empty (failed), return it immediately
    if (rawProfile.items.length === 0) return rawProfile;

    // OPTIMIZATION: Skip refinement for LinkedIn sources (already well-structured)
    const hasLinkedIn = inputs.some(i => i.type === 'linkedin' || i.content?.includes('linkedin.com'));
    if (hasLinkedIn) {
        console.log("[Bridge] Skipping refinement for LinkedIn source (already structured)");
        rawProfile.analysisReport += "\n\n✨ Profile loaded from LinkedIn - ready to review!";
        return rawProfile;
    }

    // 5. Refine Profile (Resume-Language Layer) with Timeout Guard
    console.log("[Bridge] Running Profile Refinement...");
    // TODO: Pass actual user overrides when UI supports it

    try {
        const timeoutPromise = new Promise<CareerProfile>((resolve, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);
                reject(new Error("Refinement timed out"));
            }, 40000); // 40s Timeout (saving 20s for Apify + overhead)
        });

        const refinedProfile = await Promise.race([
            refineProfile(rawProfile, intent, overrides || {}),
            timeoutPromise
        ]);

        return refinedProfile;

    } catch (e: any) {
        if (e.message === "Refinement timed out") {
            console.warn("[Bridge] Refinement skipped due to timeout.");
            rawProfile.analysisReport += "\n\n**Note:** AI Refinement timed out, so we're showing the raw extracted data. You can manually refine it below.";
        } else {
            console.error("[Bridge] Refinement failed:", e);
        }
        return rawProfile;
    }
}
