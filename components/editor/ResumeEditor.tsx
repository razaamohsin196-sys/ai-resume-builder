
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Edit2, Download, Save, Undo, Redo, LayoutTemplate, RotateCw, Sparkles, Bold, Italic, Underline, Link as LinkIcon, Trash2, ArrowUp, ArrowDown, GripVertical, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCareer } from '@/context/CareerContext';
import { modifyResumeHtml, generateHtmlResume, generateResumeDraft, checkGrammar, tailorResume, ReviewSuggestion } from '@/app/actions';
import { KUSE_RESUME_TEMPLATE } from '@/lib/templates/kuseResume';
import { RESUME_TEMPLATES } from '@/lib/templates';
import { ResumeTemplate } from '@/lib/templates/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Settings, Layout } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

// Simple Markdown Renderer
function renderMarkdown(text: string) {
    // 1. Bold: **text**
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 2. Bullets: - item
    html = html.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
    // Wrap lists if present (simple heuristic)
    if (html.includes('<li>')) {
        html = html.replace(/((<li>.*<\/li>)+)/s, '<ul class="list-disc pl-4 my-2">$1</ul>');
    }
    // Newlines to <br>
    return html.split('\n').map((line, i) => (
        <span key={i} dangerouslySetInnerHTML={{ __html: line + '<br/>' }} />
    ));
}

interface ResumeEditorProps {
    initialHtml?: string;
}

// Internal Component for Template Preview
const TemplatePreviewCard = ({ template, isSelected, onClick }: { template: any, isSelected: boolean, onClick: () => void }) => {
    // We render a scaled-down iframe
    const scale = 0.25;
    const baseWidth = 800; // Assumed internal width for A4 render
    // A4 Ratio ~ 1.414. Height ~ 1131
    const baseHeight = 1132;

    const containerWidth = baseWidth * scale; // 200px
    const containerHeight = baseHeight * scale; // 283px

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative border-2 rounded-lg overflow-hidden transition-all shrink-0 hover:ring-2 hover:ring-primary hover:border-primary text-left bg-white",
                isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border/50 opacity-80 hover:opacity-100"
            )}
            style={{ width: containerWidth, height: containerHeight + 40 }} // Extra space for label
        >
            {/* Preview Area */}
            <div className="relative bg-white overflow-hidden" style={{ width: containerWidth, height: containerHeight }}>
                <iframe
                    srcDoc={template.html}
                    className="absolute top-0 left-0 border-none pointer-events-none select-none origin-top-left"
                    tabIndex={-1}
                    aria-hidden="true"
                    loading="lazy"
                    title={`Preview of ${template.name}`}
                    style={{
                        width: `${baseWidth}px`,
                        height: `${baseHeight}px`,
                        transform: `scale(${scale})`
                    }}
                />

                {/* Overlay for selection/hover */}
                <div className={cn(
                    "absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors",
                    isSelected ? "bg-transparent" : "bg-black/5"
                )} />
            </div>

            {/* Footer Label */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-white border-t flex items-center justify-between px-3">
                <span className="text-xs font-semibold truncate max-w-[150px]">{template.name}</span>
                {isSelected && <div className="bg-primary text-white rounded-full p-0.5"><Check className="w-3 h-3" /></div>}
            </div>
        </button>
    );
};

// Helper to detect template from HTML content
const inferTemplateFromHtml = (html: string): ResumeTemplate | undefined => {
    if (!html) return undefined;
    // Classic uses CSS variables heavily in :root
    if (html.includes('--page-margin') && html.includes('--name-font-size')) {
        return RESUME_TEMPLATES.find(t => t.id === 'classic');
    }
    // Olive Green Modern has specific classes
    if (html.includes('header-left') && html.includes('arrow-icon-wrapper')) {
        return RESUME_TEMPLATES.find(t => t.id === 'olivegreenmodern');
    }
    // Add other detections as needed, or fallback
    return undefined;
};

// COMPREHENSIVE LIST OF EDITABLE ELEMENTS ACROSS ALL TEMPLATES
const EDITABLE_SELECTORS = [
    '.section',
    '.summary',
    '.experience-item',
    '.skills-list',
    '.education-item',
    '.name',
    '.contact-info',
    '.header-text',
    '.about-me-text',
    '.responsibilities-list',
    '.achievements-container',
    '.college',
    '.degree',
    '.date',
    '.details',
    '.subtitle',
    '.expertise-list',
    '.item-title',
    '.item-subtitle',
    '.item-description',
    '.job',
    '.reference-item',
    '.title',
    '.work-experience',
    '.education',
    '.skills',
    '.certification',
    '.language',
    '.job-title',       // Added
    '.section-title',   // Added
    '.contact-item',     // Added
    '.reference-name',   // Added
    '.language-item',    // Added
    'h1', 'h2', 'h3'     // Catch-all for headers
].join(', ');

export function ResumeEditor({ initialHtml = '' }: ResumeEditorProps) {
    const { setStep, resumeHtml, setResumeHtml, profile, intent, setResume } = useCareer();

    // ... rest of component

    // --- HISTORY STATE ---
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // --- TEMPLATE STATE ---
    // Fix: Detect from HTML first, then fall back to Classic (correct ID), then first available
    const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>(() => {
        const detected = inferTemplateFromHtml(resumeHtml || initialHtml);
        return detected || RESUME_TEMPLATES.find(t => t.id === 'classic') || RESUME_TEMPLATES[0];
    });

    const [isChangingTemplate, setIsChangingTemplate] = useState(false);
    const [isTemplatePopoverOpen, setIsTemplatePopoverOpen] = useState(false);

    // Local copy of HTML
    const [currentHtml, setCurrentHtml] = useState<string>(resumeHtml || initialHtml);
    const [annotatedHtml, setAnnotatedHtml] = useState<string | null>(null);
    const [showHighlights, setShowHighlights] = useState(false);

    // --- LAYOUT SETTINGS ---
    const [layoutSettings, setLayoutSettings] = useState({
        lineHeight: 1.08,
        sectionSpacing: 10
    });

    const updateIframeLayout = (settings: typeof layoutSettings) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'UPDATE_LAYOUT',
                settings
            }, '*');
        }
    };

    useEffect(() => {
        updateIframeLayout(layoutSettings);
    }, [layoutSettings]);

    // undoing/redoing flag to prevent pushing to history during traversal
    const logHistory = (newHtml: string) => {
        // If we heavily change the tree (new edit), we discard future
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newHtml);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // Initialize history
    useEffect(() => {
        if (history.length === 0 && currentHtml) {
            setHistory([currentHtml]);
            setHistoryIndex(0);
        }
    }, []);

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const prevHtml = history[newIndex];
            setHistoryIndex(newIndex);

            // FORCE UPDATE: Undo comes from "external" (User UI), so we must rewrite iframe
            isInternalUpdate.current = false;

            setCurrentHtml(prevHtml);
            setResumeHtml(prevHtml);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const nextHtml = history[newIndex];
            setHistoryIndex(newIndex);

            // FORCE UPDATE: Redo comes from "external", so we must rewrite iframe
            isInternalUpdate.current = false;

            setCurrentHtml(nextHtml);
            setResumeHtml(nextHtml);
        }
    };



    const handleDownload = () => {
        if (iframeRef.current && iframeRef.current.contentWindow && iframeRef.current.contentDocument) {
            const doc = iframeRef.current.contentDocument;

            // 1. Inject Temporary Print Styles (The Nuclear Option)
            // This guarantees we override any inline styles with !important
            const style = doc.createElement('style');
            style.id = 'temp-print-styles';
            style.textContent = `
                @page { margin: 0; }
                body { margin: 0 !important; -webkit-print-color-adjust: exact; }
                *[contenteditable] { outline: none !important; }
                .review-issue { 
                    text-decoration: none !important; 
                    background-color: transparent !important; 
                    border-bottom: none !important;
                }
                .review-issue[data-type="grammar"], .review-issue[data-type="tailor"] {
                    text-decoration: none !important; 
                    background-color: transparent !important; 
                }
            `;
            doc.head.appendChild(style);

            // 2. Print
            // Note: In Chrome, this opens the preview. The DOM must remain clean during preview generation.
            iframeRef.current.contentWindow.print();

            // 3. Cleanup after delay
            // We wait to ensure the print preview has captured the clean state.
            setTimeout(() => {
                const tempStyle = doc.getElementById('temp-print-styles');
                if (tempStyle) {
                    tempStyle.remove();
                }
            }, 1000);
        }
    };

    // --- REGEN STATE ---
    const [isFitToPage, setIsFitToPage] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [grammarIssues, setReviewIssues] = useState<ReviewSuggestion[]>([]);
    const [activeIssue, setActiveIssue] = useState<{ issue: ReviewSuggestion, rect?: { top: number, left: number, height: number } } | null>(null);

    // Tailor Modal State
    const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
    const [tailorInput, setTailorInput] = useState("");

    const handleCheckGrammar = async () => {
        setIsRegenerating(true);
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: 'Check for grammar errors.', timestamp: Date.now() }]);
        const tempId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: tempId, role: 'assistant', content: 'Scanning your resume...', timestamp: Date.now() }]);

        try {
            const issues = await checkGrammar(currentHtml);
            setReviewIssues(prev => [...prev.filter(i => i.type !== 'grammar'), ...issues]);

            if (issues.length === 0) {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: '✅ Great news! I didn\'t find any grammar or spelling issues.' } : m));
            } else {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: `Found ${issues.length} potential issues. They are highlighted in red. Click on them to review.` } : m));
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: '❌ Error running grammar check.' } : m));
        } finally {
            setIsRegenerating(false);
        }
    };

    const confirmTailor = async () => {
        const jobDescription = tailorInput.trim();
        if (!jobDescription) return;

        setIsTailorModalOpen(false); // Close modal
        setIsRegenerating(true);
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: `Tailor for Job: ${jobDescription.substring(0, 50)}...`, timestamp: Date.now() }]);
        const tempId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: tempId, role: 'assistant', content: 'Analyzing resume against job description and generating suggestions...', timestamp: Date.now() }]);

        try {
            const suggestions = await tailorResume(currentHtml, jobDescription);
            setReviewIssues(prev => [...prev.filter(i => i.type !== 'tailor'), ...suggestions]);

            if (suggestions.length === 0) {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: '✅ Your resume already looks well-tailored for this role based on my analysis.' } : m));
            } else {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: `Found ${suggestions.length} opportunities for tailoring. They are highlighted in blue. Click to review.` } : m));
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: '❌ Error generating tailoring suggestions.' } : m));
        } finally {
            setIsRegenerating(false);
            setTailorInput(""); // Reset
        }
    };

    const handleTailor = async () => {
        // Placeholder if needed, but we use setIsTailorModalOpen now
    };


    const handleRegenerate = async (fitPage: boolean) => {
        setIsFitToPage(fitPage);
        setIsRegenerating(true);

        // Add User Message
        const userMsgId = crypto.randomUUID();
        const actionText = fitPage ? "Fit to 1 Page" : "Disable 1-Page Mode";
        setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: actionText, timestamp: Date.now() }]);

        // Add Assistant processing message
        const tempId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: tempId, role: 'assistant', content: fitPage ? "Optimizing layout to fit everything on one page..." : "Reverting to standard layout...", timestamp: Date.now() }]);

        try {
            const [html, draft] = await Promise.all([
                generateHtmlResume(profile!, intent!, selectedTemplate.html, { fitToOnePage: fitPage }),
                generateResumeDraft(profile!, intent!, { fitToOnePage: fitPage })
            ]);

            setResumeHtml(html);
            setResume(draft);
            setCurrentHtml(html);
            logHistory(html); // Explicitly log history for AI actions

            // Update Assistant Message
            setMessages(prev => prev.map(m =>
                m.id === tempId ? {
                    ...m,
                    content: fitPage
                        ? "✅ **Done!** I've condensed your resume to a single page by adjusting spacing, margins, and font sizes while keeping all your content."
                        : "✅ **Done!** I've restored the standard layout."
                } : m
            ));

        } catch (e) {
            console.error(e);
            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: "❌ Sorry, I encountered an error while regenerating the resume." } : m
            ));
        } finally {
            setIsRegenerating(false);
        }
    };
    useEffect(() => {
        if (resumeHtml && resumeHtml !== currentHtml) {
            // Check if this is a NEW distinct update (not just a loop)
            if (history[historyIndex] !== resumeHtml) {
                // It came from outside (e.g. initial load or reset)
                setCurrentHtml(resumeHtml);
                // We should probably reset history if it's a totally new resume? 
                // For now, let's treat it as a new step.
                // logHistory(resumeHtml); // Be careful with loops here
            }
        }
    }, [resumeHtml]);
    const handleChangeTemplate = async (template: ResumeTemplate) => {
        setIsChangingTemplate(true);
        setIsTemplatePopoverOpen(false); // Close immediately for better UX
        setSelectedTemplate(template);

        // RESET LAYOUT SETTINGS ON TEMPLATE CHANGE
        setLayoutSettings({ lineHeight: 1.15, sectionSpacing: 18 });

        // Reset interactive state
        setBlockRect(null);
        setActiveBlockId(null);
        setSelectionRect(null);

        // Add User Message
        const userMsgId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: `Switch template to: ${template.name}`, timestamp: Date.now() }]);

        const tempId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: tempId, role: 'assistant', content: "Applying new template layout...", timestamp: Date.now() }]);

        try {
            const html = await generateHtmlResume(profile!, intent!, template.html, { fitToOnePage: isFitToPage });

            setResumeHtml(html);
            // setResume(draft); // Draft structure doesn't change, just HTML presentation
            setCurrentHtml(html);
            logHistory(html);

            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: `✅ Switched to **${template.name}** template.` } : m
            ));
        } catch (e) {
            console.error(e);
            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: "❌ Error switching template." } : m
            ));
        } finally {
            setIsChangingTemplate(false);
            // setIsTemplatePopoverOpen(false); // Already closed
        }
    };



    const [isEditing, setIsEditing] = useState(true);
    const [iframeHeight, setIframeHeight] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Hi Becky! I have generated your resume based on your profile. You can ask me to make changes like "Move Skills to bottom" or click "Edit" to type directly.', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState<'resume' | 'chat'>('resume');
    const [isMobile, setIsMobile] = useState(false);

    // --- TOOLBAR STATE ---
    const [selectionRect, setSelectionRect] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
    const [blockRect, setBlockRect] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [formatting, setFormatting] = useState<{ bold: boolean; italic: boolean; underline: boolean; fontSize: string }>({ bold: false, italic: false, underline: false, fontSize: '3' });

    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Detect mobile view
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // --- REF TO TRACK SOURCE OF UPDATES ---
    const isInternalUpdate = useRef(false);
    const lastWrittenHtml = useRef<string>('');

    // HANDLE DIRECT EDITS & SELECTION FROM IFRAME
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'RESUME_CONTENT_UPDATE') {
                const newHtml = event.data.html;
                if (newHtml !== currentHtml) {
                    isInternalUpdate.current = true; // MARK AS INTERNAL
                    setCurrentHtml(newHtml);
                    setResumeHtml(newHtml);
                    logHistory(newHtml);
                    lastWrittenHtml.current = newHtml; // Update this so we don't re-write our own change
                }
            }
            if (event.data.type === 'SELECTION_CHANGE') {
                if (event.data.isCollapsed) {
                    setSelectionRect(null);
                } else {
                    const rect = event.data.rect;
                    setSelectionRect(rect);
                    setFormatting(event.data.style);
                    // Hide block controls when selecting text
                    setBlockRect(null);
                    setActiveBlockId(null);
                }
            }
            if (event.data.type === 'BLOCK_HOVER') {
                setBlockRect(event.data.rect);
                setActiveBlockId(event.data.id);
            }
            if (event.data.type === 'IFRAME_RESIZE') {
                // Add a small buffer to prevent flicker? 297mm is ~1123px.
                // Ensure min height 1123
                const h = Math.max(event.data.height, 1123);
                setIframeHeight(h);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [setResumeHtml, currentHtml, history, historyIndex, logHistory]); // Added logHistory to dep array

    // LISTEN FOR GRAMMAR CLICKS FROM IFRAME
    useEffect(() => {
        const handleGrammarClick = (event: MessageEvent) => {
            if (event.data.type === 'GRAMMAR_CLICK') {
                console.log('[PARENT] Received GRAMMAR_CLICK', event.data);
                const issueId = event.data.id;
                const issue = grammarIssues.find(i => i.id === issueId);

                if (issue && event.data.rect && iframeRef.current) {
                    const iframeRect = iframeRef.current.getBoundingClientRect();
                    const rect = event.data.rect;

                    // Allow for a robust fallback if rect is missing (though we patched script)
                    const screenTop = iframeRect.top + rect.top;
                    const screenLeft = iframeRect.left + rect.left;

                    setActiveIssue({
                        issue,
                        rect: {
                            top: screenTop,
                            left: screenLeft,
                            height: rect.height
                        }
                    });
                } else if (issue) {
                    // Fallback to center if no rect (e.g. old script cached?)
                    setActiveIssue({ issue });
                }
            }
        };
        window.addEventListener('message', handleGrammarClick);
        return () => window.removeEventListener('message', handleGrammarClick);
    }, [grammarIssues]);

    // INJECT EDIT SCRIPTS INTO IFRAME
    useEffect(() => {
        // PERF: Skip writing to iframe if the update came from the iframe itself (typing)
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false; // Reset for next time
            return;
        }

        // ISSUE FIX: If we undo/redo, we are here because isInternalUpdate is false.
        // We MUST re-inject scripts because doc.write() wipes the window/document.
        if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument;

            const script = `
                    <script>
                        // --- 1. Content Sync ---
                        let debounceTimer;
                        
                        // --- 0. Initialize Layout Settings (From Parent State) ---
                        // This ensures spacing is correct immediately upon load/template switch
                        document.documentElement.style.setProperty('--line-height', '${layoutSettings.lineHeight}');
                        document.documentElement.style.setProperty('--section-spacing', '${layoutSettings.sectionSpacing}px');

                        document.body.addEventListener('input', function(e) {
                            clearTimeout(debounceTimer);
                            debounceTimer = setTimeout(() => {
                                window.parent.postMessage({
                                    type: 'RESUME_CONTENT_UPDATE',
                                    html: document.documentElement.outerHTML
                                }, '*');
                            }, 500);
                        });
                        
                        // --- 2. Selection Tracking (Rich Text) ---
                        document.addEventListener('selectionchange', () => {
                            const sel = window.getSelection();
                            if (sel.rangeCount > 0 && !sel.isCollapsed) {
                                const range = sel.getRangeAt(0);
                                const rect = range.getBoundingClientRect();
                                
                                // Check formatting state
                                const isBold = document.queryCommandState('bold');
                                const isItalic = document.queryCommandState('italic');
                                const isUnderline = document.queryCommandState('underline');
                                // Calculate robust font size from computed style
                                let fontSize = '3';
                                try {
                                    const parent = range.commonAncestorContainer;
                                    const el = parent.nodeType === 1 ? parent : parent.parentElement;
                                    if (el) {
                                        const px = parseFloat(window.getComputedStyle(el).fontSize);
                                        // Map px to 1-7 legacy sizes (Strict Mapping for 14px Base)
                                        if (px <= 10) fontSize = '1';      // Tiny
                                        else if (px <= 13) fontSize = '2'; // Small
                                        else if (px < 16) fontSize = '3';  // Normal (14px falls here)
                                        else if (px < 22) fontSize = '4';  // Large (18px falls here)
                                        else if (px < 28) fontSize = '5';  // Huge (26px falls here)
                                        else if (px < 40) fontSize = '6';  // Title
                                        else fontSize = '7';
                                    }
                                } catch (e) {
                                    fontSize = document.queryCommandValue('fontSize') || '3';
                                }

                                window.parent.postMessage({
                                    type: 'SELECTION_CHANGE',
                                    isCollapsed: false,
                                    rect: {
                                        top: rect.top,
                                        left: rect.left,
                                        width: rect.width,
                                        height: rect.height
                                    },
                                    style: { bold: isBold, italic: isItalic, underline: isUnderline, fontSize }
                                }, '*');
                            } else {
                                window.parent.postMessage({ type: 'SELECTION_CHANGE', isCollapsed: true }, '*');
                            }
                        });

                        // --- 3. Block Hover (Drag/Move Controls) ---
                        document.body.addEventListener('mouseover', (e) => {
                             // Find the closest draggable block (section or experience-item)
                             const block = e.target.closest('.section, .experience-item, .education-item, .skill-percentage, .timeline-item, .job, .reference-item, .contact-item');
                             if(block) {
                                 // Add an outline temporarily
                                 const rect = block.getBoundingClientRect();
                                 
                                 // Assign ID if missing
                                 if (!block.id) {
                                    block.id = 'block-' + Math.random().toString(36).substr(2, 9);
                                 }

                                 window.parent.postMessage({
                                    type: 'BLOCK_HOVER',
                                    id: block.id,
                                    rect: {
                                        top: rect.top,
                                        left: rect.left,
                                        width: rect.width,
                                        height: rect.height
                                    }
                                 }, '*');
                             } else {
                                  // window.parent.postMessage({ type: 'BLOCK_HOVER', rect: null }, '*');
                             }
                        });
                        
                        // --- 4. Command Execution Listener ---
                        window.addEventListener('message', (event) => {
                            const { type, cmd, val, blockId, direction, settings } = event.data;

                            if (type === 'UPDATE_LAYOUT' && settings) {
                                document.documentElement.style.setProperty('--line-height', settings.lineHeight);
                                document.documentElement.style.setProperty('--section-spacing', settings.sectionSpacing + 'px');
                            }

                            if (type === 'EXEC_COMMAND') {
                                document.execCommand(cmd, false, val);
                                // Trigger update immediately
                                window.parent.postMessage({
                                    type: 'RESUME_CONTENT_UPDATE',
                                    html: document.documentElement.outerHTML
                                }, '*');
                            }

                            if (type === 'MOVE_BLOCK') {
                                const el = document.getElementById(blockId);
                                if (!el) return;

                                if (direction === 'delete') {
                                    el.remove();
                                } else if (direction === 'up') {
                                    const prev = el.previousElementSibling;
                                    if (prev) {
                                        el.parentNode.insertBefore(el, prev);
                                    }
                                } else if (direction === 'down') {
                                    const next = el.nextElementSibling;
                                    if (next) {
                                        // Insert before the element *after* next
                                        el.parentNode.insertBefore(el, next.nextElementSibling);
                                    }
                                }
                                
                                // Scroll to element
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                
                                // Update rect after move
                                setTimeout(() => {
                                    const rect = el.getBoundingClientRect();
                                    window.parent.postMessage({
                                        type: 'BLOCK_HOVER',
                                        id: el.id,
                                        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
                                    }, '*');
                                }, 100);

                                window.parent.postMessage({
                                    type: 'RESUME_CONTENT_UPDATE',
                                    html: document.documentElement.outerHTML
                                }, '*');
                            }
                        });

                        // --- 5. Content Height Sync (Auto-Resize) ---
                        const resizeObserver = new ResizeObserver(entries => {
                            const height = document.body.scrollHeight;
                            window.parent.postMessage({
                                type: 'IFRAME_RESIZE',
                                height: height
                            }, '*');
                        });
                        resizeObserver.observe(document.body);
                        // Also trigger once on load
                        window.parent.postMessage({ type: 'IFRAME_RESIZE', height: document.body.scrollHeight }, '*');
                        
                        // Toggle Content Editable based on mode
                        const editable = ${isEditing};
                        const sections = document.querySelectorAll('${EDITABLE_SELECTORS}');
                        sections.forEach(el => {
                            if(editable) {
                                el.setAttribute('contenteditable', 'true');
                                el.style.outline = '1px dashed rgba(59, 130, 246, 0.3)';
                            } else {
                                el.removeAttribute('contenteditable');
                                el.style.outline = 'none';
                            }
                        });
                        
                        // CSS Injection for better edit UX
                        const style = document.createElement('style');
                        style.textContent = \`
                            *[contenteditable]:focus { outline: 2px solid #3b82f6 !important; border-radius: 4px; }
                            ::selection { background-color: #bfdbfe; }
                            
                            /* Enforce Layout Settings Globally */
                            .section { margin-bottom: var(--section-spacing, 20px) !important; }
                            p, li, .item-description, .about-me-text, .item-subtitle, .date, .location { line-height: var(--line-height, 1.4) !important; }

                            /* HIDE EDITOR ARTIFACTS IN PRINT/PDF */
                            @media print {
                                *[contenteditable] { outline: none !important; }
                                .review-issue { 
                                    text-decoration: none !important; 
                                    background-color: transparent !important; 
                                    border-bottom: none !important;
                                }
                                .review-issue[data-type="grammar"], .review-issue[data-type="tailor"] {
                                    text-decoration: none !important; 
                                    background-color: transparent !important; 
                                }
                            }
                            /* FORCE HIDE CLASS (Parent-triggered) */
                            .printing *[contenteditable] { outline: none !important; }
                            .printing .review-issue { 
                                text-decoration: none !important; 
                                background-color: transparent !important; 
                                border-bottom: none !important;
                            }
                        \`;
                        if (!document.getElementById('editor-styles')) {
                            style.id = 'editor-styles';
                            document.head.appendChild(style);
                        }

                        // JS Backup for Print (Keep as secondary)
                        window.addEventListener('beforeprint', () => {
                            document.body.classList.add('printing');
                        });
                        window.addEventListener('afterprint', () => {
                            document.body.classList.remove('printing');
                        });
                    </script>
                 `;

            // GRAMMAR & TAILOR SCRIPT INJECTION
            const grammarScript = `
                <style>
                    .review-issue {
                        cursor: pointer;
                        position: relative;
                        z-index: 10;
                    }
                    .review-issue[data-type="grammar"] {
                        text-decoration: underline wavy red;
                        background-color: rgba(255, 0, 0, 0.1);
                    }
                    .review-issue[data-type="tailor"] {
                        text-decoration: underline wavy #3b82f6;
                        background-color: rgba(59, 130, 246, 0.1);
                    }
                </style>
                <script>
                    console.log('[IFRAME] Review script loaded');
                    document.body.addEventListener('click', (e) => {
                        const target = e.target.closest('.review-issue');
                        if (target) {
                            console.log('[IFRAME] Review issue clicked', target);
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const id = target.getAttribute('data-id');
                            const rect = target.getBoundingClientRect();
                            
                            window.parent.postMessage({
                                type: 'GRAMMAR_CLICK',
                                id,
                                rect: {
                                    top: rect.top,
                                    left: rect.left,
                                    height: rect.height,
                                    width: rect.width
                                }
                            }, '*');
                        }
                    });
                </script>
            `;


            // Apply Highlights
            let htmlToWrite = (showHighlights && annotatedHtml ? annotatedHtml : currentHtml);

            if (grammarIssues.length > 0) {
                // Sort by length desc to prevent nested replacement issues? 
                // Or just proceed.
                grammarIssues.forEach(issue => {
                    const typeClass = issue.type === 'tailor' ? 'tailor' : 'grammar';
                    // Careful with replacements. Only match exact text.
                    if (htmlToWrite.includes(issue.originalText) && !htmlToWrite.includes(`data - id="${issue.id}"`)) {
                        htmlToWrite = htmlToWrite.replace(issue.originalText, `<span class="review-issue" contenteditable="false" data-id="${issue.id}" data-type="${issue.type}">${issue.originalText}</span>`);
                    }
                });
            }

            // Safe Write Logic - Inject BEFORE </body> to ensure valid DOM structure
            const combinedScripts = script + grammarScript;
            const finalHtml = htmlToWrite.includes('</body>')
                ? htmlToWrite.replace('</body>', `${combinedScripts}</body > `)
                : htmlToWrite + combinedScripts; // Fallback for partial fragments

            if (doc) {
                // Determine if we need to Rewrite content or just Update attributes
                const hasContentChanged = currentHtml !== lastWrittenHtml.current || (showHighlights && !!annotatedHtml) || (grammarIssues.length > 0);
                const isInitialLoad = doc.body.innerHTML === "";

                if (hasContentChanged || isInitialLoad) {
                    doc.open();
                    doc.write(finalHtml);
                    doc.close();
                    lastWrittenHtml.current = currentHtml;

                    // Re-apply contentEditable explicitly after write to ensure listeners attach to editable elements
                    const sections = doc.querySelectorAll(EDITABLE_SELECTORS);
                    sections.forEach(el => {
                        if (isEditing) {
                            el.setAttribute('contenteditable', 'true');
                            (el as HTMLElement).style.outline = '1px dashed rgba(59, 130, 246, 0.3)';
                        }
                    });
                } else {
                    // Update contentEditable state directly without rewriting (preserves selection)
                    const sections = doc.querySelectorAll(EDITABLE_SELECTORS);
                    sections.forEach(el => {
                        if (isEditing) {
                            el.setAttribute('contenteditable', 'true');
                            (el as HTMLElement).style.outline = '1px dashed rgba(59, 130, 246, 0.3)';
                        } else {
                            el.removeAttribute('contenteditable');
                            (el as HTMLElement).style.outline = 'none';
                        }
                    });
                }
            }
        }
    }, [isEditing, currentHtml, showHighlights, annotatedHtml, grammarIssues]);


    const [showComparison, setShowComparison] = useState(false);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        const tempId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: tempId, role: 'assistant', content: 'Working on it...', timestamp: Date.now() }]);

        try {
            const result = await modifyResumeHtml(currentHtml, userMsg.content);
            const { html, summary, changes, annotated_html } = result;

            setCurrentHtml(html);
            setResumeHtml(html); // Sync global
            logHistory(html);

            if (annotated_html) {
                setAnnotatedHtml(annotated_html);
                setShowHighlights(true); // Auto-show highlights on new edit
            }

            const changeList = changes && changes.length > 0
                ? `\n\n ** Changes:**\n${changes.map(c => `- ${c}`).join('\n')} `
                : '';

            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: `${summary}${changeList} ` } : m
            ));
        } catch (e) {
            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: 'Sorry, something went wrong while editing.' } : m
            ));
        }
    };

    // Compare Logic
    const toggleComparison = (show: boolean) => {
        if (historyIndex > 0) {
            const prevHtml = history[historyIndex - 1];
            setShowComparison(show);
            // We cheat a bit: simply swapping the HTML in state is safest for IFrame
            // But to avoid "flashing" or losing current state, we use 'currentHtml' variable

            if (show) {
                // Show OLD
                if (iframeRef.current && iframeRef.current.contentDocument) {
                    iframeRef.current.contentDocument.open();
                    iframeRef.current.contentDocument.write(prevHtml + `< script > document.body.style.opacity = '0.7';</script > `);
                    iframeRef.current.contentDocument.close();
                }
            } else {
                // Show CURRENT
                // Rerender current
                if (iframeRef.current && iframeRef.current.contentDocument) {
                    iframeRef.current.contentDocument.open();
                    iframeRef.current.contentDocument.write(currentHtml);
                    iframeRef.current.contentDocument.close();
                }
            }
        }
    };

    const execCmd = (cmd: string, val?: string) => {
        if (cmd === 'createLink') {
            const url = prompt('Enter the link URL:', 'https://');
            if (url) val = url;
            else return;
        }
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'EXEC_COMMAND', cmd, val }, '*');
        }
    };

    const handleBlockMove = (direction: 'up' | 'down' | 'delete') => {
        if (iframeRef.current && iframeRef.current.contentWindow && activeBlockId) {
            iframeRef.current.contentWindow.postMessage({ type: 'MOVE_BLOCK', blockId: activeBlockId, direction }, '*');
        }
    };

    // Components 
    const chatInterfaceCmp = (
        <div className="flex flex-col h-full bg-background border-l">
            <div className="p-4 border-b bg-muted/10 flex items-center justify-between shrink-0">
                <h3 className="font-semibold flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Assistant
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-xs h-6 px-2">Reset Session</Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map(m => (
                        <div key={m.id} className={cn("flex w-full mb-4", m.role === 'user' ? 'justify-end' : 'justify-start')}>
                            <div className={cn(
                                "max-w-[85%] rounded-lg px-4 py-3 text-sm",
                                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                                {/* Rendering the content with markdown support */}
                                {renderMarkdown(m.content)}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t mt-auto relative shrink-0 space-y-3">
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={isFitToPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleRegenerate(!isFitToPage)}
                        className={cn("h-7 text-xs rounded-full", isFitToPage && "bg-purple-600 hover:bg-purple-700")}
                        disabled={isRegenerating}
                    >
                        {isRegenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <LayoutTemplate className="w-3 h-3 mr-1" />}
                        {isFitToPage ? "1-Page Active" : "Fit to 1 Page"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs rounded-full"
                        onClick={() => {
                            setInput("Optimize my resume for impact and brevity.");
                            // handleSendMessage(); // Let user confirm or edit
                        }}
                    >
                        <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                        Optimize
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs rounded-full"
                        onClick={() => setIsTailorModalOpen(true)}
                    >
                        <Edit2 className="w-3 h-3 mr-1 text-blue-500" />
                        Tailor to Job
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs rounded-full"
                        onClick={handleCheckGrammar}
                    >
                        <span className="mr-1">🔍</span>
                        Check Grammar
                    </Button>
                </div>

                <div className="relative">
                    <Textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Make the summary more concise... (Shift+Enter for new line)"
                        className="pr-10 max-h-32 min-h-[44px] resize-none"
                    />
                    <Button
                        onClick={(e) => { e.preventDefault(); handleSendMessage(); }}
                        size="sm"
                        className="absolute right-2 bottom-2 h-7 w-7 p-0"
                        variant="ghost"
                    >
                        <Send className="w-4 h-4 text-primary" />
                    </Button>
                </div>
            </div>
        </div>
    );

    const resumePreviewCmp = (
        <div className="flex flex-col h-full relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
            {/* Toolbar */}
            <div className="h-14 border-b bg-white dark:bg-card flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setStep('resume-draft')}>
                        &larr; Back
                    </Button>
                    <div className="h-4 w-px bg-border mx-2" />
                    <Button
                        variant={isEditing ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setIsEditing(!isEditing)}
                        title={isEditing ? "Done Editing" : "Direct Edit"}
                    >
                        {isEditing ? <Save className="w-4 h-4 text-green-600" /> : <Edit2 className="w-4 h-4" />}
                    </Button>

                    <div className="h-4 w-px bg-border mx-2" />

                    <Popover open={isTemplatePopoverOpen} onOpenChange={setIsTemplatePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1 border-dashed" disabled={isChangingTemplate}>
                                {isChangingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LayoutTemplate className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline-block max-w-[100px] truncate">Template</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[90vw] max-w-[1000px] p-0 overflow-hidden" align="start">
                            <div className="p-4 border-b bg-muted/10">
                                <h4 className="font-semibold text-sm">Choose Template</h4>
                                <p className="text-xs text-muted-foreground">Select a layout to instantly update your resume style.</p>
                            </div>
                            <div className="p-6 overflow-x-auto bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex gap-6 pb-2">
                                    {/* Sorted: Selected first */}
                                    {[...RESUME_TEMPLATES].sort((a, b) => {
                                        if (a.id === selectedTemplate.id) return -1;
                                        if (b.id === selectedTemplate.id) return 1;
                                        return 0;
                                    }).map(t => (
                                        <TemplatePreviewCard
                                            key={t.id}
                                            template={t}
                                            isSelected={selectedTemplate.id === t.id}
                                            onClick={() => handleChangeTemplate(t)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 ml-1">
                                <Settings className="w-3.5 h-3.5" />
                                Spacing
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4 space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-semibold">Line Height</Label>
                                        <span className="text-xs text-muted-foreground">{layoutSettings.lineHeight.toFixed(2)}</span>
                                    </div>
                                    <Slider
                                        value={[layoutSettings.lineHeight]}
                                        min={1.0}
                                        max={2.0}
                                        step={0.01}
                                        onValueChange={([val]) => setLayoutSettings(prev => ({ ...prev, lineHeight: val }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-semibold">Section Spacing</Label>
                                        <span className="text-xs text-muted-foreground">{layoutSettings.sectionSpacing}px</span>
                                    </div>
                                    <Slider
                                        value={[layoutSettings.sectionSpacing]}
                                        min={0}
                                        max={40}
                                        step={1}
                                        onValueChange={([val]) => setLayoutSettings(prev => ({ ...prev, sectionSpacing: val }))}
                                    />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="h-4 w-px bg-border mx-2" />

                    <Button variant="ghost" size="icon" disabled={historyIndex <= 0} onClick={handleUndo}>
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={historyIndex >= history.length - 1} onClick={handleRedo}>
                        <Redo className="w-4 h-4" />
                    </Button>
                </div>

                <Button variant="default" size="sm" onClick={handleDownload} className="bg-purple-600 hover:bg-purple-700">
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
            </div>

            {/* Resume Canvas (Iframe) */}
            <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center bg-gray-500/5 relative">
                <div className="bg-white shadow-xl w-[210mm] overflow-hidden relative transition-all duration-200" style={{ minHeight: '297mm', height: iframeHeight ? `${iframeHeight} px` : '297mm' }}>
                    <iframe
                        ref={iframeRef}
                        title="Resume Preview"
                        className="w-full h-full border-none"
                        style={{ height: '100%', minHeight: '297mm' }}
                    />

                    {/* RICH TEXT OVERLAY */}
                    {isEditing && selectionRect && (
                        <div
                            className={cn(
                                "absolute z-50 flex items-center bg-gray-900 text-white p-1 rounded-lg shadow-xl transition-all duration-200",
                                // Conditional Transform based on position
                                selectionRect.top < 60 ? "translate-y-2" : "-translate-y-full"
                            )}
                            style={{
                                top: selectionRect.top < 60 ? selectionRect.top + selectionRect.height : selectionRect.top - 10,
                                // Horizontal Snapping
                                left: selectionRect.left < 250 ? 10 : (selectionRect.left > 550 ? 'auto' : selectionRect.left + (selectionRect.width / 2)),
                                right: selectionRect.left > 550 ? 10 : 'auto',
                                transform: selectionRect.left >= 250 && selectionRect.left <= 550 ? `translate(-50 %, ${selectionRect.top < 60 ? '0' : '0'})` : 'none'
                            }}
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("h-7 w-7 p-0 text-white hover:bg-gray-700", formatting.bold && "bg-gray-700")}
                                onClick={() => execCmd('bold')}
                                title="Bold"
                            >
                                <Bold className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("h-7 w-7 p-0 text-white hover:bg-gray-700", formatting.italic && "bg-gray-700")}
                                onClick={() => execCmd('italic')}
                                title="Italic"
                            >
                                <Italic className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("h-7 w-7 p-0 text-white hover:bg-gray-700", formatting.underline && "bg-gray-700")}
                                onClick={() => execCmd('underline')}
                                title="Underline"
                            >
                                <Underline className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-4 bg-gray-700 mx-1" />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:bg-gray-700" onClick={() => execCmd('createLink')} title="Link">
                                <LinkIcon className="w-4 h-4" />
                            </Button>
                            <div className="relative flex items-center mx-1">
                                <select
                                    className="h-7 bg-transparent text-white text-xs border border-gray-600 rounded px-1 outline-none cursor-pointer hover:bg-gray-700"
                                    onChange={(e) => execCmd('fontSize', e.target.value)}
                                    value={formatting.fontSize}
                                    title="Font Size"
                                >
                                    <option value="1" className="text-black">Tiny</option>
                                    <option value="2" className="text-black">Small</option>
                                    <option value="3" className="text-black">Normal</option>
                                    <option value="4" className="text-black">Large</option>
                                    <option value="5" className="text-black">Huge</option>
                                    <option value="6" className="text-black">Title</option>
                                    <option value="7" className="text-black">Max</option>
                                </select>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:bg-gray-700" onClick={() => execCmd('foreColor', '#3b82f6')} title="Blue Text">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:bg-gray-700" onClick={() => execCmd('foreColor', '#000000')} title="Black Text">
                                <div className="w-3 h-3 rounded-full bg-black border border-gray-600" />
                            </Button>
                            <div className="w-px h-4 bg-gray-700 mx-1" />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:bg-gray-700" onClick={() => execCmd('justifyLeft')} title="Align Left">
                                <AlignLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:bg-gray-700" onClick={() => execCmd('justifyCenter')} title="Align Center">
                                <AlignCenter className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:bg-gray-700" onClick={() => execCmd('justifyRight')} title="Align Right">
                                <AlignRight className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:bg-gray-700" onClick={() => execCmd('justifyFull')} title="Justify">
                                <AlignJustify className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* BLOCK CONTROLS OVERLAY (Simple Move) */}
                    {isEditing && blockRect && !selectionRect && (
                        <div
                            className="absolute z-40 border-2 border-primary/20 pointer-events-none transition-all duration-200 rounded-sm"
                            style={{
                                top: blockRect.top,
                                left: blockRect.left,
                                width: blockRect.width,
                                height: blockRect.height
                            }}
                        >
                            <div className="absolute -top-3 -right-3 flex gap-1 pointer-events-auto shadow-md bg-white rounded-md border p-0.5 animate-in fade-in zoom-in duration-200">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleBlockMove('up')} title="Move Up">
                                    <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" title="Drag (Not Impl)">
                                    <GripVertical className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleBlockMove('down')} title="Move Down">
                                    <ArrowDown className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleBlockMove('delete')} title="Delete Section">
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* TAILOR INPUT MODAL */}
                    {isTailorModalOpen && (
                        <div className="fixed inset-0 w-full h-full bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white dark:bg-card border shadow-2xl p-6 rounded-lg w-[500px] max-w-full space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <span className="text-xl">✨</span> Tailor Resume
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Paste the job description below. I'll analyze it and suggest specific keywords and phrasing updates.
                                </p>
                                <Textarea
                                    value={tailorInput}
                                    onChange={(e) => setTailorInput(e.target.value)}
                                    placeholder="Paste job description here..."
                                    className="min-h-[150px]"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsTailorModalOpen(false)}>Cancel</Button>
                                    <Button onClick={confirmTailor} disabled={!tailorInput.trim()}>
                                        Analyze Job
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REVIEW ISSUE DIALOG */}
                    {/* REVIEW ISSUE DIALOG */}
                    {/* REVIEW ISSUE DIALOG */}
                    {activeIssue && (() => {
                        // Safe derivation for Hot Reload: Handle both new structure and old legacy state
                        const issue = activeIssue.issue || (activeIssue as unknown as ReviewSuggestion);
                        const rect = activeIssue.rect;

                        // Guard against bad state
                        if (!issue || !issue.type) return null;

                        return (
                            <div
                                className={cn(
                                    "z-[100] bg-white dark:bg-card border shadow-2xl p-6 rounded-lg w-[500px] max-w-full max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200",
                                    issue.type === 'tailor' ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-red-500 ring-4 ring-red-500/10',
                                    rect ? "fixed" : "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                )}
                                style={rect ? {
                                    top: Math.max(20, Math.min(window.innerHeight - 550, rect.top + rect.height + 10)),
                                    left: Math.max(20, Math.min(window.innerWidth - 520, rect.left))
                                } : {}}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <span className="text-xl">{issue.type === 'tailor' ? '✨' : '🔍'}</span>
                                        {issue.type === 'tailor' ? 'Tailoring Suggestion' : 'Grammar Issue'}
                                    </h3>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setActiveIssue(null)}>
                                        <span className="sr-only">Close</span>
                                        &times;
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm mb-2">
                                        <span className="font-semibold text-red-600 dark:text-red-400">Original: </span>
                                        <span className="line-through opacity-70 block mt-1 p-2 bg-white/50 rounded border border-red-100">{issue.originalText}</span>
                                    </div>

                                    <div className={cn("p-3 rounded text-sm", issue.type === 'tailor' ? "bg-blue-50 dark:bg-blue-900/20" : "bg-green-50 dark:bg-green-900/20")}>
                                        <span className={cn("font-semibold", issue.type === 'tailor' ? "text-blue-600" : "text-green-600")}>Suggestion: </span>
                                        <div className="font-medium mt-1 p-2 bg-white/50 rounded border border-blue-100">{issue.suggestion}</div>
                                    </div>

                                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                        <span className="font-semibold shrink-0">Why:</span>
                                        <span className="italic">"{issue.reason}"</span>
                                    </div>

                                    <div className="flex gap-2 justify-end pt-2">
                                        <Button variant="outline" size="sm" onClick={() => {
                                            setReviewIssues(prev => prev.filter(i => i.id !== issue.id));
                                            setActiveIssue(null);
                                        }}>
                                            Dismiss
                                        </Button>
                                        <Button size="sm" className={cn("text-white", issue.type === 'tailor' ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700")} onClick={() => {
                                            if (currentHtml.includes(issue.originalText)) {
                                                const newHtml = currentHtml.replace(issue.originalText, issue.suggestion);
                                                setCurrentHtml(newHtml);
                                                setResumeHtml(newHtml);
                                                logHistory(newHtml);
                                                setReviewIssues(prev => prev.filter(i => i.id !== issue.id));
                                                setActiveIssue(null);
                                            } else {
                                                alert("Could not find original text. It may have been edited.");
                                                setReviewIssues(prev => prev.filter(i => i.id !== issue.id));
                                                setActiveIssue(null);
                                            }
                                        }}>
                                            Accept {issue.type === 'tailor' ? 'Change' : 'Fix'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                </div>
            </div>
        </div >
    );

    if (isMobile) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                    <div className="px-4 py-2 border-b flex items-center justify-between bg-background z-10">
                        <div className="flex gap-2">
                            <TabsList>
                                <TabsTrigger value="resume">Resume</TabsTrigger>
                                <TabsTrigger value="chat">Assistant</TabsTrigger>
                            </TabsList>
                        </div>
                    </div>

                    <TabsContent value="resume" className="flex-1 p-0 m-0 overflow-hidden h-full relative">
                        {resumePreviewCmp}
                    </TabsContent>

                    <TabsContent value="chat" className="flex-1 p-0 m-0 overflow-hidden h-full">
                        {chatInterfaceCmp}
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex overflow-hidden bg-background">
            <div className="flex-[3] relative min-w-[600px] border-r">
                {resumePreviewCmp}
            </div>
            <div className="flex-[2] min-w-[320px] max-w-[600px] bg-background">
                {chatInterfaceCmp}
            </div>
        </div>
    );
}
