import React, { useState } from 'react';
import { useCareer } from '@/context/CareerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CareerIntent } from '@/types/career';

export function IntentForm() {
    const { setIntent, setStep, intent: existingIntent } = useCareer();

    const [formData, setFormData] = useState<CareerIntent>(existingIntent || {
        targetRole: '',
        targetLocation: '',
        yearsOfExperience: 0,
        jobSearchIntent: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIntent(formData);
        setStep('onboarding-inputs');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Target Role
                    </label>
                    <Input
                        id="role"
                        placeholder="e.g. Senior Product Designer"
                        value={formData.targetRole}
                        onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                        required
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Target Location
                    </label>
                    <Input
                        id="location"
                        placeholder="e.g. Remote, NYC, London"
                        value={formData.targetLocation}
                        onChange={(e) => setFormData({ ...formData, targetLocation: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="yoe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Years of Experience
                    </label>
                    <Input
                        id="yoe"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="e.g. 5"
                        value={formData.yearsOfExperience || ''}
                        onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseFloat(e.target.value) })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="intent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Goal (Optional)
                    </label>
                    <Input
                        id="intent"
                        placeholder="e.g. Transitioning from Marketing to UX"
                        value={formData.jobSearchIntent || ''}
                        onChange={(e) => setFormData({ ...formData, jobSearchIntent: e.target.value })}
                    />
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={!formData.targetRole || !formData.targetLocation}>
                Next: Share Your Work
            </Button>
        </form>
    );
}
