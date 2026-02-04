/**
 * HTML Resume Parser
 * 
 * Extracts structured resume data from HTML templates.
 * Uses multi-strategy selector matching to handle different template structures.
 */

import {
  ResumeData,
  ProfileSection,
  SummarySection,
  ExperienceItem,
  EducationItem,
  SkillsSection,
  SkillGroup,
  ProjectItem,
  LanguageItem,
  CertificationItem,
  TrainingItem,
  VolunteeringItem,
} from './schema';
import {
  parseHtmlToDOM,
  extractText,
  extractTextFromSelectors,
  queryAllSelectors,
  extractUrl,
  extractEmail,
  extractPhone,
  parseDateRange,
  extractBullets,
  generateId,
  detectSectionType,
} from './utils';

/**
 * Main parser function: HTML → ResumeData
 */
export function parseResumeHtml(html: string): ResumeData {
  const doc = parseHtmlToDOM(html);
  
  return {
    profile: parseProfile(doc),
    summary: parseSummary(doc),
    experience: parseExperience(doc),
    education: parseEducation(doc),
    skills: parseSkills(doc),
    projects: parseProjects(doc),
    languages: parseLanguages(doc),
    certifications: parseCertifications(doc),
    training: parseTraining(doc),
    volunteering: parseVolunteering(doc),
  };
}

/**
 * Parse profile/contact information
 */
function parseProfile(doc: Document): ProfileSection {
  const profile: ProfileSection = {
    name: '',
  };
  
  // Extract name - comprehensive selectors
  const nameSelectors = [
    '.name',
    '.header .name',
    'h1',
    '.profile-name',
    '.header-text',
    '.header-left h1',
    '.right-header h1',
    '[class*="name"]',
  ];
  profile.name = extractTextFromSelectors(doc, nameSelectors) || 'Unknown';
  
  // Extract title/role - comprehensive selectors
  const titleSelectors = [
    '.job-title',
    '.title',
    '.role',
    '.header .title',
    '.profile-title',
    '.subtitle',
    '.header-left .title',
  ];
  profile.title = extractTextFromSelectors(doc, titleSelectors);
  
  // Extract location - comprehensive selectors
  const locationSelectors = [
    '.location',
    '.address',
    '.contact-item.contact-location',
    '[class*="location"]',
  ];
  const locationText = extractTextFromSelectors(doc, locationSelectors);
  if (locationText) {
    profile.location = locationText;
  }
  
  // Extract contact info - comprehensive selectors
  const contactSelectors = [
    '.contact-info',
    '.contact',
    '.header',
    '.profile',
    '.header-info',
    '.header-right',
    '.footer',
  ];
  
  for (const selector of contactSelectors) {
    const contactSection = doc.querySelector(selector);
    if (contactSection) {
      // Extract email
      const emailLinks = contactSection.querySelectorAll('a[href^="mailto:"]');
      if (emailLinks.length > 0) {
        const href = emailLinks[0].getAttribute('href');
        if (href) {
          profile.email = extractEmail(href);
        }
      }
      
      // Try to find email in text
      if (!profile.email) {
        const text = extractText(contactSection);
        profile.email = extractEmail(text);
      }
      
      // Also check for contact-email class
      if (!profile.email) {
        const emailEl = contactSection.querySelector('.contact-email, .contact-item.contact-email');
        if (emailEl) {
          profile.email = extractEmail(extractText(emailEl));
        }
      }
      
      // Extract phone
      const phoneText = extractText(contactSection);
      profile.phone = extractPhone(phoneText);
      
      // Also check for contact-phone class
      if (!profile.phone) {
        const phoneEl = contactSection.querySelector('.contact-phone, .contact-item.contact-phone');
        if (phoneEl) {
          profile.phone = extractPhone(extractText(phoneEl));
        }
      }
      
      // Extract LinkedIn
      const linkedinLinks = Array.from(contactSection.querySelectorAll('a')).find(a => 
        a.getAttribute('href')?.includes('linkedin.com')
      );
      if (linkedinLinks) {
        profile.linkedin = linkedinLinks.getAttribute('href') || undefined;
      }
      
      // Extract GitHub
      const githubLinks = Array.from(contactSection.querySelectorAll('a')).find(a => 
        a.getAttribute('href')?.includes('github.com')
      );
      if (githubLinks) {
        profile.github = githubLinks.getAttribute('href') || undefined;
      }
      
      // Extract website
      const websiteLinks = Array.from(contactSection.querySelectorAll('a')).find(a => {
        const href = a.getAttribute('href');
        return href && !href.includes('linkedin.com') && !href.includes('github.com') && !href.startsWith('mailto:') && !href.startsWith('tel:');
      });
      if (websiteLinks) {
        profile.website = websiteLinks.getAttribute('href') || undefined;
      }
      
      // Also check for contact-web class
      if (!profile.website) {
        const webEl = contactSection.querySelector('.contact-web, .contact-item.contact-web');
        if (webEl) {
          const text = extractText(webEl);
          if (text && !text.includes('@')) {
            profile.website = text.startsWith('http') ? text : `https://${text}`;
          }
        }
      }
      
      if (profile.email || profile.phone) break;
    }
  }
  
  // Extract photo - comprehensive selectors
  const photoSelectors = [
    '.profile-pic',
    '.profile-photo',
    '.headshot',
    'img[class*="profile"]',
    'img[class*="photo"]',
    '.header img',
  ];
  
  for (const selector of photoSelectors) {
    const img = doc.querySelector(selector);
    if (img) {
      profile.photo = img.getAttribute('src') || undefined;
      break;
    }
  }
  
  return profile;
}

/**
 * Parse summary/about section
 */
function parseSummary(doc: Document): SummarySection | undefined {
  // Comprehensive summary selectors
  const summarySelectors = [
    '.summary',
    '.about',
    '.profile-summary',
    '.about-me',
    '.about-me-text', // ModernProfessional
    '[class*="summary"]',
  ];
  
  // Also try to find by section title
  const sections = doc.querySelectorAll('.section, section, [class*="section"]');
  for (const section of Array.from(sections)) {
    const titleEl = section.querySelector('.section-title, h2, h3, [class*="title"]');
    if (titleEl) {
      const titleText = extractText(titleEl);
      if (/summary|about|profile|objective/i.test(titleText)) {
        const contentEl = section.querySelector('.summary, .about-me-text, p, [class*="text"]') || section;
        let text = extractText(contentEl);
        // Remove the title from the text
        text = text.replace(titleText, '').trim();
        if (text && text !== titleText) {
          return { text };
        }
      }
    }
  }
  
  // Try direct selectors
  const text = extractTextFromSelectors(doc, summarySelectors);
  if (text) {
    return { text };
  }
  
  return undefined;
}

/**
 * Parse experience section
 */
function parseExperience(doc: Document): ExperienceItem[] | undefined {
  const items: ExperienceItem[] = [];
  
  // Find experience section
  const experienceSection = findSection(doc, ['experience', 'work', 'employment']);
  if (!experienceSection) return undefined;
  
  // Find experience items - comprehensive selector list covering all templates
  const itemSelectors = [
    '.experience-item',
    '.job',
    '.work-item',
    '.timeline-item',
    '.role',
    '.position',
    '.two-col-section', // BandwProfessional
  ];
  
  const itemElements = queryAllSelectors(experienceSection, itemSelectors);
  
  for (const itemEl of itemElements) {
    const item = parseExperienceItem(itemEl);
    if (item) {
      items.push(item);
    }
  }
  
  return items.length > 0 ? items : undefined;
}

/**
 * Parse a single experience item
 */
function parseExperienceItem(element: Element): ExperienceItem | null {
  // Comprehensive title selectors covering all templates
  const titleSelectors = [
    '.job-title',
    '.title',
    '.position',
    '.role',
    '.item-title',
    'h3',
    'h4',
  ];
  
  // Comprehensive company selectors covering all templates
  const companySelectors = [
    '.company',
    '.company-name',
    '.organization',
    '.employer',
    '.company-location',
    '.date-company', // Template2ColumnTimeline
    '.details', // Template2ColumnStylishBlocks, OliveGreenModern
    '.item-subtitle', // ModernProfessional
  ];
  
  // Comprehensive date selectors covering all templates
  const dateSelectors = [
    '.date',
    '.dates',
    '.job-date',
    '.period',
    '.duration',
    '.item-date',
    '.date-company', // Also contains date in some templates
  ];
  
  const title = extractTextFromSelectors(element, titleSelectors);
  if (!title) return null;
  
  let company = extractTextFromSelectors(element, companySelectors);
  let dateText = extractTextFromSelectors(element, dateSelectors);
  
  // Handle combined date-company fields (e.g., "2022 - 2025<br>Company Name")
  if (company && company.includes('\n')) {
    const parts = company.split('\n');
    if (parts.length >= 2) {
      // First part might be date, second part company
      if (/\d{4}/.test(parts[0])) {
        dateText = parts[0].trim();
        company = parts.slice(1).join(' ').trim();
      }
    }
  }
  
  // Handle pipe-separated details (e.g., "Title | Company | Location")
  if (company && company.includes('|')) {
    const parts = company.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      company = parts[0]; // First part is usually company
    }
  }
  
  // Sometimes company and location are together with em dash
  if (company && company.includes('—')) {
    const parts = company.split('—');
    company = parts[0].trim();
  }
  
  const { startDate, endDate } = parseDateRange(dateText);
  
  // Extract bullets - comprehensive selectors
  const bulletsEl = element.querySelector('.achievements, ul, .bullets, .item-description, .responsibilities-list, [class*="description"]') || element;
  const bullets = extractBullets(bulletsEl);
  
  return {
    id: generateId(),
    title,
    company: company || 'Unknown',
    startDate,
    endDate,
    bullets,
  };
}

/**
 * Parse education section
 */
function parseEducation(doc: Document): EducationItem[] | undefined {
  const items: EducationItem[] = [];
  
  const educationSection = findSection(doc, ['education', 'academic']);
  if (!educationSection) return undefined;
  
  // Comprehensive education item selectors
  const itemSelectors = [
    '.education-item',
    '.school',
    '.degree',
    '.academic-item',
    '.timeline-item', // ModernProfessional, Template2ColumnTimeline
    '.two-col-section', // BandwProfessional
  ];
  
  const itemElements = queryAllSelectors(educationSection, itemSelectors);
  
  for (const itemEl of itemElements) {
    const item = parseEducationItem(itemEl);
    if (item) {
      items.push(item);
    }
  }
  
  return items.length > 0 ? items : undefined;
}

/**
 * Parse a single education item
 */
function parseEducationItem(element: Element): EducationItem | null {
  // Comprehensive school selectors
  const schoolSelectors = [
    '.school',
    '.school-name',
    '.university',
    '.institution',
    '.college', // Template2ColumnStylishBlocks
    '.item-subtitle', // ModernProfessional
    '.details', // OliveGreenModern
  ];
  
  // Comprehensive degree selectors
  const degreeSelectors = [
    '.degree',
    '.degree-info',
    '.major',
    '.field',
    '.item-title', // ModernProfessional
  ];
  
  // Comprehensive date selectors
  const dateSelectors = [
    '.date',
    '.education-date',
    '.graduation',
    '.item-date', // ModernProfessional
  ];
  
  let school = extractTextFromSelectors(element, schoolSelectors);
  let degree = extractTextFromSelectors(element, degreeSelectors);
  
  // Handle combined school/location fields (e.g., "University, City A")
  if (school && school.includes(',')) {
    const parts = school.split(',');
    school = parts[0].trim();
  }
  
  // Handle pipe-separated fields
  if (school && school.includes('|')) {
    const parts = school.split('|').map(p => p.trim());
    school = parts[0];
  }
  
  if (!school && !degree) return null;
  
  const dateText = extractTextFromSelectors(element, dateSelectors);
  const { startDate, endDate } = parseDateRange(dateText);
  
  // Extract GPA if present
  const text = extractText(element);
  const gpaMatch = text.match(/GPA:?\s*([\d.]+)/i);
  const gpa = gpaMatch ? gpaMatch[1] : undefined;
  
  return {
    id: generateId(),
    degree: degree || 'Degree',
    school: school || 'School',
    startDate,
    endDate,
    gpa,
  };
}

/**
 * Parse skills section
 */
function parseSkills(doc: Document): SkillsSection | undefined {
  const skillsSection = findSection(doc, ['skills', 'expertise', 'competencies']);
  if (!skillsSection) return undefined;
  
  const skills: SkillsSection = {};
  
  // Try to find grouped skills - comprehensive selectors
  const groupElements = skillsSection.querySelectorAll('.skills-group, .skill-group, [class*="skill-category"], .skills-grid');
  
  if (groupElements.length > 0) {
    const groups: SkillGroup[] = [];
    
    for (const groupEl of Array.from(groupElements)) {
      const categoryEl = groupEl.querySelector('.skills-category, .category, strong, b');
      const category = categoryEl ? extractText(categoryEl) : 'Skills';
      
      // Comprehensive skills list selectors
      const skillsEl = groupEl.querySelector('.skills-list, .skills, .expertise-list') || groupEl;
      const skillsText = extractText(skillsEl).replace(category, '').trim();
      
      // Split by common delimiters
      const skillsList = skillsText.split(/[,;|•·]/).map(s => s.trim()).filter(s => s);
      
      if (skillsList.length > 0) {
        groups.push({ category, skills: skillsList });
      }
    }
    
    if (groups.length > 0) {
      skills.groups = groups;
    }
  }
  
  // Try flat list with comprehensive selectors
  if (!skills.groups) {
    const listSelectors = ['.skills-list', '.skills', '.expertise-list', 'ul'];
    let skillsText = '';
    
    for (const selector of listSelectors) {
      const listEl = skillsSection.querySelector(selector);
      if (listEl) {
        skillsText = extractText(listEl);
        break;
      }
    }
    
    if (!skillsText) {
      skillsText = extractText(skillsSection);
    }
    
    const skillsList = skillsText.split(/[,;|•·]/).map(s => s.trim()).filter(s => s && !isSectionTitle(s));
    
    if (skillsList.length > 0) {
      skills.items = skillsList;
    }
  }
  
  return (skills.groups || skills.items) ? skills : undefined;
}

/**
 * Parse projects section
 */
function parseProjects(doc: Document): ProjectItem[] | undefined {
  const items: ProjectItem[] = [];
  
  const projectsSection = findSection(doc, ['projects', 'portfolio']);
  if (!projectsSection) return undefined;
  
  const itemSelectors = [
    '.project',
    '.project-item',
    '.portfolio-item',
    '.experience-item', // Some templates reuse this
  ];
  
  const itemElements = queryAllSelectors(projectsSection, itemSelectors);
  
  for (const itemEl of itemElements) {
    const item = parseProjectItem(itemEl);
    if (item) {
      items.push(item);
    }
  }
  
  return items.length > 0 ? items : undefined;
}

/**
 * Parse a single project item
 */
function parseProjectItem(element: Element): ProjectItem | null {
  const titleSelectors = [
    '.project-title',
    '.title',
    'h3',
    'h4',
  ];
  
  const title = extractTextFromSelectors(element, titleSelectors);
  if (!title) return null;
  
  const descriptionEl = element.querySelector('.description, p, [class*="description"]') || element;
  const description = extractText(descriptionEl);
  
  const url = extractUrl(element);
  
  return {
    id: generateId(),
    title,
    description,
    url,
  };
}

/**
 * Parse languages section
 */
function parseLanguages(doc: Document): LanguageItem[] | undefined {
  const items: LanguageItem[] = [];
  
  const languagesSection = findSection(doc, ['languages', 'language']);
  if (!languagesSection) return undefined;
  
  const text = extractText(languagesSection);
  
  // Try to parse "Language (Proficiency)" format
  const matches = text.matchAll(/([A-Za-z\s]+)\s*\(([^)]+)\)/g);
  for (const match of matches) {
    items.push({
      id: generateId(),
      language: match[1].trim(),
      proficiency: match[2].trim(),
    });
  }
  
  // If no matches, try comma-separated
  if (items.length === 0) {
    const langs = text.split(/[,;|]/).map(s => s.trim()).filter(s => s);
    for (const lang of langs) {
      items.push({
        id: generateId(),
        language: lang,
        proficiency: 'Proficient',
      });
    }
  }
  
  return items.length > 0 ? items : undefined;
}

/**
 * Parse certifications section
 */
function parseCertifications(doc: Document): CertificationItem[] | undefined {
  const items: CertificationItem[] = [];
  
  const certsSection = findSection(doc, ['certifications', 'certificates', 'licenses']);
  if (!certsSection) return undefined;
  
  const itemElements = certsSection.querySelectorAll('li, .cert-item, .certification');
  
  for (const itemEl of Array.from(itemElements)) {
    const text = extractText(itemEl);
    if (text) {
      // Try to parse "Name - Issuer (Date)" format
      const parts = text.split(/[-–—]/);
      const name = parts[0]?.trim();
      const issuer = parts[1]?.trim() || 'Unknown';
      
      items.push({
        id: generateId(),
        name: name || text,
        issuer,
      });
    }
  }
  
  return items.length > 0 ? items : undefined;
}

/**
 * Parse training/courses section
 */
function parseTraining(doc: Document): TrainingItem[] | undefined {
  const items: TrainingItem[] = [];
  
  const trainingSection = findSection(doc, ['training', 'courses', 'course']);
  if (!trainingSection) return undefined;
  
  const itemElements = trainingSection.querySelectorAll('li, .training-item, .course');
  
  for (const itemEl of Array.from(itemElements)) {
    const text = extractText(itemEl);
    if (text) {
      const parts = text.split(/[-–—]/);
      const name = parts[0]?.trim();
      const provider = parts[1]?.trim() || 'Unknown';
      
      items.push({
        id: generateId(),
        name: name || text,
        provider,
      });
    }
  }
  
  return items.length > 0 ? items : undefined;
}

/**
 * Parse volunteering section
 */
function parseVolunteering(doc: Document): VolunteeringItem[] | undefined {
  const items: VolunteeringItem[] = [];
  
  const volunteerSection = findSection(doc, ['volunteering', 'volunteer', 'community']);
  if (!volunteerSection) return undefined;
  
  const itemSelectors = [
    '.volunteer-item',
    '.experience-item',
    'li',
  ];
  
  const itemElements = queryAllSelectors(volunteerSection, itemSelectors);
  
  for (const itemEl of itemElements) {
    const roleEl = itemEl.querySelector('.role, .title, strong, b') || itemEl;
    const role = extractText(roleEl);
    
    if (role) {
      const text = extractText(itemEl);
      const parts = text.split(/[-–—]/);
      const organization = parts[1]?.trim() || 'Organization';
      
      items.push({
        id: generateId(),
        role,
        organization,
      });
    }
  }
  
  return items.length > 0 ? items : undefined;
}

/**
 * Helper: Find a section by title keywords
 */
function findSection(doc: Document, keywords: string[]): Element | null {
  const sections = doc.querySelectorAll('.section, section, [class*="section"]');
  
  for (const section of Array.from(sections)) {
    const titleEl = section.querySelector('.section-title, h2, h3, [class*="title"]');
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
 * Helper: Check if text is a section title
 */
function isSectionTitle(text: string): boolean {
  const titles = ['experience', 'education', 'skills', 'projects', 'summary', 'languages', 'certifications'];
  const normalized = text.toLowerCase();
  return titles.some(t => normalized.includes(t));
}
