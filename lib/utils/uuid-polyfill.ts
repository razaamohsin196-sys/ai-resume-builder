/**
 * Polyfill for crypto.randomUUID()
 * Provides a fallback for browsers/environments that don't support it
 */

// UUID v4 generator (RFC 4122)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Initialize crypto.randomUUID polyfill if not available
 * Call this early in the app lifecycle
 */
export function initUUIDPolyfill(): void {
  if (typeof window !== 'undefined' && typeof crypto !== 'undefined') {
    // Check if randomUUID is available
    if (!crypto.randomUUID) {
      // Polyfill for browsers that don't support it
      (crypto as any).randomUUID = generateUUID;
    }
  }
  
  // Also polyfill for Node.js environments if needed
  if (typeof global !== 'undefined' && typeof (global as any).crypto === 'undefined') {
    (global as any).crypto = {
      randomUUID: generateUUID,
    };
  }
}

// Export the UUID generator for direct use if needed
export { generateUUID };
