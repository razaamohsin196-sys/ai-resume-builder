/**
 * Deduplication Utility
 * 
 * Detects and removes duplicate text content to prevent duplication
 * in resume templates during parsing, rendering, and template population.
 */

/**
 * Check if two text strings are essentially the same (normalized comparison)
 */
export function isDuplicateText(text1: string, text2: string): boolean {
  if (!text1 || !text2) return false;
  
  // Normalize both strings
  const normalize = (str: string) => 
    str.toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[•·▪▸►‣⁃\-]/g, '') // Remove bullet symbols
      .replace(/[^\w\s]/g, ''); // Remove punctuation
  
  const normalized1 = normalize(text1);
  const normalized2 = normalize(text2);
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // Check if one contains the other (for nested content)
  if (normalized1.length > 20 && normalized2.length > 20) {
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      // If one is significantly longer, it might be a container
      const lengthDiff = Math.abs(normalized1.length - normalized2.length);
      const shorterLength = Math.min(normalized1.length, normalized2.length);
      // If the shorter one is more than 80% of the longer one, consider it a duplicate
      if (lengthDiff < shorterLength * 0.2) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Remove duplicate strings from an array
 */
export function deduplicateArray(items: string[]): string[] {
  const seen = new Set<string>();
  const normalizedSeen = new Set<string>();
  const result: string[] = [];
  
  for (const item of items) {
    if (!item || item.trim().length === 0) continue;
    
    // Normalize for comparison
    const normalized = item.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Check exact match
    if (seen.has(item)) continue;
    
    // Check normalized match
    if (normalizedSeen.has(normalized)) continue;
    
    // Check against all previously seen items for near-duplicates
    let isDuplicate = false;
    for (const seenItem of normalizedSeen) {
      if (isDuplicateText(item, seenItem)) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.add(item);
      normalizedSeen.add(normalized);
      result.push(item);
    }
  }
  
  return result;
}

/**
 * Remove duplicate text from a single string (handles repeated phrases)
 */
export function deduplicateText(text: string): string {
  if (!text || text.trim().length === 0) return text;
  
  // Split by common delimiters
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  const deduplicated = deduplicateArray(sentences);
  
  return deduplicated.join('. ').trim();
}

/**
 * Remove duplicate content from HTML element text
 * This handles cases where nested elements cause text duplication
 * Uses a simpler approach that works in both browser and Node.js
 */
export function deduplicateElementText(element: any): void {
  if (!element || typeof element.querySelectorAll !== 'function') return;
  
  try {
    // For list items and paragraphs, check for duplicate siblings
    const listItems = element.querySelectorAll('li');
    if (listItems && listItems.length > 0) {
      const seen = new Set<string>();
      const toRemove: any[] = [];
      
      for (let i = 0; i < listItems.length; i++) {
        const li = listItems[i];
        if (!li || typeof li.textContent === 'undefined') continue;
        
        const text = (li.textContent || '').trim();
        if (!text) continue;
        
        const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Check for duplicates
        let isDuplicate = false;
        for (const seenText of seen) {
          if (isDuplicateText(text, seenText)) {
            isDuplicate = true;
            break;
          }
        }
        
        if (isDuplicate) {
          toRemove.push(li);
        } else {
          seen.add(normalized);
        }
      }
      
      // Remove duplicates
      toRemove.forEach((item: any) => {
        if (item && typeof item.remove === 'function') {
          item.remove();
        } else if (item && item.parentNode) {
          item.parentNode.removeChild(item);
        }
      });
    }
    
    // For paragraphs, check for duplicates
    const paragraphs = element.querySelectorAll('p');
    if (paragraphs && paragraphs.length > 0) {
      const seen = new Set<string>();
      const toRemove: any[] = [];
      
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        if (!p || typeof p.textContent === 'undefined') continue;
        
        const text = (p.textContent || '').trim();
        if (!text) continue;
        
        const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Check for duplicates
        let isDuplicate = false;
        for (const seenText of seen) {
          if (isDuplicateText(text, seenText)) {
            isDuplicate = true;
            break;
          }
        }
        
        if (isDuplicate) {
          toRemove.push(p);
        } else {
          seen.add(normalized);
        }
      }
      
      // Remove duplicates
      toRemove.forEach((item: any) => {
        if (item && typeof item.remove === 'function') {
          item.remove();
        } else if (item && item.parentNode) {
          item.parentNode.removeChild(item);
        }
      });
    }
  } catch (error) {
    // Silently fail if DOM operations aren't available
    console.warn('[deduplicateElementText] Error:', error);
  }
}

/**
 * Remove duplicate items from resume data structures
 */
export function deduplicateResumeData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const cleaned: any = Array.isArray(data) ? [] : {};
  
  if (Array.isArray(data)) {
    const seen = new Set<string>();
    
    for (const item of data) {
      if (typeof item === 'string') {
        // Deduplicate string arrays
        const normalized = item.toLowerCase().trim();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          cleaned.push(item);
        }
      } else if (typeof item === 'object' && item !== null) {
        // For objects, check for duplicate based on key fields
        const key = getItemKey(item);
        if (key && !seen.has(key)) {
          seen.add(key);
          cleaned.push(deduplicateResumeData(item));
        } else if (!key) {
          // No key field, just deduplicate recursively
          cleaned.push(deduplicateResumeData(item));
        }
      } else {
        cleaned.push(item);
      }
    }
  } else {
    // For objects, recursively clean each property
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        cleaned[key] = deduplicateResumeData(value);
      } else if (typeof value === 'string') {
        // Deduplicate text in strings
        cleaned[key] = deduplicateText(value);
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = deduplicateResumeData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
}

/**
 * Get a unique key for a resume item (for deduplication)
 */
function getItemKey(item: any): string | null {
  if (!item || typeof item !== 'object') return null;
  
  // Try common key fields
  if (item.title && item.company) {
    return `${item.title}|${item.company}`.toLowerCase();
  }
  if (item.role && item.organization) {
    return `${item.role}|${item.organization}`.toLowerCase();
  }
  if (item.degree && item.school) {
    return `${item.degree}|${item.school}`.toLowerCase();
  }
  if (item.name) {
    return item.name.toLowerCase();
  }
  if (item.title) {
    return item.title.toLowerCase();
  }
  if (item.language) {
    return item.language.toLowerCase();
  }
  
  return null;
}

/**
 * Remove duplicate content from HTML string
 * This is a post-processing step to clean up any duplicates
 */
export function deduplicateHtml(html: string): string {
  if (!html) return html;
  
  try {
    // Parse HTML - use the same utility as the rest of the codebase
    // Dynamic import to avoid circular dependencies
    const { parseHtmlToDOM, serializeDOMToHtml } = require('./utils');
    const doc = parseHtmlToDOM(html);
    
    // Find all sections
    const sections = doc.querySelectorAll('.section, section, [class*="section"]');
    
    for (const section of Array.from(sections) as Element[]) {
      // Special handling for volunteering sections - they're prone to duplication
      const sectionTitle = section.querySelector('.section-title, h2, h3');
      const titleText = sectionTitle?.textContent?.toLowerCase() || '';
      const isVolunteeringSection = /volunteer/i.test(titleText);
      
      if (isVolunteeringSection) {
        // For volunteering sections, be more aggressive about removing duplicates
        // Remove duplicate items (volunteer-item, experience-item, li)
        const volunteerItems = section.querySelectorAll('.volunteer-item, .experience-item, li');
        const seenItems = new Set<string>();
        const itemsToRemove: any[] = [];
        
        for (let i = 0; i < volunteerItems.length; i++) {
          const item = volunteerItems[i] as Element | null;
          if (!item) continue;
          const itemText = (item.textContent || '').trim();
          if (!itemText) continue;
          
          // Normalize text
          const normalized = itemText.toLowerCase().replace(/\s+/g, ' ').replace(/[•·▪▸►‣⁃-]/g, '');
          
          // Check for duplicates
          let isDuplicate = false;
          for (const seen of seenItems) {
            if (normalized === seen || 
                (normalized.length > 15 && seen.length > 15 && 
                 (normalized.includes(seen) || seen.includes(normalized)))) {
              isDuplicate = true;
              break;
            }
          }
          
          if (isDuplicate) {
            itemsToRemove.push(item);
          } else {
            seenItems.add(normalized);
          }
        }
        
        // Remove duplicate items
        itemsToRemove.forEach((item: any) => {
          if (item && typeof item.remove === 'function') {
            item.remove();
          } else if (item && item.parentNode) {
            item.parentNode.removeChild(item);
          }
        });
        
        // Remove standalone "Organization" text nodes that shouldn't be there
        const allText = section.textContent || '';
        if (allText.includes('Organization')) {
          // Find and remove paragraphs or divs that only contain "Organization"
          const orgElements = section.querySelectorAll('p, div, span');
          for (let i = 0; i < orgElements.length; i++) {
            const el = orgElements[i];
            const text = (el.textContent || '').trim();
            if (text === 'Organization' || text === 'organization') {
              if (el && typeof el.remove === 'function') {
                el.remove();
              } else if (el && el.parentNode) {
                el.parentNode.removeChild(el);
              }
            }
          }
        }
      }
      
      // Deduplicate text in each section
      deduplicateElementText(section);
      
      // Remove duplicate list items
      const lists = section.querySelectorAll('ul, ol');
      for (const list of Array.from(lists) as Element[]) {
        const items = Array.from(list.querySelectorAll('li')) as Element[];
        const seen = new Set<string>();
        const toRemove: Element[] = [];
        
        for (const item of items) {
          const text = item.textContent?.trim() || '';
          if (!text) continue;
          
          const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
          
          // Check for duplicates
          let isDuplicate = false;
          for (const seenText of seen) {
            if (isDuplicateText(text, seenText)) {
              isDuplicate = true;
              break;
            }
          }
          
          if (isDuplicate) {
            toRemove.push(item);
          } else {
            seen.add(normalized);
          }
        }
        
        // Remove duplicates
        toRemove.forEach(item => item.remove());
      }
      
      // Remove duplicate paragraphs
      const paragraphs = section.querySelectorAll('p');
      const seen = new Set<string>();
      const toRemove: Element[] = [];
      
      for (const p of Array.from(paragraphs) as Element[]) {
        const text = p.textContent?.trim() || '';
        if (!text) continue;
        
        const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Check for duplicates
        let isDuplicate = false;
        for (const seenText of seen) {
          if (isDuplicateText(text, seenText)) {
            isDuplicate = true;
            break;
          }
        }
        
        if (isDuplicate) {
          toRemove.push(p);
        } else {
          seen.add(normalized);
        }
      }
      
      // Remove duplicates
      toRemove.forEach(item => item.remove());
    }
    
    // Serialize back to HTML
    return serializeDOMToHtml(doc);
  } catch (error) {
    console.error('[deduplicateHtml] Error:', error);
    return html; // Return original on error
  }
}
