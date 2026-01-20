import { ResumeTemplate } from './types';
import { KuseTemplate } from './kuseResume';

export const RESUME_TEMPLATES: ResumeTemplate[] = [
    KuseTemplate
];

export const getTemplateById = (id: string): ResumeTemplate | undefined => {
    return RESUME_TEMPLATES.find(t => t.id === id);
};
