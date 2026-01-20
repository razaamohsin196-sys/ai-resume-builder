
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
import { modifyResumeHtml } from '@/app/actions';

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
    const { setStep, resumeHtml, setResumeHtml } = useCareer();

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

    // Sync global
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


    const [isEditing, setIsEditing] = useState(false);
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


            // Safe Write Logic
            const finalHtml = (showHighlights && annotatedHtml ? annotatedHtml : currentHtml) + script;

            if (doc) {
                // Determine if we need to Rewrite content or just Update attributes
                const hasContentChanged = currentHtml !== lastWrittenHtml.current || (showHighlights && !!annotatedHtml);
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
    }, [isEditing, currentHtml, showHighlights, annotatedHtml]);


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
                    iframeRef.current.contentDocument.write(prevHtml + ` <script>document.body.style.opacity = '0.7';</script>`); // Add style to differentiate?
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

            <div className="p-4 border-t mt-auto relative shrink-0">
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
                    <Button variant="ghost" size="sm" onClick={() => setStep('profile-review')}>
                        &larr; Back
                    </Button>
                    <div className="h-4 w-px bg-border mx-2" />
                    <Button
                        variant={isEditing ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                        {isEditing ? 'Done Editing' : 'Direct Edit'}
                    </Button>
                    <div className="h-4 w-px bg-border mx-2" />
                    <Button variant="ghost" size="icon" disabled={historyIndex <= 0} onClick={handleUndo}>
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={historyIndex <= 0}
                        onMouseDown={() => toggleComparison(true)}
                        onMouseUp={() => toggleComparison(false)}
                        onMouseLeave={() => toggleComparison(false)}
                        className="select-none active:bg-blue-100"
                    >
                        <LayoutTemplate className="w-4 h-4 mr-2" /> Hold to Compare
                    </Button>
                    <div className="h-4 w-px bg-border mx-2" />
                    {annotatedHtml && (
                        <Button
                            variant={showHighlights ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setShowHighlights(!showHighlights)}
                            className={cn(showHighlights && "bg-green-100 text-green-800 hover:bg-green-200")}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {showHighlights ? 'Changes Visible' : 'Show Changes'}
                        </Button>
                    )}
                    <div className="h-4 w-px bg-border mx-2" />
                    <Button variant="ghost" size="icon" disabled={historyIndex >= history.length - 1} onClick={handleRedo}>
                        <Redo className="w-4 h-4" />
                    </Button>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownload}>
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
