"use client";

import React, { useEffect, useState } from 'react';
import { useCareer } from '@/context/CareerContext';
import { extractFormData } from '@/app/actions';
import { CareerProfileFormData } from '@/types/form';
import { Loader2, CheckCircle2, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProcessingView() {
    const { rawMemory, intent, setStep, setFormData } = useCareer();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'ingesting' | 'understanding' | 'complete'>('ingesting');
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            // Step 1: Ingestion simulation
            setStatus('ingesting');
            setError(null);
            await new Promise(r => setTimeout(r, 1500)); // Fake delay for "reading"

            if (!mounted) return;

            // Step 2: Understanding (Actual Call)
            setStatus('understanding');

            try {
                if (!intent) throw new Error("No intent found");

                // Extract form data from uploaded content
                const formData = await extractFormData(rawMemory.inputs, intent);

                if (!mounted) return;
                setStatus('complete');

                // Step 3: Transition to form
                setTimeout(() => {
                    setFormData(formData);
                    setStep('profile-form');
                }, 1000);
            } catch (e: any) {
                console.error(e);
                if (mounted) {
                    setStatus('complete'); // Stop spinner
                    setError(e.message || "An unknown error occurred.");
                }
            }
        };

        run();

        return () => { mounted = false; };
    }, [rawMemory, intent, setStep, setFormData, retryCount]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <BrainCircuit className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-red-600">Processing Failed</h2>
                <p className="text-muted-foreground">{error}</p>
                <div className="flex gap-4 pt-4">
                    <button
                        onClick={() => setStep('onboarding-inputs')}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border rounded-md"
                    >
                        Check Inputs
                    </button>
                    <button
                        onClick={() => setRetryCount(prev => prev + 1)}
                        className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-md shadow hover:bg-primary/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center space-y-8">
            <div className="relative w-24 h-24 flex items-center justify-center">
                <motion.div
                    className="absolute inset-0 border-4 border-primary/20 rounded-full"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
                <motion.div
                    className="absolute inset-0 border-t-4 border-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
                <BrainCircuit className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Agents at Work</h2>

                <div className="space-y-3 text-left max-w-xs mx-auto">
                    <StatusItem
                        label="Ingesting raw materials..."
                        state={status === 'ingesting' ? 'active' : 'done'}
                    />
                    <StatusItem
                        label="Building career profile..."
                        state={status === 'understanding' ? 'active' : status === 'complete' ? 'done' : 'pending'}
                    />
                    <StatusItem
                        label="Checking for gaps..."
                        state={status === 'complete' ? 'done' : 'pending'}
                    />
                </div>
            </div>
        </div>
    );
}

function StatusItem({ label, state }: { label: string, state: 'pending' | 'active' | 'done' }) {
    return (
        <div className={`flex items-center space-x-3 transition-colors ${state === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
            {state === 'done' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : state === 'active' ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
                <div className="w-5 h-5 border-2 border-muted rounded-full" />
            )}
            <span className="font-medium">{label}</span>
        </div>
    );
}
