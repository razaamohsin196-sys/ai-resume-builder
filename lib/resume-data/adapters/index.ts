/**
 * Template Adapters
 * 
 * Adapters for templates with special layout requirements.
 * These handle template-specific rendering logic.
 */

import { ResumeData } from '../schema';
import { ResumeTemplate } from '../../templates/types';

export interface TemplateAdapter {
  id: string;
  preProcess?: (data: ResumeData) => ResumeData;
  postProcess?: (html: string, data: ResumeData) => string;
}

/**
 * Adapter for two-column layouts
 * Handles left/right column placement
 */
export const twoColumnAdapter: TemplateAdapter = {
  id: 'two-column',
  postProcess: (html: string, data: ResumeData) => {
    // Two-column templates typically have:
    // - Left column: Contact, Skills, Languages
    // - Right column: Summary, Experience, Education
    // This is handled by the template's existing structure
    return html;
  }
};

/**
 * Adapter for timeline layouts
 * Converts dates to timeline format
 */
export const timelineAdapter: TemplateAdapter = {
  id: 'timeline',
  preProcess: (data: ResumeData) => {
    // Timeline templates may need special date formatting
    // For now, we'll use the standard format
    return data;
  }
};

/**
 * Adapter for photo-based layouts
 * Handles photo placement and sizing
 */
export const photoAdapter: TemplateAdapter = {
  id: 'photo',
  postProcess: (html: string, data: ResumeData) => {
    // If no photo provided, hide photo elements
    if (!data.profile.photo) {
      // This is handled by the renderer
    }
    return html;
  }
};

/**
 * Get adapter for a template
 */
export function getAdapter(template: ResumeTemplate): TemplateAdapter | null {
  const layout = template.metadata?.layout;
  
  switch (layout) {
    case 'two-column':
      return twoColumnAdapter;
    case 'timeline':
      return timelineAdapter;
    default:
      return null;
  }
}

/**
 * Apply adapter to data and HTML
 */
export function applyAdapter(
  data: ResumeData,
  html: string,
  template: ResumeTemplate
): { data: ResumeData; html: string } {
  const adapter = getAdapter(template);
  
  if (!adapter) {
    return { data, html };
  }
  
  let processedData = data;
  let processedHtml = html;
  
  if (adapter.preProcess) {
    processedData = adapter.preProcess(data);
  }
  
  if (adapter.postProcess) {
    processedHtml = adapter.postProcess(html, processedData);
  }
  
  return { data: processedData, html: processedHtml };
}
