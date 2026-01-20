import { CareerProfile, CareerProfileItem, EvidenceStrength } from '@/types/career';
import { CareerProfilePatch, ProjectUpsert, RoleUpsert, SkillUpsert, EnrichedField } from './types';

export class CareerProfileAggregator {

    static merge(currentProfile: CareerProfile | null, patch: CareerProfilePatch): CareerProfile {
        const base: CareerProfile = currentProfile || {
            analysisReport: '',
            summary: '',
            items: [],
            gaps: []
        };

        const mergedItems = [...base.items];

        const getEvidenceLevel = (field?: EnrichedField<any>): EvidenceStrength => {
            if (!field || !field.evidence || field.evidence.length === 0) return 'weak';
            const levels = field.evidence.map(e => e.level);
            if (levels.includes('high')) return 'strong';
            if (levels.includes('medium')) return 'medium';
            return 'weak';
        }

        // 1. Projects Upsert
        if (patch.upsert_projects) {
            for (const p of patch.upsert_projects) {
                const existingIdx = mergedItems.findIndex(i => i.id === p.id);

                if (existingIdx >= 0) {
                    // Update Logic
                    const item = mergedItems[existingIdx];

                    // Merge Metadata
                    if (!item.sourceIds.includes(patch.sourceId)) item.sourceIds.push(patch.sourceId);

                    // Prioritize description from patch if it has high evidence or if existing is empty
                    if (p.description?.value && (!item.description || getEvidenceLevel(p.description) === 'strong')) {
                        item.description = p.description.value;
                    }

                } else {
                    // Create New
                    mergedItems.push({
                        id: p.id, // STABLE ID
                        category: 'project',
                        title: p.name,
                        description: p.description?.value || '',
                        sourceIds: [patch.sourceId],
                        // For overall item strength, look at description or url
                        evidenceStrength: getEvidenceLevel(p.description || p.url),
                        dates: (p.startDate?.value || '') + (p.endDate?.value ? ` - ${p.endDate.value}` : '')
                    });
                }
            }
        }

        // 2. Skills Upsert
        if (patch.upsert_skills) {
            for (const s of patch.upsert_skills) {
                const existingIdx = mergedItems.findIndex(i => i.id === s.id);

                if (existingIdx >= 0) {
                    const item = mergedItems[existingIdx];
                    if (!item.sourceIds.includes(patch.sourceId)) item.sourceIds.push(patch.sourceId);
                } else {
                    mergedItems.push({
                        id: s.id, // STABLE ID
                        category: 'skill',
                        title: s.name,
                        description: s.category || '',
                        sourceIds: [patch.sourceId],
                        evidenceStrength: 'strong' // If it exists in repo/linkedin, it's strong
                    });
                }
            }
        }

        // 3. Roles Upsert
        if (patch.upsert_roles) {
            for (const r of patch.upsert_roles) {
                const existingIdx = mergedItems.findIndex(i => i.id === r.id);

                if (existingIdx >= 0) {
                    const item = mergedItems[existingIdx];
                    if (!item.sourceIds.includes(patch.sourceId)) item.sourceIds.push(patch.sourceId);
                } else {
                    mergedItems.push({
                        id: r.id, // STABLE ID
                        category: 'role',
                        title: `${r.title.value} at ${r.company.value}`,
                        description: r.description?.value || '',
                        sourceIds: [patch.sourceId],
                        evidenceStrength: getEvidenceLevel(r.title),
                        dates: (r.startDate?.value || '') + (r.endDate?.value ? ` - ${r.endDate.value}` : '')
                    });
                }
            }
        }


        // 4. Education Upsert
        if (patch.upsert_education) {
            for (const e of patch.upsert_education) {
                const existingIdx = mergedItems.findIndex(i => i.id === e.id);
                if (existingIdx >= 0) {
                    const item = mergedItems[existingIdx];
                    if (!item.sourceIds.includes(patch.sourceId)) item.sourceIds.push(patch.sourceId);
                } else {
                    mergedItems.push({
                        id: e.id,
                        category: 'education',
                        title: `${e.degree?.value || 'Degree'} at ${e.school.value}`,
                        description: e.description?.value || '',
                        sourceIds: [patch.sourceId],
                        evidenceStrength: getEvidenceLevel(e.school),
                        dates: (e.startDate?.value || '') + (e.endDate?.value ? ` - ${e.endDate.value}` : '')
                    });
                }
            }
        }

        // 5. Volunteering Upsert
        if (patch.upsert_volunteering) {
            for (const v of patch.upsert_volunteering) {
                const existingIdx = mergedItems.findIndex(i => i.id === v.id);
                if (existingIdx >= 0) {
                    const item = mergedItems[existingIdx];
                    if (!item.sourceIds.includes(patch.sourceId)) item.sourceIds.push(patch.sourceId);
                } else {
                    mergedItems.push({
                        id: v.id,
                        category: 'volunteer',
                        title: `${v.role.value} at ${v.organization.value}`,
                        description: v.description?.value || '',
                        sourceIds: [patch.sourceId],
                        evidenceStrength: getEvidenceLevel(v.role),
                        dates: (v.startDate?.value || '') + (v.endDate?.value ? ` - ${v.endDate.value}` : '')
                    });
                }
            }
        }

        // 6. Certifications Upsert
        if (patch.upsert_certifications) {
            for (const c of patch.upsert_certifications) {
                const existingIdx = mergedItems.findIndex(i => i.id === c.id);
                if (existingIdx === -1) {
                    mergedItems.push({
                        id: c.id,
                        category: 'certification',
                        title: c.name.value,
                        description: `Issued by ${c.authority.value}`,
                        sourceIds: [patch.sourceId],
                        evidenceStrength: getEvidenceLevel(c.name),
                        dates: c.date?.value
                    });
                }
            }
        }

        // 7. Awards Upsert
        if (patch.upsert_awards) {
            for (const a of patch.upsert_awards) {
                const existingIdx = mergedItems.findIndex(i => i.id === a.id);
                if (existingIdx === -1) {
                    mergedItems.push({
                        id: a.id,
                        category: 'award',
                        title: a.title.value,
                        description: a.description?.value || (a.issuer ? `Issued by ${a.issuer.value}` : ''),
                        sourceIds: [patch.sourceId],
                        evidenceStrength: getEvidenceLevel(a.title),
                        dates: a.date?.value
                    });
                }
            }
        }

        // 8. Languages Upsert
        if (patch.upsert_languages) {
            for (const l of patch.upsert_languages) {
                const existingIdx = mergedItems.findIndex(i => i.id === l.id);
                if (existingIdx === -1) {
                    mergedItems.push({
                        id: l.id,
                        category: 'language',
                        title: l.name,
                        description: l.category || 'Language',
                        sourceIds: [patch.sourceId],
                        evidenceStrength: 'strong'
                    });
                }
            }
        }

        // 9. Global Fields (Summary, Personal, Contact)
        if (patch.professionalSummaryDraft?.value) {
            if (!base.summary) {
                base.summary = patch.professionalSummaryDraft.value;
            }
        }

        if (patch.personal) {
            base.personal = { ...base.personal, ...patch.personal };
        }

        if (patch.contact) {
            base.contact = { ...base.contact, ...patch.contact };
        }

        return {
            ...base,
            items: mergedItems
        };
    }
}
