import { CareerProfile, CareerProfileItem } from "@/types/career";
import { CareerProfileFormData } from "@/types/form";

/**
 * Parse date range from string format
 */
function parseDateRange(dates?: string): { startDate?: string; endDate?: string; current: boolean } {
    if (!dates) return { current: false };
    
    const dateMatch = dates.match(/(\d{4}|\w+\s+\d{4})/g);
    const lowerDates = dates.toLowerCase();
    const isCurrent = lowerDates.includes('present') || lowerDates.includes('current');
    
    return {
        startDate: dateMatch?.[0],
        endDate: isCurrent ? undefined : (dateMatch?.[1] || undefined),
        current: isCurrent || !dateMatch?.[1],
    };
}

/**
 * Convert CareerProfile to CareerProfileFormData for form editing
 */
export function careerProfileToFormData(profile: CareerProfile): CareerProfileFormData {
    // Extract roles
    const roles = profile.items
        .filter(item => item.category === 'role')
        .map(item => {
            const { startDate, endDate, current } = parseDateRange(item.dates);
            return {
                id: item.id,
                title: item.title,
                company: item.organization,
                description: item.description,
                startDate,
                endDate,
                current,
            };
        });

    // Extract education
    const education = profile.items
        .filter(item => item.category === 'education')
        .map(item => {
            const dateMatch = item.dates?.match(/(\d{4})/g);
            return {
                id: item.id,
                degree: item.title,
                school: item.organization || '',
                field: item.description.split('\n')[0],
                startDate: dateMatch?.[0],
                endDate: dateMatch?.[1],
            };
        });

    // Extract projects
    const projects = profile.items
        .filter(item => item.category === 'project')
        .map(item => {
            // Try to extract URL from description
            const urlMatch = item.description.match(/https?:\/\/[^\s]+/);
            const techMatch = item.description.match(/tech[:\s]+([^\n]+)/i);
            
            return {
                id: item.id,
                name: item.title,
                description: item.description,
                technologies: techMatch ? techMatch[1].split(',').map(t => t.trim()) : undefined,
                url: urlMatch ? urlMatch[0] : undefined,
            };
        });

    // Extract skills
    const skills = profile.items
        .filter(item => item.category === 'skill')
        .map(item => ({
            id: item.id,
            name: item.title,
            category: item.organization, // Using organization field for category
        }));

    // Extract certifications
    const certifications = profile.items
        .filter(item => item.category === 'certification')
        .map(item => {
            const dateMatch = item.dates?.match(/(\d{4}|\w+\s+\d{4})/g);
            const credentialId = item.description.match(/ID:\s*([^\n]+)/)?.[1]?.trim();
            return {
                id: item.id,
                name: item.title,
                issuer: item.organization,
                date: dateMatch?.[0],
                credentialId,
            };
        });

    // Extract awards
    const awards = profile.items
        .filter(item => item.category === 'award')
        .map(item => ({
            id: item.id,
            title: item.title,
            issuer: item.organization,
            date: item.dates,
            description: item.description,
        }));

    // Extract languages
    const languages = profile.items
        .filter(item => item.category === 'language')
        .map(item => ({
            id: item.id,
            name: item.title,
            proficiency: item.organization || item.description,
        }));

    // Extract volunteering
    const volunteering = profile.items
        .filter(item => item.category === 'volunteer')
        .map(item => {
            const dateMatch = item.dates?.match(/(\d{4})/g);
            return {
                id: item.id,
                role: item.title,
                organization: item.organization || '',
                description: item.description,
                startDate: dateMatch?.[0],
                endDate: dateMatch?.[1],
            };
        });

    // Extract publications
    const publications = profile.items
        .filter(item => item.category === 'publication')
        .map(item => {
            const urlMatch = item.description.match(/https?:\/\/[^\s]+/);
            return {
                id: item.id,
                title: item.title,
                authors: item.organization,
                publisher: item.description.split('\n')[0],
                date: item.dates,
                url: urlMatch ? urlMatch[0] : undefined,
            };
        });

    return {
        personal: {
            name: profile.personal?.name || '',
            location: profile.personal?.location,
            photos: profile.personal?.photos,
        },
        contact: {
            email: profile.contact?.email,
            phone: profile.contact?.phone,
            linkedin: profile.contact?.linkedin,
            github: profile.contact?.github,
            website: profile.contact?.website,
        },
        summary: profile.summary || '',
        roles,
        education,
        projects,
        skills,
        certifications,
        awards,
        languages,
        volunteering,
        publications,
        analysisReport: profile.analysisReport,
        gaps: profile.gaps,
        missingInfo: profile.missingInfo,
    };
}

/**
 * Format date range string
 */
function formatDateRange(start?: string, end?: string, current?: boolean): string {
    if (current) return `${start || ''} - Present`.trim();
    return `${start || ''} - ${end || ''}`.trim();
}

/**
 * Get source IDs from original profile or default to form
 */
function getSourceIds(originalProfile: CareerProfile | undefined, id: string): string[] {
    return originalProfile?.items.find(i => i.id === id)?.sourceIds || ['form'];
}

/**
 * Convert CareerProfileFormData back to CareerProfile
 */
export function formDataToCareerProfile(formData: CareerProfileFormData, originalProfile?: CareerProfile): CareerProfile {
    const items: CareerProfileItem[] = [];

    // Convert roles
    formData.roles.forEach(role => {
        items.push({
            id: role.id,
            category: 'role',
            title: role.title,
            organization: role.company,
            description: role.description,
            dates: formatDateRange(role.startDate, role.endDate, role.current),
            sourceIds: getSourceIds(originalProfile, role.id),
        });
    });

    // Convert education
    formData.education.forEach(edu => {
        items.push({
            id: edu.id,
            category: 'education',
            title: edu.degree,
            organization: edu.school,
            description: [edu.field, edu.gpa, edu.honors].filter(Boolean).join('\n'),
            dates: formatDateRange(edu.startDate, edu.endDate),
            sourceIds: getSourceIds(originalProfile, edu.id),
        });
    });

    // Convert projects
    formData.projects.forEach(project => {
        const parts: string[] = [];
        if (project.technologies?.length) {
            parts.push(`Technologies: ${project.technologies.join(', ')}`);
        }
        parts.push(project.description);
        if (project.url) {
            parts.push(project.url);
        }
        
        items.push({
            id: project.id,
            category: 'project',
            title: project.name,
            description: parts.join('\n'),
            sourceIds: getSourceIds(originalProfile, project.id),
        });
    });

    // Convert skills
    formData.skills.forEach(skill => {
        items.push({
            id: skill.id,
            category: 'skill',
            title: skill.name,
            organization: skill.category,
            description: skill.proficiency || '',
            sourceIds: getSourceIds(originalProfile, skill.id),
        });
    });

    // Convert certifications
    formData.certifications.forEach(cert => {
        items.push({
            id: cert.id,
            category: 'certification',
            title: cert.name,
            organization: cert.issuer,
            description: cert.credentialId ? `Credential ID: ${cert.credentialId}` : '',
            dates: cert.date,
            sourceIds: getSourceIds(originalProfile, cert.id),
        });
    });

    // Convert awards
    formData.awards.forEach(award => {
        items.push({
            id: award.id,
            category: 'award',
            title: award.title,
            organization: award.issuer,
            description: award.description || '',
            dates: award.date,
            sourceIds: getSourceIds(originalProfile, award.id),
        });
    });

    // Convert languages
    formData.languages.forEach(lang => {
        items.push({
            id: lang.id,
            category: 'language',
            title: lang.name,
            organization: lang.proficiency,
            description: '',
            sourceIds: getSourceIds(originalProfile, lang.id),
        });
    });

    // Convert volunteering
    formData.volunteering.forEach(vol => {
        items.push({
            id: vol.id,
            category: 'volunteer',
            title: vol.role,
            organization: vol.organization,
            description: vol.description || '',
            dates: formatDateRange(vol.startDate, vol.endDate),
            sourceIds: getSourceIds(originalProfile, vol.id),
        });
    });

    // Convert publications
    formData.publications.forEach(pub => {
        const parts = [pub.publisher].filter(Boolean);
        if (pub.url) parts.push(pub.url);
        
        items.push({
            id: pub.id,
            category: 'publication',
            title: pub.title,
            organization: pub.authors,
            description: parts.join('\n'),
            dates: pub.date,
            sourceIds: getSourceIds(originalProfile, pub.id),
        });
    });

    return {
        personal: formData.personal,
        contact: formData.contact,
        summary: formData.summary,
        items,
        analysisReport: formData.analysisReport || originalProfile?.analysisReport || '',
        gaps: formData.gaps || originalProfile?.gaps || [],
        missingInfo: formData.missingInfo,
        manualOverrides: originalProfile?.manualOverrides,
    };
}
