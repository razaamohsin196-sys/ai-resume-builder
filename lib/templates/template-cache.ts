/**
 * Template Cache Utility
 * 
 * Caches generated templates in localStorage to avoid regenerating
 * the same template for the same profile data.
 */

import { CareerProfile } from '@/types/career';
import { CareerIntent } from '@/types/career';
import { ResumeTemplate } from './types';

const TEMPLATE_CACHE_PREFIX = 'resume_template_cache_';
const CACHE_VERSION = '1'; // Increment to invalidate all caches

/**
 * Generate a cache key from template, profile, and intent
 */
function generateCacheKey(
    templateId: string,
    profile: CareerProfile,
    intent: CareerIntent,
    options?: { fitToOnePage?: boolean; hasPhoto?: boolean }
): string {
    // Create a stable hash of profile data
    // We use a simplified hash based on key profile fields
    const profileHash = JSON.stringify({
        name: profile.personal?.name,
        email: profile.contact?.email,
        summary: profile.summary?.substring(0, 100), // First 100 chars for hash
        itemsCount: profile.items?.length || 0,
        // Hash of item IDs to detect changes
        itemIds: profile.items?.map(item => item.id).sort().join(',') || '',
    });
    
    const intentHash = JSON.stringify({
        targetRole: intent.targetRole,
        targetLocation: intent.targetLocation,
    });
    
    const optionsHash = JSON.stringify(options || {});
    
    // Create a simple hash (not cryptographically secure, but good enough for cache keys)
    const combined = `${templateId}_${profileHash}_${intentHash}_${optionsHash}_v${CACHE_VERSION}`;
    
    // Use a simple hash function
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `${TEMPLATE_CACHE_PREFIX}${templateId}_${Math.abs(hash)}`;
}

/**
 * Get cached template HTML if it exists
 */
export function getCachedTemplate(
    template: ResumeTemplate,
    profile: CareerProfile,
    intent: CareerIntent,
    options?: { fitToOnePage?: boolean; hasPhoto?: boolean }
): string | null {
    try {
        const cacheKey = generateCacheKey(template.id, profile, intent, options);
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            console.log(`[Template Cache] Cache hit for template: ${template.name}`);
            return cached;
        }
        
        console.log(`[Template Cache] Cache miss for template: ${template.name}`);
        return null;
    } catch (e) {
        console.error('[Template Cache] Error reading cache:', e);
        return null;
    }
}

/**
 * Save generated template HTML to cache
 */
export function saveCachedTemplate(
    template: ResumeTemplate,
    profile: CareerProfile,
    intent: CareerIntent,
    html: string,
    options?: { fitToOnePage?: boolean; hasPhoto?: boolean }
): void {
    try {
        const cacheKey = generateCacheKey(template.id, profile, intent, options);
        localStorage.setItem(cacheKey, html);
        console.log(`[Template Cache] Saved template: ${template.name}`);
    } catch (e) {
        // Handle quota exceeded error gracefully
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            console.warn('[Template Cache] Storage quota exceeded, clearing old caches...');
            clearOldCaches();
            
            // Retry once after clearing
            try {
                const cacheKey = generateCacheKey(template.id, profile, intent, options);
                localStorage.setItem(cacheKey, html);
                console.log(`[Template Cache] Saved template after clearing: ${template.name}`);
            } catch (e2) {
                console.error('[Template Cache] Failed to save even after clearing:', e2);
            }
        } else {
            console.error('[Template Cache] Error saving cache:', e);
        }
    }
}

/**
 * Clear old caches to free up space
 * Keeps the most recent 10 templates
 */
function clearOldCaches(): void {
    try {
        const keys: Array<{ key: string; timestamp: number }> = [];
        
        // Find all cache keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(TEMPLATE_CACHE_PREFIX)) {
                // Try to get timestamp from the stored data (we'll add this later)
                // For now, just collect keys
                keys.push({ key, timestamp: Date.now() }); // Use current time as fallback
            }
        }
        
        // Sort by timestamp (newest first) and keep only 10
        keys.sort((a, b) => b.timestamp - a.timestamp);
        const toKeep = keys.slice(0, 10);
        const toRemove = keys.slice(10);
        
        // Remove old caches
        toRemove.forEach(({ key }) => {
            localStorage.removeItem(key);
        });
        
        console.log(`[Template Cache] Cleared ${toRemove.length} old caches, kept ${toKeep.length}`);
    } catch (e) {
        console.error('[Template Cache] Error clearing old caches:', e);
    }
}

/**
 * Clear all template caches
 */
export function clearAllTemplateCaches(): void {
    try {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(TEMPLATE_CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[Template Cache] Cleared ${keysToRemove.length} caches`);
    } catch (e) {
        console.error('[Template Cache] Error clearing all caches:', e);
    }
}

/**
 * Clear cache for a specific template
 */
export function clearTemplateCache(templateId: string): void {
    try {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${TEMPLATE_CACHE_PREFIX}${templateId}_`)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[Template Cache] Cleared ${keysToRemove.length} caches for template: ${templateId}`);
    } catch (e) {
        console.error('[Template Cache] Error clearing template cache:', e);
    }
}
