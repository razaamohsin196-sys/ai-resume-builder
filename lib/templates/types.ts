import { SectionType } from '../resume-data/schema';

export interface ResumeTemplate {
    id: string;
    name: string;
    thumbnail?: string;
    html: string; // The raw HTML/CSS string
    hasPhoto?: boolean;
    supportedSections?: SectionType[]; // Sections this template supports
    sectionOrder?: SectionType[]; // Default order of sections
    pageSize?: 'A4' | 'Letter'; // Default page size
    metadata?: {
        selectors?: TemplateSelectorMap; // CSS selectors for parsing
        maxBulletsPerJob?: number;
        photoPosition?: 'header' | 'sidebar' | 'none';
        layout?: 'single-column' | 'two-column' | 'timeline';
    };
}

export interface TemplateSelectorMap {
    name?: string[];
    title?: string[];
    contact?: string[];
    summary?: string[];
    experienceSection?: string[];
    experienceItem?: string[];
    educationSection?: string[];
    educationItem?: string[];
    skillsSection?: string[];
    projectsSection?: string[];
}
