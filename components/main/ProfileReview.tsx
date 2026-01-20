
"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { useCareer } from '@/context/CareerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertCircle, HelpCircle, BrainCircuit, Sparkles, Send, MessageSquareText, Plus, Trash2 } from 'lucide-react';
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
    const { profile, setProfile, setStep, intent, setIntent } = useCareer();
    const [isChatOpen, setIsChatOpen] = useState(true); // Default open for visibility
    const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
    const [jobDescription, setJobDescription] = useState('');

    const handleProceedToDraft = (withTailoring: boolean) => {
        if (withTailoring && jobDescription.trim() && intent) {
            setIntent({
                ...intent,
                jobSearchIntent: jobDescription // Overloading this field for now, or we can add a specific one
            });
        }
        setStep('resume-draft');
    };

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: profile?.analysisReport
                ? `Here are some insights I found:\n\n${profile.analysisReport}\n\nDoes this look accurate?`
                : 'Does this profile look accurate? If not, just tell me what to fix! e.g. "Add a bullet to my last job about leading a team" or "Change my summary to focus on Product Strategy".',
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    if (!profile) return <div>No profile generated.</div>;

    const handleGlobalUpdate = (section: 'personal' | 'contact', field: string, value: string) => {
        if (!profile) return;

        const newProfile = { ...profile };
        const overrides = { ...(newProfile.manualOverrides || {}) };

        // Update value
        if (section === 'personal') {
            newProfile.personal = { ...newProfile.personal, [field]: value } as any;
            overrides.personal = { ...(overrides.personal || {}), [field]: true };
        } else if (section === 'contact') {
            newProfile.contact = { ...newProfile.contact, [field]: value } as any;
            overrides.contact = { ...(overrides.contact || {}), [field]: true };
        }

        newProfile.manualOverrides = overrides;
        setProfile(newProfile);
    };

    const handleItemUpdate = (itemId: string, field: keyof CareerProfileItem, value: string) => {
        if (!profile) return;

        const newProfile = { ...profile };
        const overrides = { ...(newProfile.manualOverrides || {}) };

        newProfile.items = newProfile.items.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
        );

        // Mark item as overridden
        overrides.items = { ...(overrides.items || {}), [itemId]: true };
        newProfile.manualOverrides = overrides;

        setProfile(newProfile);
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
            evidenceStrength: 'strong', // Manual adds are strong
            dates: ''
        };

        newProfile.items = [...newProfile.items, newItem];
        // Mark item as overridden (prevent deletion/overwrite)
        overrides.items = { ...(overrides.items || {}), [newItem.id]: true };
        newProfile.manualOverrides = overrides;

        setProfile(newProfile);
    };

    const handleDeleteItem = (itemId: string) => {
        if (!profile) return;
        const newProfile = { ...profile };
        const overrides = { ...(newProfile.manualOverrides || {}) };

        // Remove item
        newProfile.items = newProfile.items.filter(item => item.id !== itemId);

        // Mark as overridden (so it doesn't reappear on regen if we had that logic, 
        // though strictly removing it from state is enough for now unless we re-merge)
        // For robust "deletion" tracking we might needed a deletedItems set, but for now:
        overrides.items = { ...(overrides.items || {}), [itemId]: true };
        // Actually, preventing re-merge requires tracking "deleted IDs". 
        // Current aggregator doesn't handle deletions gracefully on re-merge without explicit "trash" state.
        // But for this session, simply removing from state is what the user expects.

        newProfile.manualOverrides = overrides;
        setProfile(newProfile);
    };

    // [Guardrail] Prevent rendering empty profiles which look broken
    if (profile.items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background p-8 text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold">We couldn't extract usable data from your inputs yet.</h2>
                <p className="text-muted-foreground max-w-md">
                    This can happen if the GitHub/LinkedIn profile was empty, private, or had no clear projects/roles.
                </p>
                <Button onClick={() => setStep('onboarding-inputs')} variant="outline">
                    Back to Inputs
                </Button>
            </div>
        );
    }

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
                                <div className="prose prose-sm dark:prose-invert max-w-none">
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
                            <a href="#summary" className="px-4 py-2 hover:bg-muted rounded-md text-sm transition-colors">Summary</a>
                            <a href="#profile" className="px-4 py-2 hover:bg-muted rounded-md text-sm transition-colors">Profile & Contact</a>
                            <a href="#experience" className="px-4 py-2 hover:bg-muted rounded-md text-sm transition-colors">Experience</a>
                            <a href="#projects" className="px-4 py-2 hover:bg-muted rounded-md text-sm transition-colors">Projects</a>
                            <a href="#education" className="px-4 py-2 hover:bg-muted rounded-md text-sm transition-colors">Education</a>
                            <a href="#volunteering" className="px-4 py-2 hover:bg-muted rounded-md text-sm transition-colors">Volunteering</a>
                            <a href="#certifications" className="px-4 py-2 hover:bg-muted rounded-md text-sm transition-colors">Certifications</a>
                            <a href="#awards" className="px-4 py-2 hover:bg-muted rounded-md text-sm transition-colors">Awards</a>
                            <a href="#languages" className="px-4 py-2 hover:bg-muted rounded-md text-sm transition-colors">Languages</a>
                            <a href="#skills" className="px-4 py-2 hover:bg-muted rounded-md text-sm transition-colors">Skills</a>
                        </nav>
                    </div>

                    <div className="flex-1 space-y-8 min-w-0">
                        <div className="flex items-center justify-between pb-6 border-b mb-6 bg-background sticky top-0 z-10 pt-4 -mt-4">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all" onClick={() => setStep('onboarding-inputs')}>
                                    &larr; Back
                                </Button>
                                <div className="h-6 w-px bg-border" />
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">Career Profile</h1>
                                    <p className="text-sm text-muted-foreground">Review and edit your data before generating.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {!isChatOpen && (
                                    <Button onClick={() => setIsChatOpen(true)} variant="outline" size="sm">
                                        <MessageSquareText className="w-4 h-4 mr-2" /> Chat
                                    </Button>
                                )}
                                <Button size="sm" onClick={() => handleProceedToDraft(false)} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                                    Generate Resume <CheckCircle2 className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Professional Summary Strategy */}
                        <div id="summary" className="bg-muted/30 p-6 rounded-lg border scroll-mt-20">
                            <h2 className="font-semibold mb-3">Summary</h2>
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

                        {/* Personal & Contact Info (Editable) */}
                        <div id="profile" className="bg-card border rounded-lg p-6 shadow-sm scroll-mt-20">
                            <h2 className="text-xl font-semibold mb-4">Profile & Contact</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>

                        {/* Roles */}
                        <div id="experience" className="scroll-mt-20">
                            <Section
                                title="Experience"
                                category="role"
                                items={profile.items.filter(i => i.category === 'role')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                            />
                        </div>

                        {/* Projects */}
                        <div id="projects" className="scroll-mt-20">
                            <Section
                                title="Key Projects"
                                category="project"
                                items={profile.items.filter(i => i.category === 'project')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                            />
                        </div>

                        {/* Education */}
                        <div id="education" className="scroll-mt-20">
                            <Section
                                title="Education"
                                category="education"
                                items={profile.items.filter(i => i.category === 'education')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                            />
                        </div>

                        {/* Volunteering */}
                        <div id="volunteering" className="scroll-mt-20">
                            <Section
                                title="Volunteering"
                                category="volunteer"
                                items={profile.items.filter(i => i.category === 'volunteer')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                            />
                        </div>

                        {/* Certifications */}
                        <div id="certifications" className="scroll-mt-20">
                            <Section
                                title="Certifications"
                                category="certification"
                                items={profile.items.filter(i => i.category === 'certification')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                            />
                        </div>

                        {/* Awards */}
                        <div id="awards" className="scroll-mt-20">
                            <Section
                                title="Awards"
                                category="award"
                                items={profile.items.filter(i => i.category === 'award')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                            />
                        </div>

                        {/* Languages */}
                        <div id="languages" className="scroll-mt-20">
                            <Section
                                title="Languages"
                                category="language"
                                items={profile.items.filter(i => i.category === 'language')}
                                onUpdate={handleItemUpdate}
                                onAdd={handleAddItem}
                                onDelete={handleDeleteItem}
                            />
                        </div>

                        {/* Skills */}
                        {profile.items.filter(i => i.category === 'skill').length > 0 && (
                            <div id="skills" className="space-y-4 scroll-mt-20">
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

                </div>

                {/* Footer Actions */}


            </div>

            {/* Chat Sidebar */}
            {isChatOpen && ChatPanel}
        </div>
    );
}



function Section({ title, category, items, onUpdate, onAdd, onDelete }: {
    title: string,
    category: CareerProfileItem['category'],
    items: CareerProfileItem[],
    onUpdate: (id: string, field: keyof CareerProfileItem, value: string) => void,
    onAdd: (category: CareerProfileItem['category']) => void,
    onDelete: (id: string) => void
}) {
    const getPlaceholders = (cat: CareerProfileItem['category']) => {
        switch (cat) {
            case 'education': return { title: 'School / Degree', desc: 'Details about your study...' };
            case 'project': return { title: 'Project Name', desc: 'What did you build? What technologies did you use?' };
            case 'skill': return { title: 'Skill Name', desc: 'Proficiency level or details...' };
            case 'certification': return { title: 'Certification Name', desc: 'Issuing organization, credential ID...' };
            case 'award': return { title: 'Award Name', desc: 'Significance of the award...' };
            case 'language': return { title: 'Language', desc: 'Proficiency level (e.g. Native, Fluent)...' };
            case 'volunteer': return { title: 'Organization / Role', desc: 'What did you contribute?' };
            default: return { title: 'Title / Role', desc: 'Description...' };
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

            {items.length === 0 ? (
                <div className="text-sm italic text-muted-foreground border border-dashed rounded-lg p-8 text-center bg-muted/20">
                    <p className="mb-2">No items found.</p>
                    <Button variant="outline" size="sm" onClick={() => onAdd(category)}>Add {title}</Button>
                </div>
            ) : (
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
                                            className="text-sm text-muted-foreground border-transparent hover:border-border h-auto py-0 px-0 -ml-2 w-1/2 focus-visible:pl-2"
                                            value={item.dates || ''}
                                            placeholder="Dates (e.g. 2020 - Present)"
                                            onChange={(e) => onUpdate(item.id, 'dates', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StrengthBadge strength={item.evidenceStrength} />
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
                                value={item.description}
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
