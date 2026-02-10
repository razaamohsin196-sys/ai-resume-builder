/**
 * Profile Adapter
 * 
 * Converts CareerProfile to ResumeData schema for deterministic rendering.
 * This allows fallback to template rendering when AI generation fails.
 */

import { CareerProfile, CareerProfileItem } from '@/types/career';
import { ResumeData, ExperienceItem, EducationItem, ProjectItem, SkillsSection, LanguageItem, CertificationItem, AwardItem, PublicationItem } from './schema';

/**
 * Convert CareerProfile to ResumeData
 */
export function careerProfileToResumeData(profile: CareerProfile): ResumeData {
  // Extract items by category
  const roleItems = profile.items.filter(item => item.category === 'role');
  const projectItems = profile.items.filter(item => item.category === 'project');
  const educationItems = profile.items.filter(item => item.category === 'education');
  const skillItems = profile.items.filter(item => item.category === 'skill');
  const certItems = profile.items.filter(item => item.category === 'certification');
  const languageItems = profile.items.filter(item => item.category === 'language');
  const volunteerItems = profile.items.filter(item => item.category === 'volunteer');
  const awardItems = profile.items.filter(item => item.category === 'award');
  const publicationItems = profile.items.filter(item => item.category === 'publication');

  // Build ResumeData
  const resumeData: ResumeData = {
    profile: {
      name: profile.personal?.name || '',
      location: profile.personal?.location,
      email: profile.contact?.email,
      phone: profile.contact?.phone,
      linkedin: profile.contact?.linkedin,
      github: profile.contact?.github,
      website: profile.contact?.website,
      photo: profile.personal?.photos?.[0],
    },
    summary: profile.summary ? { text: profile.summary } : undefined,
    experience: roleItems.length > 0 ? roleItems.map(convertToExperience) : undefined,
    education: educationItems.length > 0 ? educationItems.map(convertToEducation) : undefined,
    skills: convertToSkills(skillItems),
    projects: projectItems.length > 0 ? projectItems.map(convertToProject) : undefined,
    languages: languageItems.length > 0 ? languageItems.map(convertToLanguage) : undefined,
    certifications: certItems.length > 0 ? certItems.map(convertToCertification) : undefined,
    volunteering: volunteerItems.length > 0 ? volunteerItems.map(convertToVolunteering) : undefined,
    awards: awardItems.length > 0 ? awardItems.map(convertToAward) : undefined,
    publications: publicationItems.length > 0 ? publicationItems.map(convertToPublication) : undefined,
  };

  return resumeData;
}

/**
 * Convert CareerProfileItem (role) to ExperienceItem
 */
function convertToExperience(item: CareerProfileItem): ExperienceItem {
  // Parse description into bullets (split by newlines or bullet points)
  const bullets = item.description
    .split(/\n|•/)
    .map(b => b.trim())
    .filter(b => b.length > 0);

  // Parse dates (format: "Jan 2020 - Dec 2022" or "2020 - 2022")
  let startDate = '';
  let endDate = '';
  if (item.dates) {
    const dateParts = item.dates.split(/\s*[-–—]\s*/);
    if (dateParts.length >= 2) {
      startDate = dateParts[0].trim();
      endDate = dateParts[1].trim();
    } else {
      startDate = item.dates;
    }
  }

  return {
    id: item.id,
    title: item.title,
    company: item.organization || '',
    location: '', // Not in CareerProfileItem
    startDate,
    endDate,
    bullets: bullets.length > 0 ? bullets : [item.description],
  };
}

/**
 * Convert CareerProfileItem (education) to EducationItem
 */
function convertToEducation(item: CareerProfileItem): EducationItem {
  // Parse dates
  let startDate = '';
  let endDate = '';
  if (item.dates) {
    const dateParts = item.dates.split(/\s*[-–—]\s*/);
    if (dateParts.length >= 2) {
      startDate = dateParts[0].trim();
      endDate = dateParts[1].trim();
    } else {
      endDate = item.dates; // Graduation date
    }
  }

  return {
    id: item.id,
    degree: item.title,
    school: item.organization || '',
    location: '', // Not in CareerProfileItem
    startDate,
    endDate,
  };
}

/**
 * Convert CareerProfileItem (project) to ProjectItem
 */
function convertToProject(item: CareerProfileItem): ProjectItem {
  // Parse dates (format: "Jan 2020 - Dec 2022" or "2020 - 2022")
  let startDate = '';
  let endDate = '';
  if (item.dates) {
    const dateParts = item.dates.split(/\s*[-–—]\s*/);
    if (dateParts.length >= 2) {
      startDate = dateParts[0].trim();
      endDate = dateParts[1].trim();
    } else {
      startDate = item.dates;
    }
  }

  return {
    id: item.id,
    title: item.title,
    organization: item.organization,
    description: item.description,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };
}

/**
 * Convert skill items to SkillsSection
 */
function convertToSkills(skillItems: CareerProfileItem[]): SkillsSection | undefined {
  if (skillItems.length === 0) return undefined;

  // Just use flat list for simplicity
  const skills = skillItems.map(item => item.title);
  return { items: skills };
}

/**
 * Convert CareerProfileItem (language) to LanguageItem
 */
function convertToLanguage(item: CareerProfileItem): LanguageItem {
  // Try to extract proficiency from description or title
  const proficiency = item.description || 'Proficient';
  
  return {
    id: item.id,
    language: item.title,
    proficiency,
  };
}

/**
 * Convert CareerProfileItem (certification) to CertificationItem
 */
function convertToCertification(item: CareerProfileItem): CertificationItem {
  return {
    id: item.id,
    name: item.title,
    issuer: item.organization || '',
    date: item.dates,
  };
}

/**
 * Convert CareerProfileItem (volunteer) to VolunteeringItem
 */
function convertToVolunteering(item: CareerProfileItem) {
  // Parse dates
  let startDate = '';
  let endDate = '';
  if (item.dates) {
    const dateParts = item.dates.split(/\s*[-–—]\s*/);
    if (dateParts.length >= 2) {
      startDate = dateParts[0].trim();
      endDate = dateParts[1].trim();
    } else {
      startDate = item.dates;
    }
  }

  return {
    id: item.id,
    role: item.title,
    organization: item.organization || '',
    startDate,
    endDate,
    description: item.description,
  };
}

/**
 * Convert CareerProfileItem (award) to AwardItem
 */
function convertToAward(item: CareerProfileItem): AwardItem {
  return {
    id: item.id,
    name: item.title,
    issuer: item.organization || '',
    date: item.dates,
    description: item.description || '',
  };
}

/**
 * Convert CareerProfileItem (publication) to PublicationItem
 */
function convertToPublication(item: CareerProfileItem): PublicationItem {
  return {
    id: item.id,
    title: item.title,
    publisher: item.organization || '',
    date: item.dates,
    description: item.description || '',
  };
}

// --- localStorage helpers for resume data persistence ---

const CAREER_PROFILE_RESUME_DATA_KEY = 'career_profile_resume_data';
const RESUME_EDITS_DATA_KEY = 'resume_edits_data';

/**
 * Store the career profile as ResumeData in localStorage.
 * Called when user clicks "Generate" in ProfileReview.
 */
export function saveCareerProfileResumeData(profile: CareerProfile): void {
  try {
    const resumeData = careerProfileToResumeData(profile);
    localStorage.setItem(CAREER_PROFILE_RESUME_DATA_KEY, JSON.stringify(resumeData));
  } catch (e) {
    console.error('[saveCareerProfileResumeData] Failed to save:', e);
  }
}

/**
 * Load the stored career profile ResumeData from localStorage.
 * Used by SectionManager to populate sections with actual data.
 */
export function loadCareerProfileResumeData(): ResumeData | null {
  try {
    const stored = localStorage.getItem(CAREER_PROFILE_RESUME_DATA_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ResumeData;
  } catch (e) {
    console.error('[loadCareerProfileResumeData] Failed to load:', e);
    return null;
  }
}

/**
 * Clear stored career profile ResumeData from localStorage.
 */
export function clearCareerProfileResumeData(): void {
  try {
    localStorage.removeItem(CAREER_PROFILE_RESUME_DATA_KEY);
  } catch (e) {
    // ignore
  }
}

/**
 * Save the latest resume edits data to localStorage.
 * Called after each template switch or AI modification to
 * accumulate edits so they survive across template switches.
 */
export function saveResumeEditsData(data: ResumeData): void {
  try {
    localStorage.setItem(RESUME_EDITS_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[saveResumeEditsData] Failed to save:', e);
  }
}

/**
 * Load the latest resume edits data from localStorage.
 * This is the accumulated edits data from prior template switches/edits.
 */
export function loadResumeEditsData(): ResumeData | null {
  try {
    const stored = localStorage.getItem(RESUME_EDITS_DATA_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ResumeData;
  } catch (e) {
    console.error('[loadResumeEditsData] Failed to load:', e);
    return null;
  }
}

/**
 * Clear stored resume edits data from localStorage.
 */
export function clearResumeEditsData(): void {
  try {
    localStorage.removeItem(RESUME_EDITS_DATA_KEY);
  } catch (e) {
    // ignore
  }
}