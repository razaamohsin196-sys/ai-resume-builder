/**
 * Helper to generate default metadata for templates
 */

import { SectionType } from './schema';

export const DEFAULT_SUPPORTED_SECTIONS: SectionType[] = [
  'profile',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'languages',
  'certifications',
  'training',
  'volunteering',
];

export const DEFAULT_SECTION_ORDER: SectionType[] = [
  'profile',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
];

export function getDefaultMetadata(layout: 'single-column' | 'two-column' | 'timeline' = 'single-column', hasPhoto: boolean = false) {
  return {
    layout,
    photoPosition: hasPhoto ? ('header' as const) : ('none' as const),
    maxBulletsPerJob: 5,
    selectors: {
      name: ['.name', 'h1', '[class*="name"]'],
      title: ['.job-title', '.title', '.role'],
      contact: ['.contact-info', '.contact', '.header'],
      summary: ['.summary', '.about', '.profile-summary'],
      experienceSection: ['.section', 'section'],
      experienceItem: ['.experience-item', '.job', '.timeline-item'],
      educationSection: ['.section', 'section'],
      educationItem: ['.education-item', '.school'],
      skillsSection: ['.section', 'section'],
      projectsSection: ['.section', 'section'],
    }
  };
}
