/**
 * Integration test for resume generation with deterministic fallback
 */

import { careerProfileToResumeData } from '../profile-adapter';
import { renderToTemplate } from '../renderer';
import { ClassicTemplate } from '@/lib/templates/Classic';
import { CareerProfile } from '@/types/career';

describe('Resume Generation Integration', () => {
  const mockProfile: CareerProfile = {
    personal: {
      name: 'Alice Johnson',
      location: 'New York, NY',
    },
    contact: {
      email: 'alice@example.com',
      phone: '(555) 123-4567',
      linkedin: 'https://linkedin.com/in/alicejohnson',
      github: 'https://github.com/alicejohnson',
    },
    analysisReport: 'Test analysis',
    summary: 'Experienced Product Manager with 8+ years driving innovative solutions.',
    items: [
      {
        id: '1',
        category: 'role',
        title: 'Senior Product Manager',
        organization: 'Tech Corp',
        description: 'Led product strategy\nIncreased user engagement by 40%\nManaged cross-functional teams',
        sourceIds: ['source1'],
        dates: 'Jan 2021 - Present'
      },
      {
        id: '2',
        category: 'role',
        title: 'Product Manager',
        organization: 'StartupCo',
        description: 'Launched 5 new features\nImproved customer satisfaction',
        sourceIds: ['source1'],
        dates: 'Jan 2018 - Dec 2020'
      },
      {
        id: '3',
        category: 'education',
        title: 'MBA',
        organization: 'Harvard Business School',
        description: '',
        sourceIds: ['source2'],
        dates: 'Jun 2017'
      },
      {
        id: '4',
        category: 'skill',
        title: 'Product Strategy',
        organization: undefined,
        description: '',
        sourceIds: ['source3']
      },
      {
        id: '5',
        category: 'skill',
        title: 'Agile Development',
        organization: undefined,
        description: '',
        sourceIds: ['source3']
      },
    ],
    gaps: []
  };

  it('should generate resume with actual data, not placeholder', () => {
    // Convert profile to resume data
    const resumeData = careerProfileToResumeData(mockProfile);
    
    // Render to classic template
    const html = renderToTemplate(resumeData, ClassicTemplate);
    
    // Verify placeholder data is NOT present
    expect(html).not.toContain('Becky Shu');
    expect(html).not.toContain('beckyshu');
    expect(html).not.toContain('beckyhsiung96');
    
    // Verify actual data IS present
    expect(html).toContain('Alice Johnson');
    expect(html).toContain('alice@example.com');
    expect(html).toContain('Senior Product Manager');
    expect(html).toContain('Tech Corp');
    expect(html).toContain('Harvard Business School');
    expect(html).toContain('Product Strategy');
  });

  it('should properly replace contact information', () => {
    const resumeData = careerProfileToResumeData(mockProfile);
    const html = renderToTemplate(resumeData, ClassicTemplate);
    
    // Check email is replaced
    expect(html).toContain('alice@example.com');
    expect(html).toContain('mailto:alice@example.com');
    
    // Check phone is replaced
    expect(html).toContain('(555) 123-4567');
    
    // Check LinkedIn is replaced
    expect(html).toContain('linkedin.com/in/alicejohnson');
  });

  it('should replace all experience items', () => {
    const resumeData = careerProfileToResumeData(mockProfile);
    const html = renderToTemplate(resumeData, ClassicTemplate);
    
    // Both roles should be present
    expect(html).toContain('Senior Product Manager');
    expect(html).toContain('Tech Corp');
    expect(html).toContain('Product Manager');
    expect(html).toContain('StartupCo');
    
    // Verify bullets are present
    expect(html).toContain('Led product strategy');
    expect(html).toContain('Launched 5 new features');
  });

  it('should handle profile with minimal data', () => {
    const minimalProfile: CareerProfile = {
      personal: {
        name: 'Bob Smith',
      },
      analysisReport: 'Test',
      summary: 'Software engineer',
      items: [],
      gaps: []
    };
    
    const resumeData = careerProfileToResumeData(minimalProfile);
    const html = renderToTemplate(resumeData, ClassicTemplate);
    
    // Should have the name
    expect(html).toContain('Bob Smith');
    
    // Should not have placeholder data
    expect(html).not.toContain('Becky Shu');
  });

  it('should preserve HTML structure and CSS classes', () => {
    const resumeData = careerProfileToResumeData(mockProfile);
    const html = renderToTemplate(resumeData, ClassicTemplate);
    
    // Check that key CSS classes are still present
    expect(html).toContain('class="name"');
    expect(html).toContain('class="contact-info"');
    expect(html).toContain('class="experience-item"');
    expect(html).toContain('class="education-item"');
    expect(html).toContain('class="section-title"');
    
    // Check that style tags are preserved
    expect(html).toContain('<style>');
    expect(html).toContain('font-family: Arial, sans-serif');
  });
});
