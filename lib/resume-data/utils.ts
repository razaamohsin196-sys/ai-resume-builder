/**
 * Utility functions for resume data manipulation
 */

/**
 * Parse HTML string into a DOM document
 * Works in both Node.js (server) and browser environments
 */
export function parseHtmlToDOM(html: string): Document {
  // Server-side (Node.js)
  if (typeof window === 'undefined') {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(html);
    return dom.window.document;
  }
  
  // Client-side (browser)
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

/**
 * Serialize DOM back to HTML string
 */
export function serializeDOMToHtml(doc: Document): string {
  return doc.documentElement.outerHTML;
}

/**
 * Extract text content from an element, cleaning whitespace
 */
export function extractText(element: Element | null): string {
  if (!element) return '';
  return element.textContent?.trim().replace(/\s+/g, ' ') || '';
}

/**
 * Extract text from multiple possible selectors (first match wins)
 */
export function extractTextFromSelectors(
  doc: Document | Element,
  selectors: string[]
): string {
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const text = extractText(element);
      if (text) return text;
    }
  }
  return '';
}

/**
 * Extract all elements matching any of the selectors
 */
export function queryAllSelectors(
  doc: Document | Element,
  selectors: string[]
): Element[] {
  const results: Element[] = [];
  for (const selector of selectors) {
    const elements = Array.from(doc.querySelectorAll(selector));
    results.push(...elements);
  }
  // Remove duplicates
  return Array.from(new Set(results));
}

/**
 * Extract URL from various link formats
 */
export function extractUrl(element: Element | null): string | undefined {
  if (!element) return undefined;
  
  // Check for anchor tag
  const anchor = element.tagName === 'A' ? element : element.querySelector('a');
  if (anchor) {
    const href = anchor.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      return href;
    }
  }
  
  // Check for URL in text
  const text = extractText(element);
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    return urlMatch[0];
  }
  
  return undefined;
}

/**
 * Extract email from text or mailto link
 */
export function extractEmail(text: string): string | undefined {
  // Remove mailto: prefix if present
  text = text.replace(/^mailto:/i, '');
  
  // Email regex
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0] : undefined;
}

/**
 * Extract phone number from text
 */
export function extractPhone(text: string): string | undefined {
  // Match various phone formats
  const phoneMatch = text.match(/[\d\s\-\(\)\.+]+/);
  if (phoneMatch) {
    const phone = phoneMatch[0].trim();
    // Must have at least 10 digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return phone;
    }
  }
  return undefined;
}

/**
 * Parse date string to standardized format
 */
export function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Clean up common variations
  dateStr = dateStr.trim();
  
  // Handle "Present", "Current", etc.
  if (/present|current|now/i.test(dateStr)) {
    return 'Present';
  }
  
  // Handle month/year formats
  const monthYear = dateStr.match(/([A-Za-z]+)\s+(\d{4})/);
  if (monthYear) {
    return `${monthYear[1]} ${monthYear[2]}`;
  }
  
  // Handle year only
  const year = dateStr.match(/\b(19|20)\d{2}\b/);
  if (year) {
    return year[0];
  }
  
  return dateStr;
}

/**
 * Parse date range from text (e.g., "Jan 2020 - Present")
 */
export function parseDateRange(text: string): { startDate: string; endDate?: string } {
  const parts = text.split(/[-–—]/);
  
  if (parts.length === 2) {
    return {
      startDate: parseDate(parts[0]),
      endDate: parseDate(parts[1])
    };
  }
  
  if (parts.length === 1) {
    return { startDate: parseDate(parts[0]) };
  }
  
  return { startDate: text };
}

/**
 * Extract bullet points from various list formats
 */
export function extractBullets(element: Element): string[] {
  const bullets: string[] = [];
  
  // Try standard list items
  const listItems = element.querySelectorAll('li');
  if (listItems.length > 0) {
    listItems.forEach(li => {
      const text = extractText(li);
      if (text) bullets.push(text);
    });
    return bullets;
  }
  
  // Try paragraphs with bullet symbols
  const paragraphs = element.querySelectorAll('p');
  paragraphs.forEach(p => {
    const text = extractText(p);
    if (text && /^[•·▪▸►‣⁃-]\s*/.test(text)) {
      bullets.push(text.replace(/^[•·▪▸►‣⁃-]\s*/, ''));
    }
  });
  
  if (bullets.length > 0) return bullets;
  
  // Try splitting by line breaks
  const text = element.innerHTML;
  const lines = text.split(/<br\s*\/?>/i);
  lines.forEach(line => {
    const cleaned = line.replace(/<[^>]+>/g, '').trim();
    if (cleaned && /^[•·▪▸►‣⁃-]\s*/.test(cleaned)) {
      bullets.push(cleaned.replace(/^[•·▪▸►‣⁃-]\s*/, ''));
    }
  });
  
  return bullets;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clean HTML by removing script tags and dangerous attributes
 */
export function sanitizeHtml(html: string): string {
  const doc = parseHtmlToDOM(html);
  
  // Remove script tags
  const scripts = doc.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove event handlers
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  
  return serializeDOMToHtml(doc);
}

/**
 * Check if text looks like a section title
 */
export function isSectionTitle(text: string): boolean {
  const commonTitles = [
    'experience', 'education', 'skills', 'projects', 'summary',
    'profile', 'contact', 'languages', 'certifications', 'training',
    'volunteering', 'volunteer', 'awards', 'publications', 'interests'
  ];
  
  const normalized = text.toLowerCase().trim();
  return commonTitles.some(title => normalized.includes(title));
}

/**
 * Detect section type from title text
 */
export function detectSectionType(title: string): string | undefined {
  const normalized = title.toLowerCase().trim();
  
  if (/experience|work|employment|career/i.test(normalized)) return 'experience';
  if (/education|academic/i.test(normalized)) return 'education';
  if (/skills|expertise|competenc/i.test(normalized)) return 'skills';
  if (/project/i.test(normalized)) return 'projects';
  if (/summary|profile|about/i.test(normalized)) return 'summary';
  if (/language/i.test(normalized)) return 'languages';
  if (/certification|certificate|license/i.test(normalized)) return 'certifications';
  if (/training|course/i.test(normalized)) return 'training';
  if (/volunteer/i.test(normalized)) return 'volunteering';
  if (/contact/i.test(normalized)) return 'profile';
  
  return undefined;
}

/**
 * Clone an element deeply
 */
export function cloneElement(element: Element): Element {
  return element.cloneNode(true) as Element;
}

/**
 * Find the largest text element (likely the name)
 */
export function findLargestText(doc: Document): Element | null {
  const elements = Array.from(doc.querySelectorAll('h1, h2, .name, [class*="name"]'));
  
  if (elements.length === 0) {
    // Fallback: find any large text
    const allElements = Array.from(doc.querySelectorAll('*'));
    return allElements.reduce((largest, el) => {
      const fontSize = window.getComputedStyle(el as HTMLElement).fontSize;
      const largestSize = largest ? window.getComputedStyle(largest as HTMLElement).fontSize : '0px';
      return parseFloat(fontSize) > parseFloat(largestSize) ? el : largest;
    }, null as Element | null);
  }
  
  return elements[0];
}

/**
 * Selector Normalization Utilities
 * 
 * These functions provide comprehensive selector lists for different
 * resume sections, ensuring compatibility across all template variations.
 */

/**
 * Get normalized selectors for experience-related elements
 */
export function normalizeExperienceSelectors() {
  return {
    container: [
      '.experience-item',
      '.job',
      '.work-item',
      '.timeline-item',
      '.role',
      '.position',
      '.two-col-section',
    ],
    title: [
      '.job-title',
      '.title',
      '.position',
      '.role',
      '.item-title',
      'h3',
      'h4',
    ],
    company: [
      '.company',
      '.company-name',
      '.organization',
      '.employer',
      '.company-location',
      '.date-company',
      '.details',
      '.item-subtitle',
    ],
    date: [
      '.date',
      '.dates',
      '.job-date',
      '.period',
      '.duration',
      '.item-date',
      '.date-company',
    ],
    bullets: [
      '.achievements',
      'ul',
      '.bullets',
      '.item-description',
      '.responsibilities-list',
      '[class*="description"]',
    ],
  };
}

/**
 * Get normalized selectors for education-related elements
 */
export function normalizeEducationSelectors() {
  return {
    container: [
      '.education-item',
      '.school',
      '.degree',
      '.academic-item',
      '.timeline-item',
      '.two-col-section',
    ],
    school: [
      '.school',
      '.school-name',
      '.university',
      '.institution',
      '.college',
      '.item-subtitle',
      '.details',
    ],
    degree: [
      '.degree',
      '.degree-info',
      '.major',
      '.field',
      '.item-title',
    ],
    date: [
      '.date',
      '.education-date',
      '.graduation',
      '.item-date',
    ],
  };
}

/**
 * Get normalized selectors for skills-related elements
 */
export function normalizeSkillsSelectors() {
  return {
    container: [
      '.skills-group',
      '.skill-group',
      '.skills-grid',
      '[class*="skill-category"]',
    ],
    category: [
      '.skills-category',
      '.category',
      'strong',
      'b',
    ],
    list: [
      '.skills-list',
      '.skills',
      '.expertise-list',
      'ul',
    ],
  };
}

/**
 * Get normalized selectors for contact/profile-related elements
 */
export function normalizeContactSelectors() {
  return {
    name: [
      '.name',
      '.header .name',
      'h1',
      '.profile-name',
      '.header-text',
      '.header-left h1',
      '.right-header h1',
      '[class*="name"]',
    ],
    title: [
      '.job-title',
      '.title',
      '.role',
      '.header .title',
      '.profile-title',
      '.subtitle',
      '.header-left .title',
    ],
    location: [
      '.location',
      '.address',
      '.contact-item.contact-location',
      '[class*="location"]',
    ],
    contactSection: [
      '.contact-info',
      '.contact',
      '.header',
      '.profile',
      '.header-info',
      '.header-right',
      '.footer',
    ],
    email: [
      'a[href^="mailto:"]',
      '.contact-email',
      '.contact-item.contact-email',
    ],
    phone: [
      'a[href^="tel:"]',
      '.contact-phone',
      '.contact-item.contact-phone',
    ],
    website: [
      '.contact-web',
      '.contact-item.contact-web',
    ],
    photo: [
      '.profile-pic',
      '.profile-photo',
      '.headshot',
      'img[class*="profile"]',
      'img[class*="photo"]',
      '.header img',
    ],
  };
}

/**
 * Get normalized selectors for summary-related elements
 */
export function normalizeSummarySelectors() {
  return {
    container: [
      '.summary',
      '.about',
      '.profile-summary',
      '.about-me',
      '.about-me-text',
      '[class*="summary"]',
    ],
  };
}

/**
 * Get all normalized selectors for a given section type
 */
export function getNormalizedSelectors(sectionType: string): Record<string, string[]> {
  switch (sectionType) {
    case 'experience':
      return normalizeExperienceSelectors();
    case 'education':
      return normalizeEducationSelectors();
    case 'skills':
      return normalizeSkillsSelectors();
    case 'contact':
    case 'profile':
      return normalizeContactSelectors();
    case 'summary':
      return normalizeSummarySelectors();
    default:
      return {};
  }
}
