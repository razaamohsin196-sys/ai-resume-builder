
"use client";

import React, { useState } from 'react';
import { useCareer } from '@/context/CareerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertCircle, HelpCircle, BrainCircuit, Sparkles, Send, MessageSquareText } from 'lucide-react';
import { EvidenceStrength, CareerProfileItem } from '@/types/career';
import { modifyCareerProfile } from '@/app/actions';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export function ProfileReview() {
    const { profile, setProfile, setStep } = useCareer();
    const [isChatOpen, setIsChatOpen] = useState(true); // Default open for visibility
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Does this profile look accurate? If not, just tell me what to fix! e.g. "Add a bullet to my last job about leading a team" or "Change my summary to focus on Product Strategy".', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    if (!profile) return <div>No profile generated.</div>;

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        const tempId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: tempId, role: 'assistant', content: 'Updating your profile...', timestamp: Date.now() }]);

        try {
            const newProfile = await modifyCareerProfile(profile, userMsg.content);
            setProfile(newProfile);

            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: 'Profile updated! You can see the changes on the left.' } : m
            ));
        } catch (e) {
            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: 'Sorry, I couldn\'t update the profile. Please try again.' } : m
            ));
        } finally {
            setIsThinking(false);
        }
    };

    const ChatPanel = (
        <div className="flex flex-col h-full bg-background border-l w-full max-w-[400px]">
            <div className="p-4 border-b bg-muted/10 flex items-center justify-between shrink-0">
                <h3 className="font-semibold flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Assistant
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)}>Close</Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map(m => (
                        <div key={m.id} className={cn("flex w-full mb-4", m.role === 'user' ? 'justify-end' : 'justify-start')}>
                            <div className={cn(
                                "max-w-[85%] rounded-lg px-4 py-3 text-sm",
                                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex w-full mb-4 justify-start">
                            <div className="bg-muted rounded-lg px-4 py-3 text-sm flex items-center">
                                <Sparkles className="w-3 h-3 mr-2 animate-spin" /> Thinking...
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t mt-auto relative shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Change summary..."
                        className="pr-10"
                        disabled={isThinking}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        variant="ghost"
                        disabled={isThinking}
                    >
                        <Send className="w-4 h-4 text-primary" />
                    </Button>
                </form>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Main Content (Scrollable) */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 space-y-8 relative">

                <div className="max-w-4xl mx-auto space-y-8 pb-24">
                    <div className="space-y-2 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Understanding Your Career</h1>
                            <p className="text-muted-foreground">This is what I extracted from your inputs. Is this accurate?</p>
                        </div>
                        {!isChatOpen && (
                            <Button onClick={() => setIsChatOpen(true)} variant="outline">
                                <MessageSquareText className="w-4 h-4 mr-2" /> Open Chat
                            </Button>
                        )}
                    </div>

                    {/* Analysis Report (Consultant Memo) */}
                    {profile.analysisReport && (
                        <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <BrainCircuit className="w-24 h-24 text-primary" />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                                    <BrainCircuit className="w-5 h-5 mr-2" />
                                    AI Strategy Insight
                                </h2>
                                <p className="text-base leading-relaxed text-foreground/90 font-medium">
                                    {profile.analysisReport}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Professional Summary Strategy */}
                    <div className="bg-muted/30 p-6 rounded-lg border">
                        <h2 className="font-semibold mb-3">Professional Summary Draft</h2>
                        <p className="text-lg leading-relaxed">{profile.summary}</p>
                    </div>

                    {/* Gaps Alert */}
                    {profile.missingInfo && profile.missingInfo.length > 0 && (
                        <div className="border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-r-sm">
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 mr-3 shrink-0" />
                                <div>
                                    <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2 uppercase tracking-wide">
                                        Suggested Improvements
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {profile.missingInfo.map((info, idx) => (
                                            <li key={idx} className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
                                                {info}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Roles */}
                    <Section title="Roles identified" items={profile.items.filter(i => i.category === 'role')} />

                    {/* Projects */}
                    <Section title="Key Projects" items={profile.items.filter(i => i.category === 'project')} />

                    {/* Education */}
                    <Section title="Education" items={profile.items.filter(i => i.category === 'education')} />

                    {/* Skills */}
                    {profile.items.filter(i => i.category === 'skill').length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Skills Identified</h2>
                            <div className="flex flex-wrap gap-2">
                                {profile.items.filter(i => i.category === 'skill').map(skill => (
                                    <div key={skill.id} className="bg-secondary px-3 py-1 rounded-full text-sm font-medium">
                                        {skill.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sources Debug (Optional) */}
                    {/* <div className="mt-8 pt-8 border-t text-xs text-muted-foreground">
                        Source Data Available: {profile.items.length} items extracted.
                    </div> */}

                </div>

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t flex justify-center gap-4 z-10 w-full" style={{ width: isChatOpen ? 'calc(100% - 400px)' : '100%' }}>
                    <div className="max-w-4xl w-full flex justify-between">
                        <Button variant="outline" size="lg" onClick={() => setStep('onboarding-inputs')}>
                            Back to Inputs
                        </Button>
                        <Button size="lg" onClick={() => setStep('resume-draft')} className="bg-green-600 hover:bg-green-700 text-white">
                            Lock & Draft Resume <CheckCircle2 className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </div>

            </div>

            {/* Chat Sidebar */}
            {isChatOpen && ChatPanel}
        </div>
    );
}

function Section({ title, items }: { title: string, items: CareerProfileItem[] }) {
    if (items.length === 0) return null;
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <div className="grid gap-4">
                {items.map(item => (
                    <div key={item.id} className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg">{item.title}</h3>
                                {item.dates && <p className="text-sm text-muted-foreground">{item.dates}</p>}
                            </div>
                            <StrengthBadge strength={item.evidenceStrength} />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                        <div className="mt-3 text-xs text-muted-foreground flex items-center flex-wrap gap-2">
                            <span className="text-muted-foreground mr-1">Sources:</span>
                            {item.sourceIds.map(id => (
                                <SourceBadge key={id} sourceId={id} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SourceBadge({ sourceId }: { sourceId: string }) {
    const { rawMemory } = useCareer();
    // Safe check
    if (!rawMemory?.inputs) return null;

    // Convert "1" -> Index 0
    const index = parseInt(sourceId) - 1;
    const input = rawMemory.inputs[index];

    if (!input) return null;

    let label = `Source ${sourceId}`;
    let detail = "";
    let icon = "📄";

    if (input.type === 'file') {
        label = input.content.length > 20 ? input.content.slice(0, 15) + '...' : input.content;
        detail = `File: ${input.content}`;
        icon = "📄";
    } else if (input.type === 'url' || input.type === 'linkedin') {
        try {
            label = new URL(input.content).hostname;
        } catch { label = "URL"; }
        detail = input.content;
        icon = "🔗";
    } else {
        label = "Text Input";
        detail = input.content.slice(0, 50) + "...";
        icon = "📝";
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex items-center px-2 py-1 rounded bg-muted hover:bg-muted/80 cursor-help transition-colors text-xs font-medium">
                        <span className="mr-1">{icon}</span>
                        {label}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{detail}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function StrengthBadge({ strength }: { strength: EvidenceStrength }) {
    const styles = {
        strong: "bg-green-600 text-white dark:bg-green-500",
        medium: "bg-blue-600 text-white dark:bg-blue-500",
        weak: "bg-orange-500 text-white dark:bg-orange-600",
    };

    const icons = {
        strong: CheckCircle2,
        medium: HelpCircle,
        weak: AlertCircle,
    };

    const Icon = icons[strength] || HelpCircle;

    return (
        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold ${styles[strength] || styles.medium}`}>
            <Icon className="w-3 h-3" />
            <span className="uppercase">{strength || 'Unknown'} Evidence</span>
        </div>
    )
}
