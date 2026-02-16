/**
 * Resume Backend API Client
 * 
 * Handles communication with the new resume generation backend service
 */

import { BACKEND_API } from '../config';
import { CareerProfile, CareerIntent } from '@/types/career';

export interface GenerateResumeRequest {
  profile: CareerProfile;
  intent: CareerIntent;
  templateHtml?: string; // Existing template HTML to populate and fix
  templateStyle?: string; // Template name/style for detection
  templateId?: string; // Template ID/key for precise detection
  options?: {
    fitToOnePage?: boolean;
    hasPhoto?: boolean;
  };
}

export interface GenerateResumeResponse {
  html: string;
  metadata?: {
    generatedAt: string;
    templateStyle?: string;
    generationTimeMs?: number;
    cached?: boolean;
  };
}

/**
 * Generate resume HTML using the new backend service
 * If templateHtml is provided, it will populate and fix the template
 * Otherwise, it will generate from scratch
 */
export async function generateResumeFromBackend(
  profile: CareerProfile,
  intent: CareerIntent,
  options?: {
    fitToOnePage?: boolean;
    hasPhoto?: boolean;
    templateStyle?: string;
    templateId?: string; // Template ID/key for precise detection
    templateHtml?: string; // Pass existing template HTML to populate and fix
  }
): Promise<string> {
  try {
    const request: GenerateResumeRequest = {
      profile,
      intent,
      templateHtml: options?.templateHtml, // Pass template HTML if provided
      templateStyle: options?.templateStyle, // Template name for detection
      templateId: options?.templateId, // Template ID for precise detection
      options: {
        fitToOnePage: options?.fitToOnePage,
        hasPhoto: options?.hasPhoto,
      },
    };

    console.log('[generateResumeFromBackend] Calling backend API:', BACKEND_API.generateResume);
    const response = await fetch(BACKEND_API.generateResume, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.message || `Backend API error: ${response.status}`);
    }

    const data: GenerateResumeResponse = await response.json();
    return data.html;
  } catch (error: any) {
    console.error('[generateResumeFromBackend] Error:', error);
    
    // If backend is not available, throw error so caller can fallback
    if (error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED')) {
      throw new Error('Backend service is not available. Please ensure the backend server is running.');
    }
    
    throw error;
  }
}

/**
 * Get available template styles from backend
 */
export async function getTemplateStyles(): Promise<string[]> {
  try {
    const response = await fetch(BACKEND_API.templateStyles);
    
    if (!response.ok) {
      return ['modern professional', 'classic', 'minimalist'];
    }
    
    const data = await response.json();
    return data.styles || ['modern professional', 'classic', 'minimalist'];
  } catch (error) {
    console.warn('[getTemplateStyles] Backend not available, using defaults');
    return ['modern professional', 'classic', 'minimalist'];
  }
}

/**
 * Generate resume HTML using streaming (real-time updates)
 * If templateHtml is provided, it will populate and fix the template
 * Otherwise, it will generate from scratch
 * 
 * @param profile - Career profile data
 * @param intent - Career intent
 * @param options - Generation options
 * @param onChunk - Callback for each chunk of HTML received
 * @returns Promise that resolves with the complete HTML
 */
export async function generateResumeFromBackendStream(
  profile: CareerProfile,
  intent: CareerIntent,
  options: {
    fitToOnePage?: boolean;
    hasPhoto?: boolean;
    templateStyle?: string;
    templateId?: string; // Template ID/key for precise detection
    templateHtml?: string;
    onChunk: (chunk: string, accumulated: string) => void;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const request: GenerateResumeRequest = {
        profile,
        intent,
        templateHtml: options.templateHtml,
        templateStyle: options.templateStyle, // Template name for detection
        templateId: options.templateId, // Template ID for precise detection
        options: {
          fitToOnePage: options.fitToOnePage,
          hasPhoto: options.hasPhoto,
        },
      };

      // Use fetch with streaming - use the explicit streaming endpoint
      const streamUrl = BACKEND_API.generateResumeStream;
      console.log('[generateResumeFromBackendStream] Calling backend streaming API:', streamUrl);
      fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
        .then(async (response) => {
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.message || `Backend API error: ${response.status}`);
          }

          if (!response.body) {
            throw new Error('Response body is null');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedHtml = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Process any remaining data in buffer
              if (buffer.trim()) {
                const events = buffer.split('\n\n').filter(e => e.trim());
                for (const event of events) {
                  const dataLine = event.split('\n').find(line => line.startsWith('data: '));
                  if (dataLine) {
                    try {
                      const data = JSON.parse(dataLine.slice(6));
                      if (data.type === 'chunk') {
                        accumulatedHtml += data.content;
                        options.onChunk(data.content, accumulatedHtml);
                      } else if (data.type === 'done') {
                        const finalHtml = data.html || accumulatedHtml;
                        resolve(finalHtml);
                        return;
                      }
                    } catch (e) {
                      // Ignore parse errors for incomplete events at end
                    }
                  }
                }
              }
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            
            // SSE events are separated by \n\n
            // Process all complete events (ending with \n\n)
            while (buffer.includes('\n\n')) {
              const eventEnd = buffer.indexOf('\n\n');
              const event = buffer.substring(0, eventEnd);
              buffer = buffer.substring(eventEnd + 2); // Remove processed event and \n\n
              
              if (!event.trim()) continue;
              
              // Find the data line in this event
              const lines = event.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const jsonStr = line.slice(6).trim(); // Remove 'data: ' prefix and trim whitespace
                    if (!jsonStr) continue; // Skip empty data lines
                    
                    const data = JSON.parse(jsonStr);
                    
                    if (data.type === 'start') {
                      // Generation started
                      console.log('[Stream] Generation started');
                    } else if (data.type === 'chunk') {
                      // New chunk received
                      if (data.content) {
                        accumulatedHtml += data.content;
                        // Call onChunk immediately to trigger UI update
                        options.onChunk(data.content, accumulatedHtml);
                        // Log first few chunks for debugging
                        if (accumulatedHtml.length < 500) {
                          console.log('[Stream] Chunk received, total length:', accumulatedHtml.length);
                        }
                      }
                    } else if (data.type === 'done') {
                      // Generation complete
                      const finalHtml = data.html || accumulatedHtml;
                      resolve(finalHtml);
                      return;
                    } else if (data.type === 'error') {
                      throw new Error(data.error || 'Streaming error');
                    }
                  } catch (parseError: any) {
                    // Only log if it looks like it should be valid JSON
                    // Skip logging for obviously incomplete JSON (missing closing brace)
                    const jsonStr = line.slice(6).trim();
                    const openBraces = (jsonStr.match(/{/g) || []).length;
                    const closeBraces = (jsonStr.match(/}/g) || []).length;
                    
                    // Only warn if braces are balanced (suggests it should be valid JSON)
                    if (openBraces === closeBraces && openBraces > 0) {
                      console.warn('[Stream] Failed to parse SSE data:', parseError.message, 'JSON:', jsonStr.substring(0, 100));
                    }
                    // Silently skip incomplete JSON (unbalanced braces)
                  }
                  break; // Only process first data line per event
                }
              }
            }
          }

          // If we exit the loop without a 'done' message, resolve with accumulated HTML
          resolve(accumulatedHtml);
        })
        .catch((error) => {
          console.error('[generateResumeFromBackendStream] Error:', error);
          
          // If backend is not available, throw error so caller can fallback
          if (error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED')) {
            reject(new Error('Backend service is not available. Please ensure the backend server is running.'));
          } else {
            reject(error);
          }
        });
    } catch (error: any) {
      reject(error);
    }
  });
}

/**
 * Check if backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(BACKEND_API.health, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
