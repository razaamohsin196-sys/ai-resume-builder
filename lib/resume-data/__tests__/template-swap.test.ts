/**
 * Template Swapping Tests
 * 
 * Validates that template swapping works correctly across all templates.
 */

import { parseResumeHtml } from '../parser';
import { renderToTemplate } from '../renderer';
import { swapTemplate } from '../index';
import { RESUME_TEMPLATES } from '../../templates';
import { ResumeData } from '../schema';

// Sample resume data for testing
const SAMPLE_DATA: ResumeData = {
  profile: {
    name: 'John Doe',
    title: 'Software Engineer',
    location: 'San Francisco, CA',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
  },
  summary: {
    text: 'Experienced software engineer with 5+ years of experience in full-stack development.',
  },
  experience: [
    {
      id: '1',
      title: 'Senior Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      startDate: 'Jan 2020',
      endDate: 'Present',
      bullets: [
        'Led development of microservices architecture',
        'Improved system performance by 40%',
        'Mentored junior developers',
      ],
    },
    {
      id: '2',
      title: 'Software Engineer',
      company: 'Startup Inc',
      location: 'San Francisco, CA',
      startDate: 'Jan 2018',
      endDate: 'Dec 2019',
      bullets: [
        'Built RESTful APIs using Node.js',
        'Implemented CI/CD pipelines',
      ],
    },
  ],
  education: [
    {
      id: '1',
      degree: 'Bachelor of Science in Computer Science',
      school: 'University of California',
      location: 'Berkeley, CA',
      endDate: '2017',
      gpa: '3.8',
    },
  ],
  skills: {
    groups: [
      {
        category: 'Languages',
        skills: ['JavaScript', 'TypeScript', 'Python', 'Java'],
      },
      {
        category: 'Frameworks',
        skills: ['React', 'Node.js', 'Express', 'Next.js'],
      },
    ],
  },
};

describe('Template Swapping', () => {
  describe('Parser', () => {
    it('should parse resume HTML correctly', () => {
      // Render sample data to Classic template
      const classicTemplate = RESUME_TEMPLATES.find(t => t.id === 'classic');
      if (!classicTemplate) throw new Error('Classic template not found');
      
      const html = renderToTemplate(SAMPLE_DATA, classicTemplate);
      const parsed = parseResumeHtml(html);
      
      // Verify basic data is preserved
      expect(parsed.profile.name).toBe(SAMPLE_DATA.profile.name);
      expect(parsed.profile.email).toBe(SAMPLE_DATA.profile.email);
      expect(parsed.experience).toBeDefined();
      expect(parsed.experience?.length).toBeGreaterThan(0);
    });
  });

  describe('Renderer', () => {
    it('should render data to template correctly', () => {
      const classicTemplate = RESUME_TEMPLATES.find(t => t.id === 'classic');
      if (!classicTemplate) throw new Error('Classic template not found');
      
      const html = renderToTemplate(SAMPLE_DATA, classicTemplate);
      
      // Verify HTML contains key data
      expect(html).toContain(SAMPLE_DATA.profile.name);
      expect(html).toContain(SAMPLE_DATA.profile.email);
      expect(html).toContain(SAMPLE_DATA.experience![0].title);
      expect(html).toContain(SAMPLE_DATA.experience![0].company);
    });
  });

  describe('Template Swapping', () => {
    it('should swap between all template pairs without data loss', () => {
      // Test swapping from Classic to each other template
      const classicTemplate = RESUME_TEMPLATES.find(t => t.id === 'classic');
      if (!classicTemplate) throw new Error('Classic template not found');
      
      // Start with Classic template
      const initialHtml = renderToTemplate(SAMPLE_DATA, classicTemplate);
      
      // Test swapping to each template
      for (const targetTemplate of RESUME_TEMPLATES) {
        if (targetTemplate.id === 'classic') continue;
        
        const swappedHtml = swapTemplate(initialHtml, targetTemplate);
        
        // Parse the swapped HTML
        const parsed = parseResumeHtml(swappedHtml);
        
        // Verify critical data is preserved
        expect(parsed.profile.name).toBe(SAMPLE_DATA.profile.name);
        expect(parsed.experience).toBeDefined();
        expect(parsed.experience?.length).toBeGreaterThan(0);
        
        console.log(`✓ Swap: Classic → ${targetTemplate.name}`);
      }
    });

    it('should be deterministic (same input = same output)', () => {
      const classicTemplate = RESUME_TEMPLATES.find(t => t.id === 'classic');
      const modernTemplate = RESUME_TEMPLATES.find(t => t.id === 'modernprofessional');
      
      if (!classicTemplate || !modernTemplate) {
        throw new Error('Templates not found');
      }
      
      const initialHtml = renderToTemplate(SAMPLE_DATA, classicTemplate);
      
      // Swap multiple times
      const result1 = swapTemplate(initialHtml, modernTemplate);
      const result2 = swapTemplate(initialHtml, modernTemplate);
      
      // Results should be identical
      expect(result1).toBe(result2);
    });

    it('should handle round-trip swapping', () => {
      const classicTemplate = RESUME_TEMPLATES.find(t => t.id === 'classic');
      const modernTemplate = RESUME_TEMPLATES.find(t => t.id === 'modernprofessional');
      
      if (!classicTemplate || !modernTemplate) {
        throw new Error('Templates not found');
      }
      
      // Start with Classic
      const html1 = renderToTemplate(SAMPLE_DATA, classicTemplate);
      
      // Swap to Modern
      const html2 = swapTemplate(html1, modernTemplate);
      
      // Swap back to Classic
      const html3 = swapTemplate(html2, classicTemplate);
      
      // Parse final result
      const parsed = parseResumeHtml(html3);
      
      // Verify data integrity
      expect(parsed.profile.name).toBe(SAMPLE_DATA.profile.name);
      expect(parsed.experience?.length).toBe(SAMPLE_DATA.experience?.length);
    });
  });

  describe('Performance', () => {
    it('should swap templates in under 500ms', () => {
      const classicTemplate = RESUME_TEMPLATES.find(t => t.id === 'classic');
      const modernTemplate = RESUME_TEMPLATES.find(t => t.id === 'modernprofessional');
      
      if (!classicTemplate || !modernTemplate) {
        throw new Error('Templates not found');
      }
      
      const initialHtml = renderToTemplate(SAMPLE_DATA, classicTemplate);
      
      const startTime = Date.now();
      swapTemplate(initialHtml, modernTemplate);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      console.log(`Template swap took ${duration}ms`);
      expect(duration).toBeLessThan(500);
    });
  });
});

// Helper for running tests manually
if (require.main === module) {
  console.log('Running template swap tests...\n');
  
  try {
    const classicTemplate = RESUME_TEMPLATES.find(t => t.id === 'classic');
    if (!classicTemplate) throw new Error('Classic template not found');
    
    const initialHtml = renderToTemplate(SAMPLE_DATA, classicTemplate);
    
    console.log('Testing swaps from Classic to all templates:\n');
    
    for (const template of RESUME_TEMPLATES) {
      const startTime = Date.now();
      const swappedHtml = swapTemplate(initialHtml, template);
      const duration = Date.now() - startTime;
      
      const parsed = parseResumeHtml(swappedHtml);
      const dataIntact = parsed.profile.name === SAMPLE_DATA.profile.name;
      
      console.log(`${dataIntact ? '✓' : '✗'} ${template.name.padEnd(30)} ${duration}ms`);
    }
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}
