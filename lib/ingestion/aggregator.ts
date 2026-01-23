import { CareerProfile, CareerProfileItem } from '@/types/career';
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

        // 1. Projects Upsert
        if (patch.upsert_projects) {
            for (const p of patch.upsert_projects) {
                const existingIdx = mergedItems.findIndex(i => i.id === p.id);

                if (existingIdx >= 0) {
                    // Update Logic
                    const item = mergedItems[existingIdx];

                    // Check Lock
                    if (base.manualOverrides?.items?.[item.id]) {
                        continue;
                    }

                    // Prioritize description from patch if existing is empty or if it is a refinement
                    // SPECIAL RULE: If source is 'refinement-agent', It ALWAYS wins (unless locked by user)
                    // This is because refinement agent is a "Post-Processing" step designed to overwrite bad text.
                    const isRefinement = patch.sourceId === 'refinement-agent';

                    // Title Correction: If current title is generic and new title is specific, update it.
                    const isGenericTitle = ["project name", "untitled", "new project"].includes(item.title.toLowerCase());
                    const isNewTitleGeneric = ["project name", "untitled", "new project"].includes(p.name.toLowerCase());

                    if (!isNewTitleGeneric && (isGenericTitle || isRefinement)) {
                        console.log(`[Aggregator] Updating Project Title ${item.id}: "${item.title}" -> "${p.name}"`);
                        item.title = p.name;
                    }

                    if (isRefinement || p.description?.value && !item.description) {
                        console.log(`[Aggregator] Updating Project ${item.id} from ${patch.sourceId}`);
                        item.description = p.description?.value || item.description;
                    }

                } else {
                    // Create New
                    mergedItems.push({
                        id: p.id, // STABLE ID
                        category: 'project',
                        title: p.name,
                        description: p.description?.value || '',
                        sourceIds: [patch.sourceId],
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

                    // Check Lock
                    if (base.manualOverrides?.items?.[item.id]) {
                        continue;
                    }

                    if (!item.sourceIds.includes(patch.sourceId)) item.sourceIds.push(patch.sourceId);

                    // SPECIAL RULE: Refinement Agent wins
                    const isRefinement = patch.sourceId === 'refinement-agent';
                    if (isRefinement && r.description?.value) {
                        console.log(`[Aggregator] Updating Role ${item.id} from ${patch.sourceId}`);
                        item.description = r.description.value;
                    }
                    if (r.company?.value && !item.organization) {
                        item.organization = r.company.value;
                    }
                } else {
                    mergedItems.push({
                        id: r.id, // STABLE ID
                        category: 'role',
                        title: r.title.value,
                        organization: r.company.value,
                        description: r.description?.value || '',
                        sourceIds: [patch.sourceId],
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
                        title: e.degree?.value || 'Degree',
                        organization: e.school.value,
                        description: e.description?.value || '',
                        sourceIds: [patch.sourceId],
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
                        title: v.role.value,
                        organization: v.organization.value,
                        description: v.description?.value || '',
                        sourceIds: [patch.sourceId],
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
                        organization: c.authority.value,
                        description: '',
                        sourceIds: [patch.sourceId],
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
                        organization: a.issuer?.value,
                        description: a.description?.value || '',
                        sourceIds: [patch.sourceId],
                        dates: a.date?.value
                    });
                }
            }
        }

        // 8. Languages Upsert
        if (patch.upsert_languages) {
            for (const l of patch.upsert_languages) {
                const existingIdx = mergedItems.findIndex(i => i.id === l.id);
                if (existingIdx >= 0) {
                    const existing = mergedItems[existingIdx];

                    // Check Lock
                    if (base.manualOverrides?.items?.[existing.id]) {
                        // Item is locked by user edit. Do not overwrite description/title.
                        // We MIGHT want to merge unseen sourceIds? 
                        // For now, strict lock is safer to prevent overwriting user's "perfect" text.
                        continue;
                    }

                    // Merge
                    // For languages, title is name, description is category.
                    if (!existing.sourceIds.includes(patch.sourceId)) {
                        existing.sourceIds.push(patch.sourceId);
                    }
                    if (l.category && !existing.organization) {
                        existing.organization = l.category;
                    }
                } else {
                    mergedItems.push({
                        id: l.id,
                        category: 'language',
                        title: l.name,
                        organization: l.category || 'Proficiency',
                        description: '',
                        sourceIds: [patch.sourceId],
                    });
                }
            }
        }

        // 9. Global Fields (Summary, Personal, Contact)
        if (patch.professionalSummaryDraft?.value) {
            if (!base.manualOverrides?.summary) {
                // SPECIAL RULE: Refinement Agent wins for Summary too
                const isRefinement = patch.sourceId === 'refinement-agent';
                if (isRefinement || !base.summary) {
                    console.log(`[Aggregator] Updating Summary from ${patch.sourceId}`);
                    base.summary = patch.professionalSummaryDraft.value;
                }
            }
        }

        if (patch.personal) {
            const pOverrides = base.manualOverrides?.personal || {};
            base.personal = {
                name: pOverrides.name ? (base.personal?.name || "") : (patch.personal.name || base.personal?.name || ""),
                location: pOverrides.location ? base.personal?.location : (patch.personal.location || base.personal?.location),
                photos: base.personal?.photos || []
            };

            if (patch.personal.headshot) {
                // Add new photo to front (priority)
                const newPhoto = patch.personal.headshot;
                const existingPhotos = base.personal.photos || [];
                // Filter out if already exists to avoid duplicates
                const filtered = existingPhotos.filter(p => p !== newPhoto);
                base.personal.photos = [newPhoto, ...filtered];
            }
        }

        if (patch.contact) {
            const cOverrides = base.manualOverrides?.contact || {};
            base.contact = {
                email: cOverrides.email ? base.contact?.email : (patch.contact.email || base.contact?.email),
                phone: cOverrides.phone ? base.contact?.phone : (patch.contact.phone || base.contact?.phone),
                linkedin: cOverrides.linkedin ? base.contact?.linkedin : (patch.contact.linkedin || base.contact?.linkedin),
                github: cOverrides.github ? base.contact?.github : (patch.contact.github || base.contact?.github),
                website: cOverrides.website ? base.contact?.website : (patch.contact.website || base.contact?.website)
            };
        }

        // 10. Sort Items by Date Descending
        mergedItems.sort((a, b) => {
            const getSortValue = (d?: string) => {
                if (!d) return -Infinity; // No date -> Bottom
                const lower = d.toLowerCase();
                if (lower.includes('present') || lower.includes('current')) return Infinity; // Present -> Top

                // Extract years
                const years = d.match(/20\d{2}/g) || d.match(/19\d{2}/g);
                if (years && years.length > 0) {
                    // Return the max year found in the string
                    return Math.max(...years.map(y => parseInt(y)));
                }
                return -Infinity;
            };
            return getSortValue(b.dates) - getSortValue(a.dates);
        });

        return {
            ...base,
            items: mergedItems
        };
    }
}
