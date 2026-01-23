
import { ResumeTemplate } from './types';

const html = `<style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Noto+Sans:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Arimo:wght@700&family=Noto+Sans:wght@700&display=swap');



        body {
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
            min-width: 794px;
            font-family: 'Noto Sans', sans-serif;
            font-size: 12px;
            color: #171e1c;
        }

        .page {
            background-color: #ffffff;
            width: 794px;
            min-height: 1123px;
            margin: 20px auto;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            padding: 60px 70px;
            box-sizing: border-box;
        }

        .header {
            display: flex;
            align-items: flex-end;
            margin-bottom: 20px;
        }

        .profile-pic {
            width: 154px;
            height: 153px;
            margin-right: 30px;
            background-color: #e0e0e0;
        }

        .header-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: end;
        }

        .header-info h1 {
            font-family: 'Montserrat', sans-serif;
            font-size: 30px;
            font-weight: 700;
            color: #171e1c;
            margin: 0 0 5px 0;
            letter-spacing: 1.5px;
        }

        .header-info .job-title {
            font-family: 'Noto Sans', sans-serif;
            font-size: 16px;
            font-weight: 500;
            color: #171e1c;
            margin: 0;
            letter-spacing: 0.5px;
        }

        .contact-info {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            font-size: 12px;
            font-weight: 500;
        }

        .contact-item {
            display: flex;
            align-items: center;
        }

        .contact-item::before {
            content: '';
            display: inline-block;
            width: 16px;
            height: 16px;
            margin-right: 8px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        }

        .contact-phone::before {
            background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXBob25lIj48cGF0aCBkPSJNMjIgMTYuOTJ2M2ExLjk5OSAxLjk5OSAwIDAgMS0yLjE4IDEuOTlhMTkuNzkgMTkuNzkgMCAwIDEtOC42My0zLjA2IDE5Ljc5IDE5Ljc5IDAgMCAxLTYuMTktNi4xOEE5LjM4IDkuMzggMCAwIDEgMy4yNyA0LjJhMiAyIDAgMCAxIDEuOTItMi4xOGgzYTIgMiAwIDAgMSAyIDEuNzJsMS4yNSA1YTIgMiAwIDAgMS0uNDUgMi4xMWwtMS41IDFoLjc1YTE1IDE1IDAgMCAwIDYuMzYgNi4zNmwxLS40NWEyIDIgMCAwIDEgMi4xMS0uNDVsNSAxLjI1YTIgMiAwIDAgMSAxLjcyIDJ6Ii8+PC9zdmc+');
        }

        .contact-email::before {
            background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLW1haWwiPjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIxNiIgeD0iMiIgeT0iNCIgcng9IjIiLz48cGF0aCBkPSJtMjIgNy04Ljk3IDUuNzJhMS45NCAxLjk0IDAgMCAxLTIuMDYgMEwzIDciLz48L3N2Zz4=');
        }

        .contact-web::before {
            background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdsb2JlIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0yIDEyLjVhMTUuMyAxNS4zIDAgMCAxIDgtMi41YzQgMCA4IDIuNSAxMiA1Ii8+PHBhdGggZD0iTTIgMTIgYTE1LjMgMTUuMyAwIDAgMCA4IDIuNWM0IDAgOC0yLjUgMTItNSIvPjwvc3ZnPg==');
        }

        .section {
            margin-bottom: 25px;
        }

        .section-title {
            font-family: 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: #171e1c;
            margin: 0 0 15px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #000;
            letter-spacing: 0.5px;
        }

        .section p {
            margin: 0;
            line-height: 1.5;
            font-size: 12px;
        }

        .two-col-section {
            display: flex;
            margin-bottom: 20px;
        }

        .left-col {
            width: 160px;
            flex-shrink: 0;
            padding-right: 20px;
        }

        .left-col p {
            margin: 0;
            line-height: 1.5;
        }

        .left-col .date {
            font-family: 'Noto Sans', sans-serif;
            font-weight: 800;
        }

        .right-col {
            flex-grow: 1;
        }

        .right-col h3 {
            font-family: 'Playfair Display', serif;
            font-size: 12px;
            font-weight: 1000;
            margin: 0 0 5px 0;
        }

        .right-col h3 {
            margin: 0;
            line-height: 1.5;
            font-size: 16px;
            font-weight: bold;
        }

        .skills-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 5px 10px;
        }

        .skills-grid ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .skills-grid li {
            position: relative;
            padding-left: 12px;
            margin-bottom: 5px;
        }

        .skills-grid li::before {
            content: '•';
            position: absolute;
            left: 0;
            top: 0;
        }

        .references-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .reference-item .name {
            font-weight: 700;
        }

        .reference-item p {
            margin: 0 0 5px 0;
            line-height: 1.5;
        }

        .reference-details {
            display: flex;
        }

        .reference-details p {
            margin-right: 15px;
        }

        @media print {
            .page {
                box-shadow: none !important;
                margin: 0;
            }
        }
    </style>

    <div class="page" data-cid="OuhXJL">
        <div class="header" data-cid="ncLiCk">
            <img src="https://picture-search.skywork.ai/image/doc/2bb0b21ede173d37e3774dadbdb71228.jpg"
                alt="Sharya Singh Profile Picture" class="profile-pic" data-cid="AP2u3w">
            <div class="header-info" data-cid="3CY4lg">
                <h1 data-cid="2wGn7C">SHARYA SINGH</h1>
                <p class="job-title" data-cid="4QToAU">Web Designer</p>
                <div class="contact-info" data-cid="buynBm">
                    <div class="contact-item contact-phone" data-cid="BQI7aC">+123-456-7890</div>
                    <div class="contact-item contact-email" data-cid="jI6xIw">hello@reallygreatsite.com</div>
                    <div class="contact-item contact-web" data-cid="O6beOG">www.reallygreatsite.com</div>
                </div>
            </div>
        </div>

        <div class="section" data-cid="4lBUZo">
            <h2 class="section-title" data-cid="psjuod">ABOUT ME</h2>
            <p data-cid="cY1gTN">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
                velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
                in culpa qui officia deserunt mollit anim id est laborum</p>
        </div>

        <div class="section" data-cid="ZvA0aS">
            <h2 class="section-title" data-cid="p3Gsi5">EDUCATION</h2>
            <div class="two-col-section" data-cid="rTpwLO">
                <div class="left-col" data-cid="KCtSyw">
                    <p class="date" data-cid="yQmOBi">2020 - 2023</p>
                    <p data-cid="wZwUYH">Wardiere University</p>
                </div>
                <div class="right-col" data-cid="hCFJxM">
                    <h3 data-cid="a2nEEq">Master of IT Management</h3>
                    <p data-cid="Ozsxpy">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sit amet sem nec
                        risus egestas accumsan. In enim nunc, tincidunt ut quam eget, luctus sollicitudin neque.</p>
                </div>
            </div>
            <div class="two-col-section" data-cid="dKcVq6">
                <div class="left-col" data-cid="oBu2tR">
                    <p class="date" data-cid="Ju6rHe">2016 - 2020</p>
                    <p data-cid="3k7OWF">Borcelle University</p>
                </div>
                <div class="right-col" data-cid="bOpNYF">
                    <h3 data-cid="wky91e">Bachelor of Art and Design</h3>
                    <p data-cid="WjYDan">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sit amet sem nec
                        risus egestas accumsan. In enim nunc, tincidunt ut quam eget, luctus sollicitudin neque.</p>
                </div>
            </div>
            <div class="two-col-section" data-cid="w2QziE">
                <div class="left-col" data-cid="FIf0TR">
                    <p class="date" data-cid="wp0ItH">2012 - 2016</p>
                    <p data-cid="yIs3HA">Wardiere High School</p>
                </div>
                <div class="right-col" data-cid="qGS1pK">
                    <h3 data-cid="Lom6IY">Major Of Art and Design</h3>
                    <p data-cid="FFAF5a">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sit amet sem nec
                        risus egestas accumsan. In enim nunc, tincidunt ut quam eget, luctus sollicitudin neque.</p>
                </div>
            </div>
        </div>

        <div class="section" data-cid="wE0XvH">
            <h2 class="section-title" data-cid="qpuhgs">EXPERIENCE</h2>
            <div class="two-col-section" data-cid="Lzn7mp">
                <div class="left-col" data-cid="oHFRRR">
                    <p class="date" data-cid="xtwyzn">2020 - 2023</p>
                    <p data-cid="dI0Dot">Wardiere Company</p>
                </div>
                <div class="right-col" data-cid="rakx1D">
                    <h3 data-cid="3BCzl3">Web Designer</h3>
                    <p data-cid="HRJKbb">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sit amet sem nec
                        risus egestas accumsan. In enim nunc, tincidunt ut quam eget, luctus sollicitudin neque.</p>
                </div>
            </div>
            <div class="two-col-section" data-cid="71clHG">
                <div class="left-col" data-cid="VOhwaH">
                    <p class="date" data-cid="TAkF6P">2016 - 2020</p>
                    <p data-cid="CafeBi">Borcelle Studio</p>
                </div>
                <div class="right-col" data-cid="zVCDwU">
                    <h3 data-cid="6618OJ">Web Designer</h3>
                    <p data-cid="ziZWYJ">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sit amet sem nec
                        risus egestas accumsan. In enim nunc, tincidunt ut quam eget, luctus sollicitudin neque.</p>
                </div>
            </div>
        </div>

        <div class="section" data-cid="wvLxB7">
            <h2 class="section-title" data-cid="EILGtP">SKILLS</h2>
            <div class="skills-grid" data-cid="YfSjml">
                <ul data-cid="VjOBEc">
                    <li data-cid="TTAy6o">Web Design Tools</li>
                    <li data-cid="Ouwiab">Front-End</li>
                </ul>
                <ul data-cid="kCzdKR">
                    <li data-cid="23YXjr">Web Accessibility</li>
                    <li data-cid="bOSBHz">Version Control</li>
                </ul>
                <ul data-cid="xRm61O">
                    <li data-cid="5PuzCb">Color Theory</li>
                    <li data-cid="2lt7uw">SEO Fundamentals</li>
                </ul>
                <ul data-cid="wORqis">
                    <li data-cid="NlLdjE">UI/UX Design</li>
                    <li data-cid="PAd3HY">Typography</li>
                </ul>
            </div>
        </div>

        <div class="section" data-cid="nwGPnG">
            <h2 class="section-title" data-cid="nwZqkk">REFERENCES</h2>
            <div class="references-grid" data-cid="CWBR0E">
                <div class="reference-item" data-cid="PoTdFT">
                    <p class="name" data-cid="3nJpa8">Niranjan Devi</p>
                    <p data-cid="GLsUlQ">CEO of Wardiere Company</p>
                    <div class="reference-details" data-cid="bwxbXx">
                        <p data-cid="s0JGDJ">Phone: 123-456-7890</p>
                        <p data-cid="Aq5NaH">Social: @reallygreatsite</p>
                    </div>
                </div>
                <div class="reference-item" data-cid="BjtdRH">
                    <p class="name" data-cid="B0M2RH">Aarya Agarwal</p>
                    <p data-cid="PMhjAZ">HRD of Wardiere Company</p>
                    <div class="reference-details" data-cid="CEv26I">
                        <p data-cid="fSrJZg">Phone: 123-456-7890</p>
                        <p data-cid="AFKPCN">Social: @reallygreatsite</p>
                    </div>
                </div>
            </div>
        </div>
    </div>


`;

export const BkackAndWhiteProfessionalSkyworkTemplate: ResumeTemplate = {
    id: 'bkackandwhiteprofessionalskywork',
    name: 'Bkack and white professional Skywork',
    html: html
};
