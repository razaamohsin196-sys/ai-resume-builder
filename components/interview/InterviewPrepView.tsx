import React, { useState } from 'react';
import { useCareer } from '@/context/CareerContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, ShieldCheck, Target, ExternalLink } from 'lucide-react';
import { ResumeBullet } from '@/types/career';

import { generateInterviewPrep, InterviewPrepResponse } from '@/app/actions';
import { Loader2 } from 'lucide-react';

export function InterviewPrepView() {
    const { resume, profile, setStep } = useCareer();
    const [activeBullet, setActiveBullet] = useState<ResumeBullet | null>(null);
    const [prepData, setPrepData] = useState<InterviewPrepResponse | null>(null);
    const [loading, setLoading] = useState(false);

    if (!resume) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold">No Resume Found</h2>
                    <p className="text-muted-foreground max-w-sm">
                        You need to generate a resume draft before you can prepare for an interview.
                    </p>
                </div>
                <Button onClick={() => setStep('onboarding-intent')}>
                    Start New Session
                </Button>
            </div>
        );
    }

    // Flatten bullets for easier access
    const allBullets = resume.sections.flatMap(s => s.bullets);

    // Fetch AI Data when active bullet changes
    React.useEffect(() => {
        if (!activeBullet || !profile) return;

        let isMounted = true;
        setLoading(true);
        setPrepData(null); // Clear old data

        generateInterviewPrep(activeBullet, profile)
            .then(data => {
                if (isMounted) {
                    setPrepData(data);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error(err);
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [activeBullet, profile]);

    return (
        <div className="min-h-screen bg-muted/10 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <header className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Button variant="ghost" size="sm" className="-ml-3" onClick={() => setStep('resume-draft')}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resume
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Interview Defense Map</h1>
                        <p className="text-muted-foreground">Don't memorize scripts. Know your evidence.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Bullets List */}
                    <div className="md:col-span-5 space-y-4">
                        <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="bg-muted px-4 py-3 border-b border-border">
                                <h2 className="font-semibold text-sm">Your Claims (Resume Bullets)</h2>
                            </div>
                            <div className="divide-y divide-border h-[600px] overflow-y-auto">
                                {allBullets.map(bullet => (
                                    <div
                                        key={bullet.id}
                                        onClick={() => setActiveBullet(bullet)}
                                        className={`p-4 text-sm cursor-pointer transition-colors hover:bg-muted/50 ${activeBullet?.id === bullet.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                    >
                                        <p className="leading-snug text-foreground/90">{bullet.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Defense Detail */}
                    <div className="md:col-span-7">
                        {activeBullet ? (
                            <div className="bg-card border rounded-lg shadow-sm p-6 space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">The Claim</span>
                                            <p className="text-lg font-medium mt-1">{activeBullet.text}</p>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                            <p className="text-sm">Analyzing claim & generating defense strategy...</p>
                                        </div>
                                    ) : (
                                        /* Defense Matrix */
                                        <div className="grid grid-cols-1 gap-4 pt-4">

                                            {/* 1. Mindmap Strategy */}
                                            {prepData?.mindmap && (
                                                <DefenseCard
                                                    icon={ShieldCheck} // Network icon might be better but Shield is okay
                                                    title="Defense Mindmap (Context)"
                                                    color="text-green-600"
                                                    bg="bg-green-50 dark:bg-green-900/20"
                                                >
                                                    <div className="space-y-3">
                                                        <div>
                                                            <span className="text-xs font-semibold text-green-700/70 uppercase">Core Skills</span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {prepData.mindmap.related_skills.map((s, i) => (
                                                                    <span key={i} className="px-2 py-0.5 bg-white rounded border text-xs font-medium">{s}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-semibold text-green-700/70 uppercase">Linked Experiences</span>
                                                            <ul className="text-xs list-disc list-inside mt-1 text-foreground/80">
                                                                {prepData.mindmap.related_experiences.map((e, i) => <li key={i}>{e}</li>)}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </DefenseCard>
                                            )}

                                            {/* 2. STAR Breakdown */}
                                            {prepData?.star_breakdown && (
                                                <DefenseCard
                                                    icon={Target}
                                                    title="STAR Breakdown"
                                                    color="text-blue-600"
                                                    bg="bg-blue-50 dark:bg-blue-900/20"
                                                >
                                                    <div className="space-y-2 text-sm">
                                                        <p><span className="font-bold text-blue-800">Situation:</span> {prepData.star_breakdown.situation}</p>
                                                        <p><span className="font-bold text-blue-800">Task:</span> {prepData.star_breakdown.task}</p>
                                                        <p><span className="font-bold text-blue-800">Action:</span> {prepData.star_breakdown.action}</p>
                                                        <p><span className="font-bold text-blue-800">Result:</span> {prepData.star_breakdown.result}</p>
                                                    </div>
                                                </DefenseCard>
                                            )}

                                            {/* 3. Follow-up Questions */}
                                            {prepData?.follow_up_questions && (
                                                <DefenseCard
                                                    icon={MessageSquare}
                                                    title="Skeptical Follow-ups"
                                                    color="text-purple-600"
                                                    bg="bg-purple-50 dark:bg-purple-900/20"
                                                >
                                                    <ul className="list-disc list-inside text-sm space-y-2">
                                                        {prepData.follow_up_questions.map((q, i) => (
                                                            <li key={i} className="font-medium text-foreground/90">"{q}"</li>
                                                        ))}
                                                    </ul>
                                                </DefenseCard>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5">
                                <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
                                <p>Select a resume bullet to prepare your defense.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DefenseCard({ icon: Icon, title, children, color, bg }: any) {
    return (
        <div className={`p-4 rounded-lg border ${bg}`}>
            <div className={`flex items-center mb-3 ${color}`}>
                <Icon className="w-5 h-5 mr-2" />
                <h3 className="font-semibold text-sm uppercase tracking-wide">{title}</h3>
            </div>
            <div className="text-foreground/80 pl-7">
                {children}
            </div>
        </div>
    )
}
