import { CareerProfile, CareerProfileItem } from "@/types/career";
import { CareerProfileFormData } from "@/types/form";

/**
 * Convert CareerProfile to CareerProfileFormData for form editing
 */
export function careerProfileToFormData(profile: CareerProfile): CareerProfileFormData {
    // Extract roles
    const roles = profile.items
        .filter(item => item.category === 'role')
        .map(item => {
            // Parse dates if available
            const dateMatch = item.dates?.match(/(\d{4}|\w+\s+\d{4})/g);
            const startDate = dateMatch?.[0];
            const endDate = dateMatch?.[1] || (item.dates?.toLowerCase().includes('present') || item.dates?.toLowerCase().includes('current') ? undefined : dateMatch?.[1]);
            const current = item.dates?.toLowerCase().includes('present') || item.dates?.toLowerCase().includes('current') || !endDate;

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
                field: item.description.split('\n')[0], // First line as field
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
            return {
                id: item.id,
                name: item.title,
                issuer: item.organization,
                date: dateMatch?.[0],
                credentialId: item.description.split('ID:')[1]?.trim(),
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
 * Convert CareerProfileFormData back to CareerProfile
 */
export function formDataToCareerProfile(formData: CareerProfileFormData, originalProfile?: CareerProfile): CareerProfile {
    const items: CareerProfileItem[] = [];

    // Convert roles
    formData.roles.forEach(role => {
        const dates = role.current 
            ? `${role.startDate || ''} - Present`
            : `${role.startDate || ''} - ${role.endDate || ''}`;
        
        items.push({
            id: role.id,
            category: 'role',
            title: role.title,
            organization: role.company,
            description: role.description,
            dates: dates.trim(),
            sourceIds: originalProfile?.items.find(i => i.id === role.id)?.sourceIds || ['form'],
        });
    });

    // Convert education
    formData.education.forEach(edu => {
        const dates = `${edu.startDate || ''} - ${edu.endDate || ''}`;
        items.push({
            id: edu.id,
            category: 'education',
            title: edu.degree,
            organization: edu.school,
            description: [edu.field, edu.gpa, edu.honors].filter(Boolean).join('\n'),
            dates: dates.trim(),
            sourceIds: originalProfile?.items.find(i => i.id === edu.id)?.sourceIds || ['form'],
        });
    });

    // Convert projects
    formData.projects.forEach(project => {
        let description = project.description;
        if (project.technologies?.length) {
            description = `Technologies: ${project.technologies.join(', ')}\n${description}`;
        }
        if (project.url) {
            description = `${description}\n${project.url}`;
        }
        
        items.push({
            id: project.id,
            category: 'project',
            title: project.name,
            description,
            sourceIds: originalProfile?.items.find(i => i.id === project.id)?.sourceIds || ['form'],
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
            sourceIds: originalProfile?.items.find(i => i.id === skill.id)?.sourceIds || ['form'],
        });
    });

    // Convert certifications
    formData.certifications.forEach(cert => {
        let description = '';
        if (cert.credentialId) {
            description = `Credential ID: ${cert.credentialId}`;
        }
        
        items.push({
            id: cert.id,
            category: 'certification',
            title: cert.name,
            organization: cert.issuer,
            description,
            dates: cert.date,
            sourceIds: originalProfile?.items.find(i => i.id === cert.id)?.sourceIds || ['form'],
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
            sourceIds: originalProfile?.items.find(i => i.id === award.id)?.sourceIds || ['form'],
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
            sourceIds: originalProfile?.items.find(i => i.id === lang.id)?.sourceIds || ['form'],
        });
    });

    // Convert volunteering
    formData.volunteering.forEach(vol => {
        const dates = `${vol.startDate || ''} - ${vol.endDate || ''}`;
        items.push({
            id: vol.id,
            category: 'volunteer',
            title: vol.role,
            organization: vol.organization,
            description: vol.description || '',
            dates: dates.trim(),
            sourceIds: originalProfile?.items.find(i => i.id === vol.id)?.sourceIds || ['form'],
        });
    });

    // Convert publications
    formData.publications.forEach(pub => {
        let description = pub.publisher || '';
        if (pub.url) {
            description = `${description}\n${pub.url}`;
        }
        
        items.push({
            id: pub.id,
            category: 'publication',
            title: pub.title,
            organization: pub.authors,
            description,
            dates: pub.date,
            sourceIds: originalProfile?.items.find(i => i.id === pub.id)?.sourceIds || ['form'],
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
