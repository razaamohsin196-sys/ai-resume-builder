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
  AwardItem,
  PublicationItem,
} from './schema';
import { ResumeTemplate } from '../templates/types';
import {
  parseHtmlToDOM,
  serializeDOMToHtml,
  extractText,
  cloneElement,
} from './utils';
import { isPlaceholderText } from './placeholder-filter';

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
  renderAwards(doc, data);
  renderPublications(doc, data);
  
  // Remove sections that have no user data (avoids blank placeholder sections)
  removeEmptySections(doc, data);
  
  // Strip any remaining placeholder / Lorem ipsum content
  stripRemainingPlaceholders(doc, data);
  
  // Fix CSS for continuous content flow (no blank pages or clipping)
  fixContinuousLayoutCSS(doc, template);
  
  // Embed ResumeData as JSON in the HTML for editor access
  embedResumeData(doc, data);
  
  let html = serializeDOMToHtml(doc);
  
  // Final string-level safety net: strip any remaining placeholder text patterns
  // that the DOM-based approach might have missed
  html = stripPlaceholderStrings(html);
  
  return html;
}

/**
 * Render profile/contact information
 */
function renderProfile(doc: Document, data: ResumeData): void {
  const { profile } = data;
  
  // Render name - comprehensive selectors - replace ALL matches to ensure no placeholder remains
  const nameSelectors = [
    '.name',
    'h1',
    '.profile-name',
    '.header-text',
    '.header-left h1',
    '.right-header h1',
    '.name-title h1',  // ModernProfessional
    '.name-title .name',  // ModernProfessional variant
  ];
  let nameRendered = false;
  for (const selector of nameSelectors) {
    const nameElements = doc.querySelectorAll(selector);
    if (nameElements.length > 0) {
      nameElements.forEach(nameEl => {
        // Only replace if it's not a section title or other non-name element
        if (!nameEl.classList.contains('section-title') && 
            !nameEl.classList.contains('company-name') &&
            !nameEl.classList.contains('school-name') &&
            !nameEl.classList.contains('reference-name')) {
          nameEl.textContent = profile.name;
          nameRendered = true;
        }
      });
      if (nameRendered) break;
    }
  }
  
  
  
  // Render title - comprehensive selectors
  if (profile.title) {
    const titleSelectors = [
      '.job-title',
      '.title',
      '.role',
      '.subtitle',
      '.header-left .title',
      '.header-left h2',  // MinimalistSimplePhoto
      'h2:not(.section-title)',  // MinimalistSimplePhoto h2
      '.header p',  // Template2ColumnMinimal (title is in .header p, after h1 name)
    ];
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
  let contactSection: Element | null = null;
  for (const selector of contactSelectors) {
    contactSection = doc.querySelector(selector);
    if (contactSection) break;
  }
  
  // Fallback: find section with "Contact" title (ElegantProfessionalPhoto, BlueSimpleProfile)
  if (!contactSection) {
    const sections = doc.querySelectorAll('.section, section, [class*="section"]');
    for (const section of Array.from(sections)) {
      const titleEl = section.querySelector('.section-title, h2, h3');
      if (titleEl && /contact/i.test(extractText(titleEl))) {
        contactSection = section;
        break;
      }
    }
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
      let linkedinRendered = false;
      const linkedinLinks = Array.from(contactSection.querySelectorAll('a')).find(a =>
        a.getAttribute('href')?.includes('linkedin.com')
      );
      if (linkedinLinks) {
        linkedinLinks.setAttribute('href', profile.linkedin);
        linkedinLinks.textContent = profile.linkedin.replace(/^https?:\/\//, '');
        linkedinRendered = true;
      }
      
      
    }
    
    // GitHub
    if (profile.github) {
      let githubRendered = false;
      const githubLinks = Array.from(contactSection.querySelectorAll('a')).find(a =>
        a.getAttribute('href')?.includes('github.com')
      );
      if (githubLinks) {
        githubLinks.setAttribute('href', profile.github);
        githubLinks.textContent = profile.github.replace(/^https?:\/\//, '');
        githubRendered = true;
      }
      
      
    }
    
    // Website
    if (profile.website) {
      let websiteRendered = false;
      const websiteLinks = Array.from(contactSection.querySelectorAll('a')).find(a => {
        const href = a.getAttribute('href');
        return href && !href.includes('linkedin.com') && !href.includes('github.com') && !href.startsWith('mailto:') && !href.startsWith('tel:');
      });
      if (websiteLinks) {
        websiteLinks.setAttribute('href', profile.website);
        websiteLinks.textContent = profile.website.replace(/^https?:\/\//, '');
        websiteRendered = true;
      } else {
        // Try contact-web class
        const webEl = contactSection.querySelector('.contact-web, .contact-item.contact-web');
        if (webEl) {
          webEl.textContent = profile.website.replace(/^https?:\/\//, '');
          websiteRendered = true;
        }
      }
      
      
    }
  }
  
  // Fallback: Template2ColumnStylishBlocks and similar templates store contact in separate sections
  // with h2 titles like "PHONE", "EMAIL", "WEBSITE", "ADDRESS"
  if (!contactSection) {
    const allSections = doc.querySelectorAll('.section, section, [class*="section"]');
    for (const section of Array.from(allSections)) {
      const titleEl = section.querySelector('.section-title, h2, h3');
      if (!titleEl) continue;
      const titleText = extractText(titleEl).toLowerCase();
      
      if (titleText.includes('phone') && profile.phone) {
        const p = section.querySelector('p');
        if (p) p.textContent = profile.phone;
      } else if (titleText.includes('email') && profile.email) {
        const p = section.querySelector('p');
        if (p) p.textContent = profile.email;
      } else if (titleText.includes('website') && profile.website) {
        const p = section.querySelector('p');
        if (p) p.textContent = profile.website.replace(/^https?:\/\//, '');
      } else if (titleText.includes('address') && profile.location) {
        const p = section.querySelector('p');
        if (p) p.textContent = profile.location;
      }
    }
  }
  
  // Render photo - comprehensive selectors
  if (profile.photo) {
    const photoSelectors = ['.profile-pic', '.profile-photo', '.headshot', 'img[class*="profile"]', 'img[class*="photo"]', '.header img', '.image-container img'];
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
  if (!data.summary || !data.summary.text) {
    const summarySection = findSection(doc, ['summary', 'about', 'profile', 'objective']);
    if (summarySection) summarySection.remove();
    return;
  }
  
  let summaryRendered = false;
  
  // --- Step A: Always update header tagline paragraphs (e.g. ColorfulBlocks .header p) ---
  // These are brief summary/taglines that sit inside the header alongside the name.
  // We update them first, separately from the main summary section, so they always
  // reflect real data even when a dedicated summary section also exists.
  const headerParagraphs = doc.querySelectorAll('.header p');
  for (const p of Array.from(headerParagraphs)) {
    // Skip subtitle, contact-info children, and short all-caps titles
    const text = extractText(p);
    const looksLikeTitle = text && text === text.toUpperCase() && text.length < 100;
    
    if (!p.closest('.contact-info') && !p.classList.contains('subtitle') && !looksLikeTitle) {
      p.textContent = data.summary.text;
      summaryRendered = true;
      break; // Only update the first matching header paragraph
    }
  }
  
  // --- Step B: Update dedicated summary sections (.summary-list, .about-me, etc.) ---
  const summarySelectors = [
    '.summary',
    '.about',
    '.profile-summary',
    '.about-me',
    '.about-me-text',
    '.about-me p',  // OliveGreenModern
    '.section.about-me p',  // OliveGreenModern variant
    '.summary-list',  // ColorfulBlocks (list format)
  ];
  for (const selector of summarySelectors) {
    const summaryElements = doc.querySelectorAll(selector);
    if (summaryElements.length > 0) {
      summaryElements.forEach(summaryEl => {
        // Don't replace section titles or subtitle
        if (!summaryEl.classList.contains('section-title') && 
            !summaryEl.classList.contains('subtitle') &&
            !summaryEl.closest('.section-title') && data.summary) {
          
          // Handle list format (ColorfulBlocks)
          if (summaryEl.tagName === 'UL' || summaryEl.classList.contains('summary-list')) {
            // Split summary text into sentences for list items
            const sentences = data.summary.text.match(/[^.!?]+[.!?]+/g) || [data.summary.text];
            summaryEl.innerHTML = '';
            const ownerDoc = summaryEl.ownerDocument || document;
            sentences.forEach(sentence => {
              const li = ownerDoc.createElement('li');
              li.textContent = sentence.trim();
              summaryEl.appendChild(li);
            });
          } else {
            // Handle paragraph format
            summaryEl.textContent = data.summary.text;
          }
          summaryRendered = true;
        }
      });
      if (summaryRendered) {
        return;
      }
    }
  }
  
  // Try to find by section title
  const sections = doc.querySelectorAll('.section, section, [class*="section"]');
  for (const section of Array.from(sections)) {
    const titleEl = section.querySelector('.section-title, h2, h3');
    if (titleEl && /summary|about|profile|objective|personal profile/i.test(extractText(titleEl))) {
      // More specific selector - prefer dedicated summary classes
      // Avoid matching work-item or experience-item descriptions
      let contentEl = section.querySelector('.summary, .about-me-text');
      
      // If not found, try to find a paragraph that's not inside a work/experience item
      if (!contentEl) {
        const paragraphs = section.querySelectorAll('p');
        for (const p of Array.from(paragraphs)) {
          // Skip if it's a section title or inside a work/experience item
          if (!p.classList.contains('section-title') && 
              !p.closest('.work-item') && 
              !p.closest('.experience-item')) {
            contentEl = p;
            break;
          }
        }
      }
      
      // Don't overwrite the title
      if (contentEl && contentEl !== titleEl) {
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
  if (!data.experience || data.experience.length === 0) {
    const expSection = findSection(doc, ['experience', 'work', 'employment', 'professional']);
    if (expSection) expSection.remove();
    return;
  }
  
  const experienceSection = findSection(doc, ['experience', 'work', 'employment', 'professional']);
  if (!experienceSection) return;
  
  // Find template item - comprehensive selectors
  // .section-content is used by AccentColorMinimal (split left/right columns)
  let templateItem = experienceSection.querySelector('.experience-item, .job, .timeline-item, .work-item, .two-col-section, .section-content, [class*="experience"]');
  
  // Handle FLAT experience structure (ElegantProfessionalPhoto)
  // where items are h4.job-title + p.job-details + ul.job-description siblings without a wrapper
  if (!templateItem) {
    const flatJobTitles = experienceSection.querySelectorAll('h4.job-title, h4');
    if (flatJobTitles.length > 0) {
      renderFlatExperience(experienceSection, data.experience);
      return;
    }
    return;
  }
  
  // Also look for timeline wrapper (Template2ColumnTimeline has items inside .timeline container)
  const timelineContainer = experienceSection.querySelector('.timeline');
  const parentContainer = timelineContainer || experienceSection;
  
  // Clear existing items - comprehensive selectors
  const allItems = parentContainer.querySelectorAll('.experience-item, .job, .timeline-item, .work-item, .two-col-section, .section-content');
  allItems.forEach(item => item.remove());
  
  // Render each experience item
  for (const exp of data.experience) {
    const itemEl = cloneElement(templateItem);
    renderExperienceItem(itemEl, exp);
    parentContainer.appendChild(itemEl);
  }
}

/**
 * Render experience in flat structure (no item wrappers)
 * Used by ElegantProfessionalPhoto and similar templates
 */
function renderFlatExperience(section: Element, items: ExperienceItem[]): void {
  const ownerDoc = section.ownerDocument || document;
  
  // Find the section title to preserve it
  const titleEl = section.querySelector('.section-title, h2, h3');
  
  // Remove all child elements except the title
  const children = Array.from(section.children);
  for (const child of children) {
    if (child !== titleEl) {
      child.remove();
    }
  }
  
  // Render each experience item as flat h4 + p + ul
  for (const exp of items) {
    const h4 = ownerDoc.createElement('h4');
    h4.className = 'job-title';
    h4.textContent = exp.title;
    section.appendChild(h4);
    
    const details = ownerDoc.createElement('p');
    details.className = 'job-details';
    const dateText = exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.startDate;
    details.textContent = `${exp.company}${exp.location ? ', ' + exp.location : ''} | ${dateText}`;
    section.appendChild(details);
    
    if (exp.bullets && exp.bullets.length > 0) {
      const ul = ownerDoc.createElement('ul');
      ul.className = 'job-description';
      for (const bullet of exp.bullets) {
        const li = ownerDoc.createElement('li');
        li.textContent = bullet;
        ul.appendChild(li);
      }
      section.appendChild(ul);
    }
  }
  
}

/**
 * Render a single experience item
 */
function renderExperienceItem(element: Element, data: ExperienceItem): void {
  // Render title - comprehensive selectors
  const titleSelectors = [
    '.job-title',
    '.title',
    '.position',
    '.role',
    '.item-title',  // ModernProfessional
    '.item-titl',  // AccentColorMinimal (typo in template)
    'h3',
    'h4'
  ];
  let titleRendered = false;
  for (const selector of titleSelectors) {
    const titleEl = element.querySelector(selector);
    if (titleEl && !titleEl.classList.contains('section-title') && !titleEl.classList.contains('responsibilities-title')) {
      // For AccentColorMinimal: .item-title exists in both left (title) and right (company) columns
      // Use the one in .left-column first
      const leftCol = element.querySelector('.left-column');
      if (leftCol && selector === '.item-title') {
        const leftTitle = leftCol.querySelector('.item-title, .item-titl');
        if (leftTitle) {
          leftTitle.textContent = data.title;
          titleRendered = true;
          break;
        }
      }
      titleEl.textContent = data.title;
      titleRendered = true;
      break;
    }
  }
  
  // Render company - comprehensive selectors
  const companySelectors = [
    '.company',
    '.company-name',
    '.organization',
    '.company-location',
    '.date-company',
    '.job-details',  // ElegantProfessionalPhoto
    '.item-subtitle',  // ModernProfessional
    '.right-column .item-title',  // AccentColorMinimal (company in right column)
    '.details',  // OliveGreenModern, Template2ColumnStylishBlocks
  ];
  let companyRendered = false;
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
      
      // For job-details fields (ElegantProfessionalPhoto), include date
      if (selector === '.job-details') {
        const dateText = data.endDate ? `${data.startDate} - ${data.endDate}` : data.startDate;
        text = `${text} | ${dateText}`;
      }
      
      // For .details: if title was NOT rendered separately, combine title + company
      if (selector === '.details' && !titleRendered) {
        text = `${data.title} | ${data.company}`;
        if (data.location) {
          text += ` | ${data.location}`;
        }
      }
      
      companyEl.textContent = text;
      companyRendered = true;
      break;
    }
  }
  
  // Fallback: BandwProfessional uses .left-col with plain <p> for company
  if (!companyRendered) {
    const leftCol = element.querySelector('.left-col');
    if (leftCol) {
      const paragraphs = leftCol.querySelectorAll('p');
      // The first <p> that's NOT .date gets the company
      for (const p of Array.from(paragraphs)) {
        if (!p.classList.contains('date')) {
          p.textContent = data.company;
          if (data.location) {
            p.textContent += `, ${data.location}`;
          }
          companyRendered = true;
          break;
        }
      }
    }
  }
  
  // Render dates - comprehensive selectors
  const dateSelectors = [
    '.date',
    '.dates',
    '.job-date',
    '.period',
    '.duration',
    '.item-date',  // ModernProfessional, AccentColorMinimal
    '.date-badge',  // ColorfulBlocks
  ];
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
  const bulletsContainer = element.querySelector('.achievements, ul, .bullets, .item-description, .responsibilities-list, .experience-list, .job-description');
  if (bulletsContainer && data.bullets.length > 0) {
    // If it's a paragraph element, join bullets with line breaks
    if (bulletsContainer.tagName === 'P' || bulletsContainer.classList.contains('item-description')) {
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
  
  // Fallback: If no bullets container found but we have bullets, try to find/create one
  if (!bulletsContainer && data.bullets.length > 0) {
    // Look for any <p> that might hold a description (not date, not title, not company)
    const descP = element.querySelector('p:not(.date):not(.job-title):not(.details):not(.job-details):not(.company):not(.responsibilities-title)');
    if (descP) {
      descP.textContent = data.bullets.join('. ');
    }
  }
}

/**
 * Render education section
 */
function renderEducation(doc: Document, data: ResumeData): void {
  if (!data.education || data.education.length === 0) {
    const eduSection = findSection(doc, ['education', 'academic', 'education background']);
    if (eduSection) eduSection.remove();
    return;
  }
  
  const educationSection = findSection(doc, ['education', 'academic', 'education background']);
  if (!educationSection) return;
  
  // Comprehensive template item selectors
  const templateItem = educationSection.querySelector('.education-item, .school, .timeline-item, .two-col-section, .section-content, [class*="education"]');
  if (!templateItem) return;
  
  // Clear existing items - comprehensive selectors
  const allItems = educationSection.querySelectorAll('.education-item, .school, .timeline-item, .two-col-section, .section-content');
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
  // Check if this is MinimalistSimplePhoto template (school in .item-title, degree in .item-subtitle)
  const isMinimalistPhoto = element.querySelector('.item-title') && element.querySelector('.item-subtitle') && 
                            !element.querySelector('.item-header');
  
  if (isMinimalistPhoto) {
    // MinimalistSimplePhoto: REVERSED - school in .item-title, degree in .item-subtitle
    const schoolEl = element.querySelector('.item-title');
    if (schoolEl) {
      schoolEl.textContent = data.school;
    }
    
    const degreeEl = element.querySelector('.item-subtitle');
    if (degreeEl) {
      degreeEl.textContent = data.degree;
    }
  } else {
    // Standard templates: degree in .item-title, school in .item-subtitle
    
    // Render school - comprehensive selectors
    const schoolSelectors = [
      '.school',
      '.school-name',
      '.university',
      '.institution',
      '.college',
      '.item-subtitle',  // ModernProfessional
      '.details',  // OliveGreenModern
      '.item-subheader span:first-child',  // ColorfulBlocks (first span in subheader)
    ];
    let schoolRendered = false;
    for (const selector of schoolSelectors) {
      const schoolEl = element.querySelector(selector);
      if (schoolEl) {
        let text = data.school;
        if (data.location && selector !== '.details' && !selector.includes('subheader')) {
          text += `, ${data.location}`;
        }
        schoolEl.textContent = text;
        schoolRendered = true;
        break;
      }
    }
    
    // Fallback: BandwProfessional / Template2ColumnTimeline use .left-col or plain <p> for school
    if (!schoolRendered) {
      const leftCol = element.querySelector('.left-col');
      if (leftCol) {
        // Find the <p> that's NOT the date
        const paragraphs = leftCol.querySelectorAll('p');
        for (const p of Array.from(paragraphs)) {
          if (!p.classList.contains('date')) {
            let text = data.school;
            if (data.location) text += `, ${data.location}`;
            p.textContent = text;
            schoolRendered = true;
            break;
          }
        }
      }
      
      // Template2ColumnTimeline education has plain <p> siblings without .left-col
      if (!schoolRendered) {
        const paragraphs = element.querySelectorAll('p');
        for (const p of Array.from(paragraphs)) {
          if (!p.classList.contains('date') && !p.classList.contains('degree') && !p.classList.contains('completed')) {
            let text = data.school;
            if (data.location) text += `, ${data.location}`;
            p.textContent = text;
            schoolRendered = true;
            break;
          }
        }
      }
    }
    
    // Render degree - comprehensive selectors
    const degreeSelectors = [
      '.degree',
      '.degree-info',
      '.major',
      '.field',
      '.item-title',  // ModernProfessional
      'h3',  // OliveGreenModern, BandwProfessional
      '.item-header .title',  // ColorfulBlocks
    ];
    let degreeRendered = false;
    for (const selector of degreeSelectors) {
      const degreeEl = element.querySelector(selector);
      if (degreeEl && !degreeEl.classList.contains('section-title')) {
        let text = data.degree;
        if (data.location && selector === '.degree-info') {
          text += ` — ${data.location}`;
        }
        degreeEl.textContent = text;
        degreeRendered = true;
        break;
      }
    }
  }
  
  // Render dates - comprehensive selectors
  const dateSelectors = [
    '.date',
    '.education-date',
    '.graduation',
    '.completed',  // BlueSimpleProfile
    '.item-date',
    '.date-badge',  // ColorfulBlocks
  ];
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
      const degreeEl = element.querySelector('.degree-info, .degree, .item-subtitle');
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
  if (!data.skills || (!data.skills.groups?.length && !data.skills.items?.length)) {
    const skillsSection = findSection(doc, ['skill', 'expertise', 'competenc', 'technical', 'technologies']);
    if (skillsSection) skillsSection.remove();
    return;
  }
  
  // Try multiple keywords to find skills section
  const skillsSection = findSection(doc, ['skill', 'expertise', 'competenc', 'technical', 'technologies', 'proficienc']);
  if (!skillsSection) {
    console.warn('[renderSkills] Could not find skills section in template');
    return;
  }
  
  console.log(`[renderSkills] Found skills section, populating ${data.skills.items?.length || data.skills.groups?.length || 0} skills`);
  
  // CRITICAL: Clear ALL hardcoded/placeholder skills FIRST, before any population
  // This must happen for both grouped and flat skills
  const allUlsInSection = skillsSection.querySelectorAll('ul');
  console.log(`[renderSkills] Found ${allUlsInSection.length} <ul> elements, clearing all existing <li> items`);
  
  // Remove ALL <li> items from ALL <ul> elements in the skills section
  allUlsInSection.forEach((ul, idx) => {
    const listItems = ul.querySelectorAll('li');
    if (listItems.length > 0) {
      console.log(`[renderSkills] Clearing ${listItems.length} hardcoded skills from UL ${idx + 1}:`, 
        Array.from(listItems).slice(0, 3).map(li => li.textContent?.trim()).filter(Boolean));
    }
    
    // Clear innerHTML completely - this removes ALL hardcoded skills
    // Only skip if the ul is actually part of a section title (which shouldn't happen)
    const isInTitle = ul.closest('h2, h3, .section-title');
    if (!isInTitle) {
      // Completely clear the ul - we'll repopulate it with real skills
      ul.innerHTML = '';
      console.log(`[renderSkills] Cleared innerHTML of UL ${idx + 1}`);
    } else {
      // If somehow in a title, just remove the li items
      listItems.forEach(li => {
        if (!li.closest('.section-title')) {
          li.remove();
        }
      });
    }
  });
  
  // Also clear any text content in skills containers that might have comma-separated skills
  const skillsContainers = skillsSection.querySelectorAll('.skills-list, .skills, .expertise-list, p, span, div');
  skillsContainers.forEach(el => {
    if (!el.closest('.section-title') && !el.closest('ul') && !el.closest('h2') && !el.closest('h3')) {
      const text = extractText(el).toLowerCase();
      // If it looks like it contains skills (has commas and skill-like words), clear it
      if (text.includes(',') && (text.includes('illustration') || text.includes('design') || text.includes('programming') || text.includes('knowledge') || text.length > 20)) {
        el.textContent = '';
        el.innerHTML = '';
      }
    }
  });
  
  // Handle grouped skills - comprehensive selectors
  if (data.skills.groups && data.skills.groups.length > 0) {
    
    const groupContainer = skillsSection.querySelector('.skills-group, .skill-group, .skills-grid')?.parentElement;
    if (groupContainer) {
      const templateGroup = skillsSection.querySelector('.skills-group, .skill-group, .skills-grid');
      if (templateGroup) {
        // Clear existing groups
        const allGroups = groupContainer.querySelectorAll('.skills-group, .skill-group, .skills-grid');
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
        return;
      }
    }
  }
  
  // Handle flat skills list - comprehensive selectors
  if (data.skills?.items && data.skills.items.length > 0) {
    const skillItems = data.skills.items;
    
    console.log(`[renderSkills] Starting to populate ${skillItems.length} skills:`, skillItems.slice(0, 5));
    
    // Note: Hardcoded skills were already cleared above, now we just populate
    
    // Check for skills-grid with multiple ULs (BandwProfessional)
    const skillsGrid = skillsSection.querySelector('.skills-grid');
    if (skillsGrid) {
      const uls = skillsGrid.querySelectorAll('ul');
      if (uls.length > 0) {
        // Clear all first
        uls.forEach(ul => ul.innerHTML = '');
        // Distribute skills evenly across existing ULs
        const itemsPerList = Math.ceil(skillItems.length / uls.length);
        const ownerDoc = skillsGrid.ownerDocument || document;
        uls.forEach((ul, idx) => {
          const start = idx * itemsPerList;
          const end = Math.min(start + itemsPerList, skillItems.length);
          for (let i = start; i < end; i++) {
            const li = ownerDoc.createElement('li');
            li.textContent = skillItems[i];
            ul.appendChild(li);
          }
        });
        console.log(`[renderSkills] Populated ${skillItems.length} skills across ${uls.length} ULs in skills-grid`);
        return;
      }
    }
    
    // Find ALL ul elements in the skills section (not just the first one)
    // We already cleared them above, now we populate
    const allUls = skillsSection.querySelectorAll('ul');
    if (allUls.length > 0) {
      // Use the first ul (or the one that's not in section-title)
      let targetUl: Element | null = null;
      for (const ul of Array.from(allUls)) {
        // Skip if it's part of a section title
        if (!ul.closest('.section-title') && !ul.closest('h2') && !ul.closest('h3')) {
          targetUl = ul;
          break;
        }
      }
      // Fallback to first ul if none found (but log a warning)
      if (!targetUl && allUls.length > 0) {
        targetUl = allUls[0];
        console.warn(`[renderSkills] Using first UL as fallback (might be in title)`);
      }
      
      if (targetUl) {
        // Double-check it's empty (should already be from above)
        if (targetUl.querySelectorAll('li').length > 0) {
          console.warn(`[renderSkills] UL still has ${targetUl.querySelectorAll('li').length} items, clearing again`);
          targetUl.innerHTML = '';
        }
        
        const ownerDoc = targetUl.ownerDocument || document;
        for (const skill of skillItems) {
          const li = ownerDoc.createElement('li');
          li.textContent = skill;
          targetUl.appendChild(li);
        }
        console.log(`[renderSkills] ✅ Successfully populated ${skillItems.length} skills as list items in UL`);
        console.log(`[renderSkills] Skills added:`, skillItems.slice(0, 10));
        
        // Verify the skills were actually added
        const verifyCount = targetUl.querySelectorAll('li').length;
        if (verifyCount !== skillItems.length) {
          console.error(`[renderSkills] ⚠️ Mismatch! Expected ${skillItems.length} skills but found ${verifyCount} in UL`);
        }
        return;
      } else {
        console.warn(`[renderSkills] Found ${allUls.length} ULs but couldn't select target UL`);
      }
    } else {
      console.warn(`[renderSkills] No <ul> elements found in skills section!`);
    }
    
    // Try other selectors for skills container (non-ul elements)
    const skillsEl = skillsSection.querySelector('.skills-list, .skills, .expertise-list, .skill-items, [class*="skill"]');
    if (skillsEl && skillsEl.tagName !== 'UL') {
      // Clear existing content
      skillsEl.innerHTML = '';
      skillsEl.textContent = skillItems.join(', ');
      console.log(`[renderSkills] Populated ${skillItems.length} skills as comma-separated text`);
      return;
    }
    
    // Fallback: Try to find any element that might contain skills (p, div, span)
    // and replace placeholder text with actual skills
    const allElements = skillsSection.querySelectorAll('p, div, span, td');
    for (const el of Array.from(allElements)) {
      const text = extractText(el).toLowerCase();
      // Check if this element contains placeholder skill-like text
      if (text.includes('skill') || text.includes('expertise') || text.includes('proficient') || 
          text.includes('javascript') || text.includes('python') || text.includes('java') ||
          /[a-z]+\s*,\s*[a-z]+/.test(text)) {
        // This might be a skills container - replace with actual skills
        el.textContent = skillItems.join(', ');
        console.log(`[renderSkills] Populated ${skillItems.length} skills in fallback element`);
        return;
      }
    }
    
    // Last resort: Create a new list if we found the section but no container
    const ownerDoc = skillsSection.ownerDocument || document;
    const ul = ownerDoc.createElement('ul');
    for (const skill of skillItems) {
      const li = ownerDoc.createElement('li');
      li.textContent = skill;
      ul.appendChild(li);
    }
    skillsSection.appendChild(ul);
    console.log(`[renderSkills] Created new list with ${skillItems.length} skills`);
  }
  
}

/**
 * Render projects section
 */
function renderProjects(doc: Document, data: ResumeData): void {
  if (!data.projects || data.projects.length === 0) {
    // Remove projects section if no data
    const projectsSection = findSection(doc, ['project']);
    if (projectsSection) {
      projectsSection.remove();
    }
    return;
  }
  
  const projectsSection = findSection(doc, ['project']);
  if (!projectsSection) return;
  
  const templateItem = projectsSection.querySelector('.project, .project-item, .experience-item');
  if (!templateItem) return;
  
  // Clear existing items - need to check all possible item classes
  const allItems = projectsSection.querySelectorAll('.project, .project-item, .experience-item');
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
  // Render title - include .job-title for KUSE template
  const titleSelectors = ['.project-title', '.title', '.job-title', 'h3', 'h4'];
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
  
  // Render dates if present
  if (data.startDate || data.endDate) {
    const dateEl = element.querySelector('.job-date, .date, .project-date');
    if (dateEl) {
      const dateText = data.endDate 
        ? `${data.startDate || ''} - ${data.endDate}` 
        : data.startDate || data.endDate || '';
      dateEl.textContent = dateText;
    }
  }
  
  // Render organization/tech stack - include .degree-info for KUSE template
  if (data.organization) {
    const orgSelectors = ['.company', '.organization', '.subtitle', '.degree-info'];
    for (const selector of orgSelectors) {
      const orgEl = element.querySelector(selector);
      if (orgEl) {
        orgEl.textContent = data.organization;
        break;
      }
    }
  }
  
  // Render description - handle both text paragraphs and bullet lists
  const descEl = element.querySelector('.description, p');
  if (descEl && !descEl.classList.contains('degree-info')) {
    descEl.textContent = data.description;
  }
  
  // If template has achievements/bullets list, split description into bullets
  const bulletsContainer = element.querySelector('.achievements, ul.achievements');
  if (bulletsContainer && data.description) {
    bulletsContainer.innerHTML = '';
    const ownerDoc = element.ownerDocument || document;
    
    // Split description by newlines or periods to create bullets
    const bullets = data.description.split(/\n|\.(?=\s)/).map(b => b.trim()).filter(b => b.length > 0);
    
    for (const bullet of bullets) {
      const li = ownerDoc.createElement('li');
      li.textContent = bullet.endsWith('.') ? bullet : bullet + '.';
      bulletsContainer.appendChild(li);
    }
  }
}

/**
 * Render languages section
 */
function renderLanguages(doc: Document, data: ResumeData): void {
  if (!data.languages || data.languages.length === 0) {
    // No language data - remove standalone language section if exists
    const langSection = findSection(doc, ['language']);
    if (langSection) langSection.remove();
    return;
  }
  
  // Try standalone language section first (OliveGreenModern, Template2ColumnTimeline, etc.)
  const langSection = findSection(doc, ['language']);
  if (langSection) {
    const listEl = langSection.querySelector('ul');
    if (listEl) {
      listEl.innerHTML = '';
      const ownerDoc = listEl.ownerDocument || doc;
      for (const lang of data.languages) {
        const li = ownerDoc.createElement('li');
        li.textContent = `${lang.language} – ${lang.proficiency}`;
        listEl.appendChild(li);
      }
      return;
    }
    
    // Handle paragraph-based language items (Template2ColumnTimeline)
    const langItems = langSection.querySelectorAll('p:not(.section-title), .language-item');
    if (langItems.length > 0) {
      // Remove existing items
      langItems.forEach(item => item.remove());
      
      // Add new items
      const ownerDoc = langSection.ownerDocument || doc;
      for (const lang of data.languages) {
        const p = ownerDoc.createElement('p');
        p.textContent = `${lang.language} – ${lang.proficiency}`;
        langSection.appendChild(p);
      }
      return;
    }
  }
  
  // Fallback: Languages inside skills section as a group
  const skillsSection = findSection(doc, ['skill', 'expertise']);
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
  if (!data.certifications || data.certifications.length === 0) {
    const certsSection = findSection(doc, ['certification', 'certificate']);
    if (certsSection) {
      // Check if this is a combined "Certifications & Awards" section
      const titleEl = certsSection.querySelector('.section-title, h2, h3');
      const titleText = titleEl ? extractText(titleEl).toLowerCase() : '';
      
      // If it's a combined section with awards, just remove the certifications group
      if (titleText.includes('certification') && titleText.includes('award')) {
        const skillsGroups = certsSection.querySelectorAll('.skills-group');
        for (const group of Array.from(skillsGroups)) {
          const categoryEl = group.querySelector('.skills-category');
          if (categoryEl && /certification/i.test(extractText(categoryEl))) {
            group.remove();
          }
        }
      } else {
        // Otherwise remove the entire section
        certsSection.remove();
      }
    }
    return;
  }
  
  const certsSection = findSection(doc, ['certification', 'certificate']);
  if (!certsSection) return;
  
  // Check for skills-group format (KUSE template: Certifications & Awards combined)
  const skillsGroups = certsSection.querySelectorAll('.skills-group');
  let certsGroupFound = false;
  
  for (const group of Array.from(skillsGroups)) {
    const categoryEl = group.querySelector('.skills-category');
    if (categoryEl && /certification/i.test(extractText(categoryEl))) {
      const skillsListEl = group.querySelector('.skills-list');
      if (skillsListEl) {
        const certTexts = data.certifications.map(cert => {
          let text = cert.name;
          if (cert.issuer) text += ` (${cert.issuer})`;
          return text;
        });
        skillsListEl.textContent = certTexts.join(', ');
        certsGroupFound = true;
        break;
      }
    }
  }
  
  // If skills-group format handled, we're done
  if (certsGroupFound) return;
  
  // Otherwise, handle list format
  const listEl = certsSection.querySelector('ul');
  if (listEl) {
    listEl.innerHTML = '';
    
    const ownerDoc = listEl.ownerDocument || doc;
    for (const cert of data.certifications) {
      const li = ownerDoc.createElement('li');
      let certText = cert.name;
      if (cert.issuer) certText += ` - ${cert.issuer}`;
      if (cert.date) certText += ` (${cert.date})`;
      li.textContent = certText;
      listEl.appendChild(li);
    }
  }
}

/**
 * Render training section
 */
function renderTraining(doc: Document, data: ResumeData): void {
  if (!data.training || data.training.length === 0) {
    const trainingSection = findSection(doc, ['training', 'courses']);
    if (trainingSection) trainingSection.remove();
    return;
  }
  
  const trainingSection = findSection(doc, ['training', 'courses']);
  if (!trainingSection) return;
  
  const listEl = trainingSection.querySelector('ul');
  if (listEl) {
    listEl.innerHTML = '';
    
    const ownerDoc = listEl.ownerDocument || doc;
    for (const training of data.training) {
      const li = ownerDoc.createElement('li');
      let trainingText = training.name;
      if (training.provider) trainingText += ` - ${training.provider}`;
      li.textContent = trainingText;
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
    roleEl.textContent = vol.organization ? `${vol.role} - ${vol.organization}` : vol.role;
    
    parent.appendChild(itemEl);
  }
}

/**
 * Render awards section
 */
function renderAwards(doc: Document, data: ResumeData): void {
  if (!data.awards || data.awards.length === 0) {
    const awardsSection = findSection(doc, ['award', 'honor', 'achievement']);
    if (awardsSection) {
      // Check if this is a combined "Certifications & Awards" section
      const titleEl = awardsSection.querySelector('.section-title, h2, h3');
      const titleText = titleEl ? extractText(titleEl).toLowerCase() : '';
      
      // If it's a combined section with certifications, just remove the awards group
      if (titleText.includes('certification') && titleText.includes('award')) {
        const skillsGroups = awardsSection.querySelectorAll('.skills-group');
        for (const group of Array.from(skillsGroups)) {
          const categoryEl = group.querySelector('.skills-category');
          if (categoryEl && /award/i.test(extractText(categoryEl))) {
            group.remove();
          }
        }
      } else {
        // Otherwise remove the entire section
        awardsSection.remove();
      }
    }
    return;
  }

  const awardsSection = findSection(doc, ['award', 'honor', 'achievement']);
  if (!awardsSection) return;

  // Check for skills-group format (KUSE template: Certifications & Awards combined)
  const skillsGroups = awardsSection.querySelectorAll('.skills-group');
  let awardsGroupFound = false;
  
  for (const group of Array.from(skillsGroups)) {
    const categoryEl = group.querySelector('.skills-category');
    if (categoryEl && /award/i.test(extractText(categoryEl))) {
      const skillsListEl = group.querySelector('.skills-list');
      if (skillsListEl) {
        const awardTexts = data.awards.map(award => {
          let text = award.name;
          if (award.date) text += ` (${award.date})`;
          return text;
        });
        skillsListEl.textContent = awardTexts.join(', ');
        awardsGroupFound = true;
        break;
      }
    }
  }
  
  // If skills-group format handled, we're done
  if (awardsGroupFound) return;

  // Otherwise, handle list format
  const listEl = awardsSection.querySelector('ul');
  if (listEl) {
    listEl.innerHTML = '';

    const ownerDoc = listEl.ownerDocument || doc;
    for (const award of data.awards) {
      const li = ownerDoc.createElement('li');
      let text = award.name;
      if (award.issuer) {
        text += ` - ${award.issuer}`;
      }
      if (award.date) {
        text += ` (${award.date})`;
      }
      li.textContent = text;
      listEl.appendChild(li);
    }
  } else {
    // Fallback: write into paragraphs or create a list
    const titleEl = awardsSection.querySelector('.section-title, h2, h3');
    // Remove existing content except title
    const children = Array.from(awardsSection.children);
    for (const child of children) {
      if (child !== titleEl) child.remove();
    }

    const ownerDoc = awardsSection.ownerDocument || doc;
    const ul = ownerDoc.createElement('ul');
    for (const award of data.awards) {
      const li = ownerDoc.createElement('li');
      let text = award.name;
      if (award.issuer) text += ` - ${award.issuer}`;
      if (award.date) text += ` (${award.date})`;
      li.textContent = text;
      ul.appendChild(li);
    }
    awardsSection.appendChild(ul);
  }
}

/**
 * Render publications section
 */
function renderPublications(doc: Document, data: ResumeData): void {
  if (!data.publications || data.publications.length === 0) {
    const pubSection = findSection(doc, ['publication']);
    if (pubSection) pubSection.remove();
    return;
  }

  const pubSection = findSection(doc, ['publication']);
  if (!pubSection) return;

  const listEl = pubSection.querySelector('ul');
  if (listEl) {
    listEl.innerHTML = '';

    const ownerDoc = listEl.ownerDocument || doc;
    for (const pub of data.publications) {
      const li = ownerDoc.createElement('li');
      let text = pub.title;
      if (pub.publisher) text += ` - ${pub.publisher}`;
      if (pub.date) text += ` (${pub.date})`;
      li.textContent = text;
      listEl.appendChild(li);
    }
  } else {
    // Fallback: create a list
    const titleEl = pubSection.querySelector('.section-title, h2, h3');
    const children = Array.from(pubSection.children);
    for (const child of children) {
      if (child !== titleEl) child.remove();
    }

    const ownerDoc = pubSection.ownerDocument || doc;
    const ul = ownerDoc.createElement('ul');
    for (const pub of data.publications) {
      const li = ownerDoc.createElement('li');
      let text = pub.title;
      if (pub.publisher) text += ` - ${pub.publisher}`;
      if (pub.date) text += ` (${pub.date})`;
      li.textContent = text;
      ul.appendChild(li);
    }
    pubSection.appendChild(ul);
  }
}

/**
 * Helper: Find a section by title keywords
 * Searches .section, <section>, and [class*="section"] (covers left-section, right-section, etc.)
 */
function findSection(doc: Document, keywords: string[]): Element | null {
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
 * Remove sections from the DOM that have no corresponding user data.
 * This prevents empty placeholder sections from taking up space after template swap.
 */
function removeEmptySections(doc: Document, data: ResumeData): void {
  const sectionChecks: { keywords: string[]; hasData: boolean }[] = [
    { keywords: ['summary', 'about', 'profile', 'objective'], hasData: !!data.summary?.text },
    { keywords: ['experience', 'work', 'employment'], hasData: !!(data.experience && data.experience.length > 0) },
    { keywords: ['education', 'academic'], hasData: !!(data.education && data.education.length > 0) },
    { keywords: ['skill', 'expertise', 'competenc'], hasData: !!(data.skills && (data.skills.groups?.length || data.skills.items?.length)) },
    { keywords: ['project'], hasData: !!(data.projects && data.projects.length > 0) },
    { keywords: ['language'], hasData: !!(data.languages && data.languages.length > 0) },
    { keywords: ['certification', 'certificate'], hasData: !!(data.certifications && data.certifications.length > 0) },
    { keywords: ['training', 'course'], hasData: !!(data.training && data.training.length > 0) },
    { keywords: ['volunteering', 'volunteer'], hasData: !!(data.volunteering && data.volunteering.length > 0) },
    { keywords: ['award', 'honor', 'achievement'], hasData: !!(data.awards && data.awards.length > 0) },
    { keywords: ['publication'], hasData: !!(data.publications && data.publications.length > 0) },
    { keywords: ['reference'], hasData: false }, // Always remove references section (not in career profile)
    { keywords: ['interest', 'hobbies', 'hobby'], hasData: false }, // Always remove interests/hobbies (not in career profile)
  ];

  // Also remove standalone contact-info sections (e.g. PHONE, EMAIL, WEBSITE, ADDRESS)
  // when corresponding data is not present
  const standaloneContactChecks: { keywords: string[]; hasData: boolean }[] = [
    { keywords: ['phone'], hasData: !!data.profile.phone },
    { keywords: ['email'], hasData: !!data.profile.email },
    { keywords: ['website', 'web', 'portfolio'], hasData: !!data.profile.website },
    { keywords: ['address', 'location'], hasData: !!data.profile.location },
  ];

  const sections = doc.querySelectorAll('.section, section, [class*="section"]');
  
  for (const section of Array.from(sections)) {
    const titleEl = section.querySelector('.section-title, h2, h3');
    if (!titleEl) continue;
    
    const titleText = extractText(titleEl).toLowerCase();
    
    // Check main section types
    for (const check of sectionChecks) {
      if (check.keywords.some(kw => titleText.includes(kw)) && !check.hasData) {
        section.remove();
        break;
      }
    }
    
    // Check standalone contact sections (Template2ColumnStylishBlocks, etc.)
    // These are short, single-word titles like "PHONE", "EMAIL", "WEBSITE", "ADDRESS"
    // titleText is already lowercased, so exact match with lowercase keywords suffices
    for (const check of standaloneContactChecks) {
      if (check.keywords.some(kw => titleText === kw) && !check.hasData) {
        section.remove();
        break;
      }
    }
  }
}

/**
 * Remove any remaining placeholder / Lorem ipsum content from the document.
 * This is a safety net: after all rendering and section removal, any leftover
 * placeholder text that wasn't replaced by real data gets stripped.
 * Uses the comprehensive isPlaceholderText() utility from placeholder-filter.
 *
 * Strategy:
 *  1. Walk every TEXT NODE and blank it if it's placeholder text. This avoids
 *     destroying child elements (SVG icons, <br> tags, etc.)
 *  2. Remove link elements that still point to placeholder URLs.
 *  3. Clean up fully-emptied parent elements.
 */
function stripRemainingPlaceholders(doc: Document, data: ResumeData): void {
  // ---------- Phase 1: Walk ALL text nodes and blank placeholder text ----------
  const body = doc.body || doc.documentElement;
  const walker = doc.createTreeWalker(body, 4 /* NodeFilter.SHOW_TEXT */, null);
  const textNodesToBlank: Node[] = [];
  
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = (node.nodeValue || '').trim();
    if (!text) continue;
    
    // Skip text inside <style> and <script> tags
    const parent = node.parentElement;
    if (parent && (parent.tagName === 'STYLE' || parent.tagName === 'SCRIPT')) continue;
    
    if (isPlaceholderText(text)) {
      textNodesToBlank.push(node);
    }
  }
  
  for (const textNode of textNodesToBlank) {
    textNode.nodeValue = '';
  }
  
  // ---------- Phase 2: Check element-level text for multi-node placeholders ----------
  // Some placeholders span multiple text nodes (e.g. "Lorem ipsum <br> dolor sit amet")
  // Check the extracted text of each content element as a whole.
  //
  // IMPORTANT: We intentionally do NOT include generic `div` here because large
  // container divs (.right-column, .main-content, etc.) would aggregate ALL nested
  // text. A single leftover placeholder word in a child would cause clearTextNodes()
  // to wipe the ENTIRE container, blanking real data. Only target leaf-level or
  // known content-bearing elements.
  const contentElements = doc.querySelectorAll(
    'p, li, span, td, th, a, ' +
    '.item-description, .about-me-text, .summary, .details, .job-details, ' +
    '.description, .reference-item, .reference-name, .contact-item, .footer-item'
  );
  for (const el of Array.from(contentElements)) {
    // Skip section titles — we don't want to blank headings like "Experience"
    if ((el as HTMLElement).classList?.contains('section-title')) continue;
    
    // Skip large layout containers — only process leaf or near-leaf content elements.
    // If an element has more than 3 child elements, it's likely a container, not a
    // content block. Clearing it would wipe too much.
    if (el.children.length > 3) continue;
    
    const text = extractText(el);
    if (!text) continue;
    
    if (isPlaceholderText(text)) {
      // Clear all text nodes inside this element (preserves non-text children like SVGs)
      clearTextNodes(el);
    }
  }
  
  // ---------- Phase 3: Remove placeholder links ----------
  const placeholderLinks = doc.querySelectorAll(
    'a[href*="example.com"], a[href*="reallygreatsite.com"], a[href*="interestingsite.com"]'
  );
  for (const link of Array.from(placeholderLinks)) {
    link.remove();
  }
  
  // Also remove links with placeholder href patterns
  const allLinks = doc.querySelectorAll('a[href]');
  for (const link of Array.from(allLinks)) {
    const href = link.getAttribute('href') || '';
    if (/reallygreatsite|interestingsite|example\.com/i.test(href)) {
      link.remove();
    }
  }
}

/**
 * Clear all text nodes inside an element without destroying child elements.
 * This preserves SVG icons, <br> tags, etc. while removing visible text.
 */
function clearTextNodes(element: Element): void {
  const walker = element.ownerDocument.createTreeWalker(
    element, 4 /* NodeFilter.SHOW_TEXT */, null
  );
  const nodes: Node[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    nodes.push(n);
  }
  for (const textNode of nodes) {
    textNode.nodeValue = '';
  }
}

/**
 * Embed ResumeData as JSON in the HTML document
 * This allows the editor to access the structured data later for re-populating sections
 */
function embedResumeData(doc: Document, data: ResumeData): void {
  const head = doc.querySelector('head');
  const body = doc.querySelector('body');
  
  if (!head && !body) return;
  
  // Create a script tag with the resume data
  const scriptEl = doc.createElement('script');
  scriptEl.type = 'application/json';
  scriptEl.id = 'resume-data';
  
  // Sanitize data to avoid XSS (remove any script tags from description fields)
  const sanitizedData = JSON.stringify(data, (key, value) => {
    if (typeof value === 'string') {
      // Remove any <script> tags
      return value.replace(/<script[^>]*>.*?<\/script>/gi, '');
    }
    return value;
  });
  
  scriptEl.textContent = sanitizedData;
  
  // Append to head if available, otherwise to body
  if (head) {
    head.appendChild(scriptEl);
  } else if (body) {
    body.appendChild(scriptEl);
  }
}

/**
 * Fix CSS in the rendered HTML to ensure continuous content flow.
 * Converts fixed heights to min-heights and removes overflow:hidden on .page containers.
 * Carefully avoids breaking flex-grow based layouts (e.g. ColorfulBlocks).
 */
function fixContinuousLayoutCSS(doc: Document, template: ResumeTemplate): void {
  const pageSize = template.pageSize || 'A4';
  const pageHeight = pageSize === 'Letter' ? '1056px' : '1123px';
  
  // Inject CSS overrides into a new <style> block
  const styleEl = doc.createElement('style');
  styleEl.textContent = `
    /* Continuous content layout fix - prevents blank pages and content clipping */
    .page {
      height: auto !important;
      min-height: ${pageHeight};
      overflow: visible !important;
    }
    .main-container {
      height: auto !important;
      min-height: 100%;
    }
    /* Only override .main-content height if it uses fixed/calc height, not flex-grow */
    .main-content[style*="height"] {
      height: auto !important;
      min-height: auto;
    }
    /* Prevent profile images from stretching to fill flex containers */
    .profile-pic-container img {
      height: auto !important;
      max-height: 350px;
    }

    /*
     * Fix absolutely-positioned footers inside flex containers.
     * Templates like OliveGreenModern use position:absolute on .footer
     * which causes blank space when content exceeds one page because
     * the footer sits at the bottom of the expanded .page, leaving
     * a gap on page 1.
     * Fix: convert the footer to normal document flow so it sits
     * right after the content, and let it wrap in the flex container.
     *
     * NOTE: flex-wrap is applied via inline style ONLY to .main-content
     * elements that contain a .footer child (see JS below). Applying it
     * globally via CSS breaks two-column layouts like ColorfulBlocks.
     */
    .page > .main-content > .footer,
    .page .footer[style*="position: absolute"],
    .footer {
      position: relative !important;
      bottom: auto !important;
      right: auto !important;
      left: auto !important;
      width: 100% !important;
      flex-basis: 100% !important;
      margin-top: 30px;
    }
    /* Ensure .page has bottom padding so footer content isn't clipped */
    .page {
      padding-bottom: 0 !important;
    }

    @media print {
      .page {
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
      }
    }
  `;
  
  // Append to head or body
  const head = doc.querySelector('head');
  if (head) {
    head.appendChild(styleEl);
  } else {
    // If no head, prepend to body
    const body = doc.querySelector('body');
    if (body) {
      body.insertBefore(styleEl, body.firstChild);
    }
  }
  
  // Apply flex-wrap ONLY to .main-content elements that contain a .footer child.
  // This allows the footer to wrap to a new line while columns stay side-by-side
  // (column widths must properly account for any gap so they sum to ≤ 100%).
  const mainContents = doc.querySelectorAll('.main-content');
  for (const mc of Array.from(mainContents)) {
    if (mc.querySelector('.footer')) {
      (mc as HTMLElement).style.flexWrap = 'wrap';
    }
  }
}

/**
 * Final string-level cleanup for placeholder text in serialized HTML.
 * Only touches text content between HTML tags (not attributes, class names, etc.).
 * This is the absolute last safety net.
 */
function stripPlaceholderStrings(html: string): string {
  // Patterns that indicate placeholder text content (only match inside HTML text nodes)
  // We use a callback replacer that only blanks the text between > and <
  const PLACEHOLDER_CONTENT_PATTERNS: RegExp[] = [
    // Lorem ipsum and related filler
    /lorem\s+ipsum[^<]*/gi,
    /dolor\s+sit\s+amet[^<]*/gi,
    /consectetur\s+adipiscing[^<]*/gi,
    /nullam\s+pharetra[^<]*/gi,
    /nunc\s+sit\s+amet\s+sem[^<]*/gi,
    /donec\s+hendrerit[^<]*/gi,
    /donec\s+risus\s+arcu[^<]*/gi,
    /vel\s+tempus\s+metus[^<]*/gi,
    /in\s+elementum\s+elit[^<]*/gi,
    /in\s+enim\s+nunc[^<]*/gi,
    /luctus\s+sollicitudin[^<]*/gi,
    /sed\s+leo\s+nisl[^<]*/gi,
  ];
  
  // Only replace text content (between > and <), not inside tags or attributes
  for (const pattern of PLACEHOLDER_CONTENT_PATTERNS) {
    html = html.replace(
      new RegExp(`(>\\s*)${pattern.source}(\\s*<)`, pattern.flags.includes('i') ? 'gi' : 'g'),
      '$1$2'
    );
  }
  
  return html;
}
