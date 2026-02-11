import React, { useState } from 'react';
import { useCareer } from '@/context/CareerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RawInput } from '@/types/career';
import { FileText, Link as LinkIcon, Plus, Trash2, Mic, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { generateProfileFromIntent } from '@/app/actions';

export function InputDropzone() {
    const { addRawInput, removeRawInput, rawMemory, setStep, startProcessing, intent, setProfile } = useCareer();
    const [isGenerating, setIsGenerating] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [activeTab, setActiveTab] = useState<'text' | 'url' | 'files'>('files');

    const handleAddText = () => {
        if (!textInput.trim()) return;
        const input: RawInput = {
            id: crypto.randomUUID(),
            type: 'text',
            content: textInput,
            timestamp: Date.now()
        };
        addRawInput(input);
        setTextInput('');
    };

    const handleAddUrl = () => {
        if (!urlInput.trim()) return;

        // Auto-detect type
        const lowerUrl = urlInput.toLowerCase();
        let type: 'url' | 'linkedin' = 'url';

        if (lowerUrl.includes('linkedin.com')) {
            type = 'linkedin';
        }
        // We can treat github as generic 'url' and let bridge handle it,
        // or add explicit type if RawInput supported it. 
        // Since RawInput type is limited, we stick to 'url' for github for now.

        const input: RawInput = {
            id: crypto.randomUUID(),
            type: type,
            content: urlInput,
            timestamp: Date.now()
        };
        addRawInput(input);
        setUrlInput('');
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Convert to Base64
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix (e.g. "data:application/pdf;base64,")
                const base64Data = result.split(',')[1];

                const input: RawInput = {
                    id: crypto.randomUUID(),
                    type: 'file',
                    content: file.name,
                    mimeType: file.type,
                    data: base64Data,
                    timestamp: Date.now()
                };
                addRawInput(input);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProceed = () => {
        // Go to processing step which will extract form data
        setStep('processing');
    };

    const handleGenerate = async () => {
        if (!intent) return;
        setIsGenerating(true);
        try {
            const profile = await generateProfileFromIntent(intent);
            setProfile(profile);
            setStep('profile-review');
        } catch (e) {
            console.error(e);
            alert("Failed to generate profile. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex space-x-2 border-b">
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'files' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Upload File
                    </button>
                    <button
                        onClick={() => setActiveTab('url')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'url' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Add Link
                    </button>
                    <button
                        onClick={() => setActiveTab('text')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'text' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Text Dump
                    </button>
                </div>

                {activeTab === 'text' && (
                    <div className="space-y-2">
                        <textarea
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Paste your resume content, project descriptions, or just type out what you did..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button onClick={handleAddText} variant="secondary" size="sm" type="button">
                                <Plus className="w-4 h-4 mr-2" /> Add Text
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'url' && (
                    <div className="space-y-2">
                        <div className="flex space-x-2">
                            <Input
                                placeholder="https://linkedin.com/in/..."
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                            />
                            <Button onClick={handleAddUrl} variant="secondary" type="button">
                                Add
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 border-muted-foreground/30">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FileText className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> PDF, TXT or IMG</p>
                                    <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, PNG, JPG (MAX. 5MB)</p>
                                </div>
                                <input id="dropzone-file" type="file" className="hidden" accept=".pdf,.txt,.docx,.png,.jpg,.jpeg,.webp" onChange={handleFileSelect} />
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Added Inputs ({rawMemory.inputs.length})</h3>
                {rawMemory.inputs.length === 0 ? (
                    <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                        Nothing added yet.
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {rawMemory.inputs.map(input => (
                            <div key={input.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    {input.type === 'url' ? <LinkIcon className="w-4 h-4 shrink-0" /> :
                                        input.mimeType?.startsWith('image/') ? <ImageIcon className="w-4 h-4 shrink-0" /> :
                                            <FileText className="w-4 h-4 shrink-0" />}
                                    <span className="text-sm truncate max-w-[250px] font-medium">
                                        {input.type === 'file' ? `[FILE] ${input.content}` : input.content.substring(0, 40) + '...'}
                                    </span>
                                </div>
                                <button onClick={() => removeRawInput(input.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-4 pt-4 border-t flex flex-col gap-3">
                <div className="flex gap-3 w-full">
                    <Button onClick={() => setStep('onboarding-intent')} variant="outline" className="w-1/3">
                        Back
                    </Button>
                    <Button onClick={handleProceed} className="w-2/3" disabled={rawMemory.inputs.length === 0}>
                        Analyze Career & Suggest Resume
                    </Button>
                </div>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                <Button
                    variant="secondary"
                    className="w-full gap-2 text-primary"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isGenerating ? "Generating Draft..." : "No Resume? Generate Profile from Scratch"}
                </Button>
            </div>
        </div>
    );
}
