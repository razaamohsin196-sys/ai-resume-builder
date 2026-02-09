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
    console.warn(`Could not find insertion point for section: ${sectionType}`);
    return { html, sectionId: '' };
  }
  
  // Create the new section element
  const newSection = createSectionElement(doc, sectionType, data, template);
  if (!newSection) {
    console.warn(`Could not create section element for: ${sectionType}`);
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
    // Insert at end
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
    custom: ['custom'],
  };
  
  return keywordMap[sectionType] || [];
}

/**
 * Create a new section element based on template style
 */
function createSectionElement(
  doc: Document,
  sectionType: SectionType,
  data: ResumeData,
  template: ResumeTemplate
): Element | null {
  // Find a similar existing section to use as a template
  const existingSections = doc.querySelectorAll('.section, section');
  if (existingSections.length === 0) {
    return createGenericSection(doc, sectionType, data);
  }
  
  // Clone an existing section structure to match the resume's format
  const templateSection = existingSections[0];
  const newSection = cloneElement(templateSection);
  
  // Preserve all classes and styles from the template
  // This ensures the new section matches the resume's visual style
  
  // Clear content but keep structure
  const titleEl = newSection.querySelector('.section-title, h2, h3');
  if (titleEl) {
    titleEl.textContent = getSectionTitle(sectionType);
  }
  
  // Clear existing content
  const contentElements = newSection.querySelectorAll('.experience-item, .education-item, .skills-group, li, p, ul, div:not(.section-title):not(.job-header)');
  contentElements.forEach(el => el.remove());
  
  // Populate with new data (including placeholders)
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
      } else {
        // Add placeholder project
        const item = createPlaceholderProjectItem(ownerDoc);
        section.appendChild(item);
      }
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
      } else {
        // Add placeholder
        const list = ownerDoc.createElement('ul');
        const li = ownerDoc.createElement('li');
        li.textContent = 'English (Native)';
        li.setAttribute('contenteditable', 'true');
        li.style.color = '#999';
        list.appendChild(li);
        section.appendChild(list);
      }
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
      } else {
        // Add placeholder
        const list = ownerDoc.createElement('ul');
        const li = ownerDoc.createElement('li');
        li.textContent = 'Certification Name - Issuing Organization (Year)';
        li.setAttribute('contenteditable', 'true');
        li.style.color = '#999';
        list.appendChild(li);
        section.appendChild(list);
      }
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
      } else {
        // Add placeholder
        const list = ownerDoc.createElement('ul');
        const li = ownerDoc.createElement('li');
        li.textContent = 'Course Name - Provider';
        li.setAttribute('contenteditable', 'true');
        li.style.color = '#999';
        list.appendChild(li);
        section.appendChild(list);
      }
      break;
      
    case 'volunteering':
      if (data.volunteering && data.volunteering.length > 0) {
        for (const vol of data.volunteering) {
          const item = createVolunteerItem(ownerDoc, vol);
          section.appendChild(item);
        }
      } else {
        // Add placeholder
        const item = createPlaceholderVolunteerItem(ownerDoc);
        section.appendChild(item);
      }
      break;
      
    case 'custom':
      // Add placeholder for custom section
      const customItem = ownerDoc.createElement('div');
      customItem.className = 'experience-item';
      customItem.setAttribute('contenteditable', 'true');
      customItem.style.color = '#999';
      customItem.innerHTML = '<p>Add your custom content here. Click to edit.</p>';
      section.appendChild(customItem);
      break;
      
    default:
      // For other sections, add a placeholder
      const p = ownerDoc.createElement('p');
      p.textContent = 'Add content here. Click to edit.';
      p.setAttribute('contenteditable', 'true');
      p.style.color = '#999';
      section.appendChild(p);
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
 * Create a placeholder project item
 */
function createPlaceholderProjectItem(doc: Document): Element {
  const item = doc.createElement('div');
  item.className = 'experience-item project-item';
  
  const header = doc.createElement('div');
  header.className = 'job-header';
  
  const title = doc.createElement('div');
  title.className = 'job-title';
  title.textContent = 'Project Name';
  title.setAttribute('contenteditable', 'true');
  title.style.color = '#999';
  header.appendChild(title);
  
  const date = doc.createElement('div');
  date.className = 'job-date';
  date.textContent = 'Month Year - Month Year';
  date.setAttribute('contenteditable', 'true');
  date.style.color = '#999';
  header.appendChild(date);
  
  item.appendChild(header);
  
  const org = doc.createElement('div');
  org.className = 'company-location';
  org.textContent = 'Organization or Personal Project';
  org.setAttribute('contenteditable', 'true');
  org.style.color = '#999';
  item.appendChild(org);
  
  const list = doc.createElement('ul');
  list.className = 'achievements';
  const li = doc.createElement('li');
  li.textContent = 'Describe your project, technologies used, and key achievements here';
  li.setAttribute('contenteditable', 'true');
  li.style.color = '#999';
  list.appendChild(li);
  item.appendChild(list);
  
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
 * Create a placeholder volunteer item
 */
function createPlaceholderVolunteerItem(doc: Document): Element {
  const item = doc.createElement('div');
  item.className = 'experience-item volunteer-item';
  
  const header = doc.createElement('div');
  header.className = 'job-header';
  
  const title = doc.createElement('div');
  title.className = 'job-title';
  title.textContent = 'Volunteer Role';
  title.setAttribute('contenteditable', 'true');
  title.style.color = '#999';
  header.appendChild(title);
  
  const date = doc.createElement('div');
  date.className = 'job-date';
  date.textContent = 'Month Year - Present';
  date.setAttribute('contenteditable', 'true');
  date.style.color = '#999';
  header.appendChild(date);
  
  item.appendChild(header);
  
  const org = doc.createElement('div');
  org.className = 'company-location';
  org.textContent = 'Organization Name';
  org.setAttribute('contenteditable', 'true');
  org.style.color = '#999';
  item.appendChild(org);
  
  const list = doc.createElement('ul');
  list.className = 'achievements';
  const li = doc.createElement('li');
  li.textContent = 'Describe your volunteer work, responsibilities, and impact here';
  li.setAttribute('contenteditable', 'true');
  li.style.color = '#999';
  list.appendChild(li);
  item.appendChild(list);
  
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
    default:
      return false;
  }
}
