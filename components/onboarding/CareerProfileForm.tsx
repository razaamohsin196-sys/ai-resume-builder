"use client";

import React, { useState, useEffect } from 'react';
import { useCareer } from '@/context/CareerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CareerProfileFormData } from '@/types/form';
import { formDataToCareerProfile } from '@/lib/form-converter';
import { Plus, Trash2, Save, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function CareerProfileForm() {
    const { formData: initialFormData, setFormData, setProfile, setStep } = useCareer();
    const [formData, setLocalFormData] = useState<CareerProfileFormData | null>(initialFormData || null);

    useEffect(() => {
        if (initialFormData) {
            setLocalFormData(initialFormData);
        }
    }, [initialFormData]);

    if (!formData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground">No form data available. Please go back and analyze your resume.</p>
                    <Button onClick={() => setStep('onboarding-inputs')} className="mt-4">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const updateField = <K extends keyof CareerProfileFormData>(
        section: K,
        field: keyof CareerProfileFormData[K],
        value: any
    ) => {
        setLocalFormData(prev => {
            if (!prev) return prev;
            const sectionData = prev[section];
            if (typeof sectionData !== 'object' || sectionData === null || Array.isArray(sectionData)) {
                return prev;
            }
            return {
                ...prev,
                [section]: {
                    ...sectionData,
                    [field]: value
                }
            };
        });
    };

    const handleSave = () => {
        if (!formData) return;
        
        // Convert form data back to CareerProfile
        const profile = formDataToCareerProfile(formData);
        setProfile(profile);
        setFormData(null); // Clear form data after saving
        setStep('profile-review');
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Review & Edit Your Profile</h1>
                        <p className="text-muted-foreground mt-2">
                            AI has extracted the following information. Please review and edit as needed.
                        </p>
                    </div>
                </div>

                <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-8 pr-4">
                        {/* Personal Information */}
                        <Section title="Personal Information">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.personal.name}
                                        onChange={(e) => updateField('personal', 'name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={formData.personal.location || ''}
                                        onChange={(e) => updateField('personal', 'location', e.target.value)}
                                    />
                                </div>
                            </div>
                        </Section>

                        {/* Contact Information */}
                        <Section title="Contact Information">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.contact.email || ''}
                                        onChange={(e) => updateField('contact', 'email', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.contact.phone || ''}
                                        onChange={(e) => updateField('contact', 'phone', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="linkedin">LinkedIn</Label>
                                    <Input
                                        id="linkedin"
                                        value={formData.contact.linkedin || ''}
                                        onChange={(e) => updateField('contact', 'linkedin', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="github">GitHub</Label>
                                    <Input
                                        id="github"
                                        value={formData.contact.github || ''}
                                        onChange={(e) => updateField('contact', 'github', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        value={formData.contact.website || ''}
                                        onChange={(e) => updateField('contact', 'website', e.target.value)}
                                    />
                                </div>
                            </div>
                        </Section>

                        {/* Professional Summary */}
                        <Section title="Professional Summary">
                            <Textarea
                                value={formData.summary}
                                onChange={(e) => setLocalFormData(prev => prev ? { ...prev, summary: e.target.value } : null)}
                                rows={4}
                                className="w-full"
                            />
                        </Section>

                        {/* Work Experience */}
                        <Section title="Work Experience">
                            {formData.roles.map((role, idx) => (
                                <div key={role.id} className="border rounded-lg p-4 space-y-4 mb-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Job Title *</Label>
                                            <Input
                                                value={role.title}
                                                onChange={(e) => {
                                                    const newRoles = [...formData.roles];
                                                    newRoles[idx].title = e.target.value;
                                                    setLocalFormData(prev => prev ? { ...prev, roles: newRoles } : null);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label>Company</Label>
                                            <Input
                                                value={role.company || ''}
                                                onChange={(e) => {
                                                    const newRoles = [...formData.roles];
                                                    newRoles[idx].company = e.target.value;
                                                    setLocalFormData(prev => prev ? { ...prev, roles: newRoles } : null);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label>Start Date</Label>
                                            <Input
                                                value={role.startDate || ''}
                                                onChange={(e) => {
                                                    const newRoles = [...formData.roles];
                                                    newRoles[idx].startDate = e.target.value;
                                                    setLocalFormData(prev => prev ? { ...prev, roles: newRoles } : null);
                                                }}
                                                placeholder="YYYY or MM/YYYY"
                                            />
                                        </div>
                                        <div>
                                            <Label>End Date</Label>
                                            <Input
                                                value={role.endDate || ''}
                                                onChange={(e) => {
                                                    const newRoles = [...formData.roles];
                                                    newRoles[idx].endDate = e.target.value;
                                                    setLocalFormData(prev => prev ? { ...prev, roles: newRoles } : null);
                                                }}
                                                placeholder="YYYY or Present"
                                                disabled={role.current}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Textarea
                                            value={role.description}
                                            onChange={(e) => {
                                                const newRoles = [...formData.roles];
                                                newRoles[idx].description = e.target.value;
                                                setLocalFormData(prev => prev ? { ...prev, roles: newRoles } : null);
                                            }}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`current-${role.id}`}
                                            checked={role.current || false}
                                            onChange={(e) => {
                                                const newRoles = [...formData.roles];
                                                newRoles[idx].current = e.target.checked;
                                                if (e.target.checked) newRoles[idx].endDate = undefined;
                                                setLocalFormData(prev => prev ? { ...prev, roles: newRoles } : null);
                                            }}
                                            className="rounded"
                                        />
                                        <Label htmlFor={`current-${role.id}`} className="cursor-pointer">Current Position</Label>
                                    </div>
                                </div>
                            ))}
                        </Section>

                        {/* Education */}
                        <Section title="Education">
                            {formData.education.map((edu, idx) => (
                                <div key={edu.id} className="border rounded-lg p-4 space-y-4 mb-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Degree *</Label>
                                            <Input
                                                value={edu.degree}
                                                onChange={(e) => {
                                                    const newEdu = [...formData.education];
                                                    newEdu[idx].degree = e.target.value;
                                                    setLocalFormData(prev => prev ? { ...prev, education: newEdu } : null);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label>School *</Label>
                                            <Input
                                                value={edu.school}
                                                onChange={(e) => {
                                                    const newEdu = [...formData.education];
                                                    newEdu[idx].school = e.target.value;
                                                    setLocalFormData(prev => prev ? { ...prev, education: newEdu } : null);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label>Field of Study</Label>
                                            <Input
                                                value={edu.field || ''}
                                                onChange={(e) => {
                                                    const newEdu = [...formData.education];
                                                    newEdu[idx].field = e.target.value;
                                                    setLocalFormData(prev => prev ? { ...prev, education: newEdu } : null);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label>GPA</Label>
                                            <Input
                                                value={edu.gpa || ''}
                                                onChange={(e) => {
                                                    const newEdu = [...formData.education];
                                                    newEdu[idx].gpa = e.target.value;
                                                    setLocalFormData(prev => prev ? { ...prev, education: newEdu } : null);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Section>

                        {/* Skills */}
                        <Section title="Skills">
                            <div className="flex flex-wrap gap-2">
                                {formData.skills.map((skill, idx) => (
                                    <div key={skill.id} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
                                        <Input
                                            value={skill.name}
                                            onChange={(e) => {
                                                const newSkills = [...formData.skills];
                                                newSkills[idx].name = e.target.value;
                                                setLocalFormData(prev => prev ? { ...prev, skills: newSkills } : null);
                                            }}
                                            className="border-0 bg-transparent p-0 h-auto w-auto min-w-[100px]"
                                        />
                                        <button
                                            onClick={() => {
                                                const newSkills = formData.skills.filter((_, i) => i !== idx);
                                                setLocalFormData(prev => prev ? { ...prev, skills: newSkills } : null);
                                            }}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const newSkills = [...formData.skills, { id: crypto.randomUUID(), name: '' }];
                                        setLocalFormData(prev => prev ? { ...prev, skills: newSkills } : null);
                                    }}
                                    className="rounded-full"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Skill
                                </Button>
                            </div>
                        </Section>

                        {/* Projects */}
                        {formData.projects.length > 0 && (
                            <Section title="Projects">
                                {formData.projects.map((project, idx) => (
                                    <div key={project.id} className="border rounded-lg p-4 space-y-4 mb-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Project Name *</Label>
                                                <Input
                                                    value={project.name}
                                                    onChange={(e) => {
                                                        const newProjects = [...formData.projects];
                                                        newProjects[idx].name = e.target.value;
                                                        setLocalFormData(prev => prev ? { ...prev, projects: newProjects } : null);
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label>URL</Label>
                                                <Input
                                                    value={project.url || ''}
                                                    onChange={(e) => {
                                                        const newProjects = [...formData.projects];
                                                        newProjects[idx].url = e.target.value;
                                                        setLocalFormData(prev => prev ? { ...prev, projects: newProjects } : null);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Description</Label>
                                            <Textarea
                                                value={project.description}
                                                onChange={(e) => {
                                                    const newProjects = [...formData.projects];
                                                    newProjects[idx].description = e.target.value;
                                                    setLocalFormData(prev => prev ? { ...prev, projects: newProjects } : null);
                                                }}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </Section>
                        )}

                        {/* Bottom Actions */}
                        <div className="flex justify-end gap-4 pt-6 border-t sticky bottom-0 bg-background pb-4">
                            <Button variant="outline" onClick={() => setStep('onboarding-inputs')}>
                                Back
                            </Button>
                            <Button onClick={handleSave} className="gap-2">
                                Save & Continue
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">{title}</h2>
            {children}
        </div>
    );
}
