
import { CareerProfile, CareerIntent, CareerProfileItem } from '@/types/career';
import { generateContent } from '@/lib/ai/provider';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';
import { CareerProfileAggregator } from './aggregator';
import { CareerProfilePatch } from './types';

export const refineProfile = async (
    profile: CareerProfile,
    intent: CareerIntent,
    userOverrides: any = {}
): Promise<CareerProfile> => {

    // Prepare Input
    const input = {
        job_intent: intent,
        career_profile: profile,
        user_overrides: userOverrides
    };

    try {
        const aiResult = await generateContent(SYSTEM_PROMPTS.PROFILE_REFINEMENT, JSON.stringify(input));

        console.log("[Refinement] AI Result:", JSON.stringify(aiResult, null, 2));

        if (!aiResult || !aiResult.career_profile_patch) {
            console.warn("Refinement Agent returned empty or invalid result.");
            return profile;
        }

        const patch: CareerProfilePatch = aiResult.career_profile_patch;
        console.log("[Refinement] Patch generated with sourceId:", patch.sourceId);

        // Merge Patch
        // Note: The patch's sourceId is 'refinement-agent'. 
        // Aggregator will append this sourceId.
        const refinedProfile = CareerProfileAggregator.merge(profile, patch);

        // Handle Missing Info Questions (Appended to Report or Gaps)
        if (aiResult.missing_info_questions && aiResult.missing_info_questions.length > 0) {
            const questions = aiResult.missing_info_questions.map((q: any) => q.question);
            // Append to existing gaps, distinct
            refinedProfile.gaps = Array.from(new Set([...(refinedProfile.gaps || []), ...questions]));
        }

        return refinedProfile;

    } catch (e) {
        console.error("Refinement Agent Failed:", e);
        return profile; // Fail safe, return original
    }
}
