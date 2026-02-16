/**
 * Batch Template Generation Utilities
 * 
 * Generates all resume templates upfront in batches to avoid rate limits
 * and stores them in localStorage for instant template switching.
 */

import { RESUME_TEMPLATES } from './index';
import { ResumeTemplate } from './types';
import { CareerProfile, CareerIntent } from '@/types/career';
import { generateResumeFromBackend } from '@/lib/api/resume-backend';

const GENERATED_TEMPLATES_KEY_PREFIX = 'generated_templates_';
const BATCH_SIZE = 4; // Generate 4 templates per batch to avoid rate limits

/**
 * Generate a hash key for the profile+intent combination
 * This ensures we regenerate templates if the profile or intent changes
 */
function generateProfileHash(profile: CareerProfile, intent: CareerIntent): string {
  const key = JSON.stringify({
    profile: {
      personal: profile.personal,
      contact: profile.contact,
      summary: profile.summary,
      items: profile.items?.map(item => ({
        category: item.category,
        title: item.title,
        organization: item.organization,
        description: item.description,
        dates: item.dates,
      })),
    },
    intent: {
      targetRole: intent.targetRole,
      targetLocation: intent.targetLocation,
      yearsOfExperience: intent.yearsOfExperience,
      jobSearchIntent: intent.jobSearchIntent,
    },
  });
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get the localStorage key for generated templates
 */
function getStorageKey(profile: CareerProfile, intent: CareerIntent): string {
  const hash = generateProfileHash(profile, intent);
  return `${GENERATED_TEMPLATES_KEY_PREFIX}${hash}`;
}

/**
 * Store generated templates in localStorage
 */
export function saveGeneratedTemplates(
  profile: CareerProfile,
  intent: CareerIntent,
  templates: Record<string, string>
): void {
  try {
    const key = getStorageKey(profile, intent);
    localStorage.setItem(key, JSON.stringify({
      templates,
      generatedAt: Date.now(),
      profileHash: generateProfileHash(profile, intent),
    }));
  } catch (e) {
    console.error('[saveGeneratedTemplates] Failed to save:', e);
    // If quota exceeded, try to clear old entries
    try {
      clearOldGeneratedTemplates();
      const key = getStorageKey(profile, intent);
      localStorage.setItem(key, JSON.stringify({
        templates,
        generatedAt: Date.now(),
        profileHash: generateProfileHash(profile, intent),
      }));
    } catch (e2) {
      console.error('[saveGeneratedTemplates] Failed after cleanup:', e2);
    }
  }
}

/**
 * Load generated templates from localStorage
 */
export function loadGeneratedTemplates(
  profile: CareerProfile,
  intent: CareerIntent
): Record<string, string> | null {
  try {
    const key = getStorageKey(profile, intent);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    // Verify the hash matches (profile/intent hasn't changed)
    if (data.profileHash !== generateProfileHash(profile, intent)) {
      return null; // Profile changed, templates are stale
    }
    
    return data.templates || null;
  } catch (e) {
    console.error('[loadGeneratedTemplates] Failed to load:', e);
    return null;
  }
}

/**
 * Get a specific generated template by ID
 */
export function getGeneratedTemplate(
  profile: CareerProfile,
  intent: CareerIntent,
  templateId: string
): string | null {
  const allTemplates = loadGeneratedTemplates(profile, intent);
  return allTemplates?.[templateId] || null;
}

/**
 * Clear old generated templates to free up space
 */
function clearOldGeneratedTemplates(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(GENERATED_TEMPLATES_KEY_PREFIX)) {
        keys.push(key);
      }
    }
    
    // Keep only the most recent 3 sets, delete the rest
    const entries = keys.map(key => ({
      key,
      data: JSON.parse(localStorage.getItem(key) || '{}'),
    })).sort((a, b) => (b.data.generatedAt || 0) - (a.data.generatedAt || 0));
    
    // Delete all but the 3 most recent
    entries.slice(3).forEach(entry => {
      localStorage.removeItem(entry.key);
    });
  } catch (e) {
    console.error('[clearOldGeneratedTemplates] Failed:', e);
  }
}

/**
 * Generate a single template
 */
async function generateSingleTemplate(
  template: ResumeTemplate,
  profile: CareerProfile,
  intent: CareerIntent,
  options?: { fitToOnePage?: boolean; hasPhoto?: boolean }
): Promise<{ templateId: string; html: string }> {
  try {
    const html = await generateResumeFromBackend(
      profile,
      intent,
      {
        templateHtml: template.html,
        hasPhoto: template.hasPhoto,
        ...options,
      }
    );
    
    return {
      templateId: template.id,
      html,
    };
  } catch (error) {
    console.error(`[generateSingleTemplate] Failed for template ${template.id}:`, error);
    throw error;
  }
}

/**
 * Generate all templates in batches
 * @param profile - Career profile
 * @param intent - Career intent
 * @param onProgress - Callback for progress updates (templateId, success, error?)
 * @param options - Generation options
 * @returns Promise that resolves when all templates are generated
 */
export async function generateAllTemplates(
  profile: CareerProfile,
  intent: CareerIntent,
  onProgress?: (templateId: string, success: boolean, error?: Error) => void,
  options?: { fitToOnePage?: boolean; hasPhoto?: boolean }
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  // Split templates into batches of BATCH_SIZE
  const batches: ResumeTemplate[][] = [];
  for (let i = 0; i < RESUME_TEMPLATES.length; i += BATCH_SIZE) {
    batches.push(RESUME_TEMPLATES.slice(i, i + BATCH_SIZE));
  }
  
  // Process batches sequentially, but templates within each batch in parallel
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    console.log(`[generateAllTemplates] Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} templates)`);
    
    // Generate all templates in this batch in parallel
    const batchPromises = batch.map(template =>
      generateSingleTemplate(template, profile, intent, options)
        .then(result => {
          results[result.templateId] = result.html;
          onProgress?.(result.templateId, true);
          return result;
        })
        .catch(error => {
          console.error(`[generateAllTemplates] Failed for template ${template.id}:`, error);
          onProgress?.(template.id, false, error);
          // Continue with other templates even if one fails
          return null;
        })
    );
    
    // Wait for all templates in this batch to complete
    await Promise.all(batchPromises);
    
    // Small delay between batches to avoid rate limits
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between batches
    }
  }
  
  // Save all successfully generated templates to localStorage
  if (Object.keys(results).length > 0) {
    saveGeneratedTemplates(profile, intent, results);
  }
  
  return results;
}

/**
 * Check if all templates are already generated and cached
 */
export function areAllTemplatesGenerated(
  profile: CareerProfile,
  intent: CareerIntent
): boolean {
  const cached = loadGeneratedTemplates(profile, intent);
  if (!cached) return false;
  
  // Check if we have all 12 templates
  const cachedIds = Object.keys(cached);
  return RESUME_TEMPLATES.every(template => cachedIds.includes(template.id));
}

/**
 * Get the count of cached templates
 */
export function getCachedTemplateCount(
  profile: CareerProfile,
  intent: CareerIntent
): number {
  const cached = loadGeneratedTemplates(profile, intent);
  return cached ? Object.keys(cached).length : 0;
}
