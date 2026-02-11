/**
 * Section Injector
 * 
 * Dynamically injects missing sections into resume templates.
 * Analyzes existing sections to match the template's style.
 */

import {
  ResumeData,
  SectionType,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  LanguageItem,
  CertificationItem,
  TrainingItem,
  VolunteeringItem,
} from './schema';
import { ResumeTemplate } from '../templates/types';
import {
  parseHtmlToDOM,
  serializeDOMToHtml,
  extractText,
  cloneElement,
} from './utils';

/**
 * Inject a missing section into the resume
 */
export function injectSection(
  html: string,
  sectionType: SectionType,
  data: ResumeData,
  template: ResumeTemplate
): { html: string; sectionId: string } {
  const doc = parseHtmlToDOM(html);
  
  // Find where to inject (after last section or before a specific section)
  const insertionPoint = findInsertionPoint(doc, sectionType, template);
  if (!insertionPoint) {
    return { html, sectionId: '' };
  }
  
  // Create the new section element
  const newSection = createSectionElement(doc, sectionType, data, template);
  if (!newSection) {
    return { html, sectionId: '' };
  }
  
  // Add a unique ID to the section for scrolling
  const sectionId = `section-${sectionType}-${Date.now()}`;
  newSection.id = sectionId;
  
  // Insert the new section
  if (insertionPoint.nextSibling) {
    insertionPoint.parentElement?.insertBefore(newSection, insertionPoint.nextSibling);
  } else {
    insertionPoint.parentElement?.appendChild(newSection);
  }
  
  return { html: serializeDOMToHtml(doc), sectionId };
}

/**
 * Find where to insert the new section
 */
function findInsertionPoint(
  doc: Document,
  sectionType: SectionType,
  template: ResumeTemplate
): Element | null {
  const sectionOrder = template.sectionOrder || [
    'profile',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
  ];
  
  const targetIndex = sectionOrder.indexOf(sectionType);
  
  if (targetIndex === -1) {
    // Section type not in template's section order.
    // Find a structurally similar section to insert after.
    const itemBased: SectionType[] = ['experience', 'projects', 'volunteering', 'education'];
    const listBased: SectionType[] = ['skills', 'languages', 'certifications', 'awards', 'publications', 'training'];
    
    const isItemBased = itemBased.includes(sectionType);
    const preferredNeighbors = isItemBased ? itemBased : listBased;
    
    // Try to find the last section of similar structure to insert after
    for (const neighbor of [...preferredNeighbors].reverse()) {
      const section = findExistingSection(doc, neighbor);
      if (section) return section;
    }
    
    // Fallback: insert after last section
    const sections = doc.querySelectorAll('.section, section');
    return sections[sections.length - 1] || doc.body;
  }
  
  // Find the section that should come before this one
  for (let i = targetIndex - 1; i >= 0; i--) {
    const prevSectionType = sectionOrder[i];
    const prevSection = findExistingSection(doc, prevSectionType);
    if (prevSection) {
      return prevSection;
    }
  }
  
  // If no previous section found, insert at beginning
  const firstSection = doc.querySelector('.section, section');
  return firstSection || doc.body;
}

/**
 * Find an existing section by type
 */
function findExistingSection(doc: Document, sectionType: SectionType): Element | null {
  const keywords = getSectionKeywords(sectionType);
  const sections = doc.querySelectorAll('.section, section, [class*="section"]');
  
  for (const section of Array.from(sections)) {
    const titleEl = section.querySelector('.section-title, h2, h3');
    if (titleEl) {
      const titleText = extractText(titleEl).toLowerCase();
      if (keywords.some(kw => titleText.includes(kw))) {
        return section;
      }
    }
  }
  
  return null;
}

/**
 * Get keywords for a section type
 */
function getSectionKeywords(sectionType: SectionType): string[] {
  const keywordMap: Record<SectionType, string[]> = {
    profile: ['contact', 'profile'],
    summary: ['summary', 'about', 'profile', 'objective'],
    experience: ['experience', 'work', 'employment', 'professional'],
    education: ['education', 'academic'],
    skills: ['skill', 'expertise', 'competenc'],
    projects: ['project', 'portfolio'],
    languages: ['language'],
    certifications: ['certification', 'certificate', 'license'],
    training: ['training', 'course'],
    volunteering: ['volunteering', 'volunteer', 'community'],
    awards: ['award', 'honor', 'achievement'],
    publications: ['publication'],
    custom: ['custom'],
  };
  
  return keywordMap[sectionType] || [];
}

/**
 * Determine which existing section is structurally similar to the one being added.
 * Item-based sections (experience, projects, volunteering) share structure.
 * List-based sections (skills, languages, certifications, awards, training) share structure.
 */
function findBestSectionToClone(
  doc: Document,
  sectionType: SectionType
): Element | null {
  // Categorize section types by structure
  const itemBased: SectionType[] = ['experience', 'projects', 'volunteering', 'education'];
  const listBased: SectionType[] = ['skills', 'languages', 'certifications', 'awards', 'publications', 'training'];
  
  const isItemBased = itemBased.includes(sectionType);
  const isListBased = listBased.includes(sectionType);
  
  // Try to find a section of the same structural category
  const preferredTypes = isItemBased ? itemBased : isListBased ? listBased : [];
  
  for (const preferred of preferredTypes) {
    if (preferred === sectionType) continue; // Don't match self
    const section = findExistingSection(doc, preferred);
    if (section) return section;
  }
  
  // Fallback: try any non-summary section (avoid cloning about-me / summary)
  const summaryKeywords = getSectionKeywords('summary');
  const allSections = doc.querySelectorAll('.section, section, [class*="section"]');
  for (const section of Array.from(allSections)) {
    const titleEl = section.querySelector('.section-title, h2, h3');
    if (titleEl) {
      const titleText = extractText(titleEl).toLowerCase();
      // Skip summary / about-me sections
      if (summaryKeywords.some(kw => titleText.includes(kw))) continue;
      return section;
    }
  }
  
  // Last fallback: first section
  return allSections[0] || null;
}

/**
 * Section-specific classes that should NOT be carried over when cloning
 * a section for a different section type (prevents style leakage).
 */
const SECTION_SPECIFIC_CLASSES = [
  'about-me', 'work-experience', 'education', 'skills',
  'certification', 'language', 'volunteering', 'projects',
  'awards', 'publications', 'training', 'summary',
];

/**
 * Create a new section element based on template style
 */
function createSectionElement(
  doc: Document,
  sectionType: SectionType,
  data: ResumeData,
  template: ResumeTemplate
): Element | null {
  // Find a structurally similar existing section to clone
  const templateSection = findBestSectionToClone(doc, sectionType);
  if (!templateSection) {
    return createGenericSection(doc, sectionType, data);
  }
  
  const newSection = cloneElement(templateSection);
  
  // Strip section-specific classes to prevent style leakage
  // (e.g., cloning .about-me for a Projects section would apply summary CSS)
  for (const cls of SECTION_SPECIFIC_CLASSES) {
    (newSection as HTMLElement).classList.remove(cls);
  }
  // Ensure it has a generic 'section' class for baseline styling
  (newSection as HTMLElement).classList.add('section');
  
  // Clear content but keep structure
  const titleEl = newSection.querySelector('.section-title, h2, h3');
  if (titleEl) {
    titleEl.textContent = getSectionTitle(sectionType);
  }
  
  // Clear existing content (items, lists, paragraphs, generic divs)
  const contentElements = newSection.querySelectorAll(
    '.experience-item, .education-item, .skills-group, .job, .volunteer-item, .project-item, li, p, ul, div:not(.section-title):not(.job-header):not([style*="display: flex"])'
  );
  contentElements.forEach(el => el.remove());
  
  // Populate with actual data (no placeholders — empty if no data)
  populateSectionContent(newSection, sectionType, data, doc);
  
  // Add a subtle margin to separate from previous content
  (newSection as HTMLElement).style.marginTop = 'var(--section-spacing, 20px)';
  
  return newSection;
}

/**
 * Create a generic section when no template exists
 */
function createGenericSection(
  doc: Document,
  sectionType: SectionType,
  data: ResumeData
): Element {
  const section = doc.createElement('div');
  section.className = 'section';
  
  const title = doc.createElement('h2');
  title.className = 'section-title';
  title.textContent = getSectionTitle(sectionType);
  section.appendChild(title);
  
  populateSectionContent(section, sectionType, data, doc);
  
  return section;
}

/**
 * Get the display title for a section type
 */
function getSectionTitle(sectionType: SectionType): string {
  const titleMap: Record<SectionType, string> = {
    profile: 'Contact',
    summary: 'Summary',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    languages: 'Languages',
    certifications: 'Certifications',
    training: 'Training',
    volunteering: 'Volunteering',
    awards: 'Awards',
    publications: 'Publications',
    custom: 'Additional Information',
  };
  
  return titleMap[sectionType] || sectionType.charAt(0).toUpperCase() + sectionType.slice(1);
}

/**
 * Populate section with data
 */
function populateSectionContent(
  section: Element,
  sectionType: SectionType,
  data: ResumeData,
  doc: Document
): void {
  const ownerDoc = section.ownerDocument || doc;
  
  switch (sectionType) {
    case 'projects':
      if (data.projects && data.projects.length > 0) {
        for (const project of data.projects) {
          const item = createProjectItem(ownerDoc, project);
          section.appendChild(item);
        }
      }
      // No placeholder — if no data, section stays empty (will be removed by renderer)
      break;
      
    case 'languages':
      if (data.languages && data.languages.length > 0) {
        const list = ownerDoc.createElement('ul');
        for (const lang of data.languages) {
          const li = ownerDoc.createElement('li');
          li.textContent = `${lang.language} (${lang.proficiency})`;
          list.appendChild(li);
        }
        section.appendChild(list);
      }
      // No placeholder — if no data, section stays empty
      break;
      
    case 'certifications':
      if (data.certifications && data.certifications.length > 0) {
        const list = ownerDoc.createElement('ul');
        for (const cert of data.certifications) {
          const li = ownerDoc.createElement('li');
          li.textContent = `${cert.name} - ${cert.issuer}`;
          if (cert.date) {
            li.textContent += ` (${cert.date})`;
          }
          list.appendChild(li);
        }
        section.appendChild(list);
      }
      // No placeholder — if no data, section stays empty
      break;
      
    case 'training':
      if (data.training && data.training.length > 0) {
        const list = ownerDoc.createElement('ul');
        for (const training of data.training) {
          const li = ownerDoc.createElement('li');
          li.textContent = `${training.name} - ${training.provider}`;
          list.appendChild(li);
        }
        section.appendChild(list);
      }
      // No placeholder — if no data, section stays empty
      break;
      
    case 'volunteering':
      if (data.volunteering && data.volunteering.length > 0) {
        for (const vol of data.volunteering) {
          const item = createVolunteerItem(ownerDoc, vol);
          section.appendChild(item);
        }
      }
      // No placeholder — if no data, section stays empty
      break;

    case 'awards':
      if (data.awards && data.awards.length > 0) {
        const awardList = ownerDoc.createElement('ul');
        for (const award of data.awards) {
          const li = ownerDoc.createElement('li');
          let text = award.name;
          if (award.issuer) text += ` - ${award.issuer}`;
          if (award.date) text += ` (${award.date})`;
          li.textContent = text;
          awardList.appendChild(li);
        }
        section.appendChild(awardList);
      }
      break;

    case 'publications':
      if (data.publications && data.publications.length > 0) {
        const pubList = ownerDoc.createElement('ul');
        for (const pub of data.publications) {
          const li = ownerDoc.createElement('li');
          let text = pub.title;
          if (pub.publisher) text += ` - ${pub.publisher}`;
          if (pub.date) text += ` (${pub.date})`;
          li.textContent = text;
          pubList.appendChild(li);
        }
        section.appendChild(pubList);
      }
      break;
      
    case 'custom':
      // No placeholder — user can click to edit the empty section
      break;
      
    default:
      // No placeholder — section stays empty if no data
      break;
  }
}

/**
 * Create a project item element
 */
function createProjectItem(doc: Document, project: ProjectItem): Element {
  const item = doc.createElement('div');
  item.className = 'experience-item project-item';
  
  const title = doc.createElement('h3');
  title.className = 'title';
  if (project.url) {
    const link = doc.createElement('a');
    link.href = project.url;
    link.target = '_blank';
    link.textContent = project.title;
    title.appendChild(link);
  } else {
    title.textContent = project.title;
  }
  item.appendChild(title);
  
  if (project.organization) {
    const org = doc.createElement('div');
    org.className = 'company';
    org.textContent = project.organization;
    item.appendChild(org);
  }
  
  const desc = doc.createElement('p');
  desc.className = 'description';
  desc.textContent = project.description;
  item.appendChild(desc);
  
  return item;
}


/**
 * Create a volunteer item element
 */
function createVolunteerItem(doc: Document, vol: VolunteeringItem): Element {
  const item = doc.createElement('div');
  item.className = 'experience-item volunteer-item';
  
  const title = doc.createElement('h3');
  title.className = 'title';
  title.textContent = vol.role;
  item.appendChild(title);
  
  const org = doc.createElement('div');
  org.className = 'company';
  org.textContent = vol.organization;
  item.appendChild(org);
  
  if (vol.description) {
    const desc = doc.createElement('p');
    desc.className = 'description';
    desc.textContent = vol.description;
    item.appendChild(desc);
  }
  
  return item;
}


/**
 * Check if a section exists in the HTML
 */
export function hasSectionInHtml(html: string, sectionType: SectionType): boolean {
  const doc = parseHtmlToDOM(html);
  return findExistingSection(doc, sectionType) !== null;
}

/**
 * Get list of missing sections
 */
export function getMissingSections(
  html: string,
  data: ResumeData,
  template: ResumeTemplate
): SectionType[] {
  const supportedSections = template.supportedSections || [
    'profile',
    'summary',
    'experience',
    'education',
    'skills',
  ];
  
  const missing: SectionType[] = [];
  
  for (const sectionType of supportedSections) {
    // Check if data exists for this section
    const hasData = hasSectionData(data, sectionType);
    if (!hasData) continue;
    
    // Check if section exists in HTML
    const existsInHtml = hasSectionInHtml(html, sectionType);
    if (!existsInHtml) {
      missing.push(sectionType);
    }
  }
  
  return missing;
}

/**
 * Check if data exists for a section
 */
function hasSectionData(data: ResumeData, sectionType: SectionType): boolean {
  switch (sectionType) {
    case 'profile':
      return !!data.profile.name;
    case 'summary':
      return !!data.summary?.text;
    case 'experience':
      return !!(data.experience && data.experience.length > 0);
    case 'education':
      return !!(data.education && data.education.length > 0);
    case 'skills':
      return !!(data.skills && (data.skills.groups?.length || data.skills.items?.length));
    case 'projects':
      return !!(data.projects && data.projects.length > 0);
    case 'languages':
      return !!(data.languages && data.languages.length > 0);
    case 'certifications':
      return !!(data.certifications && data.certifications.length > 0);
    case 'training':
      return !!(data.training && data.training.length > 0);
    case 'volunteering':
      return !!(data.volunteering && data.volunteering.length > 0);
    case 'awards':
      return !!(data.awards && data.awards.length > 0);
    case 'publications':
      return !!(data.publications && data.publications.length > 0);
    default:
      return false;
  }
}
