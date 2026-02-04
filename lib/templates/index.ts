import { ResumeTemplate } from './types';
import { OliveGreenModernTemplate } from './OliveGreenModern';
import { ModernProfessionalTemplate } from './ModernProfessional';
import { MinimalistSimplePhotoTemplate } from './MinimalistSimplePhoto';
import { ColorfulBlocksTemplate } from './ColorfulBlocks';
import { ElegantProfessionalPhotoTemplate } from './ElegantProfessionalPhoto';
import { BandwProfessionalTemplate } from './BandwProfessional';
import { BlueSimpleProfileTemplate } from './BlueSimpleProfile';
import { AccentColorMinimalTemplate } from './AccentColorMinimal';
import { Template2ColumnMinimalTemplate } from './Template2ColumnMinimal';
import { ClassicTemplate } from './Classic';
import { Template2ColumnTimelineTemplate } from './Template2ColumnTimeline';
import { Template2ColumnStylishBlocksTemplate } from './Template2ColumnStylishBlocks';

export const RESUME_TEMPLATES: ResumeTemplate[] = [
    OliveGreenModernTemplate, // Temporarily disabled due to pagination issues with absolutely positioned footer
    ModernProfessionalTemplate,
    MinimalistSimplePhotoTemplate,
    ColorfulBlocksTemplate,
    ElegantProfessionalPhotoTemplate,
    BandwProfessionalTemplate,
    BlueSimpleProfileTemplate,
    AccentColorMinimalTemplate,
    Template2ColumnMinimalTemplate,
    ClassicTemplate,
    Template2ColumnTimelineTemplate,
    Template2ColumnStylishBlocksTemplate,
];

export const getTemplateById = (id: string): ResumeTemplate | undefined => {
    return RESUME_TEMPLATES.find(t => t.id === id);
};
