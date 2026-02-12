
import { ResumeTemplate } from './types';

const html = `<style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700&family=Playfair+Display:wght@400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap');

        body {
            min-width: 8.5in;
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            font-family: 'Montserrat', sans-serif;
            color: #333;
        }

        .page {
            width: 8.5in;
            min-height: 11in;
            background-color: #ffffff;
            margin: 2em 0;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            display: flex;
            position: relative;
        }

        .left-column {
            width: 30%;
            padding: 3em 2em;
            box-sizing: border-box;
            position: relative;
        }

        .right-column {
            position: relative;
            width: 70%;
            padding: 3em 3em 3em 2.5em;
            box-sizing: border-box;
        }

        .divider {
            width: 1px;
            height: calc(100% - 6em);
            position: absolute;
            top: 3em;
            background-color: #e0e0e0;
            left: 0;
        }

        .image-container {
            background-color: #F7E6E5;
            padding: 1em 1em 2em;
            margin-bottom: 3em;
        }

        .image-container img {
            width: 100%;
            display: block;
        }

        .left-section {
            margin-bottom: 2.5em;
        }

        .left-section h3 {
            font-size: 0.6em;
            color: #000;
            letter-spacing: 0.2em;
            margin-bottom: 1em;
            font-weight: 500;
        }

        .left-section p,
        .left-section ul {
            font-size: 0.8em;
            color: #555;
            margin: 0;
            padding: 0;
            list-style: none;
        }

        .left-section ul li {
            margin-bottom: 0.5em;
        }

        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 0.6em;
        }

        .contact-item img {
            width: 12px;
            height: 12px;
            margin-right: 10px;
        }

        .right-column h1 {
            font-family: 'Montserrat', sans-serif;
            font-size: 1.2em;
            color: #DC9589;
            letter-spacing: 0.2em;
            margin: 0;
            font-weight: bold;
        }

        .right-column .subtitle {
            font-family: 'Montserrat', sans-serif;
            font-size: 1em;
            color: #555;
            margin-top: 0.5em;
            margin-bottom: 2em;
        }

        .right-section {
            margin-bottom: 1.5em;
        }

        .right-section h2 {
            font-family: 'Montserrat', sans-serif;
            font-size: 1em;
            color: #DC9589;
            letter-spacing: 0.15em;
            margin-bottom: 1.8em;
            font-weight: bold;
            padding-bottom: 0.5em;
            border-bottom: 1px solid #e0e0e0;
        }

        .right-section p {
            font-size: 0.9em;
            line-height: 1.6;
            color: #555;
        }

        .job-title {
            font-size: 0.9em;
            font-weight: bold;
            letter-spacing: 0.1em;
            margin: 0 0 0.3em 0;
            color: #333;
        }

        .job-details {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 0.9em;
            color: #555;
            margin-bottom: 1em;
        }

        .job-description {
            list-style: none;
            padding-left: 0;
            margin: 0 0 1.5em 0;
        }

        .job-description li {
            font-size: 0.6em;
            color: #555;
            line-height: 1.6;
            position: relative;
            padding-left: 1em;
        }

        .job-description li::before {
            content: '-';
            position: absolute;
            left: 0;
        }

        .education-item {
            margin-bottom: 1.5em;
        }

        .education-item .degree {
            font-size: 0.6em;
            letter-spacing: 0.1em;
            margin: 0 0 0.3em 0;
            color: #333;
            font-family: auto;
        }

        .education-item .institution {
            margin: 0.5em 0;
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 0.9em;
            color: #555;
        }

        .signature {
            font-family: 'Dancing Script', cursive;
            font-size: 3em;
            color: #d1a3a4;
            position: absolute;
            transform: rotateZ(-20deg);
            top: 0.7em;
            right: 1.5em;
        }

        @media print {
            .page {
                box-shadow: none !important;
                margin: 0;
            }
        }
    </style>


    <div class="page" data-cid="FxWxgm">
        <div class="left-column" data-cid="AwwwZa">
            <div class="image-container" data-cid="CUWjdO">
                <img src="https://static-us-img.skywork.ai/router/agent/2025-10-17/1_00fc8dfb2c0147a0b9351b0ec6f4948e.png" alt="Juliana Silva" data-cid="7PBOf8">
            </div>

            <div class="left-section" data-cid="44pvpV">
                <h3 data-cid="H47TA3">CONTACT</h3>
                <div class="contact-item" data-cid="DHKTlC">
                    <img class="icon" src="https://api.iconify.design/mdi:phone.svg?color=%23d1a3a4" data-cid="fhEAgr">
                    <p data-cid="foEWX1">123-456-7890</p>
                </div>
                <div class="contact-item" data-cid="liOnzJ">
                    <img class="icon" src="https://api.iconify.design/mdi:email.svg?color=%23d1a3a4" data-cid="B5RECW">
                    <p data-cid="9w1AER">hello@reallygreatsite.com</p>
                </div>
                <div class="contact-item" data-cid="QLyD0A">
                    <img class="icon" src="https://api.iconify.design/mdi:web.svg?color=%23d1a3a4" data-cid="O4wdxD">
                    <p data-cid="sNEMuB">www.reallygreatsite.com</p>
                </div>
            </div>

            <div class="left-section" data-cid="1jHU6q">
                <h3 data-cid="jWlYkN">EXPERTISE</h3>
                <ul data-cid="vSx7vr">
                    <li data-cid="LEbZJC">UX Design</li>
                    <li data-cid="T5Z6xT">Graphics Design</li>
                    <li data-cid="RIN5XF">Project Management</li>
                    <li data-cid="gwDyXh">Branding</li>
                </ul>
            </div>

            <div class="left-section" data-cid="x8AbMG">
                <h3 data-cid="0SJ33G">SOFTWARE KNOWLEDGE</h3>
                <ul data-cid="7IIhYG">
                    <li data-cid="K2WC4X">Graphic Design Software</li>
                    <li data-cid="nV846K">Software for Design</li>
                    <li data-cid="gBUSjh">Another Software</li>
                    <li data-cid="kQNIku">Team Communication Sofware</li>
                    <li data-cid="GbLGA7">Graphics Software</li>
                </ul>
            </div>

            <div class="left-section" data-cid="SB86Xn">
                <h3 data-cid="kMpnQH">PERSONAL SKILLS</h3>
                <ul data-cid="t7DOXs">
                    <li data-cid="ZbgMpL">Creativity</li>
                    <li data-cid="8kIvut">Team building</li>
                    <li data-cid="iODfRy">Communication</li>
                    <li data-cid="mexe1Z">Problem Solving</li>
                    <li data-cid="XjfgC9">Leadership</li>
                </ul>
            </div>
        </div>

        <div class="right-column" data-cid="cQ0BSr">
            <div class="divider editor-empty-block" data-cid="2nsLjH"></div>
            <div class="signature" data-cid="pOihRK">liva</div>
            <h1 data-cid="CnDaBf">JULIANA SILVA</h1>
            <p class="subtitle" data-cid="1CERYx">Senior Graphic Designer</p>

            <div class="right-section" data-cid="MaSY9f">
                <h2 data-cid="TTcsAA">PERSONAL PROFILE</h2>
                <p data-cid="GMLJpG">I am a senior graphic designer with 10 years experience in graphic design and UX design. I am also
                    experienced in coordinating a team of mid-level designers.</p>
            </div>

            <div class="right-section" data-cid="ZjY9yy">
                <h2 data-cid="BbWKbo">WORK EXPERIENCE</h2>

                <h4 class="job-title" data-cid="IyMSFs">SENIOR GRAPHIC DESIGNER</h4>
                <p class="job-details" data-cid="tJoOi3">Fauget | Oct 2019 - present</p>
                <ul class="job-description" data-cid="Us7wh1">
                    <li data-cid="2PdmA7">Design concept development and implementation for the main product application</li>
                    <li data-cid="Hjp59C">Leading a team of five mid-level designers</li>
                    <li data-cid="Egu0V8">Coordinating social media graphics team</li>
                </ul>

                <h4 class="job-title" data-cid="dP2EBo">GRAPHIC DESIGNER</h4>
                <p class="job-details" data-cid="K2HUZn">Studio Shodwe | Dec 2015 - Sep 2019</p>
                <ul class="job-description" data-cid="32HgHs">
                    <li data-cid="5PDNv8">Creating and editing graphic design assets for the web application and website</li>
                    <li data-cid="3WfGEH">Helping with day-to-day project tasks</li>
                    <li data-cid="bVJDA2">Developing and editing social media templates</li>
                </ul>

                <h4 class="job-title" data-cid="j3tkTB">GRAPHIC DESIGN INTERN</h4>
                <p class="job-details" data-cid="IAmmCP">Borcelle | Jul 2014 - Oct 2015</p>
                <ul class="job-description" data-cid="dRoB5Q">
                    <li data-cid="UzzQso">Helping with day-to-day project tasks</li>
                    <li data-cid="QBPVwE">Editing photos for client projects</li>
                    <li data-cid="AEJ4O3">Developing printed media ideas for restaurants</li>
                </ul>
            </div>

            <div class="right-section" data-cid="w3kBuD">
                <h2 data-cid="1KR8LG">EDUCATION</h2>
                <div class="education-item" data-cid="9sdavL">
                    <p class="degree" data-cid="rSgdQa">MASTERS IN GRAPHIC DESIGN</p>
                    <p class="institution" data-cid="Dn5vnT">Keithston and Partners | 2013 - 2015</p>
                </div>
                <div class="education-item" data-cid="JTmQb2">
                    <p class="degree" data-cid="M0cIHF">BA GRAPHIC DESIGN</p>
                    <p class="institution" data-cid="d1c0WB">Keithston and Partners | 2010 - 2013</p>
                </div>
            </div>
        </div>
    </div>




`;

export const ElegantProfessionalPhotoTemplate: ResumeTemplate = {
    id: 'elegantprofessionalphoto',
    name: 'Elegant professional photo',
    html: html,
    hasPhoto: true,
    supportedSections: ['profile', 'summary', 'experience', 'education', 'skills', 'projects', 'languages', 'certifications'],
    sectionOrder: ['profile', 'summary', 'experience', 'education', 'skills'],
    pageSize: 'A4',
    metadata: {
        layout: 'two-column',
        photoPosition: 'sidebar',
        maxBulletsPerJob: 5
    }
};
