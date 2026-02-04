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
    // Step 1: Parse current HTML to structured data
    const data = parseResumeHtml(currentHtml);
    
    // Step 2: Render to new template
    let html = renderToTemplate(data, newTemplate);
    
    // Step 3: Apply template-specific adapters
    const result = applyAdapter(data, html, newTemplate);
    
    return result.html;
  } catch (error) {
    console.error('Template swap error:', error);
    throw new Error(`Failed to swap template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
