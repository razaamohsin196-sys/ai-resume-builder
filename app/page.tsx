"use client";

import { useCareer } from "@/context/CareerContext";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { IntentForm } from "@/components/onboarding/IntentForm";
import { InputDropzone } from "@/components/onboarding/InputDropzone";
import { ProcessingView } from "@/components/processing/ProcessingView";
// placeholders for now
import { ProfileReview } from "@/components/main/ProfileReview";
import { ResumeDraftView } from "@/components/main/ResumeDraftView";
import { InterviewPrepView } from "@/components/interview/InterviewPrepView";
import { ResumeEditor } from "@/components/editor/ResumeEditor";
import { KUSE_RESUME_TEMPLATE } from "@/lib/templates/kuseResume";

export default function Home() {
  const { step, resetSession } = useCareer();

  return (
    <main className="min-h-screen bg-background text-foreground relative">
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => {
            if (confirm("Start over? This will clear your session.")) {
              resetSession();
            }
          }}
          className="text-xs text-muted-foreground hover:text-destructive underline"
        >
          Reset Session
        </button>
      </div>
      {step === 'onboarding-intent' && (
        <OnboardingLayout
          title="What is your career goal?"
          description="We'll use this as a lens to filter your experience."
        >
          <IntentForm />
        </OnboardingLayout>
      )}

      {step === 'onboarding-inputs' && (
        <OnboardingLayout
          title="Share your work"
          description="Dump your messy files, links, and notes. We'll sort it out."
        >
          <InputDropzone />
        </OnboardingLayout>
      )}

      {step === 'processing' && <ProcessingView />}
      {step === 'profile-review' && <ProfileReview />}
      {step === 'resume-draft' && <ResumeDraftView />}
      {step === 'resume-editor' && <ResumeEditor initialHtml={KUSE_RESUME_TEMPLATE} />}
      {step === 'interview-prep' && <InterviewPrepView />}
    </main>
  );
}
