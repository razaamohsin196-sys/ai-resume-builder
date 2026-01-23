export interface CareerIntent {
    targetRole: string;
    targetLocation: string;
    yearsOfExperience: number;
    jobSearchIntent?: string;
}


export interface RawInput {
    id: string;
    type: 'file' | 'url' | 'text' | 'linkedin';
    content: string; // For text, this is the text. For file, this is the filename.
    mimeType?: string; // For files
    data?: string; // Base64 encoded data for files
    metadata?: Record<string, any>;
    timestamp: number;
}

export interface RawCareerMemory {
    inputs: RawInput[];
}

export interface CareerProfileItem {
    id: string;
    category: 'role' | 'project' | 'education' | 'skill' | 'certification' | 'award' | 'language' | 'volunteer' | 'publication';
    title: string;
    organization?: string; // Company, University, Issuing Org
    description: string;
    sourceIds: string[];
    dates?: string;
}

export interface CareerProfile {
    personal?: {
        name: string;
        location?: string;
        photos?: string[];
    };
    contact?: {
        email?: string;
        phone?: string;
        linkedin?: string;
        github?: string;
        website?: string;
    };
    analysisReport: string; // "Consultant Strategy Memo"
    summary: string;
    items: CareerProfileItem[];
    gaps: string[];
    missingInfo?: string[];
    manualOverrides?: {
        personal?: any;
        contact?: any;
        summary?: boolean;
        items?: Record<string, boolean>; // Set of IDs that are manually edited
    };
}

export interface ResumeBullet {
    id: string;
    text: string;
    sourceIds: string[];
    skills: string[];
}

export interface ResumeSection {
    id: string;
    title: string;
    bullets: ResumeBullet[];
}

export interface ResumeDraft {
    sections: ResumeSection[];
}

export interface AiMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export type AppStep = 'onboarding-intent' | 'onboarding-inputs' | 'processing' | 'profile-review' | 'resume-draft' | 'resume-editor' | 'interview-prep';

export interface CareerState {
    step: AppStep;
    intent: CareerIntent | null;
    rawMemory: RawCareerMemory;
    profile: CareerProfile | null;
    resume: ResumeDraft | null;
    resumeHtml?: string;
    isProcessing: boolean;
    aiMessages: AiMessage[];
}
