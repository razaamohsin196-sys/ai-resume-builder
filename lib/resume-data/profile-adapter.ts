/**
 * Profile Adapter
 * 
 * Converts CareerProfile to ResumeData schema for deterministic rendering.
 * This allows fallback to template rendering when AI generation fails.
 */

import { CareerProfile, CareerProfileItem } from '@/types/career';
import { ResumeData, ExperienceItem, EducationItem, ProjectItem, SkillsSection, LanguageItem, CertificationItem } from './schema';

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

  // Build ResumeData
  const resumeData: ResumeData = {
    profile: {
      name: profile.personal?.name || 'Your Name',
      location: profile.personal?.location,
      email: profile.contact?.email,
      phone: profile.contact?.phone,
      linkedin: profile.contact?.linkedin,
      github: profile.contact?.github,
      website: profile.contact?.website,
      photo: profile.personal?.photos?.[0],
    },
    summary: profile.summary ? { text: profile.summary } : undefined,
    experience: roleItems.map(convertToExperience),
    education: educationItems.map(convertToEducation),
    skills: convertToSkills(skillItems),
    projects: projectItems.length > 0 ? projectItems.map(convertToProject) : undefined,
    languages: languageItems.length > 0 ? languageItems.map(convertToLanguage) : undefined,
    certifications: certItems.length > 0 ? certItems.map(convertToCertification) : undefined,
    volunteering: volunteerItems.length > 0 ? volunteerItems.map(convertToVolunteering) : undefined,
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
    company: item.organization || 'Company',
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
    school: item.organization || 'University',
    location: '', // Not in CareerProfileItem
    startDate,
    endDate,
  };
}

/**
 * Convert CareerProfileItem (project) to ProjectItem
 */
function convertToProject(item: CareerProfileItem): ProjectItem {
  return {
    id: item.id,
    title: item.title,
    organization: item.organization,
    description: item.description,
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
    issuer: item.organization || 'Issuer',
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
    organization: item.organization || 'Organization',
    startDate,
    endDate,
    description: item.description,
  };
}
