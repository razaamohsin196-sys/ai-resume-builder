/**
 * Resume Data System
 * 
 * Main entry point for deterministic template swapping.
 * Exports all public APIs.
 */

export * from './schema';
export * from './parser';
export * from './renderer';
export * from './section-injector';
export * from './adapters';
export * from './profile-adapter';
export * from './utils';
export * from './placeholder-filter';

import { parseResumeHtml } from './parser';
import { renderToTemplate } from './renderer';
import { ResumeTemplate } from '../templates/types';
import { ResumeData, SectionType } from './schema';
import { applyAdapter } from './adapters';
import { hasSectionInHtml, injectSection } from './section-injector';

/**
 * Check if ResumeData has content for a given section type.
 */
function hasSectionDataCheck(data: ResumeData, sectionType: SectionType): boolean {
  switch (sectionType) {
    case 'profile': return !!data.profile.name;
    case 'summary': return !!data.summary?.text;
    case 'experience': return !!(data.experience && data.experience.length > 0);
    case 'education': return !!(data.education && data.education.length > 0);
    case 'skills': return !!(data.skills && (data.skills.groups?.length || data.skills.items?.length));
    case 'projects': return !!(data.projects && data.projects.length > 0);
    case 'languages': return !!(data.languages && data.languages.length > 0);
    case 'certifications': return !!(data.certifications && data.certifications.length > 0);
    case 'training': return !!(data.training && data.training.length > 0);
    case 'volunteering': return !!(data.volunteering && data.volunteering.length > 0);
    case 'awards': return !!(data.awards && data.awards.length > 0);
    case 'publications': return !!(data.publications && data.publications.length > 0);
    default: return false;
  }
}

/**
 * Merge parsed data with career profile fallback data.
 * Parsed data (from current HTML) takes priority — career profile
 * fills in any sections that the parser couldn't extract.
 */
function mergeWithFallback(parsed: ResumeData, fallback: ResumeData): ResumeData {
  return {
    profile: {
      name: parsed.profile.name || fallback.profile.name,
      title: parsed.profile.title || fallback.profile.title,
      location: parsed.profile.location || fallback.profile.location,
      email: parsed.profile.email || fallback.profile.email,
      phone: parsed.profile.phone || fallback.profile.phone,
      linkedin: parsed.profile.linkedin || fallback.profile.linkedin,
      github: parsed.profile.github || fallback.profile.github,
      website: parsed.profile.website || fallback.profile.website,
      photo: parsed.profile.photo || fallback.profile.photo,
    },
    summary: parsed.summary || fallback.summary,
    experience: (parsed.experience && parsed.experience.length > 0) ? parsed.experience : fallback.experience,
    education: (parsed.education && parsed.education.length > 0) ? parsed.education : fallback.education,
    skills: parsed.skills || fallback.skills,
    projects: (parsed.projects && parsed.projects.length > 0) ? parsed.projects : fallback.projects,
    languages: (parsed.languages && parsed.languages.length > 0) ? parsed.languages : fallback.languages,
    certifications: (parsed.certifications && parsed.certifications.length > 0) ? parsed.certifications : fallback.certifications,
    training: (parsed.training && parsed.training.length > 0) ? parsed.training : fallback.training,
    volunteering: (parsed.volunteering && parsed.volunteering.length > 0) ? parsed.volunteering : fallback.volunteering,
    awards: (parsed.awards && parsed.awards.length > 0) ? parsed.awards : fallback.awards,
    publications: (parsed.publications && parsed.publications.length > 0) ? parsed.publications : fallback.publications,
    custom: parsed.custom || fallback.custom,
    metadata: parsed.metadata,
  };
}

/**
 * Swap template deterministically (no LLM calls)
 * 
 * This is the main function to use for template swapping.
 * It parses the current HTML, extracts structured data,
 * and renders it to the new template.
 * 
 * Data priority (3-layer merge):
 *   1. Freshly parsed from current HTML (captures latest user edits)
 *   2. Previously saved edits data (catches edits the parser missed)
 *   3. Original career profile data (fills in sections never in the HTML)
 * 
 * @param currentHtml - The current resume HTML
 * @param newTemplate - The target template to render into
 * @param careerProfileData - Optional career profile data (layer 3 fallback)
 * @param previousEditsData - Optional previously saved edits (layer 2 fallback)
 * @returns Object with rendered html and the merged ResumeData for persistence
 */
export function swapTemplate(
  currentHtml: string,
  newTemplate: ResumeTemplate,
  careerProfileData?: ResumeData | null,
  previousEditsData?: ResumeData | null,
): { html: string; mergedData: ResumeData } {
  try {
    // Step 1: Parse current HTML to structured data (layer 1 — latest edits)
    const parsedData = parseResumeHtml(currentHtml);
    
    // Step 1.5: 3-layer merge
    // Start with career profile (lowest priority), overlay saved edits, overlay parsed
    let data = parsedData;
    if (careerProfileData) {
      data = mergeWithFallback(data, careerProfileData);
    }
    if (previousEditsData) {
      // Saved edits sit between parsed and career profile:
      // parsed data wins, then saved edits fill gaps, then career profile
      data = mergeWithFallback(parsedData, mergeWithFallback(previousEditsData, careerProfileData || previousEditsData));
    }
    
    // Step 2: Render to new template
    let html = renderToTemplate(data, newTemplate);
    
    // Step 3: Apply template-specific adapters
    const result = applyAdapter(data, html, newTemplate);
    html = result.html;
    
    // Step 4: Inject any sections that have data but don't exist in the new template.
    // This ensures sections added by the user in Template A still appear in Template B
    // even if Template B doesn't natively have that section.
    const injectableSections: SectionType[] = [
      'projects', 'certifications', 'languages', 'training',
      'volunteering', 'awards', 'publications',
    ];
    
    for (const sectionType of injectableSections) {
      if (hasSectionDataCheck(data, sectionType) && !hasSectionInHtml(html, sectionType)) {
        try {
          const injected = injectSection(html, sectionType, data, newTemplate);
          if (injected.html !== html) {
            html = injected.html;
          }
        } catch (e) {
          console.warn(`[swapTemplate] Failed to inject missing section: ${sectionType}`, e);
        }
      }
    }
    
    // Step 5: Final deduplication pass to ensure no duplicates exist
    const { deduplicateHtml } = require('./deduplication');
    html = deduplicateHtml(html);
    
    return { html, mergedData: data };
  } catch (error) {
    console.error('[swapTemplate] Template swap error:', error);
    throw new Error(`Failed to swap template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
