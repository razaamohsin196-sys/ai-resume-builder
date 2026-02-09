/**
 * Template CSS Class Analyzer
 * 
 * Analyzes all templates to extract CSS classes used for each section.
 * This helps ensure the renderer has all necessary selectors.
 */

import { RESUME_TEMPLATES } from './lib/templates';
import { parseHtmlToDOM } from './lib/resume-data/utils';

interface TemplateAnalysis {
  templateId: string;
  templateName: string;
  classes: {
    name: string[];
    contactInfo: string[];
    summary: string[];
    experienceSection: string[];
    experienceItem: string[];
    jobTitle: string[];
    company: string[];
    educationSection: string[];
    educationItem: string[];
    school: string[];
    degree: string[];
    skillsSection: string[];
    skillsGroup: string[];
    skillsList: string[];
  };
}

function analyzeTemplate(templateHtml: string, templateId: string, templateName: string): TemplateAnalysis {
  const doc = parseHtmlToDOM(templateHtml);
  
  const analysis: TemplateAnalysis = {
    templateId,
    templateName,
    classes: {
      name: [],
      contactInfo: [],
      summary: [],
      experienceSection: [],
      experienceItem: [],
      jobTitle: [],
      company: [],
      educationSection: [],
      educationItem: [],
      school: [],
      degree: [],
      skillsSection: [],
      skillsGroup: [],
      skillsList: [],
    }
  };
  
  // Find name elements
  const nameElements = doc.querySelectorAll('.name, h1, .profile-name, [class*="name"]');
  nameElements.forEach(el => {
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.includes('kgp'));
      analysis.classes.name.push(...classes);
    }
  });
  
  // Find contact info section
  const contactElements = doc.querySelectorAll('.contact-info, .contact, .header-info');
  contactElements.forEach(el => {
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.includes('kgp'));
      analysis.classes.contactInfo.push(...classes);
    }
  });
  
  // Find summary section
  const summaryElements = doc.querySelectorAll('.summary, .about, .profile-summary, [class*="summary"], [class*="about"]');
  summaryElements.forEach(el => {
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.includes('kgp'));
      analysis.classes.summary.push(...classes);
    }
  });
  
  // Find experience items
  const experienceItems = doc.querySelectorAll('.experience-item, .job, .timeline-item, .work-item, .two-col-section');
  experienceItems.forEach(el => {
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.includes('kgp'));
      analysis.classes.experienceItem.push(...classes);
    }
  });
  
  // Find job titles
  const jobTitles = doc.querySelectorAll('.job-title, .position, .role, .title');
  jobTitles.forEach(el => {
    if (el.className && !el.classList.contains('section-title')) {
      const classes = el.className.split(' ').filter(c => c && !c.includes('kgp'));
      analysis.classes.jobTitle.push(...classes);
    }
  });
  
  // Find company names
  const companies = doc.querySelectorAll('.company, .company-name, .organization, .company-location');
  companies.forEach(el => {
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.includes('kgp'));
      analysis.classes.company.push(...classes);
    }
  });
  
  // Find education items
  const educationItems = doc.querySelectorAll('.education-item, .school, .academic-item');
  educationItems.forEach(el => {
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.includes('kgp'));
      analysis.classes.educationItem.push(...classes);
    }
  });
  
  // Find school names
  const schools = doc.querySelectorAll('.school-name, .university, .institution');
  schools.forEach(el => {
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.includes('kgp'));
      analysis.classes.school.push(...classes);
    }
  });
  
  // Find degrees
  const degrees = doc.querySelectorAll('.degree, .degree-info, .major');
  degrees.forEach(el => {
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.includes('kgp'));
      analysis.classes.degree.push(...classes);
    }
  });
  
  // Find skills groups
  const skillsGroups = doc.querySelectorAll('.skills-group, .skill-group, .skills-grid');
  skillsGroups.forEach(el => {
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.includes('kgp'));
      analysis.classes.skillsGroup.push(...classes);
    }
  });
  
  // Find skills lists
  const skillsLists = doc.querySelectorAll('.skills-list, .skills, .expertise-list');
  skillsLists.forEach(el => {
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.includes('kgp'));
      analysis.classes.skillsList.push(...classes);
    }
  });
  
  // Remove duplicates
  Object.keys(analysis.classes).forEach(key => {
    analysis.classes[key as keyof typeof analysis.classes] = 
      [...new Set(analysis.classes[key as keyof typeof analysis.classes])];
  });
  
  return analysis;
}

function analyzeAllTemplates() {
  console.log('🔍 Analyzing all templates...\n');
  console.log('=' .repeat(80));
  
  const allAnalyses: TemplateAnalysis[] = [];
  
  RESUME_TEMPLATES.forEach(template => {
    console.log(`\n📄 Template: ${template.name} (${template.id})`);
    console.log('-'.repeat(80));
    
    const analysis = analyzeTemplate(template.html, template.id, template.name);
    allAnalyses.push(analysis);
    
    // Print findings
    Object.entries(analysis.classes).forEach(([section, classes]) => {
      if (classes.length > 0) {
        console.log(`  ${section}: ${classes.join(', ')}`);
      }
    });
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY: Unique CSS Classes Across All Templates\n');
  
  // Aggregate all unique classes
  const allClasses: Record<string, Set<string>> = {
    name: new Set(),
    contactInfo: new Set(),
    summary: new Set(),
    experienceItem: new Set(),
    jobTitle: new Set(),
    company: new Set(),
    educationItem: new Set(),
    school: new Set(),
    degree: new Set(),
    skillsGroup: new Set(),
    skillsList: new Set(),
  };
  
  allAnalyses.forEach(analysis => {
    Object.entries(analysis.classes).forEach(([section, classes]) => {
      if (allClasses[section]) {
        classes.forEach(cls => allClasses[section].add(cls));
      }
    });
  });
  
  // Print aggregated results
  Object.entries(allClasses).forEach(([section, classes]) => {
    if (classes.size > 0) {
      console.log(`${section}:`);
      console.log(`  [${Array.from(classes).map(c => `'${c}'`).join(', ')}]`);
      console.log();
    }
  });
  
  console.log('='.repeat(80));
  
  return allAnalyses;
}

// Run analysis
if (require.main === module) {
  analyzeAllTemplates();
}

export { analyzeAllTemplates, analyzeTemplate };
