/**
 * Structured form data extracted from uploaded content
 * This represents all fields that can be edited in the form
 */
export interface CareerProfileFormData {
    // Personal Information
    personal: {
        name: string;
        location?: string;
        photos?: string[];
    };
    
    // Contact Information
    contact: {
        email?: string;
        phone?: string;
        linkedin?: string;
        github?: string;
        website?: string;
    };
    
    // Professional Summary
    summary: string;
    
    // Work Experience
    roles: Array<{
        id: string;
        title: string;
        company?: string;
        description: string;
        startDate?: string;
        endDate?: string;
        current?: boolean;
        location?: string;
    }>;
    
    // Education
    education: Array<{
        id: string;
        degree: string;
        school: string;
        field?: string;
        startDate?: string;
        endDate?: string;
        gpa?: string;
        honors?: string;
    }>;
    
    // Projects
    projects: Array<{
        id: string;
        name: string;
        description: string;
        technologies?: string[];
        url?: string;
        startDate?: string;
        endDate?: string;
    }>;
    
    // Skills
    skills: Array<{
        id: string;
        name: string;
        category?: string;
        proficiency?: string;
    }>;
    
    // Certifications
    certifications: Array<{
        id: string;
        name: string;
        issuer?: string;
        date?: string;
        expiryDate?: string;
        credentialId?: string;
    }>;
    
    // Awards
    awards: Array<{
        id: string;
        title: string;
        issuer?: string;
        date?: string;
        description?: string;
    }>;
    
    // Languages
    languages: Array<{
        id: string;
        name: string;
        proficiency?: string;
    }>;
    
    // Volunteering
    volunteering: Array<{
        id: string;
        role: string;
        organization: string;
        description?: string;
        startDate?: string;
        endDate?: string;
    }>;
    
    // Publications
    publications: Array<{
        id: string;
        title: string;
        authors?: string;
        publisher?: string;
        date?: string;
        url?: string;
    }>;
    
    // Analysis & Gaps
    analysisReport?: string;
    gaps?: string[];
    missingInfo?: string[];
}
