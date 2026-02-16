
import React, { useMemo, useEffect } from 'react';
import { useCareer } from '@/context/CareerContext';
import { parseResumeHtml, saveResumeEditsData } from '@/lib/resume-data';
import { careerProfileToResumeData } from '@/lib/resume-data/profile-adapter';
import { renderToTemplate } from '@/lib/resume-data/renderer';
import { SectionType } from '@/lib/resume-data/schema';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, ChevronRight, Edit } from 'lucide-react';
import { KUSE_RESUME_TEMPLATE } from '@/lib/templates/kuseResume';

export function ResumeDraftView() {
    const { profile, intent, resumeHtml, setStep, setResumeHtml } = useCareer();

    // Generate resume HTML directly from template synchronously (no API calls, no loading)
    const htmlToDisplay = useMemo(() => {
        if (resumeHtml) {
            return resumeHtml;
        }

        if (!profile) {
            return KUSE_RESUME_TEMPLATE; // Fallback to empty template
        }

        try {
            // Convert CareerProfile to ResumeData
            const resumeData = careerProfileToResumeData(profile);
            
            // Create ResumeTemplate object from KUSE template HTML
            const template = {
                id: 'kuse',
                name: 'KUSE Resume',
                html: KUSE_RESUME_TEMPLATE,
                hasPhoto: false,
                supportedSections: ['profile', 'summary', 'experience', 'education', 'skills', 'projects', 'languages', 'certifications'] as SectionType[],
                sectionOrder: ['profile', 'summary', 'experience', 'education', 'skills'] as SectionType[],
                pageSize: 'A4' as const,
            };
            
            // Render directly to template (no LLM call, no API call)
            const html = renderToTemplate(resumeData, template);
            
            return html;
        } catch (e) {
            console.error('Error generating resume:', e);
            return KUSE_RESUME_TEMPLATE; // Fallback to empty template
        }
    }, [profile, resumeHtml]);

    // Save generated HTML to context and localStorage (non-blocking)
    useEffect(() => {
        if (htmlToDisplay && htmlToDisplay !== KUSE_RESUME_TEMPLATE && !resumeHtml) {
            setResumeHtml(htmlToDisplay);
            
            // Seed the edits data store with the initial generated resume
            // so template switching has complete data from the start
            try {
                const initialData = parseResumeHtml(htmlToDisplay);
                saveResumeEditsData(initialData);
            } catch (_) { /* non-critical */ }
        }
    }, [htmlToDisplay, resumeHtml, setResumeHtml]);

    const handleExportPdf = () => {
        const iframe = document.querySelector('iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.print();
        }
    };

    return (
        <div className="min-h-screen bg-muted/10">
            <header className="bg-background border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center">
                    {/* Left side empty or maybe breadcrumb? Keeping clean as requested */}
                </div>

                <div className="flex items-center gap-4 w-full justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => setStep('profile-review')}
                        className="text-muted-foreground hover:text-foreground absolute left-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Profile
                    </Button>

                    <Button
                        size="lg"
                        onClick={handleExportPdf}
                        className="bg-purple-600 hover:bg-purple-700 shadow-md min-w-[200px]"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>

                    <div className="absolute right-6 flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setStep('interview-prep')}
                        >
                            Prep Interview <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex max-w-7xl mx-auto p-6 gap-6 justify-center">
                {/* Resume Paper Preview */}
                <div className="flex flex-col items-center space-y-4 pb-16">
                    <div
                        className="bg-white dark:bg-card shadow-lg border w-[210mm] min-h-[297mm] h-auto relative group cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-purple-500/50"
                        onClick={() => setStep('resume-editor')}
                    >
                        <iframe
                            srcDoc={htmlToDisplay}
                            className="w-full h-full min-h-[297mm] border-none pointer-events-none"
                            style={{ height: 'calc(100% + 20px)' }}
                            title="Preview"
                            onLoad={(e) => {
                                const iframe = e.currentTarget;
                                if (iframe.contentWindow) {
                                    const h = iframe.contentWindow.document.body.scrollHeight;
                                    iframe.style.height = `${h}px`;
                                    iframe.parentElement!.style.height = `${h}px`;
                                }
                            }}
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-purple-900/0 group-hover:bg-purple-900/5 transition-all flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur text-purple-900 px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all font-medium flex items-center">
                                <Edit className="w-4 h-4 mr-2" />
                                Click to Edit
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Click the resume to make changes</p>
                </div>
            </div>
        </div>
    );
}
