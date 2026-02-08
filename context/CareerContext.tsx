"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CareerState, CareerIntent, RawInput, AppStep, CareerProfile, ResumeDraft, AiMessage } from '@/types/career';

import { modifyResumeHtml } from "@/app/actions";

interface CareerContextType extends CareerState {
    setStep: (step: AppStep) => void;
    setIntent: (intent: CareerIntent) => void;
    addRawInput: (input: RawInput) => void;
    removeRawInput: (id: string) => void;
    setProfile: (profile: CareerProfile) => void;
    setResume: (resume: ResumeDraft) => void;
    setResumeHtml: (html: string) => void;
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
            localStorage.setItem('career_agent_session', JSON.stringify(state));
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

    const startProcessing = () => setState((prev) => ({ ...prev, isProcessing: true }));
    const finishProcessing = () => setState((prev) => ({ ...prev, isProcessing: false }));

    const resetSession = () => {
        // Clear all localStorage items related to the session FIRST
        // This must happen before setState to avoid race conditions
        localStorage.removeItem('career_agent_session');
        localStorage.removeItem('aiPanelWidth');
        localStorage.removeItem('aiPanelCollapsed');
        
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
