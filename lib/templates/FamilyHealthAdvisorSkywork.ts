
import { ResumeTemplate } from './types';

const html = `<style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800&family=Noto+Sans:wght@400;700&display=swap');

        body {
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
            min-width: 794px;
            font-family: 'Noto Sans', sans-serif;
            color: #333;
        }

        .page {
            margin: 0 auto;
            margin-bottom: 0.2em;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            width: 794px;
            min-height: 1123px;
            background-color: #ffffff;
            display: flex;
            flex-direction: column;
        }

        .main-content {
            display: flex;
            flex-grow: 1;
        }

        .left-column {
            width: 43%;
            box-sizing: border-box;
        }

        .right-column {
            width: 65%;
            background-color: #FFFFFF;
            display: flex;
            flex-direction: column;
        }

        .header {
            background-color: #A97C74;
            color: #ffffff;
            padding: 40px 45px;
        }

        .header h1 {
            font-family: 'Arimo', sans-serif;
            font-weight: bold;
            font-size: 40px;
            margin: 0;
            line-height: 1.1;
        }

        .header .subtitle {
            font-size: 13px;
            margin: 5px 0 15px;
            font-weight: normal;
            color: #FDF6EC;
            font-weight: bold;
        }

        .header hr {
            border: 0;
            height: 1px;
            background-color: #ffffff;
            opacity: 0.5;
            width: 60px;
            margin: 15px 0;
        }

        .header p {
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
        }

        .right-content {
            padding: 10px 45px 40px;
        }

        .profile-pic-container {
            box-sizing: border-box;
            width: 100%;
            margin: 0 auto;
            overflow: hidden;
            padding: 40px 30px 0;
            background-color: #FDF6EC;
        }

        .profile-pic-container img {
            width: 100%;
            height: auto;
            max-height: 350px;
            object-fit: cover;
        }

        .contact-info {
            padding: 20px 30px 0;
            background-color: #FDF6EC;
        }

        .contact-item {
            display: flex;
            align-items: center;
            font-size: 13px;
            line-height: 20px;
            padding: 15px 0;
            border-bottom: 1px solid #000;
        }

        .contact-item:first-child {
            padding-top: 0;
        }

        .contact-item img {
            margin-right: 15px;
            width: 14px;
            height: 14px;
            border: 1px solid #9E746F;
            border-radius: 50%;
            padding: 2px;
            align-self: flex-start;
        }

        .left-column .section {
            padding: 0 30px;
            margin-top: 20px;
        }

        .section-title {
            width: 100%;
            font-family: 'Arimo', sans-serif;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #333;
            display: inline-block;
        }

        .skills-list {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: 13px;
        }

        .skills-list li {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .skills-list li::before {
            content: '*';
            font-size: 18px;
            margin-right: 10px;
            font-weight: bold;
        }

        .certification-item,
        .membership-item {
            margin-bottom: 20px;
        }

        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }

        .item-header .title {
            font-weight: bold;
            font-size: 13px;
        }

        .date-badge {
            background-color: #A97C74;
            color: white;
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 10px;
            font-weight: bold;
            white-space: nowrap;
        }

        .item-subheader {
            font-size: 12px;
            color: #555;
        }

        .summary-list,
        .experience-list {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
        }

        .summary-list li,
        .experience-list li {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .summary-list li::before,
        .experience-list li::before {
            content: '*';
            font-size: 18px;
            margin-right: 10px;
            font-weight: bold;
            align-self: flex-start;
        }

        .experience-list {
            margin-top: 20px;
        }

        .education-item {
            margin-bottom: 20px;
        }

        .education-item .item-header .title {
            font-size: 14px;
            max-width: 60%;
        }

        .education-item .item-subheader {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: #555;
            margin-top: 20px;
        }

        .experience-item .item-header .title {
            font-size: 14px;
            max-width: calc(100% - 70px);
        }

        .footer-bar {
            height: 40px;
            background-color: #A97C74;
        }

        @media print {
            .page {
                box-shadow: none !important;
                margin: 0;
            }
        }
    </style>

    <div class="page" data-cid="WsJw5L">
        <div class="main-content" data-cid="evY2w1">
            <div class="left-column" data-cid="Zo9OeL">
                <div class="profile-pic-container" data-cid="88RQBr">
                    <img src="https://picture-search.skywork.ai/image/doc/79f92341a8f33f43ea769a84515143c1.jpg"
                        alt="Juliana Silva" data-cid="CzeNe3">
                </div>
                <div class="contact-info" data-cid="TdQWdp">
                    <div class="contact-item" data-cid="wm5ZY9">
                        <img src="https://api.iconify.design/mdi/phone.svg?color=%239E746F" alt="Phone icon"
                            data-cid="cvFpse">
                        <span data-cid="1CHj5U">+123-456-7890</span>
                    </div>
                    <div class="contact-item" data-cid="GN6Ufk">
                        <img src="https://api.iconify.design/mdi/email.svg?color=%239E746F" alt="Email icon"
                            data-cid="RBuCgY">
                        <span data-cid="YqEt3K">hello@reallygreatsite.com</span>
                    </div>
                    <div class="contact-item" style="border-bottom: none;" data-cid="fhtqIT">
                        <img src="https://api.iconify.design/mdi/location.svg?color=%239E746F" alt="Location icon"
                            data-cid="329EAc">
                        <span data-cid="q77n9e">123 Anywhere St., Any City, ST 12345</span>
                    </div>
                </div>
                <div class="section" data-cid="bENUph">
                    <h2 class="section-title" data-cid="et0j4J">SKILLS</h2>
                    <ul class="skills-list" data-cid="TvVHlU">
                        <li data-cid="27GcPe">Family Assessment</li>
                        <li data-cid="ob8c4w">Conflict Resolution</li>
                        <li data-cid="jzWKCU">Communication Improvement</li>
                        <li data-cid="FhF25r">Crisis Intervention</li>
                        <li data-cid="o0O9Oh">Group Therapy</li>
                        <li data-cid="j90PbB">Case Management</li>
                    </ul>
                </div>
                <div class="section" data-cid="vRZWTB">
                    <h2 class="section-title" data-cid="aox7fX">CERTIFICATION</h2>
                    <div class="certification-item" data-cid="eYZAME">
                        <div class="item-header" data-cid="NxqRVm">
                            <span class="title" data-cid="wqZscq">Certified Family Counselor</span>
                            <span class="date-badge" data-cid="zzs2Ze">AUG 2021</span>
                        </div>
                        <p class="item-subheader" data-cid="Vxrw8p">Arowwai Industries Training Center, Any City</p>
                    </div>
                </div>
                <div class="section" data-cid="wfYFwH">
                    <h2 class="section-title" data-cid="dULRhV">MEMBERSHIP</h2>
                    <div class="membership-item" data-cid="kVs4ZT">
                        <div class="item-header" data-cid="rWDr3U">
                            <span class="title" data-cid="As7ZaV">AMFT Member</span>
                            <span class="date-badge" data-cid="3FzYNy">2022-PRESENT</span>
                        </div>
                        <p class="item-subheader" data-cid="ftqFIi">Association for Marriage and Family Therapy</p>
                    </div>
                </div>
            </div>
            <div class="right-column" data-cid="1FWoqE">
                <div class="header" data-cid="3QlLuc">
                    <h1 data-cid="IYbTkf">Juliana Silva</h1>
                    <p class="subtitle" data-cid="tANkZf">Family Wellness Counselor</p>
                    <hr data-cid="zAdOdy">
                    <p data-cid="iLIpkR">A compassionate Family Wellness Counselor with a strong background in providing
                        support and guidance to families facing various challenges.</p>
                </div>
                <div class="right-content" data-cid="Vh2t8Y">
                    <div class="section" data-cid="XDLP3u">
                        <h2 class="section-title" data-cid="4KXyUR">PROFESSIONAL SUMMARY</h2>
                        <ul class="summary-list" data-cid="Xlw9BG">
                            <li data-cid="u8LIrR">Over 5 years of experience in family counseling, specializing in
                                conflict resolution and communication.</li>
                            <li data-cid="7mXDB8">Proficient in assessing family dynamics and creating tailored wellness
                                plans.</li>
                            <li data-cid="du4XCV">Collaborated with a multidisciplinary team to develop holistic
                                treatment plans for families.</li>
                        </ul>
                    </div>
                    <div class="section" data-cid="pnhbwp">
                        <h2 class="section-title" data-cid="XHKNAg">EDUCATION</h2>
                        <div class="education-item" data-cid="JhWtRY">
                            <div class="item-header" data-cid="dM2rwf">
                                <span class="title" data-cid="769iSF">Master of Science in Marriage and Family
                                    Counseling</span>
                                <span class="date-badge" data-cid="PTHy3T">2021</span>
                            </div>
                            <div class="item-subheader" data-cid="AkGVPg">
                                <span data-cid="dDUFoD">Rimberio University</span>
                                <span data-cid="nZ6ndL">Graduated: May 2024</span>
                            </div>
                        </div>
                    </div>
                    <div class="section" data-cid="fO08HK">
                        <h2 class="section-title" data-cid="LoMiYb">EXPERIENCE</h2>
                        <div class="experience-item" data-cid="W9dUHY">
                            <div class="item-header" data-cid="9OCu55">
                                <span class="title" data-cid="6CARUx">Family Wellness Counselor at Giggling Platypus
                                    Co., Any City</span>
                                <span class="date-badge" data-cid="u5Y46V">2022</span>
                            </div>
                            <ul class="experience-list" data-cid="MCQV0V">
                                <li data-cid="RDDzeK">Conducted individual and family counseling sessions, addressing
                                    issues such as domestic violence, abuse, and others.</li>
                                <li data-cid="CydozG">Collaborated with a multidisciplinary team to develop holistic
                                    treatment plans for families.</li>
                                <li data-cid="48P5RJ">Collaborated with a multidisciplinary team to develop holistic
                                    treatment plans for families.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer-bar editor-empty-block" data-cid="cWipG1"></div>
    </div>


`;

export const FamilyHealthAdvisorSkyworkTemplate: ResumeTemplate = {
    id: 'familyhealthadvisorskywork',
    name: 'Family health advisor Skywork',
    html: html
};
