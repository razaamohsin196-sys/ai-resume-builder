import React from 'react';
import { useCareer } from '@/context/CareerContext';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

interface OnboardingLayoutProps {
    children: React.ReactNode;
    title: string;
    description: string;
}

export function OnboardingLayout({ children, title, description }: OnboardingLayoutProps) {
    const { step } = useCareer();

    const steps = [
        { id: 'onboarding-intent', label: 'Career Intent' },
        { id: 'onboarding-inputs', label: 'Share Work' },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 max-w-2xl mx-auto">
            <div className="w-full space-y-8">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>

                <div className="flex items-center justify-center space-x-4">
                    {steps.map((s, index) => {
                        const isCompleted = currentStepIndex > index;
                        const isCurrent = s.id === step;

                        return (
                            <div key={s.id} className="flex items-center space-x-2">
                                {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                ) : isCurrent ? (
                                    <Circle className="w-5 h-5 text-primary fill-primary/20" />
                                ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground" />
                                )}
                                <span className={cn("text-sm font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                                    {s.label}
                                </span>
                                {index < steps.length - 1 && (
                                    <div className="w-8 h-px bg-border mx-2" />
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="bg-card border rounded-lg p-6 sm:p-8 shadow-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}
