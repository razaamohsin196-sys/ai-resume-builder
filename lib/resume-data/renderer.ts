/**
 * Template Renderer
 * 
 * Renders structured resume data to HTML templates.
 * Uses DOM manipulation to populate template skeletons with actual data.
 */

import {
  ResumeData,
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
 * Main renderer function: ResumeData + Template → HTML
 */
export function renderToTemplate(data: ResumeData, template: ResumeTemplate): string {
  const doc = parseHtmlToDOM(template.html);
  
  // Render each section
  renderProfile(doc, data);
  renderSummary(doc, data);
  renderExperience(doc, data);
  renderEducation(doc, data);
  renderSkills(doc, data);
  renderProjects(doc, data);
  renderLanguages(doc, data);
  renderCertifications(doc, data);
  renderTraining(doc, data);
  renderVolunteering(doc, data);
  
  return serializeDOMToHtml(doc);
}

/**
 * Render profile/contact information
 */
function renderProfile(doc: Document, data: ResumeData): void {
  const { profile } = data;
  
  // Render name - comprehensive selectors
  const nameSelectors = ['.name', 'h1', '.profile-name', '.header-text', '.header-left h1', '.right-header h1'];
  for (const selector of nameSelectors) {
    const nameEl = doc.querySelector(selector);
    if (nameEl) {
      nameEl.textContent = profile.name;
      break;
    }
  }
  
  // Render title - comprehensive selectors
  if (profile.title) {
    const titleSelectors = ['.job-title', '.title', '.role', '.subtitle', '.header-left .title'];
    for (const selector of titleSelectors) {
      const titleEl = doc.querySelector(selector);
      if (titleEl && !titleEl.classList.contains('section-title') && !titleEl.classList.contains('item-title')) {
        titleEl.textContent = profile.title;
        break;
      }
    }
  }
  
  // Render location - comprehensive selectors
  if (profile.location) {
    const locationSelectors = ['.location', '.address', '.contact-item.contact-location'];
    for (const selector of locationSelectors) {
      const locationEl = doc.querySelector(selector);
      if (locationEl) {
        locationEl.textContent = profile.location;
        break;
      }
    }
  }
  
  // Render contact info - comprehensive selectors
  const contactSelectors = ['.contact-info', '.contact', '.header', '.header-info', '.header-right', '.footer'];
  let contactSection = null;
  for (const selector of contactSelectors) {
    contactSection = doc.querySelector(selector);
    if (contactSection) break;
  }
  
  if (contactSection) {
    // Email
    if (profile.email) {
      let emailRendered = false;
      
      // Try mailto links first
      const emailLinks = contactSection.querySelectorAll('a[href^="mailto:"]');
      if (emailLinks.length > 0) {
        emailLinks[0].setAttribute('href', `mailto:${profile.email}`);
        emailLinks[0].textContent = profile.email;
        // Remove CloudFlare email protection if present
        emailLinks[0].removeAttribute('data-cfemail');
        emailLinks[0].classList.remove('__cf_email__');
        emailRendered = true;
      }
      
      // Try CloudFlare protected emails
      if (!emailRendered) {
        const cfEmails = contactSection.querySelectorAll('.__cf_email__, [data-cfemail]');
        if (cfEmails.length > 0) {
          // Find the closest parent span
          let parent = cfEmails[0].closest('span');
          if (parent) {
            parent.innerHTML = profile.email;
            emailRendered = true;
          }
        }
      }
      
      // Try contact-email class
      if (!emailRendered) {
        const emailEl = contactSection.querySelector('.contact-email, .contact-item.contact-email');
        if (emailEl) {
          emailEl.textContent = profile.email;
          emailRendered = true;
        }
      }
      
      // Fallback: Find any element containing an email pattern and replace it
      if (!emailRendered) {
        const allElements = contactSection.querySelectorAll('span, a, div, p');
        for (const el of Array.from(allElements)) {
          const text = extractText(el);
          if (text && /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
            // Found an existing email, replace it
            el.textContent = profile.email;
            if (el.tagName === 'A' && !el.getAttribute('href')?.startsWith('http')) {
              el.setAttribute('href', `mailto:${profile.email}`);
            }
            emailRendered = true;
            break;
          }
        }
      }
      
      // Last resort: Just add it to the first span in contact section
      if (!emailRendered) {
        const firstSpan = contactSection.querySelector('span');
        if (firstSpan) {
          firstSpan.textContent = profile.email;
        }
      }
    }
    
    // Phone
    if (profile.phone) {
      let phoneRendered = false;
      
      // Try contact-phone class first
      const phoneEl = contactSection.querySelector('.contact-phone, .contact-item.contact-phone');
      if (phoneEl) {
        phoneEl.textContent = profile.phone;
        phoneRendered = true;
      }
      
      // Find phone element (usually has tel: or phone pattern)
      if (!phoneRendered) {
        const allText = contactSection.querySelectorAll('span, a, div, p');
        for (const el of Array.from(allText)) {
          const text = extractText(el);
          // Match various phone patterns
          if (/\d{3}[-.)]\s*\d{3}[-.)]\s*\d{4}/.test(text) || 
              /\(\d{3}\)\s*\d{3}[-\s]\d{4}/.test(text) ||
              /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text) ||
              el.getAttribute('href')?.startsWith('tel:')) {
            el.textContent = profile.phone;
            if (el.tagName === 'A') {
              el.setAttribute('href', `tel:${profile.phone}`);
            }
            phoneRendered = true;
            break;
          }
        }
      }
      
      // Last resort: Add to second span in contact section
      if (!phoneRendered) {
        const spans = contactSection.querySelectorAll('span');
        if (spans.length > 1) {
          spans[1].textContent = profile.phone;
        }
      }
    }
    
    // LinkedIn
    if (profile.linkedin) {
      const linkedinLinks = Array.from(contactSection.querySelectorAll('a')).find(a =>
        a.getAttribute('href')?.includes('linkedin.com')
      );
      if (linkedinLinks) {
        linkedinLinks.setAttribute('href', profile.linkedin);
        linkedinLinks.textContent = profile.linkedin.replace(/^https?:\/\//, '');
      }
    }
    
    // GitHub
    if (profile.github) {
      const githubLinks = Array.from(contactSection.querySelectorAll('a')).find(a =>
        a.getAttribute('href')?.includes('github.com')
      );
      if (githubLinks) {
        githubLinks.setAttribute('href', profile.github);
        githubLinks.textContent = profile.github.replace(/^https?:\/\//, '');
      }
    }
    
    // Website
    if (profile.website) {
      const websiteLinks = Array.from(contactSection.querySelectorAll('a')).find(a => {
        const href = a.getAttribute('href');
        return href && !href.includes('linkedin.com') && !href.includes('github.com') && !href.startsWith('mailto:') && !href.startsWith('tel:');
      });
      if (websiteLinks) {
        websiteLinks.setAttribute('href', profile.website);
        websiteLinks.textContent = profile.website.replace(/^https?:\/\//, '');
      } else {
        // Try contact-web class
        const webEl = contactSection.querySelector('.contact-web, .contact-item.contact-web');
        if (webEl) {
          webEl.textContent = profile.website.replace(/^https?:\/\//, '');
        }
      }
    }
  }
  
  // Render photo - comprehensive selectors
  if (profile.photo) {
    const photoSelectors = ['.profile-pic', '.profile-photo', '.headshot', 'img[class*="profile"]', 'img[class*="photo"]', '.header img'];
    for (const selector of photoSelectors) {
      const img = doc.querySelector(selector);
      if (img) {
        img.setAttribute('src', profile.photo);
        break;
      }
    }
  }
}

/**
 * Render summary section
 */
function renderSummary(doc: Document, data: ResumeData): void {
  if (!data.summary) return;
  
  // Comprehensive summary selectors
  const summarySelectors = ['.summary', '.about', '.profile-summary', '.about-me', '.about-me-text'];
  for (const selector of summarySelectors) {
    const summaryEl = doc.querySelector(selector);
    if (summaryEl) {
      summaryEl.textContent = data.summary.text;
      return;
    }
  }
  
  // Try to find by section title
  const sections = doc.querySelectorAll('.section, section, [class*="section"]');
  for (const section of Array.from(sections)) {
    const titleEl = section.querySelector('.section-title, h2, h3');
    if (titleEl && /summary|about|profile|objective/i.test(extractText(titleEl))) {
      const contentEl = section.querySelector('.summary, .about-me-text, p, [class*="text"]') || section;
      // Don't overwrite the title
      if (contentEl !== titleEl) {
        contentEl.textContent = data.summary.text;
        return;
      }
    }
  }
}

/**
 * Render experience section
 */
function renderExperience(doc: Document, data: ResumeData): void {
  if (!data.experience || data.experience.length === 0) return;
  
  const experienceSection = findSection(doc, ['experience', 'work', 'employment']);
  if (!experienceSection) return;
  
  // Find template item - comprehensive selectors
  const templateItem = experienceSection.querySelector('.experience-item, .job, .timeline-item, .work-item, .two-col-section');
  if (!templateItem) return;
  
  // Clear existing items - comprehensive selectors
  const allItems = experienceSection.querySelectorAll('.experience-item, .job, .timeline-item, .work-item, .two-col-section');
  allItems.forEach(item => item.remove());
  
  // Render each experience item
  for (const exp of data.experience) {
    const itemEl = cloneElement(templateItem);
    renderExperienceItem(itemEl, exp);
    experienceSection.appendChild(itemEl);
  }
}

/**
 * Render a single experience item
 */
function renderExperienceItem(element: Element, data: ExperienceItem): void {
  // Render title - comprehensive selectors
  const titleSelectors = ['.job-title', '.title', '.position', '.role', '.item-title', 'h3', 'h4'];
  for (const selector of titleSelectors) {
    const titleEl = element.querySelector(selector);
    if (titleEl && !titleEl.classList.contains('section-title')) {
      titleEl.textContent = data.title;
      break;
    }
  }
  
  // Render company - comprehensive selectors
  const companySelectors = ['.company', '.company-name', '.organization', '.company-location', '.date-company', '.details', '.item-subtitle'];
  for (const selector of companySelectors) {
    const companyEl = element.querySelector(selector);
    if (companyEl) {
      let text = data.company;
      if (data.location) {
        text += ` — ${data.location}`;
      }
      
      // For date-company fields, prepend date
      if (selector === '.date-company') {
        const dateText = data.endDate ? `${data.startDate} - ${data.endDate}` : data.startDate;
        text = `${dateText}\n${text}`;
      }
      
      companyEl.textContent = text;
      break;
    }
  }
  
  // Render dates - comprehensive selectors
  const dateSelectors = ['.date', '.dates', '.job-date', '.period', '.duration', '.item-date'];
  for (const selector of dateSelectors) {
    const dateEl = element.querySelector(selector);
    if (dateEl && !dateEl.classList.contains('date-company')) {
      const dateText = data.endDate
        ? `${data.startDate} - ${data.endDate}`
        : data.startDate;
      dateEl.textContent = dateText;
      break;
    }
  }
  
  // Render bullets - comprehensive selectors
  const bulletsContainer = element.querySelector('.achievements, ul, .bullets, .item-description, .responsibilities-list');
  if (bulletsContainer && data.bullets.length > 0) {
    // If it's a paragraph element, join bullets with line breaks
    if (bulletsContainer.tagName === 'P') {
      bulletsContainer.textContent = data.bullets.join('. ');
    } else {
      bulletsContainer.innerHTML = '';
      
      const ownerDoc = element.ownerDocument || document;
      for (const bullet of data.bullets) {
        const li = ownerDoc.createElement('li');
        li.textContent = bullet;
        bulletsContainer.appendChild(li);
      }
    }
  }
}

/**
 * Render education section
 */
function renderEducation(doc: Document, data: ResumeData): void {
  if (!data.education || data.education.length === 0) return;
  
  const educationSection = findSection(doc, ['education', 'academic']);
  if (!educationSection) return;
  
  // Comprehensive template item selectors
  const templateItem = educationSection.querySelector('.education-item, .school, .timeline-item, .two-col-section');
  if (!templateItem) return;
  
  // Clear existing items - comprehensive selectors
  const allItems = educationSection.querySelectorAll('.education-item, .school, .timeline-item, .two-col-section');
  allItems.forEach(item => item.remove());
  
  // Render each education item
  for (const edu of data.education) {
    const itemEl = cloneElement(templateItem);
    renderEducationItem(itemEl, edu);
    educationSection.appendChild(itemEl);
  }
}

/**
 * Render a single education item
 */
function renderEducationItem(element: Element, data: EducationItem): void {
  // Render school - comprehensive selectors
  const schoolSelectors = ['.school', '.school-name', '.university', '.institution', '.college', '.item-subtitle', '.details'];
  for (const selector of schoolSelectors) {
    const schoolEl = element.querySelector(selector);
    if (schoolEl) {
      let text = data.school;
      if (data.location && selector !== '.details') {
        text += `, ${data.location}`;
      }
      schoolEl.textContent = text;
      break;
    }
  }
  
  // Render degree - comprehensive selectors
  const degreeSelectors = ['.degree', '.degree-info', '.major', '.field', '.item-title'];
  for (const selector of degreeSelectors) {
    const degreeEl = element.querySelector(selector);
    if (degreeEl && !degreeEl.classList.contains('section-title')) {
      let text = data.degree;
      if (data.location && selector === '.degree-info') {
        text += ` — ${data.location}`;
      }
      degreeEl.textContent = text;
      break;
    }
  }
  
  // Render dates - comprehensive selectors
  const dateSelectors = ['.date', '.education-date', '.graduation', '.item-date'];
  for (const selector of dateSelectors) {
    const dateEl = element.querySelector(selector);
    if (dateEl) {
      const dateText = data.endDate
        ? `${data.startDate || ''} - ${data.endDate}`
        : data.endDate || data.startDate || '';
      dateEl.textContent = dateText;
      break;
    }
  }
  
  // Render GPA if present
  if (data.gpa) {
    const text = element.textContent || '';
    if (text.includes('GPA')) {
      element.textContent = text.replace(/GPA:?\s*[\d.]+/i, `GPA: ${data.gpa}`);
    } else {
      // Try to add GPA to degree info
      const degreeEl = element.querySelector('.degree-info, .degree');
      if (degreeEl) {
        degreeEl.textContent += ` | GPA: ${data.gpa}`;
      }
    }
  }
}

/**
 * Render skills section
 */
function renderSkills(doc: Document, data: ResumeData): void {
  if (!data.skills) return;
  
  const skillsSection = findSection(doc, ['skills', 'expertise', 'competencies']);
  if (!skillsSection) return;
  
  // Handle grouped skills - comprehensive selectors
  if (data.skills.groups) {
    const groupContainer = skillsSection.querySelector('.skills-group, .skill-group, .skills-grid')?.parentElement;
    if (groupContainer) {
      const templateGroup = skillsSection.querySelector('.skills-group, .skill-group, .skills-grid');
      if (templateGroup) {
        // Clear existing groups
        const allGroups = groupContainer.querySelectorAll('.skills-group, .skill-group, .skills-grid > *');
        allGroups.forEach(g => g.remove());
        
        // Render each group
        for (const group of data.skills.groups) {
          const groupEl = cloneElement(templateGroup);
          
          const categoryEl = groupEl.querySelector('.skills-category, .category, strong, b');
          if (categoryEl) {
            categoryEl.textContent = group.category + ':';
          }
          
          const skillsEl = groupEl.querySelector('.skills-list, .skills, .expertise-list');
          if (skillsEl) {
            skillsEl.textContent = group.skills.join(', ');
          }
          
          groupContainer.appendChild(groupEl);
        }
      }
    }
  }
  
  // Handle flat skills list - comprehensive selectors
  if (data.skills.items) {
    const skillsEl = skillsSection.querySelector('.skills-list, .skills, .expertise-list, ul');
    if (skillsEl) {
      if (skillsEl.tagName === 'UL') {
        // If it's a list, create list items
        skillsEl.innerHTML = '';
        const ownerDoc = skillsEl.ownerDocument || document;
        for (const skill of data.skills.items) {
          const li = ownerDoc.createElement('li');
          li.textContent = skill;
          skillsEl.appendChild(li);
        }
      } else {
        skillsEl.textContent = data.skills.items.join(', ');
      }
    }
  }
}

/**
 * Render projects section
 */
function renderProjects(doc: Document, data: ResumeData): void {
  if (!data.projects || data.projects.length === 0) {
    // Remove projects section if no data
    const projectsSection = findSection(doc, ['projects']);
    if (projectsSection) {
      projectsSection.remove();
    }
    return;
  }
  
  const projectsSection = findSection(doc, ['projects']);
  if (!projectsSection) return;
  
  const templateItem = projectsSection.querySelector('.project, .project-item, .experience-item');
  if (!templateItem) return;
  
  // Clear existing items
  const allItems = projectsSection.querySelectorAll('.project, .project-item');
  allItems.forEach(item => item.remove());
  
  // Render each project
  for (const project of data.projects) {
    const itemEl = cloneElement(templateItem);
    renderProjectItem(itemEl, project);
    projectsSection.appendChild(itemEl);
  }
}

/**
 * Render a single project item
 */
function renderProjectItem(element: Element, data: ProjectItem): void {
  // Render title
  const titleSelectors = ['.project-title', '.title', 'h3', 'h4'];
  for (const selector of titleSelectors) {
    const titleEl = element.querySelector(selector);
    if (titleEl) {
      if (data.url) {
        titleEl.innerHTML = `<a href="${data.url}" target="_blank">${data.title}</a>`;
      } else {
        titleEl.textContent = data.title;
      }
      break;
    }
  }
  
  // Render organization
  if (data.organization) {
    const orgSelectors = ['.company', '.organization', '.subtitle'];
    for (const selector of orgSelectors) {
      const orgEl = element.querySelector(selector);
      if (orgEl) {
        orgEl.textContent = data.organization;
        break;
      }
    }
  }
  
  // Render description
  const descEl = element.querySelector('.description, p');
  if (descEl) {
    descEl.textContent = data.description;
  }
}

/**
 * Render languages section
 */
function renderLanguages(doc: Document, data: ResumeData): void {
  if (!data.languages || data.languages.length === 0) return;
  
  // Languages are often in the skills section
  const skillsSection = findSection(doc, ['skills']);
  if (!skillsSection) return;
  
  // Look for languages group
  const groups = skillsSection.querySelectorAll('.skills-group');
  for (const group of Array.from(groups)) {
    const categoryEl = group.querySelector('.skills-category, strong');
    if (categoryEl && /language/i.test(extractText(categoryEl))) {
      const skillsEl = group.querySelector('.skills-list, .skills');
      if (skillsEl) {
        const langText = data.languages.map(l => `${l.language} (${l.proficiency})`).join(', ');
        skillsEl.textContent = langText;
      }
      return;
    }
  }
}

/**
 * Render certifications section
 */
function renderCertifications(doc: Document, data: ResumeData): void {
  if (!data.certifications || data.certifications.length === 0) return;
  
  const certsSection = findSection(doc, ['certifications', 'certificates']);
  if (!certsSection) return;
  
  const listEl = certsSection.querySelector('ul');
  if (listEl) {
    listEl.innerHTML = '';
    
    const ownerDoc = listEl.ownerDocument || doc;
    for (const cert of data.certifications) {
      const li = ownerDoc.createElement('li');
      li.textContent = `${cert.name} - ${cert.issuer}`;
      if (cert.date) {
        li.textContent += ` (${cert.date})`;
      }
      listEl.appendChild(li);
    }
  }
}

/**
 * Render training section
 */
function renderTraining(doc: Document, data: ResumeData): void {
  if (!data.training || data.training.length === 0) return;
  
  const trainingSection = findSection(doc, ['training', 'courses']);
  if (!trainingSection) return;
  
  const listEl = trainingSection.querySelector('ul');
  if (listEl) {
    listEl.innerHTML = '';
    
    const ownerDoc = listEl.ownerDocument || doc;
    for (const training of data.training) {
      const li = ownerDoc.createElement('li');
      li.textContent = `${training.name} - ${training.provider}`;
      listEl.appendChild(li);
    }
  }
}

/**
 * Render volunteering section
 */
function renderVolunteering(doc: Document, data: ResumeData): void {
  if (!data.volunteering || data.volunteering.length === 0) {
    const volunteerSection = findSection(doc, ['volunteering', 'volunteer']);
    if (volunteerSection) {
      volunteerSection.remove();
    }
    return;
  }
  
  const volunteerSection = findSection(doc, ['volunteering', 'volunteer']);
  if (!volunteerSection) return;
  
  const templateItem = volunteerSection.querySelector('.volunteer-item, .experience-item, li');
  if (!templateItem) return;
  
  const parent = templateItem.parentElement;
  if (!parent) return;
  
  // Clear existing items
  parent.innerHTML = '';
  
  // Render each volunteer item
  for (const vol of data.volunteering) {
    const itemEl = cloneElement(templateItem);
    
    const roleEl = itemEl.querySelector('.role, .title, strong') || itemEl;
    roleEl.textContent = `${vol.role} - ${vol.organization}`;
    
    parent.appendChild(itemEl);
  }
}

/**
 * Helper: Find a section by title keywords
 */
function findSection(doc: Document, keywords: string[]): Element | null {
  const sections = doc.querySelectorAll('.section, section');
  
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
