
export type EvidenceLevel = 'high' | 'medium' | 'low';

export interface Evidence {
    sourceId: string; // e.g., "github:profile", "github:repo:owner/repo"
    level: EvidenceLevel;
    url?: string;
    label?: string; // e.g., "GitHub API", "LinkedIn Scraper"
    field?: string; // Specific field this evidence supports (e.g. "startDate")
}

export interface IngestionSource {
    id: string; // Internal ID for the source input (e.g. "source-1")
    type: 'github' | 'linkedin' | 'pdf' | 'text' | 'url';
    content?: string; // Raw text or filename
    url?: string; // The URL if applicable
    data?: string; // Base64 data for files
    metadata?: Record<string, any>; // Extra metadata
}

export interface ChatLearningSection {
    heading: string;
    bullets: string[];
}

export interface ChatLearning {
    sourceType: string;
    title: string;
    sections: ChatLearningSection[];
}

// Granular field with evidence
export interface EnrichedField<T> {
    value: T;
    evidence: Evidence[];
}

// Project Patch (Upsert)
export interface ProjectUpsert {
    id: string; // STABLE ID: "github:owner/repo"
    name: string;
    description?: EnrichedField<string>;
    url?: EnrichedField<string>;
    metrics?: EnrichedField<string[]>; // e.g. "500 stars", "10k downloads"
    skills?: EnrichedField<string[]>; // Skills specifically used in this project
    startDate?: EnrichedField<string>;
    endDate?: EnrichedField<string>;
}

// Skill Patch (Upsert)
export interface SkillUpsert {
    id: string; // STABLE ID: "skill:typescript"
    name: string;
    category?: string; // "Language", "Framework"
    evidence: Evidence[]; // Evidence of this skill existing
}

// Role Patch (Upsert)
export interface RoleUpsert {
    id: string; // STABLE ID: "linkedin:role:company-title-date" or similar hash
    title: EnrichedField<string>;
    company: EnrichedField<string>;
    startDate?: EnrichedField<string>;
    endDate?: EnrichedField<string>;
    description?: EnrichedField<string>;
    location?: EnrichedField<string>;
}

// Education Patch (Upsert)
export interface EducationUpsert {
    id: string; // STABLE ID: "linkedin:edu:school-degree-year"
    school: EnrichedField<string>;
    degree?: EnrichedField<string>;
    fieldOfStudy?: EnrichedField<string>;
    startDate?: EnrichedField<string>;
    endDate?: EnrichedField<string>;
    description?: EnrichedField<string>;
}

// Volunteer Patch (Upsert)
export interface VolunteerUpsert {
    id: string; // STABLE ID: "linkedin:volunteer:org-role"
    role: EnrichedField<string>;
    organization: EnrichedField<string>;
    startDate?: EnrichedField<string>;
    endDate?: EnrichedField<string>;
    description?: EnrichedField<string>;
}

// Certification Patch (Upsert)
export interface CertificationUpsert {
    id: string; // STABLE ID: "linkedin:cert:name-authority"
    name: EnrichedField<string>;
    authority: EnrichedField<string>;
    date?: EnrichedField<string>;
    url?: EnrichedField<string>;
}

// Award Patch (Upsert)
export interface AwardUpsert {
    id: string; // "linkedin:award:title"
    title: EnrichedField<string>;
    issuer?: EnrichedField<string>;
    date?: EnrichedField<string>;
    description?: EnrichedField<string>;
}

// Generic List Patch (e.g. Languages)
export interface GenericUpsert {
    id: string;
    name: string;
    category?: string; // "Language"
    evidence: Evidence[];
}

export type LanguageUpsert = GenericUpsert;

export interface CareerProfilePatch {
    sourceId: string;
    // Atomic Upserts
    // Personal & Contact (Optional overrides)
    personal?: { name: string; location?: string };
    contact?: { email?: string; phone?: string; linkedin?: string; github?: string; website?: string };

    upsert_projects?: ProjectUpsert[];

    upsert_skills?: SkillUpsert[];
    upsert_roles?: RoleUpsert[];
    upsert_education?: EducationUpsert[];
    upsert_volunteering?: VolunteerUpsert[];
    upsert_certifications?: CertificationUpsert[];
    upsert_awards?: AwardUpsert[];
    upsert_languages?: LanguageUpsert[];

    // Global fields
    professionalSummaryDraft?: EnrichedField<string>;
    gaps?: string[];

    // Deletions (Rare)
    remove_project_ids?: string[];
}

export interface IngestionAgent {
    id: string;
    accepts(source: IngestionSource): boolean;
    process(source: IngestionSource, intent: any): Promise<{ patch: CareerProfilePatch, learnings: ChatLearning }>;
}
