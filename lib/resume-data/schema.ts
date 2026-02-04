/**
 * Resume Data Schema
 * 
 * Defines the structured data format for resume content.
 * This schema is template-agnostic and represents the semantic content
 * that can be rendered to any template.
 */

// Supported section types
export type SectionType = 
  | 'profile'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'languages'
  | 'certifications'
  | 'training'
  | 'volunteering'
  | 'custom';

// Profile/Contact Information
export interface ProfileSection {
  name: string;
  title?: string; // Job title or tagline
  location?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  photo?: string; // URL or base64
}

// Professional Summary
export interface SummarySection {
  text: string;
}

// Work Experience Item
export interface ExperienceItem {
  id: string;
  title: string; // Job title
  company: string;
  location?: string;
  startDate: string;
  endDate?: string; // Optional for current roles
  bullets: string[];
  description?: string; // Alternative to bullets for some templates
}

// Education Item
export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  honors?: string;
  details?: string[];
}

// Skills Section (can be grouped or flat)
export interface SkillsSection {
  groups?: SkillGroup[]; // Grouped skills (e.g., "Technical", "Languages")
  items?: string[]; // Flat list of skills
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

// Project Item
export interface ProjectItem {
  id: string;
  title: string;
  organization?: string; // Company or personal
  description: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  technologies?: string[];
  bullets?: string[];
}

// Language Item
export interface LanguageItem {
  id: string;
  language: string;
  proficiency: string; // e.g., "Native", "Fluent", "Intermediate"
}

// Certification Item
export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

// Training/Course Item
export interface TrainingItem {
  id: string;
  name: string;
  provider: string;
  date?: string;
  description?: string;
}

// Volunteering Item
export interface VolunteeringItem {
  id: string;
  role: string;
  organization: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  bullets?: string[];
}

// Custom Section (user-defined)
export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface CustomSectionItem {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  bullets?: string[];
}

// Root Resume Data Structure
export interface ResumeData {
  profile: ProfileSection;
  summary?: SummarySection;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  skills?: SkillsSection;
  projects?: ProjectItem[];
  languages?: LanguageItem[];
  certifications?: CertificationItem[];
  training?: TrainingItem[];
  volunteering?: VolunteeringItem[];
  custom?: CustomSection[];
  
  // Metadata
  metadata?: {
    lastModified?: Date;
    templateId?: string;
    pageSize?: 'A4' | 'Letter';
  };
}

// Helper type for section data
export type SectionData = 
  | ProfileSection
  | SummarySection
  | ExperienceItem[]
  | EducationItem[]
  | SkillsSection
  | ProjectItem[]
  | LanguageItem[]
  | CertificationItem[]
  | TrainingItem[]
  | VolunteeringItem[]
  | CustomSection[];

// Validation helpers
export function isValidResumeData(data: any): data is ResumeData {
  return (
    data &&
    typeof data === 'object' &&
    data.profile &&
    typeof data.profile.name === 'string'
  );
}

export function getSectionData(data: ResumeData, section: SectionType): SectionData | undefined {
  switch (section) {
    case 'profile':
      return data.profile;
    case 'summary':
      return data.summary;
    case 'experience':
      return data.experience;
    case 'education':
      return data.education;
    case 'skills':
      return data.skills;
    case 'projects':
      return data.projects;
    case 'languages':
      return data.languages;
    case 'certifications':
      return data.certifications;
    case 'training':
      return data.training;
    case 'volunteering':
      return data.volunteering;
    case 'custom':
      return data.custom;
    default:
      return undefined;
  }
}

export function hasSectionData(data: ResumeData, section: SectionType): boolean {
  const sectionData = getSectionData(data, section);
  if (!sectionData) return false;
  
  if (Array.isArray(sectionData)) {
    return sectionData.length > 0;
  }
  
  if (section === 'summary') {
    return !!(sectionData as SummarySection).text;
  }
  
  if (section === 'skills') {
    const skills = sectionData as SkillsSection;
    return !!(skills.groups?.length || skills.items?.length);
  }
  
  return true;
}
