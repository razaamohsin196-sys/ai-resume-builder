
import { ResumeTemplate } from './types';

const html = `<style>
        @font-face {
            font-family: 'ComicSansMS';
            src: url('https://s3.amazonaws.com/cdn-free-fonts/fonts/c/comic-sans-ms/ComicSansMS.ttf') format('truetype');
        }

        body {
            background-color: #f0f0f0;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            font-family: 'ComicSansMS', sans-serif;
            min-width: 794px;
        }

        .page {
            width: 794px;
            min-height: 1123px;
            background-color: white;
            margin-top: 0.2em;
            margin-bottom: 0.2em;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            box-sizing: border-box;
            padding: 60px 60px;
            display: flex;
            flex-direction: column;
        }

        .header {
            text-align: center;
            width: 100%;
            padding-bottom: 20px;
        }

        .header h1 {
            font-size: 26.1px;
            font-weight: normal;
            margin: 0;
            letter-spacing: 4px;
        }

        .header p {
            font-size: 14px;
            font-weight: normal;
            margin: 10px 0 0;
            letter-spacing: 2px;
        }

        .horizontal-line {
            border-top: 1px solid #999;
            margin: 10px 0 15px 0px;
        }

        .main-content {
            display: flex;
            flex-direction: row;
            width: 100%;
            margin-top: 30px;
            flex-grow: 1;
        }

        .left-column {
            width: 30%;
            padding-right: 30px;
            box-sizing: border-box;
        }

        .right-column {
            width: 70%;
            padding-left: 30px;
            box-sizing: border-box;
        }

        .section {
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 14px;
            font-weight: normal;
            letter-spacing: 1px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #000;
            display: inline-block;
        }

        .section p,
        .section ul,
        .section li {
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
        }

        .contact-info p {
            margin-bottom: 5px;
        }

        .skills-list {
            list-style: none;
            padding: 0;
        }

        .skills-list li {
            margin-bottom: 5px;
        }

        .education-item {
            margin-bottom: 20px;
        }

        .education-item p {
            margin: 0;
        }

        .experience-item {
            margin-bottom: 25px;
        }

        .experience-item h3 {
            font-size: 14px;
            font-weight: normal;
            margin: 0 0 2px 0;
        }

        .experience-item .date {
            font-size: 14px;
            margin-bottom: 8px;
        }

        .experience-item p:not(.date) {
            line-height: 1.5;
        }
    </style>

    <div class="page" data-cid="Zs5GVC">
        <div class="header" data-cid="vdrG4j">
            <h1 data-cid="T5BL8P">M I R A K A R L S S O N</h1>
            <div class="horizontal-line editor-empty-block" data-cid="dLwsIZ"></div>
            <p data-cid="HwBZwH">SOCIAL MEDIA MARKETING SPECIALIST</p>
            <div class="horizontal-line editor-empty-block" data-cid="yJwXAS"></div>
        </div>

        <div class="main-content" data-cid="tjBlao">
            <div class="left-column" data-cid="1rLsNl">
                <div class="section contact-info" data-cid="w41cTF">
                    <h2 class="section-title" data-cid="UdxAri">CONTACT</h2>
                    <p data-cid="WhJjHu">816-555-0146</p>
                    <p data-cid="ySuqHS">mira@example.com</p>
                    <p data-cid="X7o9DA">www.example.com</p>
                </div>

                <div class="section" data-cid="17rlrz">
                    <h2 class="section-title" data-cid="hNGSEJ">SKILLS</h2>
                    <ul class="skills-list" data-cid="h0HwAm">
                        <li data-cid="40lnsV">Platform expertise</li>
                        <li data-cid="RENta0">Content creation</li>
                        <li data-cid="hEEFOl">Analytics</li>
                        <li data-cid="VUH5SD">Communication</li>
                        <li data-cid="JE2U19">Creativity</li>
                        <li data-cid="MT6YSA">Strategic thinking</li>
                    </ul>
                </div>

                <div class="section" data-cid="AtL1vX">
                    <h2 class="section-title" data-cid="R26cLM">EDUCATION</h2>
                    <div class="education-item" data-cid="cRTjbD">
                        <p data-cid="SjKl57">Bellows College</p>
                        <p data-cid="AWEJ8k">20XX- 20YY</p>
                        <p data-cid="IOlsPg">BA in Communications</p>
                    </div>
                    <div class="education-item" data-cid="56lCX5">
                        <p data-cid="uxtpVL">East Beringer Community College</p>
                        <p data-cid="rxCAuK">20XX- 20YY</p>
                        <p data-cid="OJNreo">AA in Communications</p>
                    </div>
                </div>
            </div>

            <div class="right-column" data-cid="fBDRqS">
                <div class="section" data-cid="wYSopR">
                    <h2 class="section-title" data-cid="Mp9VZj">PROFILE</h2>
                    <p data-cid="OHvJKg">Social Media Marketing Specialist, utilizing my 5+ years of experience in
                        creating and executing
                        successful social media campaigns, developing engaging content, analyzing and reporting on
                        campaign performance, and staying up to date with the latest trends and best practices in social
                        media marketing. My goal is to increase brand awareness, engagement, and conversion rates while
                        delivering exceptional results and exceeding goals for the company.</p>
                </div>

                <div class="section" data-cid="SywR02">
                    <h2 class="section-title" data-cid="n7fA9Y">EXPERIENCE</h2>
                    <div class="experience-item" data-cid="K6Ake5">
                        <h3 data-cid="LOfDBQ">Social Media Marketing Specialist</h3>
                        <p class="date" data-cid="nt2hEf">20XX- 20YY</p>
                        <p data-cid="k0QSZf">Developed and executed successful social media campaigns across multiple
                            platforms to
                            increase brand awareness and drive traffic to the company's website. Managed and grew the
                            company's social media accounts by creating engaging content, monitoring analytics, and
                            implementing social media best practices. Collaborated with cross-functional teams to
                            develop and execute integrated marketing campaigns that leveraged social media to meet
                            business objectives.</p>
                    </div>
                    <div class="experience-item" data-cid="lB8gmi">
                        <h3 data-cid="LfnKfN">Digital Marketing Manager</h3>
                        <p class="date" data-cid="GCK876">20XX- 20YY</p>
                        <p data-cid="h7gHjW">Led the development and implementation of the company's digital marketing
                            strategy, including
                            social media marketing, email marketing, and paid advertising. Analyzed and reported on the
                            performance of digital marketing campaigns, using data-driven insights to optimize and
                            improve campaign effectiveness.</p>
                    </div>
                    <div class="experience-item" data-cid="vIpmVt">
                        <h3 data-cid="hiHEAy">Content Marketing Specialist</h3>
                        <p class="date" data-cid="NQW66W">20XX- 20YY</p>
                        <p data-cid="x7II4T">Developed and executed content marketing strategies that leveraged social
                            media to drive
                            traffic, engagement, and conversions. Produced high-quality, engaging content for social
                            media, email marketing, and the company's blog.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>



`;

export const SocialMediaMarketingTemplate: ResumeTemplate = {
    id: 'socialmediamarketing',
    name: 'Social media marketing',
    html: html
};
