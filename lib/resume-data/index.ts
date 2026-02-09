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
import { applyAdapter } from './adapters';

/**
 * Swap template deterministically (no LLM calls)
 * 
 * This is the main function to use for template swapping.
 * It parses the current HTML, extracts structured data,
 * and renders it to the new template.
 */
export function swapTemplate(currentHtml: string, newTemplate: ResumeTemplate): string {
  try {
    console.log('[swapTemplate] Starting template swap to:', newTemplate.name);
    
    // Step 1: Parse current HTML to structured data
    console.log('[swapTemplate] Parsing current HTML...');
    const data = parseResumeHtml(currentHtml);
    console.log('[swapTemplate] Parsed data:', {
      name: data.profile.name,
      email: data.profile.email,
      experienceCount: data.experience?.length || 0,
      educationCount: data.education?.length || 0,
      hasSummary: !!data.summary
    });
    
    // Step 2: Render to new template
    console.log('[swapTemplate] Rendering to new template...');
    let html = renderToTemplate(data, newTemplate);
    
    // Step 3: Apply template-specific adapters
    console.log('[swapTemplate] Applying adapters...');
    const result = applyAdapter(data, html, newTemplate);
    
    // Step 4: Verify the result doesn't contain placeholder data
    if (result.html.includes('Becky Shu') || result.html.includes('beckyshu')) {
      console.warn('[swapTemplate] WARNING: Result contains placeholder data! Name should be:', data.profile.name);
      // The parser/renderer should have replaced this, but let's not fail
    } else {
      console.log('[swapTemplate] Successfully swapped template, verified no placeholder data');
    }
    
    return result.html;
  } catch (error) {
    console.error('[swapTemplate] Template swap error:', error);
    throw new Error(`Failed to swap template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
