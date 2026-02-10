
import { ResumeTemplate } from './types';

const html = `<style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Calibri&display=swap');

        body {
            background-color: #f0f0f0;
            font-family: 'Open Sans', sans-serif;
            min-width: 816px;
            margin: 0;
            padding: 2em 0;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .page {
            background-color: #ffffff;
            width: 816px;
            min-height: 1056px;
            display: flex;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            margin-bottom: 0.2em;
        }

        .left-column {
            background-color: #3D3D78;
            width: 33%;
            color: #ffffff;
            padding: 40px 30px;
            box-sizing: border-box;
        }

        .right-column {
            width: 67%;
            border-top: 10px solid #3D3D78;
            border-bottom: 10px solid #3D3D78;
            border-right: 10px solid #3D3D78;
        }

        .profile-pic-container {
            text-align: center;
            margin-bottom: 30px;
        }

        .profile-pic {
            width: 124px;
            height: 124px;
            border-radius: 50%;
        }

        .left-section {
            position: relative;
            margin-bottom: 25px;
        }

        .left-section .divider {
            position: absolute;
            width: calc(100% + 30px);
            left: 0;
            height: 1px;
            background: #fff;
            top: 32px;
        }

        .left-section h2 {
            font-family: 'Open Sans', sans-serif;
            font-weight: 700;
            font-size: 17px;
            margin: 0 0 15px 0;
            padding-bottom: 8px;
            text-transform: uppercase;
        }

        .left-section p,
        .left-section li {
            font-size: 10px;
            line-height: 1.6;
            margin: 0 0 10px 0;
        }

        .left-section strong {
            font-weight: 700;
            font-size: 11px;
        }

        .education-item {
            margin-bottom: 15px;
        }

        .education-item p {
            margin: 0;
        }

        .education-item .degree {
            font-weight: 700;
            font-size: 11px;
        }

        .expertise-list {
            list-style-type: disc;
            padding-left: 10px;
            margin: 0;
        }

        .expertise-list li {
            padding-left: 10px;
            margin-bottom: 10px;
        }

        .right-header {
            padding: 20px 20px 20px 20px;
        }

        .right-header h1 {
            font-family: 'Open Sans', sans-serif;
            font-size: 34px;
            color: #3D3D78;
            margin: 0;
            font-weight: 700;
        }

        .right-header .subtitle {
            font-family: 'Open Sans', sans-serif;
            font-size: 15px;
            color: #323b4c;
            margin: 5px 0 15px 0;
            letter-spacing: 0.15em;
            font-weight: 600;
        }

        .right-header .summary {
            font-size: 10px;
            color: #77797e;
            line-height: 1.6;
        }

        .right-content {
            padding: 10px 20px 20px 20px;
        }

        .right-section {
            margin-bottom: 25px;
        }

        .right-section h2 {
            font-family: 'Calibri', sans-serif;
            font-size: 20px;
            color: #323b4c;
            margin: 0 0 8px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #dcdcdc;
            font-weight: bold;
        }

        .timeline {
            position: relative;
            padding-left: 25px;
        }

        .timeline::before {
            content: '';
            position: absolute;
            left: 7px;
            top: 8px;
            bottom: 8px;
            width: 1px;
            background-color: #323b4c;
        }

        .timeline-item {
            position: relative;
            margin-bottom: 40px;
        }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: -25px;
            top: 5px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #ffffff;
            border: 2px solid #323b4c;
            z-index: 1;
        }

        .timeline-item:last-child {
            margin-bottom: 0;
        }

        .timeline-item p {
            margin: 0;
            font-size: 10px;
            line-height: 1.6;
            color: #6b6767;
        }

        .timeline-item .date-company {
            font-size: 11px;
            color: #6b6767;
            margin-bottom: 4px;
        }

        .timeline-item .job-title {
            font-weight: 700;
            font-size: 12px;
            color: #323b4c;
            margin-bottom: 8px;
        }

        .references-container {
            display: flex;
            justify-content: space-between;
        }

        .reference-item {
            width: 48%;
        }

        .reference-item p {
            font-size: 10.5px;
            margin: 0 0 3px 0;
            line-height: 1.5;
            color: #323b4c;
        }

        .reference-item .ref-name {
            font-weight: 700;
            font-size: 12px;
        }

        .reference-item .ref-contact {
            font-size: 10px;
        }

        .reference-item .ref-contact strong {
            font-weight: 600;
        }

        @media print {
            .page {
                box-shadow: none !important;
                margin: 0;
            }
        }
    </style>

    <div class="page" data-cid="Qdb1Wl">
        <div class="left-column" data-cid="UCt1E4">
            <div class="profile-pic-container" data-cid="FiYWSc">
                <img src="https://static-us-img.skywork.ai/router/agent/2025-10-17/20251017-100505_9882ff2d833a4d5db16866ee0a0a2794.png"
                    alt="Mariana Anderson" class="profile-pic" data-cid="qKt6h1">
            </div>

            <div class="left-section" data-cid="4dzk4t">
                <h2 data-cid="hDaUyw">Contact</h2>
                <div class="divider editor-empty-block" data-cid="hpHen7"></div>
                <p data-cid="WnT2jn"><strong data-cid="yG4gZl">Phone</strong><br data-cid="E6DcZb">123-456-7890</p>
                <p data-cid="e21q4C"><strong data-cid="etMTlw">Email</strong><br
                        data-cid="dIT3im">hello@reallygreatsite.com</p>
                <p data-cid="NvMI8U"><strong data-cid="D4faQ5">Address</strong><br data-cid="qj1Mah">123 Anywhere St.,
                    Any City</p>
            </div>

            <div class="left-section" data-cid="Rs37Zf">
                <h2 data-cid="BHB6w3">Education</h2>
                <div class="divider editor-empty-block" data-cid="f8fecn"></div>
                <div class="education-item" data-cid="83bu00">
                    <p data-cid="EwUgp0">2020 - 2023</p>
                    <p class="degree" data-cid="JX8eI5">Bachelor of Business Management</p>
                    <p data-cid="HRvEo5">Borcelle University</p>
                </div>
                <div class="education-item" data-cid="ZCaKBT">
                    <p data-cid="oSyCQn">2012 - 2016</p>
                    <p class="degree" data-cid="hrWLOo">Bachelor of Business Management</p>
                    <p data-cid="LFzhMa">Borcelle University</p>
                </div>
            </div>

            <div class="left-section" data-cid="u86EPf">
                <h2 data-cid="AnVBuT">Expertise</h2>
                <div class="divider editor-empty-block" data-cid="2Q7VvK"></div>
                <ul class="expertise-list" data-cid="daJw5E">
                    <li data-cid="CcaZX2">UI/UX</li>
                    <li data-cid="rUFt27">Visual Design</li>
                    <li data-cid="3M1YHL">Wireframes</li>
                    <li data-cid="oADAr1">Storyboards</li>
                    <li data-cid="CYEcDM">User Flows</li>
                    <li data-cid="H1tsru">Process Flows</li>
                </ul>
            </div>

            <div class="left-section" data-cid="RXtkMt">
                <h2 data-cid="VTOW7h">Language</h2>
                <p data-cid="g0fUYS">English</p>
                <p data-cid="Kpso1A">Spanish</p>
            </div>
        </div>

        <div class="right-column" data-cid="OHMsrG">
            <div class="right-header" data-cid="RGE7yV">
                <h1 data-cid="wpkM1u">Mariana Anderson</h1>
                <p class="subtitle" data-cid="YHZr4K">Marketing Manager</p>
                <p class="summary" data-cid="wDyrZE">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sit
                    amet sem nec risus
                    egestas accumsan. In enim nunc, tincidunt ut quam eget, luctus sollicitudin neque. Sed leo nisl,
                    semper ac hendrerit a, sollicitudin in arcu.</p>
            </div>
            <div class="right-content" data-cid="GWxgP1">
                <div class="right-section" data-cid="a7SZu2">
                    <h2 data-cid="Xeq8Oy">Experience</h2>
                    <div class="timeline" data-cid="bHEFQD">
                        <div class="timeline-item" data-cid="Le5jzG">
                            <p class="date-company editor-empty-block" data-cid="21qJYa">2022 - 2025<br
                                    data-cid="B4keiD">Ginyard International Co. 123 Anywhere St., Any City
                            </p>
                            <p class="job-title" data-cid="1aQVRf">Marketing Manager</p>
                            <p data-cid="6inX7z">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
                                pharetra in lorem at
                                laoreet. Donec hendrerit libero eget est tempor, quis tempus arcu elementum. In
                                elementum elit at dui tristique feugiat. Mauris convallis, mi at mattis malesuada, neque
                                nulla volutpat dolor, hendrerit faucibus eros nibh ut nunc. Proin luctus urna id nunc
                                sagittis dignissim. Sed in libero sed libero dictum dapibus. Vivamus fermentum est eget
                                lorem aliquet, vel tempus metus dignissim. Donec risus arcu, tristique et sollicitudin
                                blandit, iaculis ut nisl. Integer rutrum ultricies fringilla.</p>
                        </div>
                        <div class="timeline-item" data-cid="foctsN">
                            <p class="date-company editor-empty-block" data-cid="NACJRx">2020 - 2022<br
                                    data-cid="bB7l0O">Ginyard International Co. 123 Anywhere St., Any City
                            </p>
                            <p class="job-title" data-cid="nxpngd">Inside Sales Representative</p>
                            <p data-cid="i9els5">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
                                pharetra in lorem at
                                laoreet. Donec hendrerit libero eget est tempor, quis tempus arcu elementum. In
                                elementum elit at dui tristique feugiat. Mauris convallis, mi at mattis malesuada, neque
                                nulla volutpat dolor, hendrerit faucibus eros nibh ut nunc. Proin luctus urna id nunc
                                sagittis dignissim. Sed in libero sed libero dictum dapibus. Vivamus fermentum est eget
                                lorem aliquet, vel tempus metus dignissim. Donec risus arcu, tristique et sollicitudin
                                blandit, iaculis ut nisl. Integer rutrum ultricies fringilla.</p>
                        </div>
                        <div class="timeline-item" data-cid="gHuHEG">
                            <p class="date-company editor-empty-block" data-cid="ePImoK">2018 - 2020<br
                                    data-cid="GMzdIA">Ginyard International Co. 123 Anywhere St., Any City
                            </p>
                            <p class="job-title" data-cid="VzV86B">Inside Sales Representative</p>
                            <p data-cid="OJ3OmM">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
                                pharetra in lorem at
                                laoreet. Donec hendrerit libero eget est tempor, quis tempus arcu elementum. In
                                elementum elit at dui tristique feugiat. Mauris convallis, mi at mattis malesuada, neque
                                nulla volutpat dolor, hendrerit faucibus eros nibh ut nunc. Proin luctus urna id nunc
                                sagittis dignissim. Sed in libero sed libero dictum dapibus. Vivamus fermentum est eget
                                lorem aliquet, vel tempus metus dignissim. Donec risus arcu, tristique et sollicitudin
                                blandit, iaculis ut nisl. Integer rutrum ultricies fringilla.</p>
                        </div>
                    </div>
                </div>
                <div class="right-section" data-cid="DvEvft">
                    <h2 data-cid="5nO6YE">Reference</h2>
                    <div class="references-container" data-cid="0Hgbi4">
                        <div class="reference-item" data-cid="xIzUPp">
                            <p class="ref-name" data-cid="62vp4W">Harumi Kobayashi</p>
                            <p data-cid="EMWDtA">Wardiere Inc. / CEO</p>
                            <p class="ref-contact" data-cid="1Vzp8Q"><strong data-cid="cN16Th">Phone:</strong>
                                123-456-7890</p>
                            <p class="ref-contact" data-cid="0bcx4y"><strong data-cid="l8LBm1">Email:</strong>
                                hello@reallygreatsite.com</p>
                        </div>
                        <div class="reference-item" data-cid="JN3V5t">
                            <p class="ref-name" data-cid="yGso6c">Bailey Dupont</p>
                            <p data-cid="KZCw2l">Wardiere Inc. / CEO</p>
                            <p class="ref-contact" data-cid="K6Iqmk"><strong data-cid="qUAst0">Phone:</strong>
                                123-456-7890</p>
                            <p class="ref-contact" data-cid="JpEo55"><strong data-cid="Goamlr">Email:</strong>
                                hello@reallygreatsite.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>



`;

export const Template2ColumnTimelineSkyworkTemplate: ResumeTemplate = {
    id: '2columntimelineskywork',
    name: '2 column timeline Skywork',
    html: html
};
