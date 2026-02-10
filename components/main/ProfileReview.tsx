"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

import { useCareer } from '@/context/CareerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertCircle, HelpCircle, BrainCircuit, Sparkles, Send, MessageSquareText, Plus, Trash2, LayoutTemplate, Image as ImageIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CareerProfileItem } from '@/types/career';
import { modifyCareerProfile, refineCareerProfile, ingestCareerProfile } from '@/app/actions';
import { saveCareerProfileResumeData } from '@/lib/resume-data/profile-adapter';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
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
    const { profile: rawProfile, setProfile: setRawProfile, setStep, intent, setIntent, rawMemory } = useCareer();

    // Check if profile is AI Generated (Skip Refinement)
    const isAiGenerated = React.useMemo(() => {
        return rawProfile?.items?.some((i: any) => i.sourceIds?.includes('ai-generated'));
    }, [rawProfile]);

    // UI State
    // If AI generated, start in 'refined' tab (effectively treating the generated profile as refined)
    const [activeTab, setActiveTab] = useState<'raw' | 'refined'>(isAiGenerated ? 'refined' : 'raw');
    const [isRefining, setIsRefining] = useState(!isAiGenerated);

    // If AI generated, the "refined" profile IS the raw profile.
    const [refinedProfile, setRefinedProfile] = useState<typeof rawProfile | null>(isAiGenerated ? rawProfile : null);

    const [isChatOpen, setIsChatOpen] = useState(true);
    const [jobDescription, setJobDescription] = useState('');

    // Determine which profile is currently active in the UI
    const activeProfile = activeTab === 'refined' && refinedProfile ? refinedProfile : rawProfile;

    // Safe Profile Fallback (for loading state)
    const profile = activeProfile || {
        items: [],
        summary: "",
        analysisReport: "",
        manualOverrides: {},
        personal: { name: "", location: "" },
        contact: { email: "", phone: "", linkedin: "", github: "", website: "" },
        missingInfo: []
    } as any;

    // Helper to update state correctly based on active tab
    const setProfileSafe = (newP: typeof rawProfile) => {
        if (!newP) return;
        if (activeTab === 'refined') setRefinedProfile(newP);
        else setRawProfile(newP);
    };

    // Background Ingestion (If coming from File Upload)
    useEffect(() => {
        // Only run if we have inputs but NO profile yet
        if (rawProfile) return;
        if (!rawMemory?.inputs || rawMemory.inputs.length === 0) return;
        if (!intent) return;

        let mounted = true;
        const runIngestion = async () => {
            try {
                // Determine if we need to show a specific message
                // (The initial state already says "Raw data loaded" which is a bit of a lie, but we can update it)

                const result = await ingestCareerProfile(rawMemory.inputs, intent);

                if (mounted) {
                    setRawProfile(result);

                    // Show report in chat
                    setMessages(prev => [...prev, {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: result.analysisReport || "Ingestion complete.",
                        timestamp: Date.now()
                    }]);

                    // The refinement effect will pick up automatically after this!
                }
            } catch (e) {
                console.error("Ingestion failed:", e);
                // We should probably alert the user here
            }
        };

        runIngestion();
        return () => { mounted = false; };
    }, [rawProfile, rawMemory, intent]);

    // Background Refinement on Mount
    useEffect(() => {
        if (!rawProfile || refinedProfile) return; // Already done or empty
        if (!intent) return; // Need intent for refinement
        if (isAiGenerated) return; // Skip for AI generated profiles

        let mounted = true;
        const runRefinement = async () => {
            // 1. Notify User via Chat
            const tempId = crypto.randomUUID();
            setMessages(prev => [...prev, {
                id: tempId,
                role: 'assistant',
                content: '✨ **Refinement in progress...**\n\nI am analyzing your data to create a resume-ready profile. You can review the raw data while I work!',
                timestamp: Date.now()
            }]);

            try {
                // 2. Call Server Action
                const result = await refineCareerProfile(rawProfile, intent);

                if (!mounted) return;

                // 3. Update State & Notify
                setRefinedProfile(result);
                setIsRefining(false);
                setActiveTab('refined'); // Auto-switch to refined (optional, maybe better to let user switch?)
                // Let's auto-switch for better UX, or notify.

                setMessages(prev => prev.map(m =>
                    m.id === tempId ? {
                        ...m,
                        content: '✅ **Refinement Complete!**\n\nI have polished your profile. Check out the **"Refined Profile"** tab to see the improvements.'
                    } : m
                ));

            } catch (e: any) {
                console.error("Refinement failed:", e);
                if (mounted) {
                    setIsRefining(false);
                    setMessages(prev => prev.map(m =>
                        m.id === tempId ? {
                            ...m,
                            content: '⚠️ **Refinement Timed Out**\n\nI couldn’t finish the advanced refinement, but you can still use the Raw Data!'
                        } : m
                    ));
                }
            }
        };

        runRefinement();
        return () => { mounted = false; };
    }, [rawProfile, intent, refinedProfile]); // Add dependencies correctly

    const handleProceedToDraft = (withTailoring: boolean) => {
        // Ensure we commit the refined profile to the main context if selected
        const profileToCommit = (activeTab === 'refined' && refinedProfile) ? refinedProfile : profile;
        if (activeTab === 'refined' && refinedProfile) {
            setRawProfile(refinedProfile); // Commit refined as the "truth" for next steps
        }

        // Store the full career profile ResumeData in localStorage
        // so SectionManager can use it when user manually adds sections later
        if (profileToCommit) {
            saveCareerProfileResumeData(profileToCommit);
        }

        if (withTailoring && jobDescription.trim() && intent) {
            setIntent({
                ...intent,
                jobSearchIntent: jobDescription
            });
        }
        setStep('resume-draft');
    };

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: rawProfile?.analysisReport
                ? `Here are some insights from the raw ingestion:\n\n${rawProfile.analysisReport}`
                : (rawProfile ? 'Raw data loaded. Refinement started.' : 'Reading your documents...'),
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    handlePhotoUpdate('add', event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGlobalUpdate = (section: 'personal' | 'contact', field: string, value: string) => {
        if (!profile) return;

        const newProfile = { ...profile };
        const overrides = { ...(newProfile.manualOverrides || {}) };

        // Update value
        if (section === 'personal' && field === 'photos') {
            newProfile.personal = { ...newProfile.personal, photos: value as any };
            overrides.personal = { ...(overrides.personal || {}), photos: true };
        } else {
            // General Update
            if (section === 'personal') {
                newProfile.personal = { ...newProfile.personal, [field]: value } as any;
                overrides.personal = { ...(overrides.personal || {}), [field]: true };
            } else if (section === 'contact') {
                newProfile.contact = { ...newProfile.contact, [field]: value } as any;
                overrides.contact = { ...(overrides.contact || {}), [field]: true };
            }
        }

        newProfile.manualOverrides = overrides;
        setProfileSafe(newProfile);
    };

    const handlePhotoUpdate = (action: 'set-primary' | 'remove' | 'add', photoUrl: string, index?: number) => {
        if (!profile || !profile.personal) return;
        const currentPhotos = profile.personal.photos || [];

        if (action === 'set-primary' && typeof index === 'number') {
            // Move item at index to 0
            const newPhotos = [...currentPhotos];
            const [item] = newPhotos.splice(index, 1);
            newPhotos.unshift(item);
            handleGlobalUpdate('personal', 'photos', newPhotos as any);
        } else if (action === 'remove' && typeof index === 'number') {
            const newPhotos = [...currentPhotos];
            newPhotos.splice(index, 1);
            handleGlobalUpdate('personal', 'photos', newPhotos as any);
        } else if (action === 'add') {
            const newPhotos = [photoUrl, ...currentPhotos];
            // Deduplicate if needed, though rare for exact base64 match
            handleGlobalUpdate('personal', 'photos', newPhotos as any);
        }
    };

    const handleItemUpdate = (itemId: string, field: keyof CareerProfileItem, value: string) => {
        if (!profile) return;

        const newProfile = { ...profile };
        const overrides = { ...(newProfile.manualOverrides || {}) };

        newProfile.items = newProfile.items.map((item: CareerProfileItem) =>
            item.id === itemId ? { ...item, [field]: value } : item
        );

        // Mark item as overridden
        overrides.items = { ...(overrides.items || {}), [itemId]: true };
        newProfile.manualOverrides = overrides;

        setProfileSafe(newProfile);
    };

    const handleAddItem = (category: CareerProfileItem['category']) => {
        if (!profile) return;
        const newProfile = { ...profile };
        const overrides = { ...(newProfile.manualOverrides || {}) };

        const newItem: CareerProfileItem = {
            id: crypto.randomUUID(),
            category,
            title: '',
            description: '',
            sourceIds: [`manual-${Date.now()}`],
            dates: ''
        };

        newProfile.items = [...newProfile.items, newItem];
        // Mark item as overridden (prevent deletion/overwrite)
        overrides.items = { ...(overrides.items || {}), [newItem.id]: true };
        newProfile.manualOverrides = overrides;

        setProfileSafe(newProfile);
    };

    const handleDeleteItem = (itemId: string) => {
        if (!profile) return;
        const newProfile = { ...profile };
        const overrides = { ...(newProfile.manualOverrides || {}) };

        // Remove item
        newProfile.items = newProfile.items.filter((item: CareerProfileItem) => item.id !== itemId);

        // Mark as overridden (so it doesn't reappear on regen if we had that logic, 
        // though strictly removing it from state is enough for now unless we re-merge)
        // For robust "deletion" tracking we might needed a deletedItems set, but for now:
        overrides.items = { ...(overrides.items || {}), [itemId]: true };
        // Actually, preventing re-merge requires tracking "deleted IDs". 
        // Current aggregator doesn't handle deletions gracefully on re-merge without explicit "trash" state.
        // But for this session, simply removing from state is what the user expects.

        newProfile.manualOverrides = overrides;
        setProfileSafe(newProfile);
    };

    // [Guardrail] Prevent rendering empty profiles which look broken
    // BUT allow it if we are currently refining (isRefining) or if we just started (rawProfile is null)
    // Actually, if rawProfile is null, we might want to show a skeleton state ?
    // For now, let's show the layout with empty fields so the Chat can be seen.
    const showEmptyState = !profile || profile.items.length === 0;

    if (showEmptyState && !isRefining && !rawProfile) {
        // Only show full blocking error if we are NOT loading and HAVE NO data
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background p-8 text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold">Ready to Ingest</h2>
                <p className="text-muted-foreground max-w-md">
                    Building your profile...
                </p>
                {/* Chat Panel will be visible? No, this return blocks it. */}
                {/* We need to render the main layout even if empty, to show the Chat Sidebar. */}
            </div>
        );
    }

    // If we have no profile but are loading, render the main layout with empty data
    const displayProfile = profile || {
        summary: "Loading...",
        items: [],
        personal: { name: "", location: "" },
        contact: { email: "", phone: "", linkedin: "", github: "", website: "" },
        manualOverrides: {},
        analysisReport: ""
    } as any;

    // Override local profile var for rendering
    const safeProfile = displayProfile;

    // Replace all 'profile' usage below with 'safeProfile'
    // Actually, I should just ensure 'profile' is set to a safe default if null.
    // The previous line 'const profile = activeTab ...' handles the switch.
    // I need to patch that line first logic.

    /* 
       Wait, I can't easily replace all 'profile' usages without a huge diff. 
       Let's just update the Guardrail to return the main layout with a "Loading Overlay" inside the content area, 
       but keep the Chat Sidebar accessible.
    */



    // IMPOSSIBLE to do safely with replace_file_content given the size.
    // I need to use the Guardrail block to return a "Skeleton Layout" that includes the ChatPanel.
    // The current Guardrail returns a plain <div> that REPLACES the whole UI. That's why Chat is hidden.

    // STRATEGY: 
    // 1. Comment out the guardrail return.
    // 2. Wrap the Section rendering logic below to check for empty items.



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
            setProfileSafe(newProfile);

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
                                <div className={cn(
                                    "prose prose-sm max-w-none",
                                    m.role === 'user' ? 'prose-invert text-white' : 'dark:prose-invert'
                                )}>
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>

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

                <div className="flex gap-8 max-w-7xl mx-auto pb-24 relative">

                    {/* Sidebar Navigation */}
                    <div className="hidden lg:block w-64 shrink-0 sticky top-4 h-fit space-y-2">
                        <div className="font-semibold px-4 py-2 text-lg">Sections</div>
                        <nav className="flex flex-col space-y-1">
                            <SidebarLink id="summary" label="Summary" />
                            <SidebarLink id="profile" label="Profile & Contact" />
                            <SidebarLink id="experience" label="Experience" />
                            <SidebarLink id="projects" label="Projects" />
                            <SidebarLink id="education" label="Education" />
                            <SidebarLink id="volunteering" label="Volunteering" />
                            <SidebarLink id="certifications" label="Certifications" />
                            <SidebarLink id="awards" label="Awards" />
                            <SidebarLink id="languages" label="Languages" />
                            <SidebarLink id="skills" label="Skills" />
                        </nav>
                    </div>

                    <div className="flex-1 space-y-8 min-w-0">
                        {/* Header (Compacted Single Row) */}
                        <div className="flex items-center justify-between gap-4 pb-3 border-b mb-6 bg-background sticky top-0 z-10 pt-4 -mt-4 shadow-sm h-16">

                            {/* Left: Nav & Title */}
                            <div className="flex items-center gap-4 shrink-0">
                                <Button variant="ghost" size="sm" className="gap-2 pl-2 hover:pl-3 transition-all h-auto font-normal text-muted-foreground hover:text-foreground" onClick={() => setStep('onboarding-inputs')}>
                                    &larr; Back
                                </Button>
                                <div className="h-4 w-px bg-border" />
                                <h1 className="text-lg font-bold tracking-tight hidden sm:block">Career Profile</h1>
                            </div>

                            {/* Center: Tabs */}
                            <div className="flex items-center justify-center p-0.5 bg-muted/50 rounded-lg shrink-0">
                                {!isAiGenerated && (
                                    <button
                                        onClick={() => setActiveTab('raw')}
                                        className={cn(
                                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                            activeTab === 'raw' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Raw Data
                                    </button>
                                )}
                                <button
                                    onClick={() => refinedProfile && setActiveTab('refined')}
                                    disabled={!refinedProfile}
                                    className={cn(
                                        "px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                                        activeTab === 'refined' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
                                        !refinedProfile ? "opacity-50 cursor-not-allowed" : "hover:text-foreground cursor-pointer"
                                    )}
                                >
                                    {isRefining && <Sparkles className="w-2.5 h-2.5 animate-spin text-purple-500" />}
                                    {isRefining ? "Refining" : (isAiGenerated ? "AI Generated Profile" : "Refined (AI)")}
                                </button>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                {!isChatOpen && (
                                    <Button onClick={() => setIsChatOpen(true)} variant="outline" size="sm" className="h-8 px-2 text-xs">
                                        <MessageSquareText className="w-3.5 h-3.5 mr-1.5" /> Chat
                                    </Button>
                                )}
                                <Button size="sm" onClick={() => handleProceedToDraft(false)} className="h-8 bg-green-600 hover:bg-green-700 text-white shadow-sm text-xs px-3">
                                    Generate <CheckCircle2 className="ml-1.5 w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>


                        {/* Skeleton / Empty State handled inside Sections now */}

                        {/* Summary Section */}
                        <div id="summary" className="bg-muted/30 p-6 rounded-lg border scroll-mt-32 mb-8">
                            <h2 className="font-semibold mb-3">Summary</h2>
                            {(isRefining || !rawProfile) && (!safeProfile.summary) ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-[90%]" />
                                    <Skeleton className="h-4 w-[80%]" />
                                </div>
                            ) : (
                                <p className="text-lg leading-relaxed">{safeProfile.summary || "No summary available."}</p>
                            )}
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
                                            {profile.missingInfo.map((info: string, idx: number) => (
                                                <li key={idx} className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
                                                    {info}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Personal & Contact Info (Editable) */}
                        <div id="profile" className="bg-card border rounded-lg p-6 shadow-sm scroll-mt-32">
                            <h2 className="text-xl font-semibold mb-4">Profile & Contact</h2>
                            {(isRefining || !rawProfile) && (!profile.personal?.name) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                                    <div className="md:col-span-2 mb-4 border-b pb-4">
                                        <Skeleton className="h-4 w-32 mb-3" />
                                        <div className="flex items-start gap-6">
                                            <Skeleton className="w-24 h-24 rounded-full" />
                                            <div className="space-y-2 flex-1 pt-2">
                                                <Skeleton className="h-4 w-48" />
                                                <Skeleton className="h-16 w-full max-w-md" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Skeleton className="h-4 w-20 mb-2" />
                                        {[1, 2].map(i => (
                                            <div key={i} className="space-y-1">
                                                <Skeleton className="h-3 w-12" />
                                                <Skeleton className="h-9 w-full" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        <Skeleton className="h-4 w-20 mb-2" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1"><Skeleton className="h-3 w-12" /><Skeleton className="h-9 w-full" /></div>
                                            <div className="space-y-1"><Skeleton className="h-3 w-12" /><Skeleton className="h-9 w-full" /></div>
                                        </div>
                                        <div className="space-y-1"><Skeleton className="h-3 w-12" /><Skeleton className="h-9 w-full" /></div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1"><Skeleton className="h-3 w-12" /><Skeleton className="h-9 w-full" /></div>
                                            <div className="space-y-1"><Skeleton className="h-3 w-12" /><Skeleton className="h-9 w-full" /></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Photo Manager */}
                                    <div className="md:col-span-2 mb-4 border-b pb-4">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" /> Profile Photos
                                        </h3>
                                        <div className="flex items-start gap-6">
                                            {/* Primary Photo */}
                                            <div className="relative group">
                                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center shadow-sm">
                                                    {profile.personal?.photos && profile.personal.photos.length > 0 ? (
                                                        <img src={profile.personal.photos[0]} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                                                    )}
                                                </div>
                                                {profile.personal?.photos && profile.personal.photos.length > 0 && (
                                                    <button
                                                        onClick={() => handlePhotoUpdate('remove', '', 0)}
                                                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                        title="Remove photo"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Carousel / Options */}
                                            <div className="flex-1 space-y-2">
                                                {profile.personal?.photos && profile.personal.photos.length > 1 ? (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-xs text-muted-foreground">Select a different photo:</p>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 text-xs px-2"
                                                                onClick={() => fileInputRef.current?.click()}
                                                            >
                                                                <Plus className="w-3 h-3 mr-1" /> Add New
                                                            </Button>
                                                        </div>
                                                        <div className="flex gap-3 overflow-x-auto pb-2">
                                                            {profile.personal.photos.slice(1).map((photo: string, idx: number) => (
                                                                <div key={idx} className="relative group shrink-0 cursor-pointer" onClick={() => handlePhotoUpdate('set-primary', photo, idx + 1)}>
                                                                    <div className="w-16 h-16 rounded-full overflow-hidden border border-border hover:border-primary transition-colors opacity-70 hover:opacity-100">
                                                                        <img src={photo} alt={`Option ${idx + 2}`} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 rounded-full transition-opacity">
                                                                        <span className="text-white text-xs font-medium">Use</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex items-center">
                                                        <p className="text-sm text-muted-foreground italic cursor-pointer hover:text-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
                                                            {profile.personal?.photos && profile.personal.photos.length > 0
                                                                ? "Click to upload another photo."
                                                                : "No photos found. Click here to upload one."}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Hidden File Input */}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Personal</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-semibold text-muted-foreground">Name</label>
                                                <Input
                                                    value={profile.personal?.name || ""}
                                                    onChange={e => handleGlobalUpdate('personal', 'name', e.target.value)}
                                                    placeholder="Your Name"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-muted-foreground">Location</label>
                                                <Input
                                                    value={profile.personal?.location || ""}
                                                    onChange={e => handleGlobalUpdate('personal', 'location', e.target.value)}
                                                    placeholder="City, Country"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Contact</h3>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs font-semibold text-muted-foreground">Email</label>
                                                    <Input
                                                        value={profile.contact?.email || ""}
                                                        onChange={e => handleGlobalUpdate('contact', 'email', e.target.value)}
                                                        placeholder="email@example.com"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-muted-foreground">Phone</label>
                                                    <Input
                                                        value={profile.contact?.phone || ""}
                                                        onChange={e => handleGlobalUpdate('contact', 'phone', e.target.value)}
                                                        placeholder="(555) 123-4567"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-muted-foreground">LinkedIn</label>
                                                <Input
                                                    value={profile.contact?.linkedin || ""}
                                                    onChange={e => handleGlobalUpdate('contact', 'linkedin', e.target.value)}
                                                    placeholder="https://linkedin.com/in/..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs font-semibold text-muted-foreground">GitHub</label>
                                                    <Input
                                                        value={profile.contact?.github || ""}
                                                        onChange={e => handleGlobalUpdate('contact', 'github', e.target.value)}
                                                        placeholder="https://github.com/..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-muted-foreground">Website</label>
                                                    <Input
                                                        value={profile.contact?.website || ""}
                                                        onChange={e => handleGlobalUpdate('contact', 'website', e.target.value)}
                                                        placeholder="https://website.com"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Roles */}
                        <div id="experience" className="scroll-mt-32">
                            <Section
                                title="Experience"
                                category="role"
                                items={profile.items.filter((i: CareerProfileItem) => i.category === 'role')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                                isLoading={isRefining || !rawProfile}
                            />
                        </div>

                        {/* Projects */}
                        <div id="projects" className="scroll-mt-32">
                            <Section
                                title="Key Projects"
                                category="project"
                                items={profile.items.filter((i: CareerProfileItem) => i.category === 'project')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                                isLoading={isRefining || !rawProfile}
                            />
                        </div>

                        {/* Education */}
                        <div id="education" className="scroll-mt-32">
                            <Section
                                title="Education"
                                category="education"
                                items={profile.items.filter((i: CareerProfileItem) => i.category === 'education')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                                isLoading={isRefining || !rawProfile}
                            />
                        </div>

                        {/* Volunteering */}
                        <div id="volunteering" className="scroll-mt-32">
                            <Section
                                title="Volunteering"
                                category="volunteer"
                                items={profile.items.filter((i: CareerProfileItem) => i.category === 'volunteer')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                                isLoading={isRefining || !rawProfile}
                            />
                        </div>

                        {/* Certifications */}
                        <div id="certifications" className="scroll-mt-32">
                            <Section
                                title="Certifications"
                                category="certification"
                                items={profile.items.filter((i: CareerProfileItem) => i.category === 'certification')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                                isLoading={isRefining || !rawProfile}
                            />
                        </div>

                        {/* Awards */}
                        <div id="awards" className="scroll-mt-32">
                            <Section
                                title="Awards"
                                category="award"
                                items={profile.items.filter((i: CareerProfileItem) => i.category === 'award')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                                isLoading={isRefining || !rawProfile}
                            />
                        </div>

                        {/* Languages */}
                        <div id="languages" className="scroll-mt-32">
                            <Section
                                title="Languages"
                                category="language"
                                items={profile.items.filter((i: CareerProfileItem) => i.category === 'language')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                                isLoading={isRefining || !rawProfile}
                            />
                        </div>

                        {/* Skills */}
                        {profile.items.filter((i: CareerProfileItem) => i.category === 'skill').length > 0 && (
                            <div id="skills" className="space-y-4 scroll-mt-32">
                                <h2 className="text-xl font-semibold">Skills Identified</h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.items.filter((i: CareerProfileItem) => i.category === 'skill').map((skill: CareerProfileItem) => (
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

                </div>

                {/* Footer Actions */}


            </div>

            {/* Chat Sidebar */}
            {isChatOpen && ChatPanel}
        </div>
    );
}



function Section({ title, category, items, onUpdate, onAdd, onDelete, isLoading }: {
    title: string,
    category: CareerProfileItem['category'],
    items: CareerProfileItem[],
    onUpdate: (id: string, field: keyof CareerProfileItem, value: string) => void,
    onAdd: (category: CareerProfileItem['category']) => void,
    onDelete: (id: string) => void,
    isLoading?: boolean
}) {
    const getPlaceholders = (cat: CareerProfileItem['category']) => {
        switch (cat) {
            case 'education': return { title: 'Degree / Major', org: 'University / School', desc: 'Details about your study...' };
            case 'project': return { title: 'Project Name', org: 'Context / Link', desc: 'What did you build? What technologies did you use?' };
            case 'skill': return { title: 'Skill Name', org: 'Category', desc: 'Proficiency level or details...' };
            case 'certification': return { title: 'Certification Name', org: 'Issuing Organization', desc: 'Credential ID...' };
            case 'award': return { title: 'Award Name', org: 'Issuer', desc: 'Significance of the award...' };
            case 'language': return { title: 'Language', org: 'Proficiency', desc: 'Details...' };
            case 'volunteer': return { title: 'Role', org: 'Organization', desc: 'What did you contribute?' };
            default: return { title: 'Title / Role', org: 'Organization', desc: 'Description...' };
        }
    };
    const ph = getPlaceholders(category);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{title}</h2>
                <Button variant="ghost" size="sm" onClick={() => onAdd(category)}>
                    <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
            </div>

            {/* SKELETON LOADING STATE */}
            {
                isLoading && items.length === 0 && (
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="group relative bg-card border rounded-lg p-4 shadow-sm border-l-4 border-l-muted">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <Skeleton className="h-6 w-1/3" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                                <Skeleton className="h-4 w-1/2 mb-4" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }

            {/* ACTUAL ITEMS: Empty State */}
            {items.length === 0 && !isLoading && (
                <div className="text-sm italic text-muted-foreground border border-dashed rounded-lg p-8 text-center bg-muted/20">
                    <p className="mb-2">No items found.</p>
                    <Button variant="outline" size="sm" onClick={() => onAdd(category)}>Add {title}</Button>
                </div>
            )}

            {/* ACTUAL ITEMS: List */}
            {items.length > 0 && (
                <div className="grid gap-4">
                    {items.map(item => (
                        <div key={item.id} className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-2 gap-4">
                                <div className="flex-1">
                                    <Input
                                        className="font-bold text-lg border-transparent hover:border-border h-auto py-1 px-0 -ml-2 focus-visible:pl-2 focus-visible:ring-1"
                                        value={item.title}
                                        placeholder={ph.title}
                                        onChange={(e) => onUpdate(item.id, 'title', e.target.value)}
                                    />
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            className="font-medium text-base border-transparent hover:border-border h-auto py-0 px-0 -ml-2 text-foreground/80 focus-visible:pl-2 w-full"
                                            value={item.organization || ''}
                                            placeholder={ph.org || "Organization"}
                                            onChange={(e) => onUpdate(item.id, 'organization', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            className="text-sm text-muted-foreground border-transparent hover:border-border h-auto py-0 px-0 -ml-2 w-1/2 focus-visible:pl-2"
                                            value={item.dates || ''}
                                            placeholder="Dates (e.g. 2020 - Present)"
                                            onChange={(e) => onUpdate(item.id, 'dates', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                        onClick={() => onDelete(item.id)}
                                        title="Delete Item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <Textarea
                                className="min-h-[100px] text-sm text-muted-foreground leading-relaxed resize-y mt-2"
                                value={item.description || ''}
                                placeholder={ph.desc}
                                onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
                            />

                            <div className="mt-3 text-xs text-muted-foreground flex items-center flex-wrap gap-2">
                                <span className="text-muted-foreground mr-1">Sources:</span>
                                {item.sourceIds.map(id => (
                                    <SourceBadge key={id} sourceId={id} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}



function SidebarLink({ id, label }: { id: string, label: string }) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            // We need to account for sticky header if we use scrollIntoView, 
            // but the scroll-margin-top CSS property on the element usually handles it.
            // However, since we are inside a custom scroll container, behavior varies.
            element.scrollIntoView({ behavior: 'smooth' });

            // Update URL hash without jumping
            history.pushState(null, '', `#${id}`);
        }
    };

    return (
        <a
            href={`#${id}`}
            onClick={handleClick}
            className="px-4 py-2 hover:bg-muted rounded-md text-sm transition-colors block text-left"
        >
            {label}
        </a>
    );
}

function SourceBadge({ sourceId }: { sourceId: string }) {
    const { rawMemory } = useCareer();

    let label = sourceId;
    let detail = "Source details unavailable";
    let icon = "📄";

    // Detect Source Type by Prefix
    if (sourceId.startsWith('github:')) {
        icon = "🐙";
        const parts = sourceId.split(':');
        // github:username or github:username/repo
        label = parts.length > 2 ? `GitHub Repo: ${parts[2]}` : `GitHub: ${parts[1]}`;
        detail = `Verified Metadata from GitHub API (${sourceId})`;
    } else if (sourceId.startsWith('linkedin:')) {
        icon = "💼";
        label = "LinkedIn Profile";
        detail = `Extracted from LinkedIn (${sourceId})`;
    } else {
        // Fallback for Integer IDs (Legacy Files/Text)
        if (!isNaN(parseInt(sourceId)) && rawMemory?.inputs) {
            const index = parseInt(sourceId) - 1;
            const input = rawMemory.inputs[index];
            if (input) {
                if (input.type === 'file') {
                    label = input.content.length > 15 ? input.content.slice(0, 12) + '...' : input.content;
                    detail = `File: ${input.content}`;
                } else if (input.type === 'url' || input.type === 'linkedin') {
                    try { label = new URL(input.content).hostname; } catch { label = "URL"; }
                    detail = input.content;
                    icon = "🔗";
                } else {
                    label = "Text Input";
                    detail = input.content.slice(0, 50) + "...";
                    icon = "📝";
                }
            }
        }
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex items-center px-2 py-1 rounded bg-muted hover:bg-muted/80 cursor-help transition-colors text-xs font-medium border border-border">
                        <span className="mr-1">{icon}</span>
                        {label}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold text-xs mb-1">Source Evidence</p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

