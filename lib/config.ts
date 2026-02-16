/**
 * Backend API Configuration
 * 
 * The backend URL can be set via environment variable RESUME_BACKEND_URL
 * Defaults to http://localhost:3001 for development
 */
export const BACKEND_URL = 
  process.env.NEXT_PUBLIC_RESUME_BACKEND_URL || 
  process.env.RESUME_BACKEND_URL || 
  'http://localhost:3001';

export const BACKEND_API = {
  generateResume: `${BACKEND_URL}/api/generate-resume`,
  generateResumeStream: `${BACKEND_URL}/api/generate-resume-stream`,
  templateStyles: `${BACKEND_URL}/api/template-styles`,
  health: `${BACKEND_URL}/health`,
};
