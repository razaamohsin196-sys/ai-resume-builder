"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CareerState, CareerIntent, RawInput, AppStep, CareerProfile, ResumeDraft, AiMessage } from '@/types/career';
import { CareerProfileFormData } from '@/types/form';

interface CareerContextType extends CareerState {
    setStep: (step: AppStep) => void;
    setIntent: (intent: CareerIntent) => void;
    addRawInput: (input: RawInput) => void;
    removeRawInput: (id: string) => void;
    setProfile: (profile: CareerProfile) => void;
    setResume: (resume: ResumeDraft) => void;
    setResumeHtml: (html: string) => void;
    setFormData: (formData: CareerProfileFormData | null) => void;
    startProcessing: () => void;
    finishProcessing: () => void;
    resetSession: () => void;
    setAiMessages: (messagesOrUpdater: AiMessage[] | ((prev: AiMessage[]) => AiMessage[])) => void;
}

const initialState: CareerState = {
    step: 'onboarding-intent',
    intent: null,
    rawMemory: { inputs: [] },
    profile: null,
    resume: null,
    resumeHtml: '',
    isProcessing: false,
    aiMessages: [],
};

const CareerContext = createContext<CareerContextType | undefined>(undefined);

export function CareerProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<CareerState>(initialState);
    const [isClient, setIsClient] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        setIsClient(true);
        const saved = localStorage.getItem('career_agent_session');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState((prev) => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Failed to load session', e);
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        if (isClient) {
            try {
                localStorage.setItem('career_agent_session', JSON.stringify(state));
            } catch (e) {
                // QuotaExceededError — likely caused by large base64 images in resumeHtml.
                // Retry with base64 image data stripped from the HTML.
                console.warn('localStorage quota exceeded, saving with images stripped', e);
                try {
                    const lightState = {
                        ...state,
                        resumeHtml: state.resumeHtml
                            ? state.resumeHtml.replace(
                                /src="data:image\/[^"]+"/g,
                                'src=""'
                              )
                            : state.resumeHtml,
                    };
                    localStorage.setItem('career_agent_session', JSON.stringify(lightState));
                } catch (e2) {
                    console.error('Failed to save session even after stripping images', e2);
                }
            }
        }
    }, [state, isClient]);

    const setStep = (step: AppStep) => setState((prev) => ({ ...prev, step }));

    const setIntent = (intent: CareerIntent) => setState((prev) => ({ ...prev, intent }));

    const addRawInput = (input: RawInput) => setState((prev) => ({
        ...prev,
        rawMemory: { ...prev.rawMemory, inputs: [...prev.rawMemory.inputs, input] }
    }));

    const removeRawInput = (id: string) => setState((prev) => ({
        ...prev,
        rawMemory: { ...prev.rawMemory, inputs: prev.rawMemory.inputs.filter(i => i.id !== id) }
    }));

    const setProfile = (profile: CareerProfile) => setState((prev) => ({ ...prev, profile }));
    const setResume = (resume: ResumeDraft) => setState((prev) => ({ ...prev, resume }));
    const setResumeHtml = (resumeHtml: string) => setState((prev) => ({ ...prev, resumeHtml }));
    const setFormData = (formData: CareerProfileFormData | null) => setState((prev) => ({ ...prev, formData: formData || undefined }));

    const startProcessing = () => setState((prev) => ({ ...prev, isProcessing: true }));
    const finishProcessing = () => setState((prev) => ({ ...prev, isProcessing: false }));

    const resetSession = () => {
        // Clear ALL localStorage items completely
        // This must happen before setState to avoid race conditions
        localStorage.clear();
        
        // Force a page reload to completely reset all component states
        // This ensures the editor and all other components start fresh
        // We don't need to call setState since we're reloading anyway
        window.location.href = '/';
    };

    const setAiMessages = (messagesOrUpdater: AiMessage[] | ((prev: AiMessage[]) => AiMessage[])) => {
        setState((prev) => ({
            ...prev,
            aiMessages: typeof messagesOrUpdater === 'function' ? messagesOrUpdater(prev.aiMessages) : messagesOrUpdater
        }));
    };

    return (
        <CareerContext.Provider
            value={{
                ...state,
                setStep,
                setIntent,
                addRawInput,
                removeRawInput,
                setProfile,
                setResume,
                setResumeHtml,
                setFormData,
                startProcessing,
                finishProcessing,
                resetSession,
                setAiMessages,
            }}
        >
            {children}
        </CareerContext.Provider>
    );
}

export function useCareer() {
    const context = useContext(CareerContext);
    if (context === undefined) {
        throw new Error('useCareer must be used within a CareerProvider');
    }
    return context;
}
