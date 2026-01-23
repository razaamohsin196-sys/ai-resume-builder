
import { ResumeTemplate } from './types';

const html = `<style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

        body {
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
            min-width: 794px;
            font-family: 'Inter', sans-serif;
            color: #414042;
        }

        .page {
            padding-top: 50px;
            background-color: #ffffff;
            margin: 2em auto;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            width: 794px;
            min-height: 1123px;
            padding-bottom: 0.2em;
        }

        .header {
            height: 250px;
            background-color: #F6F6F6;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-right: 50px;
        }

        .header-left {
            padding: 40px 50px;
            flex-basis: 60%;
        }

        .header-left h1 {
            font-size: 36px;
            font-weight: 700;
            margin: 0;
            letter-spacing: 1px;
        }

        .header-left h2 {
            font-size: 16px;
            font-weight: 700;
            margin: 5px 0 15px;
            letter-spacing: 1px;
        }

        .header-left h2::after {
            content: '';
            display: block;
            width: 40px;
            height: 3px;
            background-color: #3b8586;
            margin-top: 8px;
        }

        .contact-info {
            margin-top: 25px;
        }

        .contact-info p {
            display: flex;
            align-items: center;
            font-size: 12px;
            margin: 8px 0;
            font-weight: normal;
        }

        .contact-info svg {
            width: 14px;
            height: 14px;
            margin-right: 10px;
            fill: #425867;
        }

        .header-right img {
            height: 250px;
            object-fit: cover;
        }

        .main-content {
            display: flex;
            padding: 30px 50px;
            gap: 40px;
        }

        .column-left {
            flex: 1.5;
        }

        .column-right {
            flex: 1;
        }

        .section {
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }

        .section-title::after {
            content: '';
            display: block;
            width: 40px;
            height: 3px;
            background-color: #3b8586;
            margin-top: 8px;
        }

        .work-item,
        .reference-item,
        .education-item {
            margin-bottom: 20px;
        }

        p {
            margin: 0;
            line-height: 1.5;
            font-size: 12px;
        }

        .item-date {
            font-weight: 700;
            font-size: 12px;
        }

        .item-title {
            font-weight: 700;
            font-size: 12px;
            margin-top: 2px;
        }

        .item-subtitle {
            font-size: 11px;
            margin-top: 2px;
        }

        .item-description {
            margin-top: 8px;
            font-weight: normal;
        }

        .reference-name {
            font-weight: 700;
            font-size: 12px;
        }

        .expertise-img {
            width: 100%;
            margin-top: 10px;
        }

        .language-item {
            font-size: 11px;
            margin-bottom: 5px;
        }

        @media print {
            .page {
                box-shadow: none !important;
                margin: 0;
            }
        }
    </style>

    <div class="page" data-cid="1qk2yw">
        <div class="header" data-cid="tqAeec">
            <div class="header-left" data-cid="MoUrJQ">
                <h1 data-cid="ThURzH">OLIVIA WILSON</h1>
                <h2 data-cid="q4EDtH">MARKETING MANAGER</h2>
                <div class="contact-info" data-cid="QTU3uM">
                    <p data-cid="6vWBJO">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" data-cid="33LFmE">
                            <path
                                d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                                data-cid="bLBxWt"></path>
                        </svg>
                        123-456-7890
                    </p>
                    <p data-cid="1i6wgi">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" data-cid="36c8Z4">
                            <path
                                d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                                data-cid="Xucr7l"></path>
                        </svg>
                        hello@reallygreatsite.com
                    </p>
                    <p data-cid="dFzO3a">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" data-cid="RRyTkI">
                            <path
                                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                                data-cid="vgDVkc"></path>
                        </svg>
                        123 Anywhere St., Any City
                    </p>
                </div>
            </div>
            <div class="header-right" data-cid="0iMjCQ">
                <img src="https://picture-search.skywork.ai/image/doc/c34576ce8d2a95386caec25f929fbda9.jpg"
                    alt="Olivia Wilson" data-cid="OYW0FH">
            </div>
        </div>

        <div class="main-content" data-cid="RhQvxs">
            <div class="column-left" data-cid="XbPaUK">
                <div class="section" data-cid="2HFSiE">
                    <h3 class="section-title" data-cid="2OrCQ3">WORK EXPERIENCE</h3>
                    <div class="work-item" data-cid="te9rP2">
                        <p class="item-date" data-cid="MCfPno">2020 – 2023</p>
                        <p class="item-title" data-cid="6Bv36o">Marketing Manager</p>
                        <p class="item-subtitle" data-cid="lfWhgQ">Arowwai Industries</p>
                        <p class="item-description" data-cid="wKbBBG">Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Nullam pharetra in lorem at laoreet. Donec hendrerit libero eget est tempor, quis
                            tempus arcu elementum.</p>
                    </div>
                    <div class="work-item" data-cid="R143X4">
                        <p class="item-date" data-cid="BhlVEw">2020 – 2023</p>
                        <p class="item-title" data-cid="XM1QRO">Marketing Manager</p>
                        <p class="item-subtitle" data-cid="jeoWJj">Wardiere Inc. / CEO</p>
                        <p class="item-description" data-cid="8WZ2N1">Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Nullam pharetra in lorem at laoreet. Donec hendrerit libero eget est tempor, quis
                            tempus arcu elementum.</p>
                    </div>
                    <div class="work-item" data-cid="4sGx8h">
                        <p class="item-date" data-cid="SyrCYd">2020 – 2023</p>
                        <p class="item-title" data-cid="Aa1DO0">Marketing Manager</p>
                        <p class="item-subtitle" data-cid="Urvywj">Salford &amp; Co.</p>
                        <p class="item-description" data-cid="6qFBW8">Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Nullam pharetra in lorem at laoreet. Donec hendrerit libero eget est tempor, quis
                            tempus arcu elementum.</p>
                    </div>
                </div>
                <div class="section" data-cid="pGsgAA">
                    <h3 class="section-title" data-cid="lcgXHt">REFERENCES</h3>
                    <div class="reference-item" data-cid="JX8cDP">
                        <p class="reference-name" data-cid="Yufscm">Harumi Kobayashi</p>
                        <p class="item-subtitle" data-cid="rFP3L2">Wardiere Inc. / CEO</p>
                        <p class="item-subtitle" data-cid="U0CSCd">Phone: 123-456-7890</p>
                        <p class="item-subtitle" data-cid="X5sgtK">Email: hello@reallygreatsite.com</p>
                    </div>
                    <div class="reference-item" data-cid="HXEB4x">
                        <p class="reference-name" data-cid="Mpp7NX">Adeline Palmerston</p>
                        <p class="item-subtitle" data-cid="gP82XE">Salford &amp; Co.</p>
                        <p class="item-subtitle" data-cid="7KB5Tj">Phone: 123-456-7890</p>
                        <p class="item-subtitle" data-cid="Antz9G">Email: hello@reallygreatsite.com</p>
                    </div>
                </div>
            </div>
            <div class="column-right" data-cid="yMefAs">
                <div class="section" data-cid="FRwEds">
                    <h3 class="section-title" data-cid="5uDKJE">ABOUT ME</h3>
                    <p class="item-description" data-cid="7JJa1I">Lorem ipsum dolor sit amet, consectetur adipiscing
                        elit. Nullam pharetra in lorem at laoreet. Donec hendrerit libero eget est tempor, quis tempus
                        arcu elementum. In elementum elit at dui tristique feugiat.</p>
                </div>
                <div class="section" data-cid="vvnSNY">
                    <h3 class="section-title" data-cid="3HK33B">EDUCATION</h3>
                    <div class="education-item" data-cid="ZB5ssw">
                        <p class="item-date" data-cid="QFUvlR">2020 - 2023</p>
                        <p class="item-title" data-cid="YzoG4W">Borcelle University</p>
                        <p class="item-subtitle" data-cid="dlBkGA">Bachelor of Business Management</p>
                    </div>
                    <div class="education-item" data-cid="B65OP1">
                        <p class="item-date" data-cid="AOkgJt">2016 - 2020</p>
                        <p class="item-title" data-cid="gKDPK6">Rimberio University</p>
                        <p class="item-subtitle" data-cid="Vweu3Z">Bachelor of Business Management</p>
                    </div>
                </div>
                <div class="section" data-cid="9jNOhA">
                    <h3 class="section-title" data-cid="kz9ABm">EXPERTISE</h3>
                    <img src="https://picture-search.skywork.ai/image/doc/451518e06e84fecc4129f331bcb17124.jpg"
                        alt="Expertise" class="expertise-img" data-cid="ncZYeF">
                </div>
                <div class="section" data-cid="BsdVmQ">
                    <h3 class="section-title" data-cid="BQRfh1">LANGUAGE</h3>
                    <p class="language-item" data-cid="A5G5jM">English</p>
                    <p class="language-item" data-cid="bWvQm0">Spain</p>
                </div>
            </div>
        </div>
    </div>


`;

export const MinimalistSimpleMarketingSkyworkTemplate: ResumeTemplate = {
    id: 'minimalistsimplemarketingskywork',
    name: 'Minimalist simple marketing Skywork',
    html: html
};
