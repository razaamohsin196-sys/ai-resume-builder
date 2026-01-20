
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
            <header className="bg-background border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                    <h1 className="font-semibold text-lg">Resume Draft</h1>
                    <span className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded-full">
                        Target: {intent?.targetRole}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setStep('profile-review')} className="text-muted-foreground hover:text-foreground">
                        Back to Profile
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setStep('interview-prep')}>
                        Verify & Prep Interview <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setStep('resume-editor')}>
                        Open Advanced Editor
                    </Button>
                    <Button size="sm">
                        <Download className="w-4 h-4 mr-2" /> Export PDF
                    </Button>
                </div>
            </header>

            <div className="flex max-w-7xl mx-auto p-6 gap-6 justify-center">
                {/* Resume Paper Preview */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white dark:bg-card shadow-lg border w-[210mm] h-[297mm] overflow-hidden relative group">
                        <iframe
                            srcDoc={resumeHtml}
                            className="w-full h-full border-none pointer-events-none"
                            title="Preview"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="lg" onClick={() => setStep('resume-editor')}>
                                <Edit className="w-5 h-5 mr-2" />
                                Click to Edit
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
