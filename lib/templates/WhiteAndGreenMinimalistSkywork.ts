
import { ResumeTemplate } from './types';

const html = `<style>
        @font-face {
            font-family: 'NotoSans';
            src: url('https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC5A4PNr5TRA.woff2') format('woff2');
            font-weight: normal;
        }

        @font-face {
            font-family: 'NotoSans';
            src: url('https://fonts.gstatic.com/s/notosans/v27/o-0NIpQlx3QUlC5A4PNjXhFVadyB.woff2') format('woff2');
            font-weight: bold;
        }

        body {
            background-color: #f0f0f0;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            font-family: 'NotoSans', sans-serif;
            min-width: 794px;
        }

        .page {
            background-color: #ffffff;
            width: 794px;
            min-height: 1123px;
            margin: 0.2em 0;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            padding: 40px 40px;
            box-sizing: border-box;
        }

        .header {
            display: flex;
            align-items: center;
            margin-bottom: 50px;
        }

        .profile-pic {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            margin-right: 25px;
        }

        .header-title {
            flex-grow: 1;
        }

        .header-title h1 {
            font-size: 34.6px;
            color: #57b5b2;
            font-weight: bold;
            margin: 0;
            line-height: 1.1;
        }

        .header-title p {
            font-size: 14px;
            color: #282522;
            margin: 5px 0 0 0;
            letter-spacing: 0.5px;
        }

        .contact-info {
            text-align: right;
            font-size: 12px;
            color: #282522;
        }

        .contact-info div {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-bottom: 6px;
        }

        .contact-info img {
            width: 12px;
            height: 12px;
            margin-left: 8px;
        }

        .main-content {
            display: flex;
            flex-direction: column;
        }

        .left-column {
            display: flex;
            flex-direction: column;
            width: 25%;
            box-sizing: border-box;
        }

        .right-column {
            width: 75%;
            padding-left: 20px;
            box-sizing: border-box;
        }

        .right-column.bottom {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
        }

        .section-title {
            display: flex;
            font-size: 18px;
            font-weight: bold;
            color: #282522;
            margin-bottom: 20px;
            padding-bottom: 5px;
            align-items: center;
            justify-content: space-between;
        }

        .section-title::after {
            content: '';
            width: calc(75% - 20px);
            border-top: 1px dashed #000;
        }

        .section {
            display: flex;
            flex-direction: column;
            margin-bottom: 25px;
        }

        .left-column .item {
            margin-bottom: 25px;
        }

        .left-column .item-title {
            font-size: 12px;
            font-weight: bold;
            color: #282522;
            margin: 0;
        }

        .left-column .item-date {
            font-size: 12px;
            color: #282522;
            margin: 2px 0 0 0;
        }

        .right-column .item-title {
            font-size: 12px;
            font-weight: bold;
            color: #282522;
            margin: 0 0 8px 0;
        }

        .right-column .item-description {
            font-size: 12px;
            color: #282522;
            line-height: 1.5;
            margin: 0;
        }

        .dotted-separator {
            border-bottom: 1px dotted #cccccc;
            margin: 20px 0;
        }

        .bottom-section {
            display: flex;
            margin-top: 40px;
        }

        .bottom-left,
        .bottom-right {
            width: 50%;
        }

        .bottom-left {
            padding-right: 30px;
            box-sizing: border-box;
        }

        .bottom-right {
            padding-left: 30px;
            box-sizing: border-box;
        }

        .reference-item,
        .expertise-item {
            margin-bottom: 15px;
        }

        .reference-name {
            font-size: 12px;
            font-weight: bold;
            margin: 0;
        }

        .reference-details {
            font-size: 12px;
            color: #282522;
            line-height: 1.8;
            margin: 2px 0 0 0;
        }

        .expertise-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .expertise-label {
            margin-right: 20px;
            font-size: 12px;
            color: #282522;
        }

        .expertise-bar {
            width: 120px;
            height: 6px;
            background-color: #e0e0e0;
            border-radius: 3px;
            position: relative;
        }

        .expertise-level {
            height: 100%;
            background-color: #57b5b2;
            border-radius: 3px;
            position: absolute;
        }

        .level-1 {
            width: 85%;
        }

        .level-2 {
            width: 90%;
        }

        .level-3 {
            width: 80%;
        }

        .section-content {
            display: flex;
        }

        .divider {
            flex: 1;
        }

        .section-title-bottom {
            display: flex;
            font-size: 18px;
            justify-content: space-between;
        }

        .divider-title {
            display: flex;
            width: calc(75% - 20px);
            align-items: center;
        }

        .divider-title::before,
        .divider-title::after {
            content: '';
            flex: 1;
            border-top: 1px dashed #000;
        }

        .divider-title::before {
            margin-right: 20px;
        }

        .divider-title::after {
            margin-left: 20px;
        }

        .left-column .item-title.nobold {
            font-weight: normal;
        }

        .bold {
            font-weight: bold;
        }

        @media print {
            .page {
                box-shadow: none !important;
                margin: 0;
            }
        }
    </style>

    <div class="page" data-cid="dg4Crd">
        <div class="header" data-cid="7cCse7">
            <img src="https://picture-search.skywork.ai/image/doc/711b2ca4a9e2586014259da3cbd565c0.jpg"
                alt="Korina Villanueva" class="profile-pic" data-cid="zpDVpg">
            <div class="header-title" data-cid="wTewKr">
                <h1 data-cid="hlw6kH" class="editor-empty-block">Korina<br data-cid="FPwC8k">Villanueva</h1>
                <p data-cid="14Vvvd">Professional Accountant</p>
            </div>
            <div class="contact-info" data-cid="eCEFMH">
                <div data-cid="igHD2I">
                    <span data-cid="4zXd0g">+123-456-7890</span>
                    <img src="https://api.iconify.design/mdi/phone.svg?color=%2372B4B1" alt="Phone icon"
                        data-cid="oIwHX1">
                </div>
                <div data-cid="tMD2YJ">
                    <span data-cid="EnasHJ">hello@reallygreatsite.com</span>
                    <img src="https://api.iconify.design/mdi/email.svg?color=%2372B4B1" alt="Email icon"
                        data-cid="6pBEzI">
                </div>
                <div data-cid="1UgakM">
                    <span data-cid="cBGb6l">123 Anywhere St., Any City</span>
                    <img src="https://api.iconify.design/mdi/location.svg?color=%2372B4B1" alt="Location icon"
                        data-cid="mAJCzC">
                </div>
            </div>
        </div>

        <div class="main-content" data-cid="EL0yw4">

            <div class="section" data-cid="XLq0U1">
                <h2 class="section-title" data-cid="dJSE5q">Work Experience</h2>
                <div class="section-content" data-cid="buiLNk">
                    <div class="left-column" data-cid="LKoS6q">
                        <div class="item" data-cid="J1Fbfy">
                            <p class="item-titl nobold" data-cid="CuvpmF">Professional Accountant</p>
                            <p class="item-date bold" data-cid="mTZQvB">2019 - 2022</p>
                        </div>
                    </div>
                    <div class="right-column" data-cid="qb7SVO">
                        <div class="item" data-cid="AjcDcf">
                            <p class="item-title" data-cid="tsa79x">Liceria &amp; Co. l 123 Anywhere St., Any City</p>
                            <p class="item-description" data-cid="4lXkd3">Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit. Mauris sodales enim vitae elit imperdiet ornare. Nulla facilisi. Nullam
                                egestas elementum elit id efficitur. Maecenas et turpis at orci interdum rhoncus finibus
                                sit amet quam. Nam eu molestie neque. Etiam quis risus lacus. Donec consequat risus in
                                purus maximus efficitur a vel orci. Etiam eu sapien quis felis mollis interdum et eget
                                nisl. Vestibulum ac vehicula risus. Fusce euismod mattis urna, ut euismod urna porta
                                non. Sed ut libero mattis tortor sollicitudin sollicitudin vitae non dui.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section" data-cid="I05b0p">
                <div class="section-content" data-cid="Z4XpoI">
                    <div class="left-column" data-cid="uKYXTn">
                        <div class="item" data-cid="rfu4ad">
                            <p class="item-title nobold" data-cid="2sbtJE">Financial Analyst</p>
                            <p class="item-date bold" data-cid="B5gaAb">2017 - 2019</p>
                        </div>
                    </div>
                    <div class="right-column" data-cid="VPkpkl">
                        <div class="item" data-cid="VeV9Lk">
                            <p class="item-title" data-cid="q7JRFA">Liceria &amp; Co. l 123 Anywhere St., Any City</p>
                            <p class="item-description" data-cid="g1PQ1j">Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit. Mauris sodales enim vitae elit imperdiet ornare. Nulla facilisi. Nullam
                                egestas elementum elit id efficitur. Maecenas et turpis at orci interdum rhoncus finibus
                                sit amet quam. Nam eu molestie neque. Etiam quis risus lacus. Donec consequat risus in
                                purus maximus efficitur a vel orci. Etiam eu sapien quis felis mollis interdum et eget
                                nisl. Vestibulum ac vehicula risus. Fusce euismod mattis urna, ut euismod urna porta
                                non. Sed ut libero mattis tortor sollicitudin sollicitudin vitae non dui.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section" data-cid="2df00C">
                <div class="section-content" data-cid="AsAccR">
                    <div class="left-column" data-cid="ZB8R6R">
                        <div class="item" data-cid="h1QO63">
                            <p class="item-title nobold" data-cid="kpAntB">Financial Analyst</p>
                            <p class="item-date bold " data-cid="AUhJMA">2015 - 2017</p>
                        </div>
                    </div>
                    <div class="right-column" data-cid="pQfiyz">
                        <div class="item" data-cid="8lk6FI">
                            <p class="item-title nobold" data-cid="MoLg6e">Liceria &amp; Co. l 123 Anywhere St., Any
                                City</p>
                            <p class="item-description " data-cid="ZlbjzP">Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit. Mauris sodales enim vitae elit imperdiet ornare. Nulla facilisi. Nullam
                                egestas elementum elit id efficitur. Maecenas et turpis at orci interdum rhoncus finibus
                                sit amet quam. Nam eu molestie neque. Etiam quis risus lacus. Donec consequat risus in
                                purus maximus efficitur a vel orci. Etiam eu sapien quis felis mollis interdum et eget
                                nisl. Vestibulum ac vehicula risus. Fusce euismod mattis urna, ut euismod urna porta
                                non. Sed ut libero mattis tortor sollicitudin sollicitudin vitae non dui.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section" data-cid="WVzRWF">
                <h2 class="section-title" data-cid="IyGlwi">Education</h2>
                <div class="section-content" data-cid="IplQxT">
                    <div class="left-column" data-cid="e3Q2DJ">
                        <div class="item" data-cid="tl93JF">
                            <p class="item-title nobold" data-cid="EhjRDs">Master of Business Administration</p>
                            <p class="item-date bold" data-cid="Km9VtP">2012 - 2015</p>
                        </div>
                    </div>

                    <div class="right-column" data-cid="MGX3b8">
                        <div class="item" data-cid="rO4Zuh">
                            <p class="item-title" data-cid="KqEklq">University of Lorem l 123 Anywhere St., Any City</p>
                            <p class="item-description" data-cid="e7piEd">Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit. Mauris sodales enim vitae elit imperdiet ornare. Nulla facilisi. Nullam
                                egestas elementum elit id efficitur. Maecenas et turpis at orci interdum rhoncus finibus
                                sit amet quam.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section" data-cid="xMX6HG">
                <div class="section-content" data-cid="AmImSG">
                    <div class="left-column" data-cid="peKfHB">
                        <div class="item" data-cid="TSRXJZ">
                            <p class="item-title nobold" data-cid="7IxPoJ">Master of Business Administration</p>
                            <p class="item-date bold" data-cid="wdi9FV">2009 - 2012</p>
                        </div>
                    </div>
                    <div class="right-column" data-cid="phrE59">
                        <div class="item" data-cid="SNBEwG">
                            <p class="item-title" data-cid="SQEKjI">University of Lorem l 123 Anywhere St., Any City</p>
                            <p class="item-description" data-cid="xzJH80">Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit. Mauris sodales enim vitae elit imperdiet ornare. Nulla facilisi. Nullam
                                egestas elementum elit id efficitur. Maecenas et turpis at orci interdum rhoncus finibus
                                sit amet quam.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section" data-cid="Jb6hUx">
            <h2 class="section-title-bottom" data-cid="cDCMx1">
                <p data-cid="9xcr3I">References</p>
                <p class="divider-title" data-cid="sCFe2r">Expertise</p>
            </h2>

            <div class="section-content" data-cid="vUPmv1">
                <div class="left-column" data-cid="ITRzFv">
                    <div class="reference-item" data-cid="YJtCSv">
                        <p class="reference-name" data-cid="AQycoZ">Bailey Dupont</p>
                        <p class="reference-details editor-empty-block" data-cid="1oZOLu">Wardiere Inc. / CEO<br
                                data-cid="e8pVyN">Phone: 123-456-7890<br data-cid="8BSfUR">Email:
                            hello@reallygreatsite.com</p>
                    </div>
                </div>
                <div class="right-column bottom" data-cid="sWsa7w">
                    <div class="reference-item" data-cid="nT018J">
                        <p class="reference-name" data-cid="f78BUJ">Harumi Kobayashi</p>
                        <p class="reference-details editor-empty-block" data-cid="r4yIiB">Wardiere Inc. / CEO<br
                                data-cid="14W3M1">Phone: 123-456-7890<br data-cid="fpleVw">Email:
                            hello@reallygreatsite.com</p>
                    </div>
                    <div data-cid="O5tYNH">
                        <div class="expertise-item" data-cid="qAMhzo">
                            <span class="expertise-label" data-cid="sJQ7K8">UI/UX</span>
                            <div class="expertise-bar" data-cid="9IrTlK">
                                <div class="expertise-level level-1 editor-empty-block" data-cid="IszrV0"></div>
                            </div>
                        </div>
                        <div class="expertise-item" data-cid="UbxNhk">
                            <span class="expertise-label" data-cid="KZh3MH">Visual Design</span>
                            <div class="expertise-bar" data-cid="t5SqTy">
                                <div class="expertise-level level-2 editor-empty-block" data-cid="ku47cG"></div>
                            </div>
                        </div>
                        <div class="expertise-item" data-cid="G8uKuy">
                            <span class="expertise-label" data-cid="ehw2ht">Wireframes</span>
                            <div class="expertise-bar" data-cid="5Wvm9i">
                                <div class="expertise-level level-3 editor-empty-block" data-cid="Ux4MUZ"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- The image d830335842b06398a35b8051bc8b0de3.jpg from the markdown is a crop of the expertise bars, which have been recreated using CSS. -->
    </div>


`;

export const WhiteAndGreenMinimalistSkyworkTemplate: ResumeTemplate = {
    id: 'whiteandgreenminimalistskywork',
    name: 'White and green minimalist Skywork',
    html: html
};
