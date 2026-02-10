
import { ResumeTemplate } from './types';

const html = `<style>
        body {
            background-color: #f0f0f0;
            font-family: 'Georgia', serif;
            margin: 0;
            padding: 2em 0;
            display: flex;
            justify-content: center;
            color: #333;
            min-width: 794px;
        }

        .page {
            background-color: #ffffff;
            width: 794px;
            min-height: 1123px;
            position: relative;
            overflow: visible;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            margin-bottom: 0.2em;
        }

        .main-container {
            display: flex;
            min-height: 100%;
        }

        .left-column {
            background-color: #e9f5f1;
            width: 30%;
            padding: 300px 40px 40px 40px;
            box-sizing: border-box;
        }

        .right-column {
            width: 70%;
            padding: 300px 40px 40px 40px;
            box-sizing: border-box;
        }

        .header {
            position: absolute;
            top: 60px;
            left: 40px;
        }

        .header h1 {
            font-family: 'Georgia', serif;
            font-weight: bold;
            font-size: 84px;
            color: #4a9a82;
            margin: 0;
            line-height: 1.1;
        }

        .section {
            margin-bottom: 25px;
        }

        .section h2 {
            font-family: 'Georgia', serif;
            font-weight: bold;
            font-size: 14px;
            color: #000000;
            letter-spacing: 1px;
            margin: 0 0 8px 0;
        }

        .section p,
        .section .content {
            font-family: 'Georgia', serif;
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
            color: #555;
        }

        .right-column .section h2 {
            color: #4a9a82;
            display: flex;
            align-items: center;
            font-size: 12px;
        }

        .right-column .section h2::after {
            content: '';
            flex-grow: 1;
            height: 1px;
            background-color: #4a9a82;
            margin-left: 15px;
        }

        .experience-item {
            margin-bottom: 15px;
        }

        .experience-item .date {
            font-family: 'Georgia', serif;
            font-weight: bold;
            font-size: 14px;
            color: #000000;
            letter-spacing: 1px;
            margin: 0 0 4px 0;
        }

        .experience-item .details {
            font-family: 'Georgia', serif;
            font-size: 14px;
            color: #555;
            margin: 0;
        }

        .right-column .section p {
            font-size: 14px;
            color: #555;
        }

        .education-item {
            margin-bottom: 5px;
        }

        .education-item .college {
            font-family: 'Georgia', serif;
            font-weight: bold;
            font-size: 14px;
            color: #000000;
        }

        .education-item .degree {
            font-family: 'Georgia', serif;
            font-size: 14px;
            color: #555;
        }

        @media print {
            .page {
                box-shadow: none !important;
                margin: 0;
            }
        }
    </style>

    <div class="page" data-cid="91LfvW">
        <div class="header" data-cid="5LmMIQ">
            <h1 data-cid="3pUfXA" class="editor-empty-block">Tonnie<br data-cid="M4aBQZ">Thomsen</h1>
        </div>
        <div class="main-container" data-cid="uAepdl">
            <div class="left-column" data-cid="kWpIaV">
                <div class="section" data-cid="96rbxF">
                    <h2 data-cid="Sr1woS">OBJECTIVE</h2>
                    <p data-cid="HVMsKm">My primary objective is to provide a safe and nurturing learning environment
                        that encourages
                        student growth and development. I aim to facilitate engaging and challenging instruction that
                        fosters a love for learning, critical thinking, and problem-solving s kills.</p>
                </div>
                <div class="section" data-cid="MNBTaa">
                    <h2 data-cid="hmE6ta">REFERENCES</h2>
                    <p data-cid="KrERad">Available upon request.</p>
                </div>
                <div class="section" data-cid="8MhsBF">
                    <h2 data-cid="ODSVmE">ADDRESS</h2>
                    <p data-cid="lZ5q1S" class="editor-empty-block">987 6th Ave<br data-cid="zdZRmV">Santa Fe, NM
                        76543<br data-cid="QyH8Lo">USA</p>
                </div>
                <div class="section" data-cid="fCZ8GP">
                    <h2 data-cid="SDeuli">PHONE</h2>
                    <p data-cid="NcDEKU">706.555.0123</p>
                </div>
                <div class="section" data-cid="DbeePe">
                    <h2 data-cid="99at6z">EMAIL</h2>
                    <p data-cid="n78cdW">tonnie@example.com</p>
                </div>
                <div class="section" data-cid="hLPOe5">
                    <h2 data-cid="BiRAXi">WEBSITE</h2>
                    <p data-cid="i3S5VE">www.interestingsite.com</p>
                </div>
            </div>
            <div class="right-column" data-cid="G5PBHt">
                <div class="section" data-cid="rvSUog">
                    <h2 data-cid="Aiqqjz">EXPERIENCE</h2>
                    <div class="experience-item" data-cid="2dPmSZ">
                        <p class="date" data-cid="Z12GVA">JAN 20XX – AUG 20XX</p>
                        <p class="details" data-cid="GloWlH">Teacher | Balsam Elementary School | Santa Fe, NM</p>
                    </div>
                    <div class="experience-item" data-cid="c9B2ri">
                        <p class="date" data-cid="TY6fIJ">OCT 20XX –MAY 20XX</p>
                        <p class="details" data-cid="y8EQMq">Teacher’s Aide | Balsam Elementary School | Santa Fe, NM
                        </p>
                    </div>
                    <div class="experience-item" data-cid="LtdVJc">
                        <p class="date" data-cid="Aaeq1L">SEP 20XX – JUN 20XX</p>
                        <p class="details" data-cid="e6Dkmj">Teacher’s Aide | Balsam Elementary School | Santa Fe, NM
                        </p>
                    </div>
                    <p data-cid="qZPUTQ">Key responsibilities: planning and delivering effective instruction across
                        various subjects and
                        grade levels, assessing and monitoring student progress, and providing individualized support
                        and intervention as needed.</p>
                </div>
                <div class="section" data-cid="jAoF7C">
                    <h2 data-cid="OvROmg">EDUCATION</h2>
                    <div class="education-item" data-cid="Rk5i9S">
                        <p class="college" data-cid="isXZHj">Bellows College | Santa Fe, NM</p>
                        <p class="degree" data-cid="LtkngY">Bachelor’s Degree in Elementary Education</p>
                    </div>
                </div>
                <div class="section" data-cid="AcFRii">
                    <h2 data-cid="gWo0TF">COMMUNICATION</h2>
                    <p data-cid="KhDIDj">Collaborating with colleagues, parents, and community members to support
                        student learning and
                        achievement is an essential responsibility of an elementary school teacher.</p>
                </div>
                <div class="section" data-cid="rcVOZ7">
                    <h2 data-cid="qeDcgp">LEADERSHIP</h2>
                    <p data-cid="DsOEiR">As a teacher, I maintain a positive classroom environment that promotes student
                        engagement,
                        behavior management, and social-emotional development.</p>
                </div>
            </div>
        </div>
    </div>



`;

export const Template2ColumnStylishBlocksTemplate: ResumeTemplate = {
    id: '2columnstylishblocks',
    name: '2 Column stylish blocks',
    html: html,
    hasPhoto: false,
    supportedSections: ['profile', 'summary', 'experience', 'education', 'skills', 'projects', 'languages', 'certifications'],
    sectionOrder: ['profile', 'summary', 'experience', 'education', 'skills'],
    pageSize: 'A4',
    metadata: {
        layout: 'two-column',
        photoPosition: 'none',
        maxBulletsPerJob: 5
    }
};
