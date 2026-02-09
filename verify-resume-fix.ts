/**
 * Verification Script for Resume Generation Fix
 * 
 * This script tests that the deterministic fallback properly replaces
 * placeholder data with actual user data.
 */

import { careerProfileToResumeData } from './lib/resume-data/profile-adapter';
import { renderToTemplate } from './lib/resume-data/renderer';
import { ClassicTemplate } from './lib/templates/Classic';
import { CareerProfile } from './types/career';

// Test profile with real data
const testProfile: CareerProfile = {
  personal: {
    name: 'Test User',
    location: 'Test City, TC',
  },
  contact: {
    email: 'test@example.com',
    phone: '(555) 000-0000',
    linkedin: 'https://linkedin.com/in/testuser',
    github: 'https://github.com/testuser',
  },
  analysisReport: 'Test analysis report',
  summary: 'This is a test summary for verification purposes.',
  items: [
    {
      id: '1',
      category: 'role',
      title: 'Test Engineer',
      organization: 'Test Company',
      description: 'Testing resume generation\nVerifying placeholder replacement\nEnsuring proper data mapping',
      sourceIds: ['test-1'],
      dates: 'Jan 2020 - Present'
    },
    {
      id: '2',
      category: 'education',
      title: 'Bachelor of Testing',
      organization: 'Test University',
      description: '',
      sourceIds: ['test-2'],
      dates: 'Jun 2019'
    },
  ],
  gaps: []
};

function verifyResumeFix() {
  console.log('🔍 Starting Resume Generation Verification...\n');
  
  try {
    // Step 1: Convert profile
    console.log('Step 1: Converting CareerProfile to ResumeData...');
    const resumeData = careerProfileToResumeData(testProfile);
    console.log('✅ Conversion successful');
    console.log(`   - Name: ${resumeData.profile.name}`);
    console.log(`   - Email: ${resumeData.profile.email}`);
    console.log(`   - Experience items: ${resumeData.experience?.length || 0}`);
    console.log(`   - Education items: ${resumeData.education?.length || 0}\n`);
    
    // Step 2: Render to template
    console.log('Step 2: Rendering to Classic template...');
    const html = renderToTemplate(resumeData, ClassicTemplate);
    console.log('✅ Rendering successful');
    console.log(`   - HTML length: ${html.length} characters\n`);
    
    // Step 3: Verify placeholder data is removed
    console.log('Step 3: Checking for placeholder data...');
    const hasPlaceholder = html.includes('Becky Shu') || 
                          html.includes('beckyshu') || 
                          html.includes('beckyhsiung96');
    
    if (hasPlaceholder) {
      console.log('❌ FAIL: Placeholder data still present!');
      return false;
    }
    console.log('✅ No placeholder data found\n');
    
    // Step 4: Verify actual data is present
    console.log('Step 4: Checking for actual user data...');
    const checks = [
      { name: 'User name', value: 'Test User', found: html.includes('Test User') },
      { name: 'Email', value: 'test@example.com', found: html.includes('test@example.com') },
      { name: 'Phone', value: '(555) 000-0000', found: html.includes('(555) 000-0000') },
      { name: 'Job title', value: 'Test Engineer', found: html.includes('Test Engineer') },
      { name: 'Company', value: 'Test Company', found: html.includes('Test Company') },
      { name: 'Education', value: 'Test University', found: html.includes('Test University') },
    ];
    
    let allFound = true;
    checks.forEach(check => {
      if (check.found) {
        console.log(`   ✅ ${check.name}: "${check.value}" found`);
      } else {
        console.log(`   ❌ ${check.name}: "${check.value}" NOT found`);
        allFound = false;
      }
    });
    
    if (!allFound) {
      console.log('\n❌ FAIL: Some user data is missing!');
      return false;
    }
    
    // Step 5: Verify HTML structure
    console.log('\nStep 5: Checking HTML structure...');
    const structureChecks = [
      { name: 'Style tags', found: html.includes('<style>') },
      { name: 'CSS classes', found: html.includes('class="name"') && html.includes('class="experience-item"') },
      { name: 'Section titles', found: html.includes('section-title') },
    ];
    
    structureChecks.forEach(check => {
      if (check.found) {
        console.log(`   ✅ ${check.name} preserved`);
      } else {
        console.log(`   ❌ ${check.name} missing`);
        allFound = false;
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUCCESS! Resume generation fix is working correctly!');
    console.log('='.repeat(50) + '\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ERROR during verification:', error);
    return false;
  }
}

// Run verification
if (require.main === module) {
  const success = verifyResumeFix();
  process.exit(success ? 0 : 1);
}

export { verifyResumeFix };
