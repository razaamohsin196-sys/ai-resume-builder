"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Briefcase, GraduationCap, Award, Languages, BookOpen, Heart, Sparkles, Loader2, Trophy, FileText } from 'lucide-react';
import { SectionType, ResumeData } from '@/lib/resume-data/schema';
import { getMissingSections, injectSection } from '@/lib/resume-data/section-injector';
import { parseResumeHtml } from '@/lib/resume-data/parser';
import { loadCareerProfileResumeData, loadResumeEditsData, saveResumeEditsData } from '@/lib/resume-data/profile-adapter';
import { ResumeTemplate } from '@/lib/templates/types';
import { cn } from '@/lib/utils';

interface SectionManagerProps {
  currentHtml: string;
  template: ResumeTemplate;
  onHtmlChange: (html: string) => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  isEditing?: boolean;
}

interface SectionOption {
  type: SectionType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SECTION_OPTIONS: SectionOption[] = [
  {
    type: 'projects',
    label: 'Projects',
    description: 'Showcase your work and achievements',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  },
  {
    type: 'certifications',
    label: 'Certifications',
    description: 'Professional credentials and licenses',
    icon: Award,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  },
  {
    type: 'languages',
    label: 'Languages',
    description: 'Language proficiencies',
    icon: Languages,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  },
  {
    type: 'training',
    label: 'Training & Courses',
    description: 'Additional education and training',
    icon: BookOpen,
    color: 'text-green-600 bg-green-50 dark:bg-green-950',
  },
  {
    type: 'volunteering',
    label: 'Volunteering',
    description: 'Community service and involvement',
    icon: Heart,
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950',
  },
  {
    type: 'awards',
    label: 'Awards',
    description: 'Honors and achievements',
    icon: Trophy,
    color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
  },
  {
    type: 'publications',
    label: 'Publications',
    description: 'Published works and papers',
    icon: FileText,
    color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950',
  },
  {
    type: 'custom',
    label: 'Custom Section',
    description: 'Add any custom content',
    icon: Sparkles,
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950',
  },
];

/**
 * Pick the relevant section data from career profile ResumeData
 * for the section type being injected.
 */
function pickSectionData(careerData: ResumeData, sectionType: SectionType): Partial<ResumeData> {
  switch (sectionType) {
    case 'projects':
      return careerData.projects ? { projects: careerData.projects } : {};
    case 'certifications':
      return careerData.certifications ? { certifications: careerData.certifications } : {};
    case 'languages':
      return careerData.languages ? { languages: careerData.languages } : {};
    case 'training':
      return careerData.training ? { training: careerData.training } : {};
    case 'volunteering':
      return careerData.volunteering ? { volunteering: careerData.volunteering } : {};
    case 'awards':
      return careerData.awards ? { awards: careerData.awards } : {};
    case 'publications':
      return careerData.publications ? { publications: careerData.publications } : {};
    case 'skills':
      return careerData.skills ? { skills: careerData.skills } : {};
    case 'experience':
      return careerData.experience ? { experience: careerData.experience } : {};
    case 'education':
      return careerData.education ? { education: careerData.education } : {};
    case 'summary':
      return careerData.summary ? { summary: careerData.summary } : {};
    default:
      return {};
  }
}

export function SectionManager({ currentHtml, template, onHtmlChange, iframeRef, isEditing = true }: SectionManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSection = async (sectionType: SectionType) => {
    setIsAdding(true);
    try {
      // Parse current HTML data
      const parsedData = parseResumeHtml(currentHtml);
      
      // Load saved edits data (accumulated across template switches)
      const editsData = loadResumeEditsData();
      // Load career profile data (original data from profile generation)
      const careerData = loadCareerProfileResumeData();
      
      // Merge: edits data takes priority over career data for the section being added
      const bestFallback = editsData || careerData;
      const data: ResumeData = bestFallback
        ? { ...parsedData, ...pickSectionData(bestFallback, sectionType) }
        : parsedData;
      
      // Inject the new section
      const { html: newHtml, sectionId } = injectSection(currentHtml, sectionType, data, template);
      
      // Persist the merged data to localStorage so edits survive template switches
      try {
        const updatedData = parseResumeHtml(newHtml);
        const prevEdits = loadResumeEditsData();
        // Merge: keep all previous edits, overlay with new parsed data
        const merged = prevEdits
          ? { ...prevEdits, ...updatedData, profile: { ...(prevEdits.profile || {}), ...updatedData.profile } }
          : updatedData;
        saveResumeEditsData(merged);
      } catch (_) { /* non-critical */ }
      
      // Update HTML
      onHtmlChange(newHtml);
      setIsOpen(false);
      
      // Scroll to the new section after a short delay to allow DOM update
      setTimeout(() => {
        if (iframeRef?.current && sectionId) {
          const iframeDoc = iframeRef.current.contentDocument;
          if (iframeDoc) {
            const newSection = iframeDoc.getElementById(sectionId);
            if (newSection) {
              newSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              
              // Add a highlight animation
              newSection.style.transition = 'background-color 0.6s ease';
              newSection.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              
              setTimeout(() => {
                newSection.style.backgroundColor = '';
              }, 1500);
            }
          }
        }
      }, 300);
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to add section. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
          disabled={!isEditing}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline-block">Add Section</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 overflow-hidden" 
        align="start"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b bg-muted/50">
          <h3 className="font-semibold text-sm">Add Section</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose a section to add to your resume
          </p>
        </div>

        {/* Section Options */}
        <div className="p-2 max-h-[400px] overflow-y-auto">
          <div className="space-y-1">
            {SECTION_OPTIONS.map((option, index) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.type}
                  onClick={() => handleAddSection(option.type)}
                  disabled={isAdding}
                  className={cn(
                    "w-full text-left rounded-lg p-3 transition-all duration-200",
                    "hover:bg-accent hover:shadow-sm hover:scale-[1.02]",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                    "group relative overflow-hidden",
                    "animate-in fade-in slide-in-from-top-2"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "p-2 rounded-md shrink-0 transition-transform group-hover:scale-110",
                      option.color
                    )}>
                      {isAdding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-0.5 group-hover:text-primary transition-colors">
                        {option.label}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {option.description}
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
          💡 Tip: You can add multiple sections of the same type
        </div>
      </PopoverContent>
    </Popover>
  );
}
