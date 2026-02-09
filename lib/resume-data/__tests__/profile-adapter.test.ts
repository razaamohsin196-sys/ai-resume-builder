/**
 * Test profile adapter functionality
 */

import { careerProfileToResumeData } from '../profile-adapter';
import { CareerProfile } from '@/types/career';

describe('Profile Adapter', () => {
  const mockProfile: CareerProfile = {
    personal: {
      name: 'John Doe',
      location: 'San Francisco, CA',
      photos: ['https://example.com/photo.jpg']
    },
    contact: {
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      website: 'https://johndoe.com'
    },
    analysisReport: 'Test analysis',
    summary: 'Experienced software engineer with 10+ years in full-stack development.',
    items: [
      {
        id: '1',
        category: 'role',
        title: 'Senior Software Engineer',
        organization: 'Tech Company Inc.',
        description: 'Led development of key features\nImproved system performance by 50%\nMentored junior developers',
        sourceIds: ['source1'],
        dates: 'Jan 2020 - Present'
      },
      {
        id: '2',
        category: 'education',
        title: 'Bachelor of Science in Computer Science',
        organization: 'Stanford University',
        description: 'Graduated with honors',
        sourceIds: ['source2'],
        dates: 'Jun 2015'
      },
      {
        id: '3',
        category: 'skill',
        title: 'JavaScript',
        organization: undefined,
        description: 'Expert level',
        sourceIds: ['source3']
      },
      {
        id: '4',
        category: 'project',
        title: 'Open Source Library',
        organization: 'Personal',
        description: 'Built a popular React component library',
        sourceIds: ['source4']
      }
    ],
    gaps: []
  };

  it('should convert CareerProfile to ResumeData', () => {
    const result = careerProfileToResumeData(mockProfile);
    
    // Check profile section
    expect(result.profile.name).toBe('John Doe');
    expect(result.profile.email).toBe('john.doe@example.com');
    expect(result.profile.location).toBe('San Francisco, CA');
    
    // Check summary
    expect(result.summary?.text).toBe('Experienced software engineer with 10+ years in full-stack development.');
    
    // Check experience
    expect(result.experience).toHaveLength(1);
    expect(result.experience?.[0].title).toBe('Senior Software Engineer');
    expect(result.experience?.[0].company).toBe('Tech Company Inc.');
    expect(result.experience?.[0].startDate).toBe('Jan 2020');
    expect(result.experience?.[0].endDate).toBe('Present');
    expect(result.experience?.[0].bullets).toHaveLength(3);
    
    // Check education
    expect(result.education).toHaveLength(1);
    expect(result.education?.[0].degree).toBe('Bachelor of Science in Computer Science');
    expect(result.education?.[0].school).toBe('Stanford University');
    
    // Check skills
    expect(result.skills?.items).toContain('JavaScript');
    
    // Check projects
    expect(result.projects).toHaveLength(1);
    expect(result.projects?.[0].title).toBe('Open Source Library');
  });

  it('should handle missing contact information', () => {
    const minimalProfile: CareerProfile = {
      personal: {
        name: 'Jane Smith'
      },
      analysisReport: 'Test',
      summary: 'Test summary',
      items: [],
      gaps: []
    };
    
    const result = careerProfileToResumeData(minimalProfile);
    
    expect(result.profile.name).toBe('Jane Smith');
    expect(result.profile.email).toBeUndefined();
    expect(result.profile.phone).toBeUndefined();
  });

  it('should parse date ranges correctly', () => {
    const profileWithDates: CareerProfile = {
      ...mockProfile,
      items: [
        {
          id: '1',
          category: 'role',
          title: 'Developer',
          organization: 'Company',
          description: 'Work',
          sourceIds: ['s1'],
          dates: 'Jan 2018 - Dec 2020'
        }
      ]
    };
    
    const result = careerProfileToResumeData(profileWithDates);
    
    expect(result.experience?.[0].startDate).toBe('Jan 2018');
    expect(result.experience?.[0].endDate).toBe('Dec 2020');
  });

  it('should handle multiple bullets in description', () => {
    const profileWithBullets: CareerProfile = {
      ...mockProfile,
      items: [
        {
          id: '1',
          category: 'role',
          title: 'Developer',
          organization: 'Company',
          description: '• Built features\n• Fixed bugs\n• Wrote tests',
          sourceIds: ['s1']
        }
      ]
    };
    
    const result = careerProfileToResumeData(profileWithBullets);
    
    expect(result.experience?.[0].bullets.length).toBeGreaterThan(0);
  });
});
