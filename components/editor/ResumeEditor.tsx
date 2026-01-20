
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
import { Loader2 } from 'lucide-react';

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

export function ResumeEditor({ initialHtml = '' }: ResumeEditorProps) {
    const { setStep, resumeHtml, setResumeHtml, profile, intent, setResume } = useCareer();

    // --- HISTORY STATE ---
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Local copy of HTML
    const [currentHtml, setCurrentHtml] = useState<string>(resumeHtml || initialHtml);
    const [annotatedHtml, setAnnotatedHtml] = useState<string | null>(null);
    const [showHighlights, setShowHighlights] = useState(false);

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
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.print();
        }
    };

    // --- REGEN STATE ---
    const [isFitToPage, setIsFitToPage] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [grammarIssues, setReviewIssues] = useState<ReviewSuggestion[]>([]);
    const [activeIssue, setActiveIssue] = useState<ReviewSuggestion | null>(null);

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
                generateHtmlResume(profile!, intent!, KUSE_RESUME_TEMPLATE, { fitToOnePage: fitPage }),
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


    const [isEditing, setIsEditing] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Hi Becky! I have generated your resume based on your profile. You can ask me to make changes like "Move Skills to bottom" or click "Edit" to type directly.', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState<'resume' | 'chat'>('resume');
    const [isMobile, setIsMobile] = useState(false);

    // --- TOOLBAR STATE ---
    const [selectionRect, setSelectionRect] = useState<{ top: number, left: number, width: number } | null>(null);
    const [blockRect, setBlockRect] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [formatting, setFormatting] = useState({ bold: false, italic: false, underline: false });

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
                console.log('[PARENT] Found issue:', issue);
                if (issue) setActiveIssue(issue);
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

        if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument;

            const script = `
                    <script>
                        // --- 1. Content Sync ---
                        let debounceTimer;
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

                                window.parent.postMessage({
                                    type: 'SELECTION_CHANGE',
                                    isCollapsed: false,
                                    rect: {
                                        top: rect.top,
                                        left: rect.left,
                                        width: rect.width
                                    },
                                    style: { bold: isBold, italic: isItalic, underline: isUnderline }
                                }, '*');
                            } else {
                                window.parent.postMessage({ type: 'SELECTION_CHANGE', isCollapsed: true }, '*');
                            }
                        });

                        // --- 3. Block Hover (Drag/Move Controls) ---
                        document.body.addEventListener('mouseover', (e) => {
                             // Find the closest draggable block (section or experience-item)
                             const block = e.target.closest('.section, .experience-item, .education-item, .skill-percentage');
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
                            const { type, cmd, val, blockId, direction } = event.data;

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


                        // Toggle Content Editable based on mode
                        const editable = ${isEditing};
                        const sections = document.querySelectorAll('.section, .summary, .experience-item, .skills-list, .education-item, .name, .contact-info');
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
                        \`;
                        if (!document.getElementById('editor-styles')) {
                            style.id = 'editor-styles';
                            document.head.appendChild(style);
                        }
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
                            console.log('[IFRAME] Posting message for id:', id);
                            window.parent.postMessage({ type: 'GRAMMAR_CLICK', id }, '*');
                        }
                    }, true); // Capture phase
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
                    if (htmlToWrite.includes(issue.originalText) && !htmlToWrite.includes(`data-id="${issue.id}"`)) {
                        htmlToWrite = htmlToWrite.replace(issue.originalText, `<span class="review-issue" contenteditable="false" data-id="${issue.id}" data-type="${issue.type}">${issue.originalText}</span>`);
                    }
                });
            }

            // Safe Write Logic - Inject BEFORE </body> to ensure valid DOM structure
            const combinedScripts = script + grammarScript;
            const finalHtml = htmlToWrite.includes('</body>')
                ? htmlToWrite.replace('</body>', `${combinedScripts}</body>`)
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
                } else {
                    // Update contentEditable state directly without rewriting (preserves selection)
                    const sections = doc.querySelectorAll('.section, .summary, .experience-item, .skills-list, .education-item, .name, .contact-info, .school-name, .degree-info, .education-date, .job-header, .company-location, .achievements');
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
                ? `\n\n**Changes:**\n${changes.map(c => `- ${c}`).join('\n')}`
                : '';

            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: `${summary}${changeList}` } : m
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
                    iframeRef.current.contentDocument.write(prevHtml + `<script>document.body.style.opacity = '0.7';</script>`);
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
                <div className="bg-white shadow-xl w-[210mm] min-h-[297mm] overflow-hidden relative">
                    <iframe
                        ref={iframeRef}
                        title="Resume Preview"
                        className="w-full h-[297mm] border-none"
                    />

                    {/* RICH TEXT OVERLAY */}
                    {isEditing && selectionRect && (
                        <div
                            className="absolute z-50 flex items-center bg-gray-900 text-white p-1 rounded-lg shadow-xl -translate-y-full -translate-x-1/2 transition-all duration-200"
                            style={{
                                top: selectionRect.top - 10,
                                left: selectionRect.left + (selectionRect.width / 2)
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
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:bg-gray-700" onClick={() => execCmd('fontSize', '4')} title="Large Text">
                                <span className="text-xs font-bold">A+</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:bg-gray-700" onClick={() => execCmd('fontSize', '2')} title="Small Text">
                                <span className="text-xs font-bold">A-</span>
                            </Button>
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
                        <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                    {activeIssue && (
                        <div className={cn(
                            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-card border shadow-2xl p-6 rounded-lg z-[100] w-[500px] max-w-full animate-in fade-in zoom-in-95 duration-200",
                            activeIssue.type === 'tailor' ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-red-500 ring-4 ring-red-500/10'
                        )}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <span className="text-xl">{activeIssue.type === 'tailor' ? '✨' : '🔍'}</span>
                                    {activeIssue.type === 'tailor' ? 'Tailoring Suggestion' : 'Grammar Issue'}
                                </h3>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setActiveIssue(null)}>
                                    <span className="sr-only">Close</span>
                                    &times;
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm mb-2">
                                    <span className="font-semibold text-red-600 dark:text-red-400">Original: </span>
                                    <span className="line-through opacity-70 block mt-1 p-2 bg-white/50 rounded border border-red-100">{activeIssue.originalText}</span>
                                </div>

                                <div className={cn("p-3 rounded text-sm", activeIssue.type === 'tailor' ? "bg-blue-50 dark:bg-blue-900/20" : "bg-green-50 dark:bg-green-900/20")}>
                                    <span className={cn("font-semibold", activeIssue.type === 'tailor' ? "text-blue-600" : "text-green-600")}>Suggestion: </span>
                                    <div className="font-medium mt-1 p-2 bg-white/50 rounded border border-blue-100">{activeIssue.suggestion}</div>
                                </div>

                                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                    <span className="font-semibold shrink-0">Why:</span>
                                    <span className="italic">"{activeIssue.reason}"</span>
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        // Dismiss
                                        setReviewIssues(prev => prev.filter(i => i.id !== activeIssue.id));
                                        setActiveIssue(null);
                                    }}>
                                        Dismiss
                                    </Button>
                                    <Button size="sm" className={cn("text-white", activeIssue.type === 'tailor' ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700")} onClick={() => {
                                        // Accept Fix
                                        // We use the exact string replacement. 
                                        // TODO: Handle case where text might have been edited by user in meantime?
                                        if (currentHtml.includes(activeIssue.originalText)) {
                                            const newHtml = currentHtml.replace(activeIssue.originalText, activeIssue.suggestion);
                                            setCurrentHtml(newHtml);
                                            setResumeHtml(newHtml);
                                            logHistory(newHtml);
                                            setReviewIssues(prev => prev.filter(i => i.id !== activeIssue.id));
                                            setActiveIssue(null);
                                        } else {
                                            alert("Could not find original text. It may have been edited.");
                                            // Maybe remove the issue?
                                            setReviewIssues(prev => prev.filter(i => i.id !== activeIssue.id));
                                            setActiveIssue(null);
                                        }
                                    }}>
                                        Accept {activeIssue.type === 'tailor' ? 'Change' : 'Fix'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

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
        <div className="h-screen max-h-screen flex overflow-hidden">
            <div className="flex-[3] relative min-w-[600px] border-r">
                {resumePreviewCmp}
            </div>
            <div className="flex-[2] min-w-[320px] max-w-[600px] bg-background">
                {chatInterfaceCmp}
            </div>
        </div>
    );
}
