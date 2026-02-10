/**
 * Placeholder Detection Utility
 * 
 * Detects and filters out common placeholder text patterns
 * to prevent placeholder content from being carried over during template switching.
 */

/**
 * Common placeholder patterns across all templates
 */
const PLACEHOLDER_PATTERNS = [
  // Names
  /becky\s+shu/i,
  /lorna\s+alvarado/i,
  /rachelle\s+beaudry/i,
  /juliana\s+silva/i,
  /olivia\s+wilson/i,
  /harumi\s+kobayashi/i,
  /bailey\s+dupont/i,
  /adeline\s+palmerston/i,
  /mira\s+karlsson/i,  // Template2ColumnMinimal
  /tonnie\s+thomsen/i,  // Template2ColumnStylishBlocks
  /sharya\s+singh/i,  // BandwProfessional
  /mariana\s+anderson/i,  // Template2ColumnTimeline
  /howard\s+ong/i,  // BlueSimpleProfile
  /niranjan\s+devi/i,  // BandwProfessional reference
  /aarya\s+agarwal/i,  // BandwProfessional reference
  
  // Placeholder text
  /lorem\s+ipsum/i,
  /dolor\s+sit\s+amet/i,
  /consectetur\s+adipiscing/i,
  /nullam\s+pharetra/i,
  /social\s+media\s+marketing\s+specialist.*utilizing\s+my\s+5\+\s+years/i,  // Template2ColumnMinimal summary
  /increase\s+brand\s+awareness.*engagement.*conversion\s+rates/i,  // Template2ColumnMinimal summary fragment
  /my\s+primary\s+objective\s+is\s+to\s+provide\s+a\s+safe\s+and\s+nurturing\s+learning\s+environment/i,  // Template2ColumnStylishBlocks objective
  /encourages\s+student\s+growth\s+and\s+development/i,  // Template2ColumnStylishBlocks objective fragment
  /facilitate\s+engaging\s+and\s+challenging\s+instruction/i,  // Template2ColumnStylishBlocks objective fragment
  /collaborating\s+with\s+colleagues.*parents.*community\s+members\s+to\s+support\s+student\s+learning/i,  // Template2ColumnStylishBlocks communication
  /maintain\s+a\s+positive\s+classroom\s+environment\s+that\s+promotes\s+student\s+engagement/i,  // Template2ColumnStylishBlocks leadership
  /planning\s+and\s+delivering\s+effective\s+instruction\s+across\s+various\s+subjects/i,  // Template2ColumnStylishBlocks experience
  
  // Placeholder emails
  /hello@reallygreatsite\.com/i,
  /example@email\.com/i,
  /mira@example\.com/i,  // Template2ColumnMinimal
  /tonnie@example\.com/i,  // Template2ColumnStylishBlocks
  
  // Placeholder companies
  /arowwai\s+industries/i,
  /wardiere\s+inc/i,
  /wardiere\s+company/i,  // BandwProfessional
  /wardiere\s+university/i,  // BandwProfessional
  /wardiere\s+high\s+school/i,  // BandwProfessional
  /salford\s+&\s+co/i,
  /borcelle\s+university/i,
  /borcelle\s+studio/i,  // BandwProfessional
  /borcelle\s+business\s+school/i,  // BlueSimpleProfile
  /rimberio\s+university/i,
  /giggling\s+platypus/i,
  /bellows\s+college/i,  // Template2ColumnMinimal & Template2ColumnStylishBlocks
  /east\s+beringer\s+community\s+college/i,  // Template2ColumnMinimal
  /balsam\s+elementary\s+school/i,  // Template2ColumnStylishBlocks
  /ginyard\s+international/i,  // Template2ColumnTimeline, BlueSimpleProfile
  /ingoude\s+company/i,  // BlueSimpleProfile
  /timmerman\s+industries/i,  // BlueSimpleProfile
  /larana\s+business\s+school/i,  // BlueSimpleProfile
  /fauget/i,  // ElegantProfessionalPhoto
  /studio\s+shodwe/i,  // ElegantProfessionalPhoto
  /keithston\s+and\s+partners/i,  // ElegantProfessionalPhoto
  /liceria/i,  // OliveGreenModern, AccentColorMinimal
  /korina\s+villanueva/i,  // AccentColorMinimal
  /university\s+of\s+lorem/i,  // AccentColorMinimal
  
  // Placeholder degrees/education
  /ba\s+in\s+communications/i,  // Template2ColumnMinimal
  /aa\s+in\s+communications/i,  // Template2ColumnMinimal
  /bachelor'?s?\s+degree\s+in\s+elementary\s+education/i,  // Template2ColumnStylishBlocks
  
  // Placeholder skills (Template2ColumnMinimal)
  /^platform\s+expertise$/i,
  /^content\s+creation$/i,
  /^analytics$/i,
  /^communication$/i,
  /^creativity$/i,
  /^strategic\s+thinking$/i,
  
  // Placeholder experience bullets (Template2ColumnMinimal)
  /developed\s+and\s+executed\s+successful\s+social\s+media\s+campaigns.*multiple\s+platforms/i,
  /managed\s+and\s+grew.*social\s+media\s+accounts.*engaging\s+content.*monitoring\s+analytics/i,
  /collaborated\s+with\s+cross-functional\s+teams.*integrated\s+marketing\s+campaigns/i,
  /led\s+the\s+development.*digital\s+marketing\s+strategy.*email\s+marketing.*paid\s+advertising/i,
  /analyzed\s+and\s+reported\s+on.*performance.*digital\s+marketing\s+campaigns/i,
  /developed\s+and\s+executed\s+content\s+marketing\s+strategies.*leveraged\s+social\s+media/i,
  /produced\s+high-quality.*engaging\s+content.*social\s+media.*email\s+marketing/i,
  
  // Placeholder dates
  /20xx\s*-?\s*20yy/i,  // Template2ColumnMinimal and other templates
  /jan\s+20xx/i,  // Template2ColumnStylishBlocks
  /aug\s+20xx/i,  // Template2ColumnStylishBlocks
  /oct\s+20xx/i,  // Template2ColumnStylishBlocks
  /may\s+20xx/i,  // Template2ColumnStylishBlocks
  /sep\s+20xx/i,  // Template2ColumnStylishBlocks
  /jun\s+20xx/i,  // Template2ColumnStylishBlocks
  
  // Placeholder phone numbers
  /816-555-0146/i,  // Template2ColumnMinimal
  /706\.555\.0123/i,  // Template2ColumnStylishBlocks
  
  // Placeholder websites
  /www\.example\.com/i,  // Template2ColumnMinimal
  /www\.interestingsite\.com/i,  // Template2ColumnStylishBlocks
  /www\.reallygreatsite\.com/i,  // Multiple templates
  
  // Placeholder locations
  /santa\s+fe,?\s+nm/i,  // Template2ColumnStylishBlocks
  /987\s+6th\s+ave/i,  // Template2ColumnStylishBlocks address
  /123\s+anywhere\s+st/i,  // Multiple templates
  
  // Placeholder phone numbers (more templates)
  /\+?123[-.]?456[-.]?7890/i,  // Common across many templates
  
  // Generic placeholder
  /\[name\]/i,
  /\[company\]/i,
  /\[email\]/i,
  /your\s+name\s+here/i,
];

/**
 * Check if text is placeholder content
 */
export function isPlaceholderText(text: string): boolean {
  if (!text || text.trim().length === 0) return true;
  
  // Check against placeholder patterns
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Filter out placeholder bullets
 */
export function filterPlaceholderBullets(bullets: string[]): string[] {
  return bullets.filter(bullet => !isPlaceholderText(bullet));
}

/**
 * Check if any field contains placeholder data
 */
export function hasPlaceholderData(data: any): boolean {
  if (typeof data === 'string') {
    return isPlaceholderText(data);
  }
  
  if (Array.isArray(data)) {
    return data.some(item => hasPlaceholderData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    return Object.values(data).some(value => hasPlaceholderData(value));
  }
  
  return false;
}

/**
 * Clean placeholder data from resume data object
 */
export function cleanPlaceholderData(data: any): any {
  if (typeof data === 'string') {
    return isPlaceholderText(data) ? '' : data;
  }
  
  if (Array.isArray(data)) {
    return data
      .filter(item => !isPlaceholderText(JSON.stringify(item)))
      .map(item => cleanPlaceholderData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const cleaned: any = {};
    Object.entries(data).forEach(([key, value]) => {
      const cleanedValue = cleanPlaceholderData(value);
      if (cleanedValue !== '' && cleanedValue !== null && cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    });
    return cleaned;
  }
  
  return data;
}

/**
 * Clean template HTML for preview display by stripping all visible placeholder text.
 * Preserves structure and styling but removes fake names, Lorem ipsum, fake emails, etc.
 * Works on raw HTML strings using regex (no DOM required).
 */
export function cleanTemplateHtmlForPreview(html: string): string {
  if (!html) return html;
  
  // Step 1: Split HTML into style/script regions and content regions
  // to avoid accidentally modifying CSS or JS.
  // Process only text content outside <style> and <script> tags.
  const parts: string[] = [];
  let lastIndex = 0;
  
  // Match <style>...</style> and <script>...</script> blocks (preserve them unchanged)
  const tagPattern = /<(style|script)[\s>][\s\S]*?<\/\1>/gi;
  let tagMatch;
  
  while ((tagMatch = tagPattern.exec(html)) !== null) {
    // Process the content BEFORE this tag block
    if (tagMatch.index > lastIndex) {
      parts.push(cleanTextSegments(html.slice(lastIndex, tagMatch.index)));
    }
    // Preserve the style/script block unchanged
    parts.push(tagMatch[0]);
    lastIndex = tagMatch.index + tagMatch[0].length;
  }
  
  // Process the remaining content after the last style/script block
  if (lastIndex < html.length) {
    parts.push(cleanTextSegments(html.slice(lastIndex)));
  }
  
  return parts.join('');
}

/**
 * Clean text content between HTML tags in a segment that is NOT inside <style>/<script>.
 */
function cleanTextSegments(segment: string): string {
  return segment.replace(
    />((?:[^<]|\n)+)</g,
    (match, textContent: string) => {
      const trimmed = textContent.trim();
      if (!trimmed) return match; // Preserve whitespace-only
      
      if (isPlaceholderText(trimmed)) {
        // Preserve the tag boundary characters but blank the text
        return '> <';
      }
      
      return match;
    }
  );
}