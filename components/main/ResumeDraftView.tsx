
import React, { useState, useEffect } from 'react';
import { useCareer } from '@/context/CareerContext';
import { generateHtmlResume, generateResumeDraft } from '@/app/actions';
import { ResumeDraft } from '@/types/career';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ArrowLeft, Sparkles, CheckCircle2, ChevronRight, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KUSE_RESUME_TEMPLATE } from '@/lib/templates/kuseResume';

export function ResumeDraftView() {
    const { profile, intent, resume, resumeHtml, setStep, setResumeHtml, setResume } = useCareer();

    // Dynamic Checklist State
    const [loadingStep, setLoadingStep] = useState(0);
    const loadingSteps = [
        "Analyzing career profile...",
        "Applying resume structure...",
        "Optimizing content for impact...",
        "Formatting layout & typography...",
        "Finalizing resume draft..."
    ];

    // Trigger generation on mount if no resume HTML exists
    useEffect(() => {
        // We check for both HTML and the structured resume object to determine if we should generate
        if ((!resumeHtml || !resume) && profile && intent) {
            // Start checklist animation
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
            }, 800);

            async function gen() {
                try {
                    console.log("Generating HTML resume and structured draft...");

                    // Run both generations in parallel for speed
                    const [html, draft] = await Promise.all([
                        // Only regen HTML if missing
                        resumeHtml ? Promise.resolve(resumeHtml) : generateHtmlResume(profile!, intent!, KUSE_RESUME_TEMPLATE),
                        // Only regen Structured Draft if missing
                        resume ? Promise.resolve(resume) : generateResumeDraft(profile!, intent!)
                    ]);

                    setResumeHtml(html);
                    setResume(draft);
                } catch (e) {
                    console.error(e);
                }
            }
            gen();

            return () => clearInterval(interval);
        }
    }, [resumeHtml, resume, profile, intent, setResumeHtml, setResume, loadingSteps.length]);


    const handleExportPdf = () => {
        const iframe = document.querySelector('iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.print();
        }
    };

    if (!resumeHtml) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                    </div>
                </div>

                <div className="space-y-3 w-[280px] text-left">
                    {loadingSteps.map((step, idx) => (
                        <div key={idx} className={cn("flex items-center space-x-3 transition-opacity duration-300",
                            idx > loadingStep ? "opacity-30" : "opacity-100"
                        )}>
                            {idx < loadingStep ? (
                                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                </div>
                            ) : idx === loadingStep ? (
                                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-gray-200" />
                            )}
                            <span className={cn("text-sm font-medium", idx === loadingStep && "text-primary")}>{step}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

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
                            srcDoc={resumeHtml}
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
