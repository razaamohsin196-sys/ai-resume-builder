
import { ResumeTemplate } from './types';

const html = `<style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');

        body {
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
            min-width: 794px;
            font-family: 'Playfair Display', serif;
            color: #333;
        }

        .page {
            background-color: #ffffff;
            width: 794px;
            min-height: 1123px;
            margin: 0 auto;
            margin-bottom: 0.2em;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            box-sizing: border-box;
            padding: 60px 60px 0 60px;
            position: relative;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
        }

        .header-left h1 {
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            font-size: 56px;
            margin: 0;
            line-height: 1.1;
            letter-spacing: 1px;
        }

        .header-left .title {
            display: inline-block;
            background-color: #f0ebe3;
            border-radius: 20px;
            padding: 8px 20px;
            margin-top: 15px;
            font-size: 15.6px;
            color: #7a7162;
            font-weight: 400;
        }

        .header-right {
            position: relative;
            width: 250px;
            height: 167px;
        }

        .header-right img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .arrow-icon-wrapper {
            bottom: -15px;
            right: -30px;
            position: absolute;
            padding: 10px;
            background-color: #8c8376;
        }

        .header-right .arrow-icon {
            background-color: #8c8376;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #fff;
        }

        .arrow-icon svg {
            width: 24px;
            height: 24px;
            fill: white;
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 700;
            color: #7a7162;
        }

        .section-title img {
            width: 24px;
            height: 24px;
        }

        .section-title {
            padding-bottom: 20px;
            border-bottom: 1px solid #e0e0e0;
        }

        .about-me p {
            font-size: 14px;
            line-height: 1.6;
            color: #555;
            margin: 0 0 30px 0;
            font-weight: 400;
        }

        .main-content {
            display: flex;
            gap: 40px;
        }

        .left-column,
        .right-column {
            width: calc(50% - 20px);
        }

        .job,
        .education-item {
            margin-bottom: 25px;
            padding-left: 25px;
            position: relative;
        }

        .carbon--circle-filled {
            margin-right: 10px;
            display: inline-block;
            width: 20px;
            height: 20px;
            --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='10' fill='%23000'/%3E%3Cpath fill='%23000' d='M16 30a14 14 0 1 1 14-14a14.016 14.016 0 0 1-14 14m0-26a12 12 0 1 0 12 12A12.014 12.014 0 0 0 16 4'/%3E%3C/svg%3E");
            background-color: currentColor;
            -webkit-mask-image: var(--svg);
            mask-image: var(--svg);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
        }

        .job h3,
        .education-item h3 {
            font-size: 16px;
            font-weight: 700;
            margin: 0 0 5px 0;
        }

        .job .details,
        .education-item .details {
            display: inline-block;
            background-color: #f0ebe3;
            border-radius: 15px;
            padding: 4px 12px;
            font-size: 14px;
            color: #7a7162;
            margin-bottom: 10px;
        }

        .job ul,
        .right-column ul {
            list-style-type: none;
            padding-left: 50px;
            margin: 0;
            font-size: 14px;
            color: #555;
            line-height: 1.6;
        }

        .job ul li::before,
        .right-column ul li::before {
            content: '•';
            color: #333;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
        }

        .education-item p {
            font-size: 14px;
            color: #555;
            margin: 0;
        }

        .right-column .section {
            margin-bottom: 30px;
        }

        .footer {
            width: 50%;
            position: absolute;
            bottom: 0;
            right: 0;
            background-color: #8c8376;
            color: white;
            padding: 15px 20px;
            box-sizing: border-box;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            font-weight: 400;
            flex-wrap: wrap;
        }

        .footer-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            line-height: 2;
        }

        .footer-item svg {
            width: 16px;
            height: 16px;
            fill: white;
        }

        .solar--medal-ribbon-bold {
            display: inline-block;
            width: 24px;
            height: 24px;
            --svg: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iX+WbvuWxgl8xIiBkYXRhLW5hbWU9IuWbvuWxgl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxMi4yNCAxOC40OCI+CiAgPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI5LjYuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDIuMS4xIEJ1aWxkIDkpICAtLT4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLnN0MCB7CiAgICAgICAgZmlsbDogbm9uZTsKICAgICAgfQoKICAgICAgLnN0MSB7CiAgICAgICAgZmlsbDogIzdhNzE2MjsKICAgICAgfQoKICAgICAgLnN0MiB7CiAgICAgICAgY2xpcC1wYXRoOiB1cmwoI2NsaXBwYXRoKTsKICAgICAgfQogICAgPC9zdHlsZT4KICAgIDxjbGlwUGF0aCBpZD0iY2xpcHBhdGgiPgogICAgICA8cmVjdCBjbGFzcz0ic3QwIiB3aWR0aD0iMTIuMjQiIGhlaWdodD0iMTguNDgiLz4KICAgIDwvY2xpcFBhdGg+CiAgPC9kZWZzPgogIDxnIGNsYXNzPSJzdDIiPgogICAgPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI4LjQ3IDExLjk2IDguMTUgMTIuNDggNy44OSAxMi45IDcuNDYgMTIuNjYgNy4xIDEyLjQ3IDYuNCAxNS4xIDcuMjYgMTguMyA4LjQ5IDE2LjE2IDEwLjYyIDE3LjQgOS4yMiAxMi4xNSA5LjA1IDEyLjEgOC40NyAxMS45NiIvPgogICAgPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI1Ljc3IDEyLjc5IDUuMzMgMTIuMzcgNC44IDEyLjY2IDQuMzcgMTIuOSA0LjExIDEyLjQ4IDMuNzkgMTEuOTYgMy4yMSAxMi4xIDMuMDUgMTIuMTQgMS42NSAxNy40IDMuNzggMTYuMTYgNS4wMSAxOC4zIDYuNDggMTIuODEgNi4xMyAxMy4xNCA1Ljc3IDEyLjc5Ii8+CiAgICA8ZWxsaXBzZSBjbGFzcz0ic3QxIiBjeD0iNi4xMyIgY3k9IjYuMzEiIHJ4PSI0LjA5IiByeT0iNC4xIi8+CiAgICA8cGF0aCBjbGFzcz0ic3QxIiBkPSJNMTAuMzgsOC4xMWMtLjIzLjU1LS41NiwxLjA1LS45OSwxLjQ3LS40Mi40Mi0uOTIuNzYtMS40Ny45OS0uNTcuMjQtMS4xNy4zNi0xLjc5LjM2cy0xLjIzLS4xMi0xLjc5LS4zNmMtLjU1LS4yMy0xLjA0LS41Ny0xLjQ3LS45OS0uNDItLjQyLS43NS0uOTItLjk5LTEuNDctLjI0LS41Ny0uMzYtMS4xOC0uMzYtMS44cy4xMi0xLjIzLjM2LTEuOGMuMjMtLjU1LjU2LTEuMDUuOTktMS40N3MuOTItLjc2LDEuNDctLjk5Yy41Ny0uMjQsMS4xNy0uMzYsMS43OS0uMzZzMS4yMy4xMiwxLjc5LjM2Yy41NS4yMywxLjA0LjU3LDEuNDcuOTlzLjc1LjkyLjk5LDEuNDdjLjI0LjU3LjM2LDEuMTguMzYsMS44cy0uMTIsMS4yMy0uMzYsMS44Wk0xMS41NCw3LjAybC42OC0uNzEtLjY4LS43MS40Ny0uODctLjg0LS41Mi4yMy0uOTYtLjk0LS4yOC0uMDItLjk5LS45OC0uMDItLjI4LS45NC0uOTYuMjMtLjUxLS44NC0uODYuNDctLjcyLS42OC0uNzEuNjgtLjg2LS40Ny0uNTEuODQtLjk2LS4yMy0uMjguOTQtLjk4LjAyLS4wMi45OS0uOTQuMjguMjMuOTYtLjg0LjUxLjQ3Ljg3TC4wNCw2LjMxbC42OC43Mi0uNDcuODcuODQuNTEtLjIzLjk2Ljk0LjI4LjAyLjk5Ljk4LjAyLjI4Ljk0Ljk2LS4yMy41MS44NC44Ni0uNDcuNzEuNjguNzEtLjY4Ljg2LjQ3LjUxLS44NC45Ni4yMy4yOC0uOTQuOTgtLjAyLjAyLS45OS45NC0uMjgtLjIzLS45Ni44NC0uNTItLjQ3LS44NloiLz4KICA8L2c+Cjwvc3ZnPg==");
            background-color: currentColor;
            -webkit-mask-image: var(--svg);
            mask-image: var(--svg);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
        }

        .clarity--language-solid {
            display: inline-block;
            width: 24px;
            height: 24px;
            --svg: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iX+WbvuWxgl8xIiBkYXRhLW5hbWU9IuWbvuWxgl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAyMC4xNiAxNS44NCI+CiAgPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI5LjYuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDIuMS4xIEJ1aWxkIDkpICAtLT4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLnN0MCB7CiAgICAgICAgZmlsbDogbm9uZTsKICAgICAgfQoKICAgICAgLnN0MSB7CiAgICAgICAgZmlsbDogIzdhNzE2MjsKICAgICAgICBmaWxsLXJ1bGU6IGV2ZW5vZGQ7CiAgICAgIH0KCiAgICAgIC5zdDIgewogICAgICAgIGNsaXAtcGF0aDogdXJsKCNjbGlwcGF0aCk7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgICA8Y2xpcFBhdGggaWQ9ImNsaXBwYXRoIj4KICAgICAgPHJlY3QgY2xhc3M9InN0MCIgd2lkdGg9IjIwLjE2IiBoZWlnaHQ9IjE1Ljg0Ii8+CiAgICA8L2NsaXBQYXRoPgogIDwvZGVmcz4KICA8ZyBjbGFzcz0ic3QyIj4KICAgIDxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik01LjkyLDcuNDZoMS4xMWwtLjU1LTEuNjYtLjU1LDEuNjZaTTEyLjg3LDMuOTFoLTEuNDJjLS4zOSwwLS43MS4zMi0uNzEuNzFzLjMyLjcxLjcxLjcxaDEuNGMtLjAxLjMyLS4wMS43Mi4wMiwxLjE1LS4wMi4xNi0uMDQuMzMtLjA3LjUtLjE2Ljg5LS41NiwxLjg1LTEuNjQsMi4zMi0uMzYuMTYtLjUyLjU4LS4zNy45My4xNi4zNi41OC41Mi45NC4zNy44Ny0uMzgsMS40Ni0uOTYsMS44NS0xLjYzLjM5LjY3Ljk4LDEuMjUsMS44NSwxLjYzLjM2LjE2Ljc4LDAsLjk0LS4zNy4xNi0uMzYsMC0uNzgtLjM3LS45My0xLjA3LS40Ny0xLjQ4LTEuNDItMS42NC0yLjMyLS4wMy0uMTctLjA1LS4zNC0uMDctLjUuMDMtLjQzLjAzLS44My4wMi0xLjE1aDEuNGMuMzksMCwuNzEtLjMyLjcxLS43MXMtLjMyLS43MS0uNzEtLjcxaC0xLjQydi0uMzZjMC0uMzktLjMyLS43MS0uNzEtLjcxcy0uNzEuMzItLjcxLjcxdi4zNlpNNS40NSw4Ljg4aDIuMDZsLjQzLDEuMjljLjEyLjM3LjUzLjU3LjkuNDUuMzctLjEyLjU3LS41My40NS0uOWwtMi4xMy02LjM5Yy0uMS0uMjktLjM3LS40OS0uNjctLjQ5cy0uNTguMi0uNjcuNDlsLTIuMTMsNi4zOWMtLjEyLjM3LjA4Ljc3LjQ1LjkuMzcuMTIuNzctLjA4LjktLjQ1bC40My0xLjI5Wk0xOS45OCwyLjEyYzAtMS4xNy0uOTUtMi4xMi0yLjEzLTIuMTJIMi4yQzEuMDMsMCwuMDguOTUuMDgsMi4xMnY5LjI1YzAsMS4xNy45NSwyLjEyLDIuMTMsMi4xMmg0Ljc1bDIuNjUsMS45OWMuMjUuMTkuNi4xOS44NSwwbDIuNjUtMS45OWg0Ljc1YzEuMTcsMCwyLjEzLS45NSwyLjEzLTIuMTJWMi4xMloiLz4KICA8L2c+Cjwvc3ZnPg==");
            background-color: currentColor;
            -webkit-mask-image: var(--svg);
            mask-image: var(--svg);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
        }

        .vaadin--academy-cap {
            display: inline-block;
            width: 24px;
            height: 24px;
            --svg: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iX+WbvuWxgl8xIiBkYXRhLW5hbWU9IuWbvuWxgl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDIyLjg1IDE1Ij4KICA8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjkuNi4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogMi4xLjEgQnVpbGQgOSkgIC0tPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuc3QwIHsKICAgICAgICBmaWxsOiAjN2E3MTYyOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNC45LDcuODR2My44M2MwLDEuMTMsMi43LDIuMzksNi41NiwyLjM5czYuNTYtMS4yNiw2LjU2LTIuMzl2LTQuNDNsLTcuMjcsMy4yNC01Ljg2LTIuNjMiLz4KICA8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjIuODUsMTMuODNjLS4zMS0yLjYxLTEuMzMtMy44NC0xLjctNC4yMXYtNC43OGMwLS4wNy0uMDItLjEzLS4wNi0uMTloMCwwYy0uMDYtLjEtLjE3LS4xNy0uMy0uMTctLjAyLDAtLjA0LDAtLjA2LDBMMTAuNzQsMCwwLDQuNzlsMTAuNzYsNC44NCw5LjY4LTQuMzF2NC4zMWMtLjM3LjM3LTEuMzksMS41OS0xLjcxLDQuMjEsMCwuMDEsMCwuMDIsMCwuMDMsMCwuMDUsMCwuMzMuMjcuNjEuMzQuMzUuOTQuNTMsMS43OS41M3MxLjQ2LS4xOCwxLjc5LS41M2MuMjctLjI3LjI3LS41Ni4yNy0uNjEsMC0uMDEsMC0uMDIsMC0uMDNNMTMuMSw1LjIzYy0uMTYsMC0uMjktLjEzLS4yOS0uMjlzLjEzLS4yOS4yOS0uMjloNy4zOGMtLjAzLjA1LS4wNi4xMi0uMDYuMTl2LjM5aC03LjMzWiIvPgo8L3N2Zz4=");
            background-color: currentColor;
            -webkit-mask-image: var(--svg);
            mask-image: var(--svg);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
        }

        @media print {
            .page {
                box-shadow: none !important;
                margin: 0;
            }
        }
    </style>


    <div class="page" data-cid="nSEtPG">
        <header class="header" data-cid="gf1o3L">
            <div class="header-left" data-cid="RZRBIr">
                <h1 data-cid="pxO3hZ" class="editor-empty-block">RACHELLE<br data-cid="aoO9jb">BEAUDRY</h1>
                <div class="title" data-cid="2cfEaF">Fashion Designer</div>
            </div>
            <div class="header-right" data-cid="2DaRaq">
                <img src="https://static-us-img.skywork.ai/router/agent/2025-10-22/women31_f14e68c956c64cf3a9479842099fcb5c.jpg"
                    alt="Rachelle Beaudry" data-cid="MBTyV2">
                <div class="arrow-icon-wrapper" data-cid="An4xcf">
                    <div class="arrow-icon" data-cid="QhCWC5">
                        <svg viewBox="0 0 24 24" data-cid="ddzGrh">
                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" data-cid="DJjSUx">
                            </path>
                        </svg>
                    </div>
                </div>

            </div>
        </header>

        <section class="about-me" data-cid="CoZBaF">
            <h2 class="section-title" data-cid="ZfzIkL">
                <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iX+WbvuWxgl8xIiBkYXRhLW5hbWU9IuWbvuWxgl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDIwIDIwIj4KICA8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjkuNi4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogMi4xLjEgQnVpbGQgOSkgIC0tPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuc3QwIHsKICAgICAgICBmaWxsOiAjN2E3MTYyOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8Zz4KICAgIDxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0zNS4wMywxMC43NWgtMi4yNGMtMi42OCwwLTQuODUsMi4xOC00Ljg1LDQuODZ2MS40OWMwLC4yMS4xNy4zNy4zNy4zN2gxMS4yYy4yMSwwLC4zNy0uMTcuMzctLjM3di0xLjQ5YzAtMi42OC0yLjE3LTQuODYtNC44NS00Ljg2WiIvPgogICAgPHBhdGggY2xhc3M9InN0MCIgZD0iTTM3LjY0LDYuMjZjMCwyLjA2LTEuNjcsMy43NC0zLjczLDMuNzRzLTMuNzMtMS42Ny0zLjczLTMuNzQsMS42Ny0zLjc0LDMuNzMtMy43NCwzLjczLDEuNjcsMy43MywzLjc0WiIvPgogIDwvZz4KICA8Zz4KICAgIDxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xMS4xMiwxMC43NWgtMi4yNGMtMi42OCwwLTQuODUsMi4xOC00Ljg1LDQuODZ2MS40OWMwLC4yMS4xNy4zNy4zNy4zN2gxMS4yYy4yMSwwLC4zNy0uMTcuMzctLjM3di0xLjQ5YzAtMi42OC0yLjE3LTQuODYtNC44NS00Ljg2WiIvPgogICAgPHBhdGggY2xhc3M9InN0MCIgZD0iTTEzLjczLDYuMjZjMCwyLjA2LTEuNjcsMy43NC0zLjczLDMuNzRzLTMuNzMtMS42Ny0zLjczLTMuNzQsMS42Ny0zLjc0LDMuNzMtMy43NCwzLjczLDEuNjcsMy43MywzLjc0WiIvPgogIDwvZz4KPC9zdmc+"
                    data-cid="6oHmdP">
                About Me
            </h2>
            <p data-cid="66CmYC">Creative Fashion Designer skilled in trend research, textile selection, and design
                conceptualization. Proficient in any software tools, with a passion for sustainable fashion and
                innovative materials.</p>
        </section>

        <div class="main-content" data-cid="FaP4e1">
            <div class="left-column" data-cid="M1vqnw">
                <section class="work-experience" data-cid="jbHqwb">
                    <h2 class="section-title" data-cid="J9B03B">
                        <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iX+WbvuWxgl8xIiBkYXRhLW5hbWU9IuWbvuWxgl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDIwIDIwIj4KICA8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjkuNi4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogMi4xLjEgQnVpbGQgOSkgIC0tPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuc3QwIHsKICAgICAgICBmaWxsOiAjN2E3MTYyOwogICAgICAgIGZpbGwtcnVsZTogZXZlbm9kZDsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPHBhdGggY2xhc3M9InN0MCIgZD0iTTYuMTYsNS44NWg3LjY4di0xLjc1YzAtLjU3LS40Ny0xLjA0LTEuMDQtMS4wNGgtNS42Yy0uNTcsMC0xLjA0LjQ3LTEuMDQsMS4wNHYxLjc1Wk0xMCwxMS4xNGMuMjUsMCwuNDYuMjEuNDYuNDZ2MS4zOWMwLC4yNS0uMjEuNDYtLjQ2LjQ2cy0uNDYtLjIxLS40Ni0uNDZ2LTEuMzljMC0uMjUuMjEtLjQ2LjQ2LS40NlpNMTguMzMsNy45M3YyLjU4bC02Ljc2Ljkzdi0uMTRjMC0uODYtLjctMS41Ni0xLjU2LTEuNTZzLTEuNTYuNy0xLjU2LDEuNTZ2LjE0bC02Ljc2LS45M3YtMi41OGMwLTEuMTUuOTMtMi4wOCwyLjA4LTIuMDhoMS4wNHYtMi4wOGMwLTEuMTUuOTMtMi4wOCwyLjA4LTIuMDhoNi4yNGMxLjE1LDAsMi4wOC45MywyLjA4LDIuMDh2Mi4wOGgxLjA0YzEuMTUsMCwyLjA4LjkzLDIuMDgsMi4wOFpNMTguMzMsMTEuNTV2NC42OGMwLDEuMTUtLjkzLDIuMDgtMi4wOCwyLjA4SDMuNzZjLTEuMTUsMC0yLjA4LS45My0yLjA4LTIuMDh2LTQuNjhsNi43Ni45MnYuNDdjMCwuODYuNywxLjU2LDEuNTYsMS41NnMxLjU2LS43LDEuNTYtMS41NnYtLjQ3bDYuNzYtLjkyWiIvPgo8L3N2Zz4="
                            data-cid="HD1dgh">
                        Work Experience
                    </h2>
                    <div class="job" data-cid="Xl4Ypg">
                        <div style="display: flex; align-items: center;" data-cid="66yEPa">
                            <span class="carbon--circle-filled" data-cid="V84HQG"></span>
                            <h3 data-cid="czQASg">Fashion Designer Intern</h3>
                        </div>
                        <div class="details" data-cid="BitN6g">Liceria | Jan 2024 – Jun 2024</div>
                        <ul data-cid="IbcGOo">
                            <li data-cid="Ju0k31">Created mood boards and digital sketches.</li>
                            <li data-cid="QvX5lP">Coordinated with production team to ensure design feasibility</li>
                        </ul>
                    </div>
                    <div class="job" data-cid="90lR6P">
                        <div style="display: flex; align-items: center;" data-cid="0r8MqO">
                            <span class="carbon--circle-filled" data-cid="ZqM4op"></span>
                            <h3 data-cid="bTDzvV">Freelance Fashion Illustrator</h3>
                        </div>
                        <div class="details" data-cid="ZCOu4Z">Self-employed – 2022 – present</div>
                        <ul data-cid="jQAyFg">
                            <li data-cid="EC2D54">Designed custom outfits for personal clients and small clothing brands
                            </li>
                            <li data-cid="uSxJVY">Produced illustrations and technical drawings for marketing material
                            </li>
                        </ul>
                    </div>
                </section>

                <section class="education" data-cid="kqgdXh">
                    <h2 class="section-title" data-cid="LAUL7D">
                        <span class="vaadin--academy-cap" data-cid="zrWnTi"></span>
                        Education
                    </h2>
                    <div class="education-item" data-cid="VvQ6lu">
                        <div style="display: flex; align-items: center;" data-cid="8MOiJW">
                            <span class="carbon--circle-filled" data-cid="aL8wsN"></span>
                            <h3 data-cid="EHInIh">Bachelor of Arts in Fashion Design</h3>
                        </div>
                        <div class="details" data-cid="COJ5OL">University, City A</div>
                        <p data-cid="1T1M3U">Expected Graduation: 2025</p>
                    </div>
                </section>
            </div>

            <div class="right-column" data-cid="mPokUz">
                <section class="skills section" data-cid="WrSxQX">
                    <h2 class="section-title" data-cid="DM14DG">
                        <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iX+WbvuWxgl8xIiBkYXRhLW5hbWU9IuWbvuWxgl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxNi4wOCAxNi4wOCI+CiAgPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI5LjYuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDIuMS4xIEJ1aWxkIDkpICAtLT4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLnN0MCB7CiAgICAgICAgZmlsbDogbm9uZTsKICAgICAgfQoKICAgICAgLnN0MSB7CiAgICAgICAgZmlsbDogIzdhNzE2MjsKICAgICAgICBmaWxsLXJ1bGU6IGV2ZW5vZGQ7CiAgICAgIH0KCiAgICAgIC5zdDIgewogICAgICAgIGNsaXAtcGF0aDogdXJsKCNjbGlwcGF0aCk7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgICA8Y2xpcFBhdGggaWQ9ImNsaXBwYXRoIj4KICAgICAgPHJlY3QgY2xhc3M9InN0MCIgd2lkdGg9IjE2LjA4IiBoZWlnaHQ9IjE2LjA4Ii8+CiAgICA8L2NsaXBQYXRoPgogIDwvZGVmcz4KICA8ZyBjbGFzcz0ic3QyIj4KICAgIDxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik01LjI5LDcuNzhsLS43MS0uNzJjLTEuMTkuMzItMi40Ni0uMDItMy4zMi0uODlDLjM3LDUuMjkuMDMsMy45OC4zOSwyLjc4Yy4wNC0uMTMuMjEtLjE3LjMtLjA3bDEuNTgsMS41NywxLjk1LTEuOTUtMS41Ny0xLjU4Yy0uMS0uMDktLjA1LS4yNy4wNy0uMywxLjIxLS4zNiwyLjUxLS4wMiwzLjQuODcuODcuODcsMS4yMSwyLjE0Ljg5LDMuMzNsLjcyLjcxLTIuNDMsMi40M1pNMTIuMzksMTUuODljLS45LDAtMS43OC0uMzYtMi40My0xLjAxLS44OC0uODgtMS4yMS0yLjE0LS44OS0zLjMzbC0uNTktLjYsMi40Mi0yLjQyLjYuNTljMS4xOS0uMzIsMi40NS4wMiwzLjMyLjg5Ljg5LjksMS4yMSwyLjE5Ljg3LDMuNC0uMDQuMTQtLjIxLjE4LS4zMS4wOGwtMS41Ny0xLjU4LTEuOTUsMS45NSwxLjU4LDEuNThjLjEuMS4wNS4yNi0uMDguMzEtLjMyLjA5LS42NC4xNC0uOTYuMTRaIi8+CiAgICA8cGF0aCBjbGFzcz0ic3QxIiBkPSJNMi42OCwxMy4zMWwtMS4xMS0xLjExYy0uMDctLjA3LS4wNy0uMTgsMC0uMjZMMTAuNzYsMi43NGMuMDMuMDUuMDUuMTEuMTEuMTZsMS4xLDEuMTFMMi42OCwxMy4zMVpNNC4xOCwxNC43NHMtLjA5LS4wMi0uMTMtLjA1bC0xLjEtMS4xMUwxMi4yNCw0LjI3bDEuMSwxLjExcy4xLjA4LjE2LjFMNC4zMSwxNC42OHMtLjA4LjA1LS4xNC4wNVoiLz4KICAgIDxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0xLjAyLDEzLjc4bC4zNy0xLjMzLDIuNCwyLjQtMS4zMi4zOC0xLjQ1LTEuNDZaTS43LDE1Ljc0Yy0uMTMsMC0uMjEtLjEyLS4xOC0uMjRsLjM4LTEuMzIsMS4xNiwxLjE2LTEuMzYuMzlaIi8+CiAgICA8cGF0aCBjbGFzcz0ic3QxIiBkPSJNMTMuNjksNS4yMnMtLjA5LS4wMi0uMTMtLjA1bC0yLjQ4LTIuNDljLS4wNy0uMDYtLjA3LS4xOCwwLS4yNmwxLjEzLTEuMTNjLjQ2LS40NiwxLjIxLS40NiwxLjY2LDBsMS4wOSwxLjA4Yy40Ni40Ni40NiwxLjIxLDAsMS42NmwtMS4xMywxLjEzcy0uMDguMDUtLjE0LjA1WiIvPgogIDwvZz4KPC9zdmc+"
                            alt="Skills Icon" data-cid="Snt9cU">
                        Skills
                    </h2>
                    <ul data-cid="CT5V41">
                        <li data-cid="wu9afO">Fashion Illustration</li>
                        <li data-cid="aDO3h2">3D Garment Design</li>
                        <li data-cid="IRoB7V">Textile &amp; Material Knowledge</li>
                        <li data-cid="wQeGj1">Pattern Making &amp; Sewing</li>
                    </ul>
                </section>

                <section class="certification section" data-cid="w4yS2z">
                    <h2 class="section-title" data-cid="ycaAVT">
                        <span class="solar--medal-ribbon-bold" data-cid="lG7zd9"></span>
                        Certification
                    </h2>
                    <ul data-cid="3w3sNI">
                        <li data-cid="olYg9Z">Certificate in Sustainable Fashion – Fashion Revolution (2023)</li>
                        <li data-cid="43KVHI">Winner, Young Designer Competition – Borcelle Fashion Week (2022)</li>
                    </ul>
                </section>

                <section class="language section" data-cid="AgWJHd">
                    <h2 class="section-title" data-cid="mtGlNb">
                        <span class="clarity--language-solid" data-cid="cXPkxE"></span>
                        Language
                    </h2>
                    <ul data-cid="5Tdimp">
                        <li data-cid="K6qAZ5">Bahasa Indonesia – Native</li>
                        <li data-cid="40q6sT">English – Fluent</li>
                    </ul>
                </section>
            </div>
            <footer class="footer" data-cid="ved78u">
                <div class="footer-item" data-cid="bQDDec">
                    <svg viewBox="0 0 24 24" data-cid="VyfCMD">
                        <path
                            d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                            data-cid="UpmpoC"></path>
                    </svg>
                    <span data-cid="30Kk0Q">+123-456-7890</span>
                </div>
                <div class="footer-item" data-cid="5SGBlB">
                    <svg viewBox="0 0 24 24" data-cid="4b1ZPE">
                        <path
                            d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                            data-cid="nCoI1b"></path>
                    </svg>
                    <span data-cid="rqi8GD">hello@reallygreatsite.com</span>
                </div>
                <div class="footer-item" data-cid="xRFKTD">
                    <svg viewBox="0 0 24 24" data-cid="wLFOGp">
                        <path
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                            data-cid="CXyDJS"></path>
                    </svg>
                    <span data-cid="q3jgjF">123 Anywhere St., Any City, ST 12345</span>
                </div>
            </footer>
        </div>
        <img src="https://picture-search.skywork.ai/image/doc/b77a568ed45ae5fcd5bdecdda527cd89.jpg"
            alt="Decorative element" style="display: none;" data-cid="Zt5Kkv">
    </div>



`;

export const OliveGreenModernTemplate: ResumeTemplate = {
    id: 'olivegreenmodern',
    name: 'Olive green modern',
    html: html,
    hasPhoto: true,
    supportedSections: ['profile', 'summary', 'experience', 'education', 'skills', 'projects', 'languages', 'certifications'],
    sectionOrder: ['profile', 'summary', 'experience', 'education', 'skills'],
    pageSize: 'A4',
    metadata: {
        layout: 'single-column',
        photoPosition: 'header',
        maxBulletsPerJob: 5
    }
};
