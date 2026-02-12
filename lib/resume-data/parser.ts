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
  AwardItem,
  PublicationItem,
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
import { isPlaceholderText, filterPlaceholderBullets } from './placeholder-filter';
import { deduplicateArray, deduplicateText } from './deduplication';

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
    awards: parseAwards(doc),
    publications: parsePublications(doc),
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
  
  // Filter placeholder names
  if (isPlaceholderText(profile.name)) {
    profile.name = '';
  }
  
  // Extract title/role - comprehensive selectors
  const titleSelectors = [
    '.job-title',
    '.title',
    '.role',
    '.header .title',
    '.profile-title',
    '.subtitle',
    '.header-left .title',
    '.header-left h2',  // MinimalistSimplePhoto
    '.header p',  // Template2ColumnMinimal (title is in .header p, after h1 name)
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
  
  // Fallback: Template2ColumnStylishBlocks stores contact in separate sections
  if (!profile.email || !profile.phone) {
    const allSections = doc.querySelectorAll('.section, section, [class*="section"]');
    for (const section of Array.from(allSections)) {
      const titleEl = section.querySelector('.section-title, h2, h3');
      if (!titleEl) continue;
      const titleText = extractText(titleEl).toLowerCase();
      
      if (titleText.includes('phone') && !profile.phone) {
        const p = section.querySelector('p');
        if (p) profile.phone = extractPhone(extractText(p));
      } else if (titleText.includes('email') && !profile.email) {
        const p = section.querySelector('p');
        if (p) profile.email = extractEmail(extractText(p));
      } else if (titleText.includes('website') && !profile.website) {
        const p = section.querySelector('p');
        if (p) {
          const text = extractText(p);
          if (text && !text.includes('@')) {
            profile.website = text.startsWith('http') ? text : `https://${text}`;
          }
        }
      } else if (titleText.includes('address') && !profile.location) {
        const p = section.querySelector('p');
        if (p) profile.location = extractText(p);
      }
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
    '.summary-list',  // ColorfulBlocks
    '.header p:not(.subtitle)',  // ColorfulBlocks (paragraph in header, excluding subtitle)
    '[class*="summary"]',
  ];
  
  // Also try to find by section title
  const sections = doc.querySelectorAll('.section, section, [class*="section"]');
  for (const section of Array.from(sections)) {
    const titleEl = section.querySelector('.section-title, h2, h3, [class*="title"]');
    if (titleEl) {
      const titleText = extractText(titleEl);
      if (/summary|about|profile|objective|personal profile/i.test(titleText)) {
        // For ColorfulBlocks .summary-list (ul with li items)
        const summaryList = section.querySelector('.summary-list, ul');
        if (summaryList && summaryList.tagName === 'UL') {
          const listItems = Array.from(summaryList.querySelectorAll('li'));
          const text = listItems.map(li => extractText(li)).filter(t => t).join(' ');
          if (text && !isPlaceholderText(text)) {
            return { text };
          }
        }
        
        // Standard text extraction
        const contentEl = section.querySelector('.summary, .about-me-text, p, [class*="text"]') || section;
        let text = extractText(contentEl);
        // Remove the title from the text
        text = text.replace(titleText, '').trim();
        if (text && text !== titleText && !isPlaceholderText(text)) {
          return { text };
        }
      }
    }
  }
  
  // Try direct selectors
  const text = extractTextFromSelectors(doc, summarySelectors);
  if (text && !isPlaceholderText(text)) {
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
  const experienceSection = findSection(doc, ['experience', 'work', 'employment', 'professional']);
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
  
  let itemElements = queryAllSelectors(experienceSection, itemSelectors);
  
  // Handle flat experience structure (ElegantProfessionalPhoto)
  // Items are h4.job-title + p.job-details + ul.job-description siblings without wrappers
  if (itemElements.length === 0) {
    const flatTitles = experienceSection.querySelectorAll('h4.job-title, h4');
    if (flatTitles.length > 0) {
      for (const titleEl of Array.from(flatTitles)) {
        const title = extractText(titleEl);
        if (!title) continue;
        
        // Get sibling elements that follow this h4
        let company = '';
        let dateText = '';
        const bullets: string[] = [];
        let sibling = titleEl.nextElementSibling;
        
        while (sibling && sibling.tagName !== 'H4' && sibling.tagName !== 'H3' && sibling.tagName !== 'H2') {
          if (sibling.classList.contains('job-details') || (sibling.tagName === 'P' && !sibling.classList.contains('section-title'))) {
            const text = extractText(sibling);
            // Parse "Company | Date" format
            if (text.includes('|')) {
              const parts = text.split('|').map(p => p.trim());
              company = parts[0];
              dateText = parts.slice(1).join(' ').trim();
            } else {
              company = text;
            }
          } else if (sibling.tagName === 'UL' || sibling.classList.contains('job-description')) {
            const lis = sibling.querySelectorAll('li');
            lis.forEach(li => {
              const t = extractText(li);
              if (t) bullets.push(t);
            });
          }
          sibling = sibling.nextElementSibling;
        }
        
        const { startDate, endDate } = parseDateRange(dateText);
        
        items.push({
          id: generateId(),
          title,
          company: company || 'Unknown',
          startDate,
          endDate,
          bullets: filterPlaceholderBullets(bullets),
        });
      }
      return items.length > 0 ? items : undefined;
    }
  }
  
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
    '.job-details',  // ElegantProfessionalPhoto
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
    '.date-badge',  // ColorfulBlocks
  ];
  
  let title = extractTextFromSelectors(element, titleSelectors);
  
  let company = extractTextFromSelectors(element, companySelectors);
  let dateText = extractTextFromSelectors(element, dateSelectors);
  
  // Handle case where title is NOT found but .details has "Title | Company | Location"
  // (Template2ColumnStylishBlocks)
  if (!title && company && company.includes('|')) {
    const parts = company.split('|').map(p => p.trim());
    title = parts[0]; // First part is title
    company = parts.slice(1).join(' | ').trim(); // Rest is company/location
  }
  
  if (!title) return null;
  
  // Handle BlueSimpleProfile: title from h3 is "Company | Title" combined
  // If the title itself contains a pipe and no separate company element was found
  if (title.includes('|') && !company) {
    const parts = title.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      company = parts[0]; // First part is usually company
      title = parts.slice(1).join(' ').trim(); // Second part is the actual title
    }
  }
  
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
  
  // Fallback: BandwProfessional uses .left-col with plain <p> for company
  if (!company) {
    const leftCol = element.querySelector('.left-col');
    if (leftCol) {
      const paragraphs = leftCol.querySelectorAll('p');
      for (const p of Array.from(paragraphs)) {
        if (!p.classList.contains('date')) {
          company = extractText(p);
          break;
        }
      }
    }
  }
  
  const { startDate, endDate } = parseDateRange(dateText);
  
  // Extract bullets - comprehensive selectors
  const bulletsEl = element.querySelector('.achievements, ul, .bullets, .item-description, .responsibilities-list, .experience-list, .job-description, [class*="description"]') || element;
  const rawBullets = extractBullets(bulletsEl);
  
  // Filter out placeholder bullets and deduplicate
  const filteredBullets = filterPlaceholderBullets(rawBullets);
  const bullets = deduplicateArray(filteredBullets);
  
  // If no valid bullets, try to extract from description paragraph
  if (bullets.length === 0 && bulletsEl) {
    const descParagraph = bulletsEl.querySelector('p');
    if (descParagraph) {
      const text = extractText(descParagraph);
      if (text && !isPlaceholderText(text)) {
        bullets.push(text);
      }
    }
  }
  
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
  // Check if this is MinimalistSimplePhoto template (school in .item-title, degree in .item-subtitle, no .item-header)
  const isMinimalistPhoto = element.querySelector('.item-title') && element.querySelector('.item-subtitle') && 
                            !element.querySelector('.item-header') && element.classList.contains('education-item');
  
  let school = '';
  let degree = '';
  
  if (isMinimalistPhoto) {
    // MinimalistSimplePhoto: REVERSED - school in .item-title, degree in .item-subtitle
    const schoolEl = element.querySelector('.item-title');
    if (schoolEl) {
      school = extractText(schoolEl);
    }
    
    const degreeEl = element.querySelector('.item-subtitle');
    if (degreeEl) {
      degree = extractText(degreeEl);
    }
  } else {
    // Standard templates: degree in .item-title, school in .item-subtitle
    
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
    
    school = extractTextFromSelectors(element, schoolSelectors);
    degree = extractTextFromSelectors(element, degreeSelectors);
    
    // Fallback: BandwProfessional uses .left-col with plain <p> for school
    if (!school) {
      const leftCol = element.querySelector('.left-col');
      if (leftCol) {
        const paragraphs = leftCol.querySelectorAll('p');
        for (const p of Array.from(paragraphs)) {
          if (!p.classList.contains('date')) {
            school = extractText(p);
            break;
          }
        }
      }
    }
    
    // Fallback: Template2ColumnTimeline has plain <p> without class for school
    if (!school) {
      const paragraphs = element.querySelectorAll('p');
      for (const p of Array.from(paragraphs)) {
        if (!p.classList.contains('date') && !p.classList.contains('degree') && !p.classList.contains('completed')) {
          const text = extractText(p);
          if (text && !/^\d{4}/.test(text) && !/expected|graduation|completed/i.test(text)) {
            school = text;
            break;
          }
        }
      }
    }
    
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
  }
  
  if (!school && !degree) return null;
  
  // Filter placeholder data
  if (isPlaceholderText(school)) school = '';
  if (isPlaceholderText(degree)) degree = '';
  
  // If both are placeholders, return null
  if (!school && !degree) return null;
  
  // Comprehensive date selectors
  const dateSelectors = [
    '.date',
    '.education-date',
    '.graduation',
    '.item-date', // ModernProfessional, MinimalistSimplePhoto
    '.date-badge',  // ColorfulBlocks
  ];
  
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
  const skillsSection = findSection(doc, ['skill', 'expertise', 'competenc']);
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
  
  const languagesSection = findSection(doc, ['language']);
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
  
  const certsSection = findSection(doc, ['certification', 'certificate', 'license']);
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
  const seenRoles = new Set<string>();
  
  const volunteerSection = findSection(doc, ['volunteering', 'volunteer', 'community']);
  if (!volunteerSection) return undefined;
  
  const itemSelectors = [
    '.volunteer-item',
    '.experience-item',
    'li',
  ];
  
  const itemElements = queryAllSelectors(volunteerSection, itemSelectors);
  
  for (const itemEl of itemElements) {
    const roleEl = itemEl.querySelector('.role, .title, strong, b, h3, h4') || itemEl;
    let role = extractText(roleEl);
    
    // Clean and deduplicate role text
    if (role) {
      role = deduplicateText(role).trim();
      
      // Check if we've seen this role before (prevent duplicates)
      const roleKey = role.toLowerCase().trim();
      if (seenRoles.has(roleKey)) {
        continue; // Skip duplicate
      }
      seenRoles.add(roleKey);
    }
    
    if (role && !isPlaceholderText(role)) {
      // Extract organization - be more careful to avoid duplication
      let organization = '';
      const orgEl = itemEl.querySelector('.company, .organization, .details');
      if (orgEl) {
        organization = extractText(orgEl);
      } else {
        // Try parsing from full text
        const text = extractText(itemEl);
        // Remove the role from the text to get organization
        const textWithoutRole = text.replace(role, '').trim();
        const parts = textWithoutRole.split(/[-–—]/);
        organization = parts[0]?.trim() || parts[1]?.trim() || 'Organization';
      }
      
      // Deduplicate organization text
      organization = deduplicateText(organization).trim();
      
      // Extract description/bullets if present
      const bulletsEl = itemEl.querySelector('ul, .description, p');
      let description: string | undefined;
      if (bulletsEl) {
        const bullets = extractBullets(bulletsEl);
        const filteredBullets = filterPlaceholderBullets(bullets);
        const deduplicatedBullets = deduplicateArray(filteredBullets);
        if (deduplicatedBullets.length > 0) {
          description = deduplicatedBullets.join(' • ');
        }
      }
      
      items.push({
        id: generateId(),
        role,
        organization: organization || 'Organization',
        description,
      });
    }
  }
  
  // Final deduplication pass - remove items with duplicate role+organization
  const uniqueItems: VolunteeringItem[] = [];
  const seenKeys = new Set<string>();
  
  for (const item of items) {
    const key = `${item.role}|${item.organization}`.toLowerCase().trim();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueItems.push(item);
    }
  }
  
  return uniqueItems.length > 0 ? uniqueItems : undefined;
}

/**
 * Parse awards section
 */
function parseAwards(doc: Document): AwardItem[] | undefined {
  const items: AwardItem[] = [];
  
  const awardsSection = findSection(doc, ['award', 'honor', 'achievement']);
  if (!awardsSection) return undefined;
  
  const itemElements = awardsSection.querySelectorAll('li, .award-item, .experience-item');
  
  for (const itemEl of Array.from(itemElements)) {
    const text = extractText(itemEl);
    if (text && !isPlaceholderText(text)) {
      // Try to parse "Name - Issuer (Date)" format
      const parts = text.split(/[-–—]/);
      const name = parts[0]?.trim();
      const rest = parts.slice(1).join('-').trim();
      
      // Try to extract date from parentheses
      const dateMatch = rest.match(/\(([^)]+)\)/);
      const date = dateMatch ? dateMatch[1] : undefined;
      const issuer = rest.replace(/\([^)]+\)/, '').trim() || undefined;
      
      items.push({
        id: generateId(),
        name: name || text,
        issuer,
        date,
        description: rest || undefined,
      });
    }
  }
  
  return items.length > 0 ? items : undefined;
}

/**
 * Parse publications section
 */
function parsePublications(doc: Document): PublicationItem[] | undefined {
  const items: PublicationItem[] = [];
  
  const pubsSection = findSection(doc, ['publication']);
  if (!pubsSection) return undefined;
  
  const itemElements = pubsSection.querySelectorAll('li, .publication-item, .experience-item');
  
  for (const itemEl of Array.from(itemElements)) {
    const text = extractText(itemEl);
    if (text && !isPlaceholderText(text)) {
      // Try to parse "Title - Publisher (Date)" format
      const parts = text.split(/[-–—]/);
      const title = parts[0]?.trim();
      const rest = parts.slice(1).join('-').trim();
      
      // Try to extract date from parentheses
      const dateMatch = rest.match(/\(([^)]+)\)/);
      const date = dateMatch ? dateMatch[1] : undefined;
      const publisher = rest.replace(/\([^)]+\)/, '').trim() || undefined;
      
      const url = extractUrl(itemEl);
      
      items.push({
        id: generateId(),
        title: title || text,
        publisher,
        date,
        url,
        description: rest || undefined,
      });
    }
  }
  
  return items.length > 0 ? items : undefined;
}

/**
 * Helper: Find a section by title keywords
 * Searches .section, <section>, and [class*="section"] (covers left-section, right-section, etc.)
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
