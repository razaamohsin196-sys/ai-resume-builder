
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Edit2, Download, Save, Undo, Redo, LayoutTemplate, RotateCw, Sparkles, Bold, Italic, Underline, Link as LinkIcon, Trash2, ArrowUp, ArrowDown, GripVertical, AlignLeft, AlignCenter, AlignRight, AlignJustify, FileText, Image, Code, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCareer } from '@/context/CareerContext';
import { modifyResumeHtml, generateHtmlResume, generateHtmlResumeStream, generateResumeDraft, checkGrammar, tailorResume, ReviewSuggestion } from '@/app/actions';
import { KUSE_RESUME_TEMPLATE } from '@/lib/templates/kuseResume';
import { RESUME_TEMPLATES } from '@/lib/templates';
import { ResumeTemplate } from '@/lib/templates/types';
import { getCachedTemplate, saveCachedTemplate } from '@/lib/templates/template-cache';
import { cleanTemplateHtmlForPreview } from '@/lib/resume-data/placeholder-filter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Settings, Layout } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { SectionManager } from './SectionManager';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

// Helper to strip injected scripts AND pagination/editor artifacts from HTML
function cleanHtmlScripts(html: string): string {
    if (!html) return html;
    let cleaned = html;

    // --- Remove injected scripts ---
    cleaned = cleaned.replace(/<script>[\s\S]*?<\/script>/gi, '');

    // --- Remove injected styles ---
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?\.review-issue[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?\.page-break-gap[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*id="page-size-override"[^>]*>[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*id="layout-flow-fix"[^>]*>[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*id="editor-styles"[^>]*>[\s\S]*?<\/style>/gi, '');

    // --- Remove pagination DOM elements ---
    // page-break-gap divs (visual page separators)
    cleaned = cleaned.replace(/<div[^>]*class="page-break-gap"[^>]*>[\s\S]*?<\/div>/gi, '');
    // page-margin-spacer divs
    cleaned = cleaned.replace(/<div[^>]*class="page-margin-spacer"[^>]*>[\s\S]*?<\/div>/gi, '');
    // page-break-indicator divs
    cleaned = cleaned.replace(/<div[^>]*class="page-break-indicator"[^>]*>[\s\S]*?<\/div>/gi, '');
    // page-number-footer divs
    cleaned = cleaned.replace(/<div[^>]*class="page-number-footer"[^>]*>[\s\S]*?<\/div>/gi, '');

    // --- Remove pagination-pushed class from elements ---
    // e.g. class="section pagination-pushed" → class="section"
    cleaned = cleaned.replace(/ pagination-pushed/g, '');
    cleaned = cleaned.replace(/pagination-pushed /g, '');
    cleaned = cleaned.replace(/class="pagination-pushed"/gi, '');

    // --- Remove data-page-start attributes ---
    cleaned = cleaned.replace(/\s*data-page-start="[^"]*"/gi, '');

    // --- Remove contenteditable attributes ---
    cleaned = cleaned.replace(/\s*contenteditable="true"/gi, '');
    cleaned = cleaned.replace(/\s*contenteditable="false"/gi, '');

    // --- Remove inline editor outline styles ---
    cleaned = cleaned.replace(/\s*outline:\s*1px dashed rgba\(59,\s*130,\s*246,\s*0\.3\)\s*;?/gi, '');

    // --- Remove inline margin-top added by pagination (style="margin-top: NNpx") ---
    // Only strip standalone margin-top styles that were pagination-injected
    // Be careful not to strip template-defined margin-top in combined style attrs
    // We clean elements that had pagination-pushed (already stripped above), their margin-top
    // was set by pagination. The pagination script will recalculate fresh.
    // Pattern: strip margin-top from style attrs where it's the only property
    cleaned = cleaned.replace(/\s*style="margin-top:\s*[\d.]+px\s*;?\s*--print-margin:\s*[\d.]+px\s*;?\s*"/gi, '');
    // Also handle just --print-margin left over
    cleaned = cleaned.replace(/\s*--print-margin:\s*[\d.]+px\s*;?/gi, '');

    // --- Clean up empty style attributes left behind ---
    cleaned = cleaned.replace(/\s*style="\s*"/gi, '');

    return cleaned;
}

// Internal Component for Template Preview
const TemplatePreviewCard = ({ template, isSelected, onClick }: { template: any, isSelected: boolean, onClick: () => void }) => {
    // We render a scaled-down iframe
    const scale = 0.25;
    // Use the template's pageSize to determine dimensions
    // A4: 210mm x 297mm = 794px x 1123px @ 96dpi
    // Letter: 8.5in x 11in = 816px x 1056px @ 96dpi
    const pageSize = template.pageSize || 'A4';
    const baseWidth = pageSize === 'Letter' ? 816 : 794;
    const baseHeight = pageSize === 'Letter' ? 1056 : 1123;

    const containerWidth = baseWidth * scale; // ~200px
    const containerHeight = baseHeight * scale; // ~280px
    
    // Clean placeholder content from preview HTML (memoized per template)
    const previewHtml = React.useMemo(() => cleanTemplateHtmlForPreview(template.html), [template.html]);

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
                    srcDoc={previewHtml}
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

// CSS SELECTORS for profile photo images across all templates (excludes small icon images)
const PROFILE_IMAGE_SELECTORS = [
    '.profile-pic',
    '.profile-pic-container img',
    '.image-container img:not(.icon)',
    '.header-right img',
].join(', ');

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
    '.about-me',        // Added for some templates
    '.responsibilities-list',
    '.achievements-container',
    '.achievements',    // Added
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
    '.job-title',
    '.section-title',
    '.contact-item',
    '.reference-name',
    '.language-item',
    '.company-location', // Added
    '.degree-info',      // Added
    '.school-name',      // Added
    '.skills-category',  // Added
    '.skills-group',     // Added
    '.header-title',     // Added for some templates
    '.header-left',      // Added for some templates
    '.right-content',    // Added for some templates
    '.left-column',      // Added for some templates
    '.right-column',     // Added for some templates
    'p',                 // All paragraphs
    'ul',                // All lists
    'li',                // All list items
    'h1', 'h2', 'h3', 'h4' // All headers
].join(', ');

export function ResumeEditor({ initialHtml = '' }: ResumeEditorProps) {
    const { setStep, resumeHtml, setResumeHtml, profile, intent, setResume, aiMessages, setAiMessages, resetSession } = useCareer();

    // ... rest of component

    // --- HISTORY STATE ---
    interface HistoryState {
        html: string;
        template: ResumeTemplate;
        layoutSettings: { lineHeight: number; sectionSpacing: number };
        pageSize: 'A4' | 'Letter';
    }
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // --- TEMPLATE STATE ---
    // Fix: Detect from HTML first, then fall back to Classic (correct ID), then first available
    const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>(() => {
        const detected = inferTemplateFromHtml(resumeHtml || initialHtml);
        return detected || RESUME_TEMPLATES.find(t => t.id === 'classic') || RESUME_TEMPLATES[0];
    });

    const [isChangingTemplate, setIsChangingTemplate] = useState(false);
    const [isTemplatePopoverOpen, setIsTemplatePopoverOpen] = useState(false);
    const templateGenerationInProgress = useRef<string | null>(null); // Track which template is being generated

    // Local copy of HTML (cleaned of any injected scripts)
    const [currentHtml, setCurrentHtml] = useState<string>(() => cleanHtmlScripts(resumeHtml || initialHtml));
    const [streamingHtml, setStreamingHtml] = useState<string>('');
    const [annotatedHtml, setAnnotatedHtml] = useState<string | null>(null);
    const [showHighlights, setShowHighlights] = useState(false);

    // --- LAYOUT SETTINGS ---
    const [layoutSettings, setLayoutSettings] = useState({
        lineHeight: 1.08,
        sectionSpacing: 10
    });
    
    // --- PAGE SIZE SETTINGS ---
    // Initialize page size from template metadata
    const [pageSize, setPageSize] = useState<'A4' | 'Letter'>(() => {
        return selectedTemplate?.pageSize || 'A4';
    });
    
    // --- PAGINATION STATE ---
    const [pageCount, setPageCount] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    
    // Update page size
    useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'UPDATE_PAGE_SIZE',
                pageSize
            }, '*');
        }
    }, [pageSize]);

    // undoing/redoing flag to prevent pushing to history during traversal
    const logHistory = (
        newHtml: string,
        templateOverride?: ResumeTemplate,
        layoutOverride?: { lineHeight: number; sectionSpacing: number },
        pageSizeOverride?: 'A4' | 'Letter'
    ) => {
        // If we heavily change the tree (new edit), we discard future
        const newHistory = history.slice(0, historyIndex + 1);
        const historyEntry = {
            html: newHtml,
            template: templateOverride ?? selectedTemplate,
            layoutSettings: layoutOverride ? { ...layoutOverride } : { ...layoutSettings },
            pageSize: pageSizeOverride ?? pageSize
        };
        
        newHistory.push(historyEntry);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // Initialize history
    useEffect(() => {
        if (history.length === 0 && currentHtml) {
            setHistory([{
                html: currentHtml,
                template: selectedTemplate,
                layoutSettings: { ...layoutSettings },
                pageSize
            }]);
            setHistoryIndex(0);
        }
    }, []);

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const prevState = history[newIndex];
            setHistoryIndex(newIndex);

            // FORCE UPDATE: Undo comes from "external" (User UI), so we must rewrite iframe
            isInternalUpdate.current = false;

            // Restore all state from history
            setCurrentHtml(prevState.html);
            setResumeHtml(prevState.html);
            setSelectedTemplate(prevState.template);
            setLayoutSettings(prevState.layoutSettings);
            setPageSize(prevState.pageSize);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const nextState = history[newIndex];
            setHistoryIndex(newIndex);

            // FORCE UPDATE: Redo comes from "external", so we must rewrite iframe
            isInternalUpdate.current = false;

            // Restore all state from history
            setCurrentHtml(nextState.html);
            setResumeHtml(nextState.html);
            setSelectedTemplate(nextState.template);
            setLayoutSettings(nextState.layoutSettings);
            setPageSize(nextState.pageSize);
        }
    };



    // Get clean HTML for export (removes editor artifacts)
    const getCleanHtmlForExport = (): string => {
        if (!iframeRef.current?.contentDocument) return currentHtml;
        
        const doc = iframeRef.current.contentDocument;
        const clonedDoc = doc.cloneNode(true) as Document;
        
        // Remove contenteditable attributes
        clonedDoc.querySelectorAll('[contenteditable]').forEach(el => {
            el.removeAttribute('contenteditable');
        });
        
        // Remove review issue highlights
        clonedDoc.querySelectorAll('.review-issue').forEach(el => {
            const parent = el.parentNode;
            while (el.firstChild) {
                parent?.insertBefore(el.firstChild, el);
            }
            el.remove();
        });
        
        // Remove pagination UI elements
        clonedDoc.querySelectorAll('.page-break-gap, .page-margin-spacer, .page-break-indicator, .page-number-footer').forEach(el => {
            el.remove();
        });
        
        // Remove temp styles
        clonedDoc.querySelectorAll('#temp-print-styles, #editor-styles').forEach(el => {
            el.remove();
        });
        
        // Remove image upload overlays and unwrap image wrappers
        clonedDoc.querySelectorAll('.image-upload-overlay').forEach(el => {
            el.remove();
        });
        clonedDoc.querySelectorAll('.resume-profile-image-wrapper').forEach(wrapper => {
            const parent = wrapper.parentNode;
            if (parent) {
                while (wrapper.firstChild) {
                    parent.insertBefore(wrapper.firstChild, wrapper);
                }
                wrapper.remove();
            }
        });
        // Clean up image styling classes
        clonedDoc.querySelectorAll('.resume-profile-image').forEach(img => {
            img.classList.remove('resume-profile-image');
        });
        
        return clonedDoc.documentElement.outerHTML;
    };

    const handleDownloadPDF = () => {
        if (iframeRef.current && iframeRef.current.contentWindow && iframeRef.current.contentDocument) {
            const doc = iframeRef.current.contentDocument;

            // 1. Inject Temporary Print Styles for multi-page support
            const style = doc.createElement('style');
            style.id = 'temp-print-styles';
            const pageDimensions = pageSize === 'Letter' 
                ? { width: '8.5in', height: '11in' }
                : { width: '210mm', height: '297mm' };
            
            style.textContent = `
                @page {
                    size: ${pageDimensions.width} ${pageDimensions.height};
                    margin: 0;
                }
                /* CRITICAL: Force browsers to preserve colors when printing/exporting to PDF */
                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                body {
                    background-color: white !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    /* Don't override template's own padding - it's intentional */
                }
                /* Clean up visual artifacts */
                .page, .resume-container {
                    box-shadow: none !important;
                }
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
                /* Hide pagination UI visual elements */
                .page-break-gap {
                    display: none !important;
                }
                .page-margin-spacer,
                .page-break-indicator,
                .page-number-footer {
                    display: none !important;
                }
                /* Use print-safe margins (without gap heights) */
                .pagination-pushed {
                    margin-top: var(--print-margin, 0px) !important;
                }
                /* Force page breaks where the preview shows them */
                [data-page-start] {
                    page-break-before: always;
                }
                /* Ensure proper page breaks */
                .section {
                    page-break-inside: avoid;
                }
                .experience-item, .education-item, .job, .timeline-item, .skill-item, .reference-item {
                    page-break-inside: avoid;
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

    const handleDownloadHTML = () => {
        const cleanHtml = getCleanHtmlForExport();
        const blob = new Blob([cleanHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPNG = async () => {
        if (!iframeRef.current?.contentDocument) return;
        
        const doc = iframeRef.current.contentDocument;
        const body = doc.body;
        
        // Use html2canvas dynamically loaded
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        
        // Check if already loaded
        if (!(window as unknown as { html2canvas?: unknown }).html2canvas) {
            await new Promise<void>((resolve, reject) => {
                html2canvasScript.onload = () => resolve();
                html2canvasScript.onerror = () => reject(new Error('Failed to load html2canvas'));
                document.head.appendChild(html2canvasScript);
            });
        }
        
        try {
            // Get html2canvas from window
            const html2canvas = (window as unknown as { html2canvas: (element: HTMLElement, options?: object) => Promise<HTMLCanvasElement> }).html2canvas;
            
            const canvas = await html2canvas(body, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
            });
            
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resume.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error generating PNG:', error);
            alert('Failed to generate PNG. Please try the PDF option instead.');
        }
    };

    const handleDownloadDOCX = async () => {
        if (!iframeRef.current?.contentDocument) return;
        const iframeDoc = iframeRef.current.contentDocument;
        const body = iframeDoc.body;

        // 1. Load html2canvas from CDN if not loaded (same as PNG export)
        if (!(window as unknown as { html2canvas?: unknown }).html2canvas) {
            await new Promise<void>((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                s.onload = () => resolve();
                s.onerror = () => reject(new Error('Failed to load html2canvas'));
                document.head.appendChild(s);
            });
        }
        // Load JSZip from CDN if not loaded
        if (!(window as unknown as { JSZip?: unknown }).JSZip) {
            await new Promise<void>((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                s.onload = () => resolve();
                s.onerror = () => reject(new Error('Failed to load JSZip'));
                document.head.appendChild(s);
            });
        }

        try {
            const html2canvas = (window as unknown as { html2canvas: (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement> }).html2canvas;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const JSZip = (window as unknown as { JSZip: any }).JSZip;

            // 2. Page dimensions
            const scale = 2;
            const pageHeightPx = pageSize === 'Letter' ? 1056 : 1123;
            const pageWidthPx = pageSize === 'Letter' ? 816 : 794;
            // EMU (1 inch = 914400 EMU)
            const pageWidthEmu = pageSize === 'Letter' ? 7772400 : 7559040;
            const pageHeightEmu = pageSize === 'Letter' ? 10058400 : 10692000;
            // Twips (1 inch = 1440 twips)
            const pageWidthTwips = pageSize === 'Letter' ? 12240 : 11906;
            const pageHeightTwips = pageSize === 'Letter' ? 15840 : 16838;

            // 3. Inject temporary cleanup styles for a clean capture.
            //    IMPORTANT: Do NOT override .pagination-pushed margins here.
            //    Unlike PDF export (which uses the browser's print engine with CSS
            //    page-break-before), DOCX export captures the canvas and slices it.
            //    Collapsing pagination margins would misalign content with the fixed
            //    slice intervals, causing content to be cut mid-line — especially in
            //    colorful two-column templates where backgrounds must align per-page.
            //    Instead, we keep the paginated layout intact and slice at positions
            //    that skip the page-break gap areas.
            const tempStyle = iframeDoc.createElement('style');
            tempStyle.id = 'temp-docx-capture';
            tempStyle.textContent = `
                .page-break-gap { display: none !important; }
                .page-margin-spacer, .page-break-indicator, .page-number-footer { display: none !important; }
                .page, .resume-container { box-shadow: none !important; }
                *[contenteditable] { outline: none !important; }
                .review-issue { text-decoration: none !important; background-color: transparent !important; border-bottom: none !important; }
                .review-issue[data-type="grammar"], .review-issue[data-type="tailor"] { text-decoration: none !important; background-color: transparent !important; }
                .image-upload-overlay { display: none !important; }
            `;
            iframeDoc.head.appendChild(tempStyle);
            // Let layout settle
            await new Promise(resolve => setTimeout(resolve, 300));

            // 4. Capture the full clean content as one big canvas
            const fullCanvas = await html2canvas(body, {
                scale,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: pageWidthPx,
            });

            // Remove temporary styles
            iframeDoc.getElementById('temp-docx-capture')?.remove();

            // 5. Slice into per-page images, accounting for page-break gaps.
            //    The pagination system inserts 28px-tall gap indicators between
            //    pages and pushes content down accordingly. The captured canvas
            //    includes these gap areas (rendered as blank space since we hid
            //    the visual indicators). We must skip them when slicing so each
            //    page image contains only its own content.
            const pageGapHeight = 28; // Must match pagination script's pageGapHeight
            // Use pageCount from React state (set via PAGE_COUNT message from the
            // pagination script). Querying .page-break-gap elements from the DOM is
            // unreliable here because html2canvas may trigger MutationObserver
            // callbacks that cause the pagination script to remove & recreate them.
            // Fall back to canvas-height calculation if state is stale.
            const capturedHeight = fullCanvas.height / scale;
            const numPages = pageCount > 1
                ? pageCount
                : Math.max(1, Math.ceil(capturedHeight / pageHeightPx));

            const pageImageBytes: Uint8Array[] = [];
            for (let i = 0; i < numPages; i++) {
                const pgCanvas = document.createElement('canvas');
                pgCanvas.width = pageWidthPx * scale;
                pgCanvas.height = pageHeightPx * scale;
                const ctx = pgCanvas.getContext('2d')!;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, pgCanvas.width, pgCanvas.height);

                // Each page occupies pageHeightPx in the canvas, followed by a
                // pageGapHeight gap (except for the last page). So page i starts
                // at i * (pageHeightPx + pageGapHeight).
                const srcY = i * (pageHeightPx + pageGapHeight) * scale;
                const srcH = Math.min(pageHeightPx * scale, fullCanvas.height - srcY);
                if (srcH > 0) {
                    ctx.drawImage(fullCanvas, 0, srcY, pageWidthPx * scale, srcH, 0, 0, pageWidthPx * scale, srcH);
                }

                // Convert canvas to PNG bytes
                const dataUrl = pgCanvas.toDataURL('image/png');
                const raw = atob(dataUrl.split(',')[1]);
                const bytes = new Uint8Array(raw.length);
                for (let j = 0; j < raw.length; j++) bytes[j] = raw.charCodeAt(j);
                pageImageBytes.push(bytes);
            }

            // 6. Build proper DOCX (Open XML) ZIP with embedded images
            const zip = new JSZip();

            // [Content_Types].xml
            zip.file('[Content_Types].xml',
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

            // _rels/.rels
            zip.folder('_rels').file('.rels',
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

            // word/media/imageN.png
            const wordFolder = zip.folder('word');
            const mediaFolder = wordFolder.folder('media');
            for (let i = 0; i < numPages; i++) {
                mediaFolder.file(`image${i + 1}.png`, pageImageBytes[i]);
            }

            // word/_rels/document.xml.rels
            let imgRels = '';
            for (let i = 0; i < numPages; i++) {
                imgRels += `  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i + 1}.png"/>\n`;
            }
            wordFolder.folder('_rels').file('document.xml.rels',
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${imgRels}</Relationships>`);

            // word/document.xml — each page as a full-page inline image
            let docBody = '';
            for (let i = 0; i < numPages; i++) {
                docBody += `
    <w:p>
      <w:pPr><w:spacing w:after="0" w:before="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="${pageWidthEmu}" cy="${pageHeightEmu}"/>
            <wp:docPr id="${i + 1}" name="Page ${i + 1}"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="${i + 1}" name="image${i + 1}.png"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rId${i + 1}"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${pageWidthEmu}" cy="${pageHeightEmu}"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>`;
                // No explicit page break needed — each image is sized to fill the
                // entire page (pageWidthEmu × pageHeightEmu with zero margins), so
                // Word naturally starts the next image on a new page. Adding an
                // explicit <w:br w:type="page"/> would create a blank page in between.
            }

            wordFolder.file('document.xml',
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>${docBody}
    <w:sectPr>
      <w:pgSz w:w="${pageWidthTwips}" w:h="${pageHeightTwips}"/>
      <w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`);

            // 7. Generate and download
            const blob = await zip.generateAsync({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resume.docx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating DOCX:', error);
            alert('Failed to generate DOCX. Please try the PDF option instead.');
        }
    };

    const handleDownloadTXT = () => {
        if (!iframeRef.current?.contentDocument) return;
        
        const doc = iframeRef.current.contentDocument;
        const body = doc.body;
        
        // Extract text content with basic formatting
        const extractText = (element: Element, depth = 0): string => {
            let text = '';
            const children = element.childNodes;
            
            for (const child of children) {
                if (child.nodeType === Node.TEXT_NODE) {
                    const content = child.textContent?.trim();
                    if (content) {
                        text += content + ' ';
                    }
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const el = child as Element;
                    const tagName = el.tagName.toLowerCase();
                    
                    // Add line breaks for block elements
                    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                        text += '\n\n' + '='.repeat(40) + '\n';
                        text += extractText(el, depth);
                        text += '\n' + '='.repeat(40) + '\n';
                    } else if (['p', 'div', 'section', 'article'].includes(tagName)) {
                        text += '\n' + extractText(el, depth) + '\n';
                    } else if (tagName === 'li') {
                        text += '\n• ' + extractText(el, depth);
                    } else if (tagName === 'br') {
                        text += '\n';
                    } else {
                        text += extractText(el, depth);
                    }
                }
            }
            
            return text;
        };
        
        let plainText = extractText(body);
        // Clean up excessive whitespace
        plainText = plainText.replace(/\n{3,}/g, '\n\n').trim();
        
        const blob = new Blob([plainText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
        setAiMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: 'Check for grammar errors.', timestamp: Date.now() }]);
        const tempId = crypto.randomUUID();
        setAiMessages(prev => [...prev, { id: tempId, role: 'assistant', content: 'Scanning your resume...', timestamp: Date.now() }]);

        try {
            const issues = await checkGrammar(getLatestHtmlFromIframe());
            setReviewIssues(prev => [...prev.filter(i => i.type !== 'grammar'), ...issues]);

            if (issues.length === 0) {
                setAiMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: '✅ Great news! I didn\'t find any grammar or spelling issues.' } : m));
            } else {
                setAiMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: `Found ${issues.length} potential issues.They are highlighted in red.Click on them to review.` } : m));
            }
        } catch (e) {
            console.error(e);
            setAiMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: '❌ Error running grammar check.' } : m));
        } finally {
            setIsRegenerating(false);
        }
    };

    const confirmTailor = async () => {
        const jobDescription = tailorInput.trim();
        if (!jobDescription) return;

        setIsTailorModalOpen(false); // Close modal
        setIsRegenerating(true);
        setAiMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: `Tailor for Job: ${jobDescription.substring(0, 50)}...`, timestamp: Date.now() }]);
        const tempId = crypto.randomUUID();
        setAiMessages(prev => [...prev, { id: tempId, role: 'assistant', content: 'Analyzing resume against job description and generating suggestions...', timestamp: Date.now() }]);

        try {
            const suggestions = await tailorResume(getLatestHtmlFromIframe(), jobDescription);
            setReviewIssues(prev => [...prev.filter(i => i.type !== 'tailor'), ...suggestions]);

            if (suggestions.length === 0) {
                setAiMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: '✅ Your resume already looks well-tailored for this role based on my analysis.' } : m));
            } else {
                setAiMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: `Found ${suggestions.length} opportunities for tailoring.They are highlighted in blue.Click to review.` } : m));
            }
        } catch (e) {
            console.error(e);
            setAiMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: '❌ Error generating tailoring suggestions.' } : m));
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
        setAiMessages(prev => [...prev, { id: userMsgId, role: 'user', content: actionText, timestamp: Date.now() }]);

        // Add Assistant processing message
        const tempId = crypto.randomUUID();
        setAiMessages(prev => [...prev, { id: tempId, role: 'assistant', content: fitPage ? "Optimizing layout to fit everything on one page..." : "Reverting to standard layout...", timestamp: Date.now() }]);

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
            setAiMessages(prev => prev.map(m =>
                m.id === tempId ? {
                    ...m,
                    content: fitPage
                        ? "✅ **Done!** I've condensed your resume to a single page by adjusting spacing, margins, and font sizes while keeping all your content."
                        : "✅ **Done!** I've restored the standard layout."
                } : m
            ));

        } catch (e) {
            console.error(e);
            setAiMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: "❌ Sorry, I encountered an error while regenerating the resume." } : m
            ));
        } finally {
            setIsRegenerating(false);
        }
    };
    // Sync resumeHtml from context (e.g., after localStorage load) to currentHtml
    useEffect(() => {
        if (resumeHtml && resumeHtml !== currentHtml) {
            // Check if this is a NEW distinct update (not just an echo of our own change)
            if (history[historyIndex]?.html !== resumeHtml) {
                // It came from outside (e.g. initial load or reset)
                // Clean scripts before setting
                setCurrentHtml(cleanHtmlScripts(resumeHtml));
                // Initialize history if empty
                if (history.length === 0) {
                    setHistory([{
                        html: resumeHtml,
                        template: selectedTemplate,
                        layoutSettings: { ...layoutSettings },
                        pageSize
                    }]);
                    setHistoryIndex(0);
                }
            }
        }
    }, [resumeHtml]);

    // Update iframe content when streamingHtml or currentHtml changes
    useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentDocument) {
            const htmlToDisplay = streamingHtml || currentHtml;
            if (htmlToDisplay && htmlToDisplay.length > 0) {
                const updateFrame = () => {
                    if (iframeRef.current && iframeRef.current.contentDocument) {
                        try {
                            // During streaming, we need to write the HTML even if incomplete
                            // The browser will render what it can and update as more arrives
                            iframeRef.current.contentDocument.open();
                            iframeRef.current.contentDocument.write(htmlToDisplay);
                            iframeRef.current.contentDocument.close();
                            
                            // Log when we update during streaming for debugging
                            if (streamingHtml && htmlToDisplay.length > 100) {
                                console.log(`[Iframe] Updated with ${htmlToDisplay.length} chars of HTML`);
                            }
                        } catch (e) {
                            console.warn('Error updating iframe:', e);
                        }
                    }
                };
                
                if (streamingHtml) {
                    // During streaming, update immediately without delay for real-time display
                    // Use requestAnimationFrame to ensure smooth rendering without blocking
                    requestAnimationFrame(updateFrame);
                } else {
                    // For non-streaming updates, update immediately
                    updateFrame();
                }
            }
        }
    }, [streamingHtml, currentHtml]);
    const handleChangeTemplate = async (template: ResumeTemplate) => {
        // Prevent duplicate template generation - if same template is already being generated, skip
        if (templateGenerationInProgress.current === template.id) {
            console.log(`[Template Switch] Template ${template.name} is already being generated, skipping duplicate call`);
            return;
        }
        
        // If a different template is being generated, wait for it to complete
        if (templateGenerationInProgress.current !== null && templateGenerationInProgress.current !== template.id) {
            console.log(`[Template Switch] Another template (${templateGenerationInProgress.current}) is being generated, waiting...`);
            // Wait a bit and check again
            await new Promise(resolve => setTimeout(resolve, 100));
            if (templateGenerationInProgress.current === template.id) {
                return; // Already started
            }
        }
        
        templateGenerationInProgress.current = template.id;
        setIsChangingTemplate(true);
        setIsTemplatePopoverOpen(false); // Close immediately for better UX
        setSelectedTemplate(template);

        // RESET LAYOUT SETTINGS ON TEMPLATE CHANGE
        setLayoutSettings({ lineHeight: 1.15, sectionSpacing: 18 });
        
        // Update page size from template metadata
        setPageSize(template.pageSize || 'A4');

        // Reset interactive state
        setBlockRect(null);
        setActiveBlockId(null);
        setSelectionRect(null);
        
        // Reset pagination state to avoid stale page counts
        setIframeHeight(null);
        setPageCount(1);
        setStreamingHtml(''); // Clear any previous streaming state

        // Add User Message
        const userMsgId = crypto.randomUUID();
        setAiMessages(prev => [...prev, { id: userMsgId, role: 'user', content: `Switch template to: ${template.name}`, timestamp: Date.now() }]);

        const tempId = crypto.randomUUID();
        setAiMessages(prev => [...prev, { id: tempId, role: 'assistant', content: "Applying new template layout...", timestamp: Date.now() }]);

        try {
            // Use streaming template population with populateAndFixTemplate
            if (!profile || !intent) {
                throw new Error('Profile or intent missing');
            }

            // Check cache first
            const cachedHtml = getCachedTemplate(
                template,
                profile,
                intent,
                {
                    fitToOnePage: isFitToPage,
                    hasPhoto: false,
                }
            );

            let finalHtml: string;

            if (cachedHtml) {
                // Use cached template - no streaming needed
                console.log(`[Template Switch] Using cached template: ${template.name}`);
                finalHtml = cachedHtml;
                setResumeHtml(finalHtml);
                setCurrentHtml(finalHtml);
            } else {
                // Generate new template with streaming
                console.log(`[Template Switch] Generating new template: ${template.name}`);
                const { generateResumeFromBackendStream } = await import('@/lib/api/resume-backend');
                finalHtml = await generateResumeFromBackendStream(
                    profile,
                    intent,
                    {
                        fitToOnePage: isFitToPage,
                        hasPhoto: false,
                        templateHtml: template.html,
                        templateStyle: template.name,
                        templateId: template.id,
                        onChunk: (chunk: string, accumulated: string) => {
                            // Update streaming HTML in real-time - this triggers the iframe update
                            // Force immediate update by using a function that always returns the new value
                            setStreamingHtml(() => accumulated);
                            
                            // Log progress for debugging (first chunk and every 10KB)
                            if (accumulated.length < 500 || accumulated.length % 10000 < chunk.length) {
                                console.log(`[Stream] Received chunk (${chunk.length} chars), total: ${accumulated.length} chars`);
                            }
                        }
                    }
                );

                // Save to cache for future use
                saveCachedTemplate(
                    template,
                    profile,
                    intent,
                    finalHtml,
                    {
                        fitToOnePage: isFitToPage,
                        hasPhoto: false,
                    }
                );

                // Clear streaming state and set final HTML
                setStreamingHtml('');
                setResumeHtml(finalHtml);
                setCurrentHtml(finalHtml);
            }
            
            // Pass the NEW template state to logHistory since state updates are async
            const newLayoutSettings = { lineHeight: 1.15, sectionSpacing: 18 };
            const newPageSize = template.pageSize || 'A4';
            logHistory(finalHtml, template, newLayoutSettings, newPageSize);

            setAiMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: `✅ Switched to **${template.name}** template.` } : m
            ));
        } catch (e) {
            console.error('Error switching template:', e);
            setStreamingHtml(''); // Clear streaming state on error
            setAiMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: "❌ Error switching template." } : m
            ));
        } finally {
            setIsChangingTemplate(false);
            // Clear the in-progress flag only if this was the current generation
            if (templateGenerationInProgress.current === template.id) {
                templateGenerationInProgress.current = null;
            }
        }
    };



    const [isEditing, setIsEditing] = useState(true);
    const [iframeHeight, setIframeHeight] = useState<number | null>(null);

    // Initialize messages if empty (first time)
    useEffect(() => {
        if (aiMessages.length === 0) {
            setAiMessages([{
                id: '1',
                role: 'assistant',
                content: `Hi${profile?.personal?.name ? ` ${profile.personal.name.split(' ')[0]}` : ''} ! 👋 Welcome to the Resume Editor.I've generated your resume based on your profile.\n\nYou can ask me to make changes, or try one of these popular actions:\n• "Move Skills to bottom"\n• "Make it fit on one page"\n• "Check for grammar errors"\n• "Switch to a different template"\n\nOr click "Edit" to type directly in the resume.`,
                timestamp: Date.now()
            }]);
        }
    }, []);
    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState<'resume' | 'chat'>('resume');
    const [isMobile, setIsMobile] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [panelWidth, setPanelWidth] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('aiPanelWidth');
            return saved ? parseInt(saved) : 400;
        }
        return 400;
    });
    const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('aiPanelCollapsed');
            return saved === 'true';
        }
        return false;
    });

    // --- TOOLBAR STATE ---
    const [selectionRect, setSelectionRect] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
    const [blockRect, setBlockRect] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [formatting, setFormatting] = useState<{ bold: boolean; italic: boolean; underline: boolean; fontSize: string }>({ bold: false, italic: false, underline: false, fontSize: '3' });

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // --- IMAGE UPLOAD HANDLER ---
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        // Validate file size (max 10MB raw — will be compressed)
        if (file.size > 10 * 1024 * 1024) {
            alert('Image size must be less than 10MB.');
            return;
        }

        // Compress and resize the image using canvas to avoid localStorage quota issues
        const img = new window.Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            // Max dimensions for a resume profile photo
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 500;
            let { width, height } = img;

            // Scale down if needed, maintaining aspect ratio
            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(img, 0, 0, width, height);

            // Export as JPEG with quality 0.85 (~30-80KB typically)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                    type: 'IMAGE_UPDATE',
                    src: compressedDataUrl
                }, '*');
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            alert('Failed to load image. Please try a different file.');
        };
        img.src = objectUrl;

        // Reset input so same file can be selected again
        event.target.value = '';
    };

    // Helper: Get the latest HTML from iframe (bypasses debounce)
    // This ensures user edits are not lost when performing operations
    // Always returns cleaned HTML (no pagination/editor artifacts)
    const getLatestHtmlFromIframe = (): string => {
        if (iframeRef.current && iframeRef.current.contentDocument) {
            return cleanHtmlScripts(iframeRef.current.contentDocument.documentElement.outerHTML);
        }
        return currentHtml;
    };

    // Detect mobile view
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Persist panel state
    useEffect(() => {
        localStorage.setItem('aiPanelWidth', panelWidth.toString());
        localStorage.setItem('aiPanelCollapsed', isPanelCollapsed.toString());
    }, [panelWidth, isPanelCollapsed]);

    // --- REF TO TRACK SOURCE OF UPDATES ---
    const isInternalUpdate = useRef(false);
    const lastWrittenHtml = useRef<string>('');

    // HANDLE DIRECT EDITS & SELECTION FROM IFRAME
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'RESUME_CONTENT_UPDATE') {
                // Clean pagination/editor artifacts from iframe HTML before storing
                // This prevents stale pagination divs, margins, and classes from
                // being baked into history, which would distort the template on undo/redo
                const newHtml = cleanHtmlScripts(event.data.html);
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
            if (event.data.type === 'PAGE_COUNT') {
                setPageCount(event.data.count || 1);
            }
            if (event.data.type === 'IMAGE_CLICK') {
                // Open file explorer to select a new image
                if (imageInputRef.current) {
                    imageInputRef.current.click();
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [setResumeHtml, currentHtml, history, historyIndex, logHistory]); // Added logHistory to dep array
    
    // Track current page based on scroll position
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        
        const handleScroll = () => {
            const pageHeight = pageSize === 'Letter' ? 1056 : 1123; // px at 96dpi
            const scrollTop = container.scrollTop;
            const currentPageNum = Math.floor(scrollTop / (pageHeight + 24)) + 1; // 24px gap between pages
            setCurrentPage(Math.min(Math.max(1, currentPageNum), pageCount));
        };
        
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [pageSize, pageCount]);

    // LISTEN FOR GRAMMAR CLICKS FROM IFRAME
    useEffect(() => {
        const handleGrammarClick = (event: MessageEvent) => {
            if (event.data.type === 'GRAMMAR_CLICK') {
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
                        (function() {
                        // --- 1. Content Sync ---
                        let debounceTimer;
                        
                        // --- 0. Initialize Layout Settings (From Parent State) ---
                        // This ensures spacing is correct immediately upon load/template switch
                        document.documentElement.style.setProperty('--line-height', '${layoutSettings.lineHeight}');
                        document.documentElement.style.setProperty('--section-spacing', '${layoutSettings.sectionSpacing}px');
                        
                        // Set page size
                        const pageSize = '${pageSize}';
                        const pageWidth = pageSize === 'Letter' ? '8.5in' : '210mm';
                        const pageHeight = pageSize === 'Letter' ? '11in' : '297mm';
                        const pageWidthPx = pageSize === 'Letter' ? 816 : 794;
                        const pageHeightPx = pageSize === 'Letter' ? 1056 : 1123;
                        
                        document.documentElement.style.setProperty('--page-width', pageWidth);
                        document.documentElement.style.setProperty('--page-height', pageHeight);
                        document.body.style.width = pageWidth;
                        document.body.style.minHeight = pageHeight;
                        
                        // Override hardcoded template dimensions with !important
                        // This ensures templates auto-fit to the selected page size
                        let pageSizeStyleEl = document.getElementById('page-size-override');
                        if (!pageSizeStyleEl) {
                            pageSizeStyleEl = document.createElement('style');
                            pageSizeStyleEl.id = 'page-size-override';
                            document.head.appendChild(pageSizeStyleEl);
                        }
                        pageSizeStyleEl.textContent = \`
                            .page, body {
                                width: \${pageWidth} !important;
                                min-width: \${pageWidth} !important;
                                max-width: \${pageWidth} !important;
                                min-height: \${pageHeight} !important;
                            }
                        \`;
                        
                        // Fix absolutely positioned footers (e.g. OliveGreenModern)
                        // that cause blank space when content exceeds one page
                        let layoutFixEl = document.getElementById('layout-flow-fix');
                        if (!layoutFixEl) {
                            layoutFixEl = document.createElement('style');
                            layoutFixEl.id = 'layout-flow-fix';
                            document.head.appendChild(layoutFixEl);
                        }
                        layoutFixEl.textContent = \`
                            .page {
                                height: auto !important;
                                overflow: visible !important;
                            }
                            .main-content {
                                flex-wrap: wrap !important;
                            }
                            .footer {
                                position: relative !important;
                                bottom: auto !important;
                                right: auto !important;
                                left: auto !important;
                                width: 100% !important;
                                flex-basis: 100% !important;
                                margin-top: 30px;
                            }
                        \`;

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
                            if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                                try {
                                    const range = sel.getRangeAt(0);
                                    const rect = range.getBoundingClientRect();
                                    
                                    // Only track if we have a valid rect with content
                                    if (rect.width > 0 && rect.height > 0) {
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
                                                // Map px to 1-7 sizes (matching our custom font size map)
                                                // Using midpoints between sizes for better tolerance
                                                if (px < 11) fontSize = '1';       // Tiny (10px)
                                                else if (px < 13) fontSize = '2';  // Small (12px)
                                                else if (px < 16) fontSize = '3';  // Normal (14px - matches template default)
                                                else if (px < 21) fontSize = '4';  // Large (18px)
                                                else if (px < 28) fontSize = '5';  // Huge (24px)
                                                else if (px < 40) fontSize = '6';  // Title (32px)
                                                else fontSize = '7';               // Max (48px+)
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
                                } catch (e) {
                                    console.warn('[Selection] Error tracking selection:', e);
                                    window.parent.postMessage({ type: 'SELECTION_CHANGE', isCollapsed: true }, '*');
                                }
                            } else {
                                window.parent.postMessage({ type: 'SELECTION_CHANGE', isCollapsed: true }, '*');
                            }
                        });

                        // --- 3. Block Hover (Drag/Move Controls) ---
                        document.body.addEventListener('mouseover', (e) => {
                             // Ignore pagination elements
                             if (e.target.closest('.page-break-gap, .page-margin-spacer')) return;
                             
                             // Find the closest draggable block (section or experience-item)
                             const block = e.target.closest('.section, .experience-item, .education-item, .skill-percentage, .timeline-item, .job, .reference-item, .contact-item');
                             if(block && !block.classList.contains('page-break-gap') && !block.classList.contains('page-margin-spacer')) {
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
                                // Force layout recalculation, then trigger pagination
                                // (pagination is the authoritative source of IFRAME_RESIZE)
                                void document.body.offsetHeight;
                                if (window.updatePagination) {
                                    window.updatePagination();
                                } else {
                                    window.dispatchEvent(new Event('resize'));
                                }
                            }
                            
                            if (type === 'UPDATE_PAGE_SIZE' && event.data.pageSize) {
                                const pageSize = event.data.pageSize;
                                const pageWidth = pageSize === 'Letter' ? '8.5in' : '210mm';
                                const pageHeight = pageSize === 'Letter' ? '11in' : '297mm';
                                
                                document.documentElement.style.setProperty('--page-width', pageWidth);
                                document.documentElement.style.setProperty('--page-height', pageHeight);
                                document.body.style.width = pageWidth;
                                document.body.style.minHeight = pageHeight;
                                
                                // Override hardcoded template dimensions with !important
                                let pageSizeStyleEl = document.getElementById('page-size-override');
                                if (!pageSizeStyleEl) {
                                    pageSizeStyleEl = document.createElement('style');
                                    pageSizeStyleEl.id = 'page-size-override';
                                    document.head.appendChild(pageSizeStyleEl);
                                }
                                pageSizeStyleEl.textContent = \`
                                    .page, body {
                                        width: \${pageWidth} !important;
                                        min-width: \${pageWidth} !important;
                                        max-width: \${pageWidth} !important;
                                        min-height: \${pageHeight} !important;
                                    }
                                \`;
                                // Force layout recalculation, then trigger pagination
                                void document.body.offsetHeight;
                                if (window.updatePagination) {
                                    window.updatePagination();
                                } else {
                                    window.dispatchEvent(new Event('resize'));
                                }
                            }

                            if (type === 'EXEC_COMMAND') {
                                document.execCommand(cmd, false, val);
                                // Trigger update immediately
                                window.parent.postMessage({
                                    type: 'RESUME_CONTENT_UPDATE',
                                    html: document.documentElement.outerHTML
                                }, '*');
                            }
                            
                            if (type === 'APPLY_FONT_SIZE' && event.data.size) {
                                // Apply custom font size using inline styles
                                const sel = window.getSelection();
                                if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                                    const range = sel.getRangeAt(0);
                                    const span = document.createElement('span');
                                    span.style.fontSize = event.data.size;
                                    
                                    try {
                                        range.surroundContents(span);
                                    } catch(e) {
                                        // If surroundContents fails, use a different approach
                                        const fragment = range.extractContents();
                                        span.appendChild(fragment);
                                        range.insertNode(span);
                                    }
                                    
                                    // Normalize to avoid fragmented spans
                                    span.normalize();
                                    
                                    // Trigger content update
                                    window.parent.postMessage({
                                        type: 'RESUME_CONTENT_UPDATE',
                                        html: document.documentElement.outerHTML
                                    }, '*');
                                }
                            }

                            if (type === 'MOVE_BLOCK') {
                                const el = document.getElementById(blockId);
                                if (!el) return;

                                if (direction === 'delete') {
                                    el.remove();
                                } else if (direction === 'up' || direction === 'down') {
                                    // Determine if this is a section-level or item-level block
                                    const isSection = el.classList.contains('section');
                                    
                                    // For sections, move among other sections
                                    // For items, move among siblings within same parent first, then allow cross-section
                                    let siblings;
                                    if (isSection) {
                                        // Get all top-level sections
                                        siblings = Array.from(el.parentNode.querySelectorAll(':scope > .section'));
                                    } else {
                                        // Get siblings at same level (items within a section)
                                        const parent = el.parentNode;
                                        siblings = Array.from(parent.children).filter(child => 
                                            child.classList && !child.classList.contains('page-break-gap') && 
                                            !child.classList.contains('section-title') && !child.classList.contains('page-margin-spacer') &&
                                            child.nodeType === 1
                                        );
                                    }
                                    
                                    const currentIndex = siblings.indexOf(el);
                                    
                                    if (direction === 'up' && currentIndex > 0) {
                                        const prevSibling = siblings[currentIndex - 1];
                                        el.parentNode.insertBefore(el, prevSibling);
                                    } else if (direction === 'down' && currentIndex < siblings.length - 1) {
                                        const nextSibling = siblings[currentIndex + 1];
                                        if (nextSibling.nextElementSibling) {
                                            el.parentNode.insertBefore(el, nextSibling.nextElementSibling);
                                        } else {
                                            el.parentNode.appendChild(el);
                                        }
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

                        // --- 4b. Profile Image Click-to-Upload ---
                        const profileImageSelector = '${PROFILE_IMAGE_SELECTORS}';
                        const profileImages = document.querySelectorAll(profileImageSelector);
                        let activeProfileImage = null;
                        
                        profileImages.forEach(function(img) {
                            // Skip tiny icon images (less than 40px)
                            if (img.naturalWidth > 0 && img.naturalWidth < 40) return;
                            if (img.width < 40 && img.height < 40) return;
                            
                            // Mark as profile image for styling
                            img.classList.add('resume-profile-image');
                            // Remove contenteditable from image and its wrapper to prevent text cursor
                            img.removeAttribute('contenteditable');
                            
                            // Wrap image in a relative container for overlay
                            const parent = img.parentElement;
                            if (parent && !parent.classList.contains('resume-profile-image-wrapper')) {
                                const wrapper = document.createElement('div');
                                wrapper.className = 'resume-profile-image-wrapper';
                                wrapper.style.cssText = parent.style.cssText || '';
                                // Copy over parent's sizing behavior
                                wrapper.style.position = 'relative';
                                wrapper.style.display = 'inline-block';
                                wrapper.style.width = '100%';
                                parent.insertBefore(wrapper, img);
                                wrapper.appendChild(img);
                                
                                // Add overlay with camera icon
                                const overlay = document.createElement('div');
                                overlay.className = 'image-upload-overlay';
                                overlay.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg><span>Change Photo</span>';
                                wrapper.appendChild(overlay);
                                
                                // Click on wrapper triggers upload
                                wrapper.addEventListener('click', function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    activeProfileImage = img;
                                    window.parent.postMessage({ type: 'IMAGE_CLICK' }, '*');
                                });
                            } else {
                                // Image is already wrapped or can't be wrapped — attach click directly
                                img.addEventListener('click', function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    activeProfileImage = img;
                                    window.parent.postMessage({ type: 'IMAGE_CLICK' }, '*');
                                });
                            }
                        });
                        
                        // Listen for IMAGE_UPDATE from parent (file selected)
                        window.addEventListener('message', function(event) {
                            if (event.data.type === 'IMAGE_UPDATE' && event.data.src) {
                                if (activeProfileImage) {
                                    activeProfileImage.src = event.data.src;
                                    // Trigger content update
                                    clearTimeout(debounceTimer);
                                    debounceTimer = setTimeout(function() {
                                        window.parent.postMessage({
                                            type: 'RESUME_CONTENT_UPDATE',
                                            html: document.documentElement.outerHTML
                                        }, '*');
                                    }, 300);
                                }
                            }
                        });

                        // --- 5. Content Height Sync (Auto-Resize) ---
                        // ResizeObserver triggers pagination recalculation when body size changes.
                        // Pagination is the authoritative source of IFRAME_RESIZE height 
                        // (always full-page multiples), so we DON'T send raw scrollHeight here
                        // to avoid bouncing between raw and paginated heights.
                        const resizeObserver = new ResizeObserver(entries => {
                            if (window.updatePagination) window.updatePagination();
                        });
                        resizeObserver.observe(document.body);
                        
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

                            /* Profile Image Upload Hover Effect */
                            .resume-profile-image {
                                cursor: pointer !important;
                                transition: filter 0.2s ease, outline 0.2s ease;
                                position: relative;
                            }
                            .resume-profile-image:hover {
                                filter: brightness(0.7);
                                outline: 3px solid #3b82f6;
                                outline-offset: 2px;
                            }
                            .resume-profile-image-wrapper {
                                position: relative;
                                display: inline-block;
                            }
                            .resume-profile-image-wrapper .image-upload-overlay {
                                position: absolute;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                background: rgba(0,0,0,0.45);
                                opacity: 0;
                                transition: opacity 0.2s ease;
                                pointer-events: none;
                                z-index: 10;
                            }
                            .resume-profile-image-wrapper:hover .image-upload-overlay {
                                opacity: 1;
                            }
                            .image-upload-overlay svg {
                                width: 28px;
                                height: 28px;
                                fill: white;
                                margin-bottom: 4px;
                            }
                            .image-upload-overlay span {
                                color: white;
                                font-size: 11px;
                                font-family: system-ui, -apple-system, sans-serif;
                                font-weight: 600;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                            }
                            @media print {
                                .resume-profile-image { outline: none !important; filter: none !important; }
                                .image-upload-overlay { display: none !important; }
                            }
                            .printing .resume-profile-image { outline: none !important; filter: none !important; }
                            .printing .image-upload-overlay { display: none !important; }

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
                        })(); // End IIFE
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
                    document.body.addEventListener('click', (e) => {
                        const target = e.target.closest('.review-issue');
                        if (target) {
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

            // PAGINATION SCRIPT - Google Docs style multi-page view with full pages
            const paginationScript = `
                <style>
                    /* Page break gap - creates visual separation between pages */
                    .page-break-gap {
                        position: absolute;
                        left: -30px;
                        right: -30px;
                        height: 28px;
                        background: #d1d5db;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        pointer-events: none;
                    }
                    .page-break-label {
                        font-size: 10px;
                        color: #6b7280;
                        background: #e5e7eb;
                        padding: 2px 10px;
                        border-radius: 10px;
                        z-index: 1;
                        font-family: system-ui, -apple-system, sans-serif;
                        white-space: nowrap;
                        font-weight: 500;
                    }
                    /* Elements pushed down by pagination */
                    .pagination-pushed {
                        /* Marker class for elements that have been pushed */
                    }
                    @media print {
                        .page-break-gap {
                            display: none !important;
                        }
                        body {
                            min-height: auto !important;
                        }
                        /* In print: use the print-safe margin (without gap height) */
                        .pagination-pushed {
                            margin-top: var(--print-margin, 0px) !important;
                        }
                        /* Force a page break before the first element on each new page */
                        [data-page-start] {
                            page-break-before: always;
                        }
                    }
                </style>
                <script>
                    (function() {
                        const pageSize = '${pageSize}';
                        // Page heights at 96dpi - A4: 297mm = 1123px, Letter: 11in = 1056px
                        const pageHeight = pageSize === 'Letter' ? 1056 : 1123;
                        const pageGapHeight = 28; // Height of visual gap between pages
                        
                        let isPaginationRunning = false;
                        function updatePagination() {
                            if (isPaginationRunning) return;
                            isPaginationRunning = true;
                            
                            // Remove existing pagination elements
                            document.querySelectorAll('.page-break-gap').forEach(el => el.remove());
                            
                            // Reset any previously pushed elements
                            document.querySelectorAll('.pagination-pushed').forEach(el => {
                                el.style.marginTop = '';
                                el.style.removeProperty('--print-margin');
                                el.removeAttribute('data-page-start');
                                el.classList.remove('pagination-pushed');
                            });
                            
                            // Ensure body has relative positioning
                            document.body.style.position = 'relative';
                            
                            // Fix ALL .page containers - remove fixed height and overflow:hidden
                            // to allow content to flow continuously across multiple pages
                            const pageContainers = document.querySelectorAll('.page');
                            pageContainers.forEach(function(pageContainer) {
                                const pageStyle = window.getComputedStyle(pageContainer);
                                
                                // Fix fixed height → min-height
                                const hasFixedHeight = pageStyle.height && pageStyle.height !== 'auto' && !pageStyle.height.includes('%');
                                if (hasFixedHeight) {
                                    pageContainer.style.height = 'auto';
                                    pageContainer.style.minHeight = pageHeight + 'px';
                                }
                                
                                // Remove overflow:hidden that clips content
                                if (pageStyle.overflow === 'hidden') {
                                    pageContainer.style.overflow = 'visible';
                                }
                            });
                            
                            // Fix .main-container height (two-column layouts)
                            const mainContainers = document.querySelectorAll('.main-container');
                            mainContainers.forEach(function(mc) {
                                const mcStyle = window.getComputedStyle(mc);
                                if (mcStyle.height && mcStyle.height !== 'auto' && !mcStyle.height.includes('%')) {
                                    mc.style.height = 'auto';
                                    mc.style.minHeight = '100%';
                                }
                            });
                            
                            // Fix .main-content height (e.g., BlueSimpleProfile calc-based height)
                            // Only fix if it has a fixed/calc height, not flex-grow based layouts
                            const mainContents = document.querySelectorAll('.main-content');
                            mainContents.forEach(function(mc) {
                                const mcStyle = window.getComputedStyle(mc);
                                const mcHeight = mcStyle.height;
                                const mcFlexGrow = mcStyle.flexGrow;
                                // Only override if height is explicitly set (not from flex-grow)
                                if (mcHeight && mcHeight !== 'auto' && !mcHeight.includes('auto') && mcFlexGrow === '0') {
                                    mc.style.height = 'auto';
                                    mc.style.minHeight = 'auto';
                                }
                                
                                // Fix flex row layouts (e.g. OliveGreenModern two-column layout)
                                // that cause blank space when content exceeds one page.
                                // Flex row containers can't be split across pages, so convert
                                // to block layout when content overflows.
                                if (mcStyle.display === 'flex' && mcStyle.flexDirection !== 'column') {
                                    const mcRect = mc.getBoundingClientRect();
                                    const mcTop = mcRect.top + window.scrollY;
                                    const mcBottom = mcTop + mcRect.height;
                                    // Check if this flex container's content would cross page 1 boundary
                                    if (mcBottom > pageHeightPx) {
                                        mc.style.display = 'block';
                                        mc.style.flexWrap = '';
                                        // Make column children full-width so they stack vertically
                                        Array.from(mc.children).forEach(function(child) {
                                            if (child.classList && 
                                                (child.classList.contains('left-column') || 
                                                 child.classList.contains('right-column'))) {
                                                child.style.width = '100%';
                                                child.style.display = 'block';
                                            }
                                        });
                                    }
                                }
                            });
                            
                            // Fix profile images that stretch to fill flex containers
                            document.querySelectorAll('.profile-pic-container img').forEach(function(img) {
                                const imgStyle = window.getComputedStyle(img);
                                // If image height exceeds a reasonable max (350px), constrain it
                                if (parseInt(imgStyle.height) > 400) {
                                    img.style.height = 'auto';
                                    img.style.maxHeight = '350px';
                                }
                            });
                            
                            const hasPageContainer = pageContainers.length > 0;
                            
                            // --- Gather GRANULAR content elements ---
                            // Instead of pushing entire sections, break them into 
                            // individual items so only items that cross the page 
                            // boundary get pushed, minimizing blank space.
                            function isExcluded(el) {
                                if (!el || el.nodeType !== 1) return true;
                                if (el.classList.contains('page-break-gap') || el.classList.contains('page-margin-spacer')) return true;
                                if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return true;
                                if (el.classList.contains('footer') || el.tagName === 'FOOTER') return true;
                                if (el.classList.contains('header-bg') || el.classList.contains('footer-bg')) return true;
                                if (el.classList.contains('page')) return true;
                                // Never exclude skills sections - they must be included in pagination
                                const isSkillsSection = el.classList.contains('section') && 
                                    (el.querySelector('.skills-grid, .skills-list, .skills') || 
                                     /skill/i.test(el.textContent || ''));
                                if (isSkillsSection) return false;
                                return false;
                            }
                            
                            const SUB_ITEM_SELECTOR = '.experience-item, .education-item, .project-item, .volunteer-item, .timeline-item, .work-item, .job, .two-col-section, .section-content, .skills-group, .skill-group, .skills-grid';
                            
                            function getGranularElements() {
                                const result = [];
                                const seen = new Set();
                                
                                function addUnique(el) {
                                    if (!isExcluded(el) && !seen.has(el)) {
                                        seen.add(el);
                                        result.push(el);
                                    }
                                }
                                
                                // Add headers
                                document.body.querySelectorAll('.header, .resume-header, .header-text').forEach(addUnique);
                                
                                // Process each section: break into title + sub-items if possible
                                document.body.querySelectorAll('.section, section, [class*="section"]').forEach(section => {
                                    if (isExcluded(section)) return;
                                    // Skip wrapper sections (e.g. left-section, right-section that contain other sections)
                                    if (section.querySelector('.section, section')) {
                                        // This is a wrapper - skip it, its child sections will be processed
                                        return;
                                    }
                                    
                                    // Check if this is a skills section - handle it specially to ensure it's not cut off
                                    const sectionTitle = section.querySelector('.section-title, :scope > h2, :scope > h3');
                                    const titleText = sectionTitle ? sectionTitle.textContent?.toLowerCase() || '' : '';
                                    const isSkillsSection = /skill/i.test(titleText);
                                    
                                    const subItems = section.querySelectorAll(SUB_ITEM_SELECTOR);
                                    
                                    if (subItems.length > 1) {
                                        // Section has multiple sub-items — add title and each item separately
                                        if (sectionTitle) addUnique(sectionTitle);
                                        subItems.forEach(item => addUnique(item));
                                    } else if (isSkillsSection && subItems.length === 0) {
                                        // Skills section with no sub-items (skills-grid or flat list) - add entire section
                                        // This ensures skills sections are never cut off
                                        if (sectionTitle) addUnique(sectionTitle);
                                        const skillsContent = section.querySelector('.skills-grid, .skills-list, ul, .skills');
                                        if (skillsContent) addUnique(skillsContent);
                                        else addUnique(section);
                                    } else {
                                        // Section is small (0-1 sub-items) — add entire section as one unit
                                        addUnique(section);
                                    }
                                });
                                
                                // For two-column layouts, also grab direct children of columns
                                document.body.querySelectorAll('.main-content > *, .left-column > *, .right-column > *').forEach(el => {
                                    if (!isExcluded(el) && !seen.has(el)) {
                                        // Only add if not already covered by section processing
                                        const parentSection = el.closest('.section, section');
                                        if (!parentSection || !seen.has(parentSection)) {
                                            addUnique(el);
                                        }
                                    }
                                });
                                
                                return result;
                                    }
                            
                            let elements = getGranularElements();
                            
                            // Fallback: if nothing found, use direct body children
                            if (elements.length === 0) {
                                elements = Array.from(document.body.children).filter(el => !isExcluded(el));
                            }
                            
                            // Calculate content height
                            let maxBottom = 0;
                            elements.forEach(el => {
                                const rect = el.getBoundingClientRect();
                                const bottom = rect.top + window.scrollY + rect.height;
                                if (bottom > maxBottom) maxBottom = bottom;
                            });
                            
                            const contentHeight = maxBottom > 0 ? maxBottom : document.body.scrollHeight;
                            
                            // Safety check: Cap maximum content height to prevent infinite loops
                            // Increased to 10 pages to support longer resumes
                            const maxReasonableHeight = pageHeight * 10;
                            const cappedContentHeight = Math.min(contentHeight, maxReasonableHeight);
                            
                            // Only show multiple pages if content exceeds one page
                            const pageThreshold = pageHeight + 20; // Must exceed by at least 20px
                            const exceedsOnePage = cappedContentHeight > pageThreshold;
                            const pageCount = exceedsOnePage ? Math.ceil(cappedContentHeight / pageHeight) : 1;
                            
                            // Only add page breaks if content truly exceeds the threshold
                            if (pageCount > 1 && cappedContentHeight > pageThreshold) {
                                let cumulativeOffset = 0;
                                
                                for (let pageNum = 1; pageNum < pageCount; pageNum++) {
                                    const pageBreakY = pageNum * pageHeight + cumulativeOffset;
                                    // Increase top margin for page 2+ to match template padding and prevent content from being too close to top
                                    // For templates with .page container, use their top padding; otherwise use a reasonable default
                                    const pageContainer = document.querySelector('.page');
                                    let pageTopMargin = 30; // Default top margin
                                    if (pageContainer) {
                                        const pageStyle = window.getComputedStyle(pageContainer);
                                        const topPadding = parseInt(pageStyle.paddingTop) || 0;
                                        // Use template's top padding + extra space for visual separation on new pages
                                        // This ensures page 2+ has proper spacing and doesn't look cramped
                                        pageTopMargin = Math.max(topPadding + 25, 50);
                                    }
                                    const pageBottomMargin = 20; // Bottom margin — keep content away from page edge
                                    const orphanThreshold = 80; // Push section titles if they'd be orphaned near page bottom
                                    // The bottom "safe edge" — content should not extend past this
                                    const pageBottomEdge = pageBreakY - pageBottomMargin;
                                    // The "safe zone" where content should not start:
                                    // from pageBreakY to pageBreakY + pageGapHeight + pageTopMargin
                                    const newPageContentStart = pageBreakY + pageGapHeight + pageTopMargin;
                                    
                                    // Collect elements that need to be pushed for this page break
                                    const toPush = [];
                                    
                                    elements.forEach(el => {
                                        const rect = el.getBoundingClientRect();
                                        const elTop = rect.top + window.scrollY;
                                        const elBottom = elTop + rect.height;
                                        
                                        // Push elements that cross into the bottom margin zone
                                        // (start before the safe edge but end past it)
                                        if (elTop < pageBottomEdge && elBottom > pageBottomEdge && elBottom <= pageBreakY + pageGapHeight) {
                                            toPush.push({ el, elTop, elBottom, target: newPageContentStart });
                                        }
                                        // Push elements that CROSS the page break boundary
                                        else if (elTop < pageBreakY && elBottom > pageBreakY + 5) {
                                            toPush.push({ el, elTop, elBottom, target: newPageContentStart });
                                        }
                                        // Also push elements that start inside the gap/margin zone
                                        else if (elTop >= pageBreakY && elTop < newPageContentStart) {
                                            toPush.push({ el, elTop, elBottom, target: newPageContentStart });
                                        }
                                    });
                                    
                                    // Orphan protection: check if a section title would be stranded 
                                    // near the bottom of the page (within orphanThreshold of break)
                                    elements.forEach(el => {
                                        const isTitle = el.classList.contains('section-title') || 
                                            (el.matches && el.matches('h2, h3') && el.closest('.section, section'));
                                        if (!isTitle) return;
                                        
                                        const rect = el.getBoundingClientRect();
                                        const elTop = rect.top + window.scrollY;
                                        const elBottom = elTop + rect.height;
                                        const spaceAfterTitle = pageBreakY - elBottom;
                                        
                                        // If title ends within orphanThreshold of the page break, 
                                        // it would be alone at bottom — push it to next page
                                        if (elBottom <= pageBreakY && spaceAfterTitle < orphanThreshold && spaceAfterTitle >= 0) {
                                            if (!toPush.some(p => p.el === el)) {
                                                toPush.push({ el, elTop, elBottom, target: newPageContentStart });
                                            }
                                        }
                                    });
                                    
                                    // Sort by position so the first element on the new page gets marked
                                    toPush.sort((a, b) => a.elTop - b.elTop);
                                    
                                    // Apply pushes — move each element so its top aligns with the target
                                    let firstOnPage = true;
                                    toPush.forEach(({ el, elTop, target }) => {
                                        const pushAmount = target - elTop;
                                        if (pushAmount > 0) {
                                            const currentMargin = parseInt(getComputedStyle(el).marginTop) || 0;
                                            el.style.marginTop = (currentMargin + pushAmount) + 'px';
                                            el.classList.add('pagination-pushed');
                                            // Store a print-safe top margin (without gap height)
                                            el.style.setProperty('--print-margin', pageTopMargin + 'px');
                                            // Mark the first element on each new page for print page-break
                                            if (firstOnPage) {
                                                el.setAttribute('data-page-start', 'true');
                                                firstOnPage = false;
                                            }
                                        }
                                    });
                                    
                                    // Add the page break indicator
                                    const gap = document.createElement('div');
                                    gap.className = 'page-break-gap';
                                    gap.style.top = pageBreakY + 'px';
                                    gap.innerHTML = '<span class="page-break-label">Page ' + pageNum + ' / ' + pageCount + '</span>';
                                    document.body.appendChild(gap);
                                    
                                    cumulativeOffset += pageGapHeight;
                                }
                            }
                            
                            // Calculate final height - always use FULL page multiples
                            // (like Google Docs: each page is exactly pageHeight tall)
                            const totalGapHeight = pageCount > 1 ? (pageCount - 1) * pageGapHeight : 0;
                            const totalHeight = (pageCount * pageHeight) + totalGapHeight;
                            
                            document.body.style.minHeight = totalHeight + 'px';
                            
                            // Notify parent
                            window.parent.postMessage({ type: 'PAGE_COUNT', count: pageCount }, '*');
                            window.parent.postMessage({ type: 'IFRAME_RESIZE', height: totalHeight }, '*');
                            
                            // Release re-entrant guard after DOM settles
                            setTimeout(() => { isPaginationRunning = false; }, 100);
                        }
                        
                        // Run pagination after DOM is ready
                        if (document.readyState === 'complete') {
                            setTimeout(updatePagination, 150);
                        } else {
                            window.addEventListener('load', () => setTimeout(updatePagination, 150));
                        }
                        
                        // Re-run on content changes (debounced)
                        let paginationTimer;
                        const paginationObserver = new MutationObserver((mutations) => {
                            // Ignore mutations caused by our own pagination logic
                            const isOwnMutation = mutations.every(m => {
                                // For childList mutations, check if added/removed nodes are pagination elements
                                if (m.type === 'childList') {
                                    const isPaginationNode = (node) => 
                                        node.nodeType === 1 && node.classList && (
                                            node.classList.contains('page-break-gap') || 
                                            node.classList.contains('page-margin-spacer') ||
                                            node.classList.contains('pagination-pushed')
                                        );
                                    const allAdded = Array.from(m.addedNodes).every(isPaginationNode);
                                    const allRemoved = Array.from(m.removedNodes).every(isPaginationNode);
                                    return (m.addedNodes.length === 0 || allAdded) && 
                                           (m.removedNodes.length === 0 || allRemoved);
                                }
                                // For attribute mutations, check if target is pagination element
                                if (m.type === 'attributes') {
                                    return m.target.classList && (
                                    m.target.classList.contains('page-break-gap') || 
                                        m.target.classList.contains('pagination-pushed')
                            );
                                }
                                return false;
                            });
                            if (isOwnMutation) return;
                            
                            clearTimeout(paginationTimer);
                            paginationTimer = setTimeout(updatePagination, 300);
                        });
                        paginationObserver.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style', 'class'] });
                        
                        // Also update on resize
                        window.addEventListener('resize', () => {
                            clearTimeout(paginationTimer);
                            paginationTimer = setTimeout(updatePagination, 300);
                        });
                        
                        // Expose updatePagination globally so layout/page-size handlers can trigger it
                        window.updatePagination = function() {
                            clearTimeout(paginationTimer);
                            paginationTimer = setTimeout(updatePagination, 200);
                        };
                    })();
                </script>
            `;

            // Apply Highlights
            let htmlToWrite = (showHighlights && annotatedHtml ? annotatedHtml : currentHtml);
            
            // IMPORTANT: Remove any existing injected scripts to prevent duplicate declarations
            htmlToWrite = cleanHtmlScripts(htmlToWrite);

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
            const combinedScripts = script + grammarScript + paginationScript;
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
    }, [isEditing, currentHtml, showHighlights, annotatedHtml, grammarIssues, layoutSettings, pageSize]);


    const [showComparison, setShowComparison] = useState(false);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input, timestamp: Date.now() };
        setAiMessages(prev => [...prev, userMsg]);
        setInput('');

        const tempId = crypto.randomUUID();
        setAiMessages(prev => [...prev, { id: tempId, role: 'assistant', content: 'Working on it...', timestamp: Date.now() }]);

        try {
            // getLatestHtmlFromIframe() ensures any pending edits are captured
            const result = await modifyResumeHtml(getLatestHtmlFromIframe(), userMsg.content);
            const { html, summary, changes } = result;

            setCurrentHtml(html);
            setResumeHtml(html); // Sync global
            logHistory(html);
            
            // Persist edits: parse the new HTML and save to localStorage
            // so edits survive template switches
            try {
                const { parseResumeHtml, saveResumeEditsData, loadResumeEditsData } = await import('@/lib/resume-data');
                const parsed = parseResumeHtml(html);
                const prev = loadResumeEditsData();
                // Merge parsed on top of previous edits to accumulate
                const merged = prev ? { ...prev, ...parsed, profile: { ...prev.profile, ...parsed.profile } } : parsed;
                saveResumeEditsData(merged);
            } catch (_) { /* non-critical */ }

            const changeList = changes && changes.length > 0
                ? `\n\n ** Changes:**\n${changes.map(c => `- ${c}`).join('\n')} `
                : '';

            setAiMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: `${summary}${changeList} ` } : m
            ));
        } catch (e) {
            setAiMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: 'Sorry, something went wrong while editing.' } : m
            ));
        }
    };

    // Compare Logic
    const toggleComparison = (show: boolean) => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setShowComparison(show);
            // We cheat a bit: simply swapping the HTML in state is safest for IFrame
            // But to avoid "flashing" or losing current state, we use 'currentHtml' variable

            if (show) {
                // Show OLD
                if (iframeRef.current && iframeRef.current.contentDocument) {
                    iframeRef.current.contentDocument.open();
                    iframeRef.current.contentDocument.write(prevState.html + `< script > document.body.style.opacity = '0.7';</script > `);
                    iframeRef.current.contentDocument.close();
                }
            } else {
                // Show CURRENT
                // Rerender current
                if (iframeRef.current && iframeRef.current.contentDocument) {
                    iframeRef.current.contentDocument.open();
                    // Use streaming HTML if available, otherwise use current HTML
                    const htmlToDisplay = streamingHtml || currentHtml;
                    iframeRef.current.contentDocument.write(htmlToDisplay);
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
        
        // Map fontSize values to actual pixel sizes matching template defaults
        if (cmd === 'fontSize' && val) {
            const fontSizeMap: { [key: string]: string } = {
                '1': '10px',   // Tiny
                '2': '12px',   // Small
                '3': '14px',   // Normal (matches template default)
                '4': '18px',   // Large
                '5': '24px',   // Huge
                '6': '32px',   // Title
                '7': '48px',   // Max
            };
            
            if (fontSizeMap[val] && iframeRef.current && iframeRef.current.contentWindow) {
                // Apply custom font size using inline styles
                iframeRef.current.contentWindow.postMessage({ 
                    type: 'APPLY_FONT_SIZE', 
                    size: fontSizeMap[val] 
                }, '*');
                return;
            }
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
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                            Reset Session
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Reset Session?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will clear all data including your resume, profile, and chat history. 
                                You'll be taken back to the beginning to start over.
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={resetSession}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                Reset Everything
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {aiMessages.map(m => (
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
                            <Button variant="outline" size="sm" className="h-8 gap-1 border-dashed" disabled={!isEditing || isChangingTemplate}>
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
                            <Button variant="ghost" size="sm" className="h-8 gap-1 ml-1" disabled={!isEditing}>
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

                    <SectionManager
                        currentHtml={currentHtml}
                        template={selectedTemplate}
                        onHtmlChange={(html) => {
                            setCurrentHtml(html);
                            setResumeHtml(html);
                            logHistory(html);
                        }}
                        iframeRef={iframeRef}
                        isEditing={isEditing}
                    />
                    
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-1" disabled={!isEditing}>
                                <Layout className="w-3.5 h-3.5" />
                                {pageSize}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                            <div className="space-y-1">
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                    Page Size
                                </div>
                                <Button
                                    variant={pageSize === 'A4' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="w-full justify-start h-8 px-2"
                                    onClick={() => setPageSize('A4')}
                                >
                                    A4 (210mm × 297mm)
                                </Button>
                                <Button
                                    variant={pageSize === 'Letter' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="w-full justify-start h-8 px-2"
                                    onClick={() => setPageSize('Letter')}
                                >
                                    US Letter (8.5" × 11")
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Page Indicator */}
                    {pageCount > 1 && (
                        <>
                            <div className="h-4 w-px bg-border mx-2" />
                            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                <span className="font-medium">{currentPage}</span>
                                <span>/</span>
                                <span>{pageCount}</span>
                                <span className="hidden sm:inline ml-1">pages</span>
                            </div>
                        </>
                    )}

                    <div className="h-4 w-px bg-border mx-2" />

                    <Button variant="ghost" size="icon" disabled={!isEditing || historyIndex <= 0} onClick={handleUndo}>
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={!isEditing || historyIndex >= history.length - 1} onClick={handleRedo}>
                        <Redo className="w-4 h-4" />
                    </Button>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <Download className="w-4 h-4 mr-2" /> Download
                            <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
                            <FileText className="w-4 h-4 mr-2 text-red-500" />
                            PDF Document
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadDOCX} className="cursor-pointer">
                            <FileText className="w-4 h-4 mr-2 text-blue-500" />
                            Word Document (.docx)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDownloadPNG} className="cursor-pointer">
                            <Image className="w-4 h-4 mr-2 text-green-500" />
                            PNG Image
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDownloadHTML} className="cursor-pointer">
                            <Code className="w-4 h-4 mr-2 text-orange-500" />
                            HTML File
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadTXT} className="cursor-pointer">
                            <FileText className="w-4 h-4 mr-2 text-gray-500" />
                            Plain Text (.txt)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Resume Canvas (Iframe) - Multi-page Google Docs style */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center bg-gray-500/10 relative"
                style={{ gap: '24px' }}
            >
                <div 
                    className="bg-white shadow-xl overflow-hidden relative"
                    style={{ 
                        width: pageSize === 'Letter' ? '8.5in' : '210mm',
                        minHeight: iframeHeight ? `${iframeHeight}px` : (pageSize === 'Letter' ? '11in' : '297mm'),
                        height: iframeHeight ? `${iframeHeight}px` : 'auto'
                    }}
                >
                    <iframe
                        ref={iframeRef}
                        title="Resume Preview"
                        className="w-full border-none"
                        style={{ 
                            height: iframeHeight ? `${iframeHeight}px` : (pageSize === 'Letter' ? '11in' : '297mm'),
                            minHeight: pageSize === 'Letter' ? '11in' : '297mm',
                            opacity: isChangingTemplate && streamingHtml ? 0.9 : 1,
                            transition: 'opacity 0.2s'
                        }}
                    />
                    {/* Streaming indicator */}
                    {isChangingTemplate && streamingHtml && (
                        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg z-10">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating template...</span>
                        </div>
                    )}

                    {/* HIDDEN FILE INPUT FOR IMAGE UPLOAD */}
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
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
            <div className="flex-1 relative min-w-[600px] border-r">
                {resumePreviewCmp}
            </div>
            {!isPanelCollapsed && (
                <div
                    className="relative bg-background border-l flex flex-col"
                    style={{ width: `${panelWidth}px`, minWidth: '320px', maxWidth: '800px' }}
                >
                    {/* Resize Handle */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors group"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startWidth = panelWidth;

                            const handleMouseMove = (e: MouseEvent) => {
                                const delta = startX - e.clientX;
                                const newWidth = Math.max(320, Math.min(800, startWidth + delta));
                                setPanelWidth(newWidth);
                            };

                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-border group-hover:bg-blue-500 rounded-r transition-colors" />
                    </div>

                    {/* Collapse Button */}
                    <button
                        onClick={() => setIsPanelCollapsed(true)}
                        className="absolute right-2 top-2 z-10 p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Collapse panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>

                    {chatInterfaceCmp}
                </div>
            )}

            {/* Collapsed Panel - Show Expand Button */}
            {isPanelCollapsed && (
                <button
                    onClick={() => setIsPanelCollapsed(false)}
                    className="fixed right-0 top-1/2 -translate-y-1/2 p-2 bg-background border border-r-0 rounded-l-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shadow-lg z-50"
                    title="Expand AI Assistant"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
            )}
        </div>
    );
}
