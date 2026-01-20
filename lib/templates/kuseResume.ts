
import { ResumeTemplate } from './types';

const html = `
<style>

        :root {
            --page-margin: 10mm;
            --page-width: 210mm;
            --page-height: 297mm;
            --body-font-size: 14px;
            --name-font-size: 26px;
            --section-title-size: 18px;
            --job-title-size: 15px;
            --job-date-size: 14px;
            --line-height: 1.08;
            --header-margin-bottom: 9px;
            --section-spacing: 10px;
            --section-title-margin: 4px;
            --experience-item-spacing: 7px;
            --job-header-margin: 2px;
            --company-margin: 3px;
            --bullet-spacing: 1.5px;
            --education-item-spacing: 5px;
            --skills-group-spacing: 3px;
            --bullet-indent: 14px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 0mm; /* Set to 0 to hide browser headers/footers */
        }

        body {
            font-family: Arial, sans-serif;
            font-size: var(--body-font-size);
            line-height: var(--line-height);
            color: #000000;
            background: white;
            width: var(--page-width);
            min-height: var(--page-height);
            max-height: var(--page-height);
            margin: 0 auto;
            padding: var(--page-margin);
            position: relative;
            display: flex;
            flex-direction: column;
        }

        @media print {
            body {
                width: 100%;
                margin: 0;
                padding: var(--page-margin);
                font-size: var(--body-font-size);
            }
            .section {
                page-break-inside: avoid;
            }
            .experience-item {
                page-break-inside: avoid;
            }
            .education-item {
                page-break-inside: avoid;
            }
        }

        .header {
            text-align: center;
            margin-bottom: var(--header-margin-bottom);
            flex-shrink: 0;
        }

        .name {
            font-size: var(--name-font-size);
            font-weight: bold;
            margin-bottom: 3px;
            text-transform: uppercase;
        }

        .contact-info {
            font-size: var(--body-font-size);
            margin-bottom: var(--header-margin-bottom);
        }

        .contact-info span {
            margin: 0 4px;
        }

        .section {
            margin-bottom: var(--section-spacing);
            flex-shrink: 1;
        }

        .section:last-of-type {
            flex-grow: 0;
            margin-bottom: 0;
        }

        .section-title {
            font-size: var(--section-title-size);
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            margin-bottom: var(--section-title-margin);
            padding-bottom: 1px;
        }

        .summary {
            text-align: justify;
            line-height: var(--line-height);
        }

        .skills-group {
            margin-bottom: var(--skills-group-spacing);
        }

        .skills-category {
            font-weight: bold;
            display: inline;
        }

        .skills-list {
            display: inline;
            margin-left: 5px;
        }

        .experience-item {
            margin-bottom: var(--experience-item-spacing);
        }

        .experience-item:last-child {
            margin-bottom: 0;
        }

        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: var(--job-header-margin);
        }

        .job-title {
            font-weight: bold;
            font-size: var(--job-title-size);
        }

        .job-date {
            font-weight: bold;
            font-size: var(--job-date-size);
        }

        .company-location {
            font-style: italic;
            margin-bottom: var(--company-margin);
            color: #333;
        }

        .achievements {
            list-style: none;
            margin-left: var(--bullet-indent);
        }

        .achievements li {
            position: relative;
            margin-bottom: var(--bullet-spacing);
            line-height: var(--line-height);
        }

        .achievements li:last-child {
            margin-bottom: 0;
        }

        .achievements li:before {
            content: "•";
            position: absolute;
            left: calc(-1 * var(--bullet-indent));
            font-weight: bold;
        }

        .education-item {
            margin-bottom: var(--education-item-spacing);
        }

        .education-item:last-child {
            margin-bottom: 0;
        }

        .education-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .school-name {
            font-weight: bold;
        }

        .education-date {
            font-weight: bold;
        }

        .degree-info {
            font-style: italic;
            color: #333;
        }

        @media screen and (max-width: 768px) {
            body {
                width: 100%;
                padding: 10mm;
            }
            .job-header {
                flex-direction: column;
                align-items: flex-start;
            }
            .education-header {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    

  [data-kgp-selected]::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 4px;
    border-radius: 4px;
    outline: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 10px rgba(255, 107, 53, 0.4) !important;
    z-index: 10000;
    pointer-events: none;
  }

  [data-kgp-selected] {
    position: relative;
    outline: none;
    cursor: default;
  }

  img[data-kgp-selected],
  img[data-kgp-hover-selected],
  [data-kgp-hover-selected],
  [item-kgp-click-selected],
  [item-kgp-selected] {
    border: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 15px rgba(255, 107, 53, 0.5) !important;
    border-radius: 4px;
  }

  [data-kgp-hover-selected]::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 2px;
    border-radius: 4px;
    outline: 2px solid #FFA366 !important;
    box-shadow: 0 0 0 1px rgba(255, 163, 102, 0.3), 0 0 8px rgba(255, 163, 102, 0.4) !important;
    z-index: 9999;
    pointer-events: none;
  }

  [data-kgp-hover-selected] {
    position: relative;
    outline: none;
  }


  [data-kgp-selected]::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 4px;
    border-radius: 4px;
    outline: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 10px rgba(255, 107, 53, 0.4) !important;
    z-index: 10000;
    pointer-events: none;
  }

  [data-kgp-selected] {
    position: relative;
    outline: none;
    cursor: default;
  }

  img[data-kgp-selected],
  img[data-kgp-hover-selected],
  [data-kgp-hover-selected],
  [item-kgp-click-selected],
  [item-kgp-selected] {
    border: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 15px rgba(255, 107, 53, 0.5) !important;
    border-radius: 4px;
  }

  [data-kgp-hover-selected]::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 2px;
    border-radius: 4px;
    outline: 2px solid #FFA366 !important;
    box-shadow: 0 0 0 1px rgba(255, 163, 102, 0.3), 0 0 8px rgba(255, 163, 102, 0.4) !important;
    z-index: 9999;
    pointer-events: none;
  }

  [data-kgp-hover-selected] {
    position: relative;
    outline: none;
  }


  [data-kgp-selected]::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 4px;
    border-radius: 4px;
    outline: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 10px rgba(255, 107, 53, 0.4) !important;
    z-index: 10000;
    pointer-events: none;
  }

  [data-kgp-selected] {
    position: relative;
    outline: none;
    cursor: default;
  }

  img[data-kgp-selected],
  img[data-kgp-hover-selected],
  [data-kgp-hover-selected],
  [item-kgp-click-selected],
  [item-kgp-selected] {
    border: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 15px rgba(255, 107, 53, 0.5) !important;
    border-radius: 4px;
  }

  [data-kgp-hover-selected]::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 2px;
    border-radius: 4px;
    outline: 2px solid #FFA366 !important;
    box-shadow: 0 0 0 1px rgba(255, 163, 102, 0.3), 0 0 8px rgba(255, 163, 102, 0.4) !important;
    z-index: 9999;
    pointer-events: none;
  }

  [data-kgp-hover-selected] {
    position: relative;
    outline: none;
  }


  [data-kgp-selected]::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 4px;
    border-radius: 4px;
    outline: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 10px rgba(255, 107, 53, 0.4) !important;
    z-index: 10000;
    pointer-events: none;
  }

  [data-kgp-selected] {
    position: relative;
    outline: none;
    cursor: default;
  }

  img[data-kgp-selected],
  img[data-kgp-hover-selected],
  [data-kgp-hover-selected],
  [item-kgp-click-selected],
  [item-kgp-selected] {
    border: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 15px rgba(255, 107, 53, 0.5) !important;
    border-radius: 4px;
  }

  [data-kgp-hover-selected]::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 2px;
    border-radius: 4px;
    outline: 2px solid #FFA366 !important;
    box-shadow: 0 0 0 1px rgba(255, 163, 102, 0.3), 0 0 8px rgba(255, 163, 102, 0.4) !important;
    z-index: 9999;
    pointer-events: none;
  }

  [data-kgp-hover-selected] {
    position: relative;
    outline: none;
  }


  [data-kgp-selected]::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 4px;
    border-radius: 4px;
    outline: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 10px rgba(255, 107, 53, 0.4) !important;
    z-index: 10000;
    pointer-events: none;
  }

  [data-kgp-selected] {
    position: relative;
    outline: none;
    cursor: default;
  }

  img[data-kgp-selected],
  img[data-kgp-hover-selected],
  [data-kgp-hover-selected],
  [item-kgp-click-selected],
  [item-kgp-selected] {
    border: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 15px rgba(255, 107, 53, 0.5) !important;
    border-radius: 4px;
  }

  [data-kgp-hover-selected]::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 2px;
    border-radius: 4px;
    outline: 2px solid #FFA366 !important;
    box-shadow: 0 0 0 1px rgba(255, 163, 102, 0.3), 0 0 8px rgba(255, 163, 102, 0.4) !important;
    z-index: 9999;
    pointer-events: none;
  }

  [data-kgp-hover-selected] {
    position: relative;
    outline: none;
  }


  [data-kgp-selected]::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 4px;
    border-radius: 4px;
    outline: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 10px rgba(255, 107, 53, 0.4) !important;
    z-index: 10000;
    pointer-events: none;
  }

  [data-kgp-selected] {
    position: relative;
    outline: none;
    cursor: default;
  }

  img[data-kgp-selected],
  img[data-kgp-hover-selected],
  [data-kgp-hover-selected],
  [item-kgp-click-selected],
  [item-kgp-selected] {
    border: 3px solid #FF6B35 !important;
    box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 15px rgba(255, 107, 53, 0.5) !important;
    border-radius: 4px;
  }

  [data-kgp-hover-selected]::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    padding: 2px;
    border-radius: 4px;
    outline: 2px solid #FFA366 !important;
    box-shadow: 0 0 0 1px rgba(255, 163, 102, 0.3), 0 0 8px rgba(255, 163, 102, 0.4) !important;
    z-index: 9999;
    pointer-events: none;
  }

  [data-kgp-hover-selected] {
    position: relative;
    outline: none;
  }

</style>
<div id="resume-page" class="resume-page">

    <div class="header" style="">
        <div class="name">Becky Shu</div>
        <div class="contact-info">
            <span style="">Denver, CO</span> | 
            <span><a href="mailto:beckyshu@example.com" style="color: #000000; text-decoration: none;">beckyshu@example.com</a></span> | 
            <span style=""><a href="https://linkedin.com/in/beckyshu" target="_blank" style="color: #000000; text-decoration: none;">linkedin.com/in/beckyshu</a></span> | 
            <span style="">github.com/beckyhsiung96</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Summary</div>
        <div class="summary" style="outline: none;" contenteditable="true" data-editor-original-outline="">
            Senior Product Manager with proven track record of driving 25% increase in customer satisfaction through data-driven roadmaps and user research. Combines product management expertise with technical fluency in Python development, data modeling, and system architecture. Skilled in agile methodologies, stakeholder collaboration, and translating customer insights into actionable product strategies. Seeking to leverage cross-functional leadership and analytical capabilities to drive platform expansion and enhance customer experiences.
        </div>
    </div>

    <div class="section">
        <div class="section-title">Experience</div>
        
        <div class="experience-item">
            <div class="job-header">
                <div class="job-title">Senior Product Manager</div>
                <div class="job-date">Jan 2025 - Present</div>
            </div>
            <div class="company-location" style="">Resume Worded — Los Angeles, CA</div>
            <ul class="achievements">
                <li style="">Drove 25% increase in customer satisfaction by conducting user interviews and surveys, applying customer empathy and UX principles to identify behavioral patterns and preference insights</li>
                <li>Collaborated with cross-functional stakeholders in agile development sprints to identify, prioritize, and resolve product-related issues, improving customer retention metrics</li>
                <li>Defined data-driven product roadmap by analyzing customer needs and market trends using product management best practices, resulting in measurable satisfaction improvements</li>
            </ul>
        </div>

        <div class="experience-item">
            <div class="job-header">
                <div class="job-title">IT Business Analyst</div>
                <div class="job-date">Jan 2023 - Jan 2025</div>
            </div>
            <div class="company-location">Polyhire — Seattle, WA</div>
            <ul class="achievements">
                <li style="">Led cross-functional teams in agile development cycles to ensure successful on-time project delivery within budget constraints</li>
                <li>Developed comprehensive project timelines and budget frameworks, ensuring 100% on-schedule delivery of key initiatives</li>
                <li>Created detailed data models and documented data flows to improve system architecture and enhance data quality across platforms</li>
            </ul>
        </div>

        <div class="experience-item">
            <div class="job-header">
                <div class="job-title">Business Analyst</div>
                <div class="job-date">Jan 2021 - Jan 2023</div>
            </div>
            <div class="company-location">Growtsi — Seattle, WA</div>
            <ul class="achievements">
                <li>Conducted comprehensive cost-benefit analysis leveraging analytical skills to identify optimization opportunities, resulting in measurable cost reduction</li>
                <li>Developed financial models to forecast cash flows and assess financial viability of potential projects, informing strategic investment decisions</li>
                <li>Built automated customer data monitoring system with stakeholder alerting capabilities, enabling proactive issue resolution and improved customer empathy</li>
            </ul>
        </div>

        <div class="experience-item" style="">
            <div class="job-header">
                <div class="job-title" style="">Technical Project: Hue Pulse App</div>
                <div class="job-date" style="">Dec 2025</div>
            </div>
            <div class="company-location">Personal Project — github.com/beckyhsiung96/hue-pulse-app</div>
            <ul class="achievements">
                <li>Developed Python-based logo voting application demonstrating technical proficiency in application development and software engineering</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Education</div>
        <div class="education-item">
            <div class="education-header">
                <div class="school-name">University of New York</div>
                <div class="education-date">Jun 2020</div>
            </div>
            <div class="degree-info">Bachelor of Science in Business Administration — New York, NY</div>
            <div class="degree-info">GPA: 3.9/4.0 | Graduated with High Honors</div>
        </div>
    </div>

    <div class="section" contenteditable="true" data-editor-original-outline="" style="outline: none;">
        <div class="section-title">Skills</div>
        <div class="skills-group">
            <span class="skills-category">Product Management:</span>
            <span class="skills-list">Product Roadmapping, User Research, A/B Testing, Customer Empathy, User Experience (UX), Competitive Analysis</span>
        </div>
        <div class="skills-group">
            <span class="skills-category">Technical Skills:</span>
            <span class="skills-list">Python Programming, Data Modeling, System Architecture, Technical Fluency, Agile Development, Growth Stack Tools</span>
        </div>
        <div class="skills-group" style="">
            <span class="skills-category">Business Analysis:</span>
            <span class="skills-list">Financial Modeling, Cost-Benefit Analysis, Analytical Skills, Wireframing, Prototyping</span>
        </div>
        <div class="skills-group">
            <span class="skills-category">Languages:</span>
            <span class="skills-list" style="">English (Native), Mandarin (Native), German (Intermediate)</span>
        </div>
    </div>

    
    


</div>

`;

export const KUSE_RESUME_TEMPLATE = html;

export const KuseTemplate: ResumeTemplate = {
    id: 'kuse-v1',
    name: 'Simple Professional',
    html: html
};
