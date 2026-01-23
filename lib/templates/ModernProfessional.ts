
import { ResumeTemplate } from './types';

const html = `<style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800&family=Noto+Sans:wght@400;700&display=swap');

        body {
            background-color: #f0f0f0;
            margin: 0;
            padding: 2em 0;
            display: flex;
            justify-content: center;
            font-family: 'Noto Sans', sans-serif;
            min-width: 794px;
        }

        .page {
            background-color: #ffffff;
            margin-bottom: 0.2em;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            width: 794px;
            min-height: 1123px;
            display: flex;
            position: relative;
        }

        .left-column {
            width: 40%;
            background-color: #F7F7F7;
            padding: 40px 30px 40px 40px;
            box-sizing: border-box;
            position: relative;
            z-index: 1;
        }

        .background-shape {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 300px;
            background-color: #e9dcc9;
            clip-path: polygon(0 0, 100% 0, 0 80%);
            z-index: -1;
        }

        .right-column {
            width: 65%;
            background-color: #ffffff;
            padding: 40px 40px 40px 30px;
            box-sizing: border-box;
        }

        .profile-pic-container {
            text-align: center;
            margin-bottom: 20px;
        }

        .profile-pic {
            width: 130px;
            height: 130px;
            border-radius: 50%;
            border: 5px solid #ffffff;
            object-fit: cover;
        }

        .name-title {
            text-align: center;
            margin-bottom: 40px;
        }

        .name {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 700;
            color: #d8be93;
            line-height: 1.1;
            margin-bottom: 8px;
        }

        .job-title {
            font-size: 13px;
            color: #636466;
            margin-top: 5px;
            letter-spacing: 0.5px;
        }

        .section {
            margin-bottom: 30px;
        }

        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            font-weight: 700;
            color: #636466;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #E4D9C5;
        }

        .section-title img {
            margin-top: 3px;
        }

        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            font-size: 12px;
            color: #636466;
        }

        .contact-item img {
            width: 12px;
            height: 12px;
            margin-right: 10px;
            margin-top: 2px;
        }

        .about-me-text {
            font-size: 12px;
            color: #636466;
            line-height: 1.6;
        }

        .skills-list {
            list-style: none;
            padding-left: 0;
            margin: 0;
            font-size: 12px;
            color: #636466;
        }

        .skills-list li {
            padding-left: 15px;
            position: relative;
            margin-bottom: 8px;
            font-weight: bold;
            line-height: 22px;
        }

        .skills-list li::before {
            content: '•';
            position: absolute;
            left: 0;
            color: #656666;
            font-size: 14px;
            line-height: 1;
        }

        .timeline-container {
            position: relative;
            padding-left: 20px;
        }

        .timeline-line {
            position: absolute;
            left: 9.5px;
            top: 5px;
            bottom: 5px;
            width: 1px;
            background-color: #d8be93;
        }

        .timeline-item {
            padding-left: 10px;
            margin-bottom: 20px;
            position: relative;
        }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: -15.5px;
            top: 5px;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background-color: #d8be93;
            border: 1px solid #d8be93;
        }

        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 3px;
        }

        .item-title {
            font-size: 14px;
            font-weight: 700;
            color: #636466;
        }

        .item-date {
            font-size: 12px;
            font-weight: 700;
            color: #636466;
            white-space: nowrap;
            padding-left: 10px;
        }

        .item-subtitle {
            font-family: 'Playfair Display', serif;
            font-size: 12px;
            font-style: italic;
            color: #636466;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .item-description {
            font-size: 12px;
            color: #636466;
            line-height: 1.6;
        }

        .references-container {
            display: flex;
            justify-content: space-between;
            gap: 20px;
        }

        .reference-item {
            width: 50%;
            font-size: 12px;
            color: #636466;
            line-height: 1.6;
        }

        .reference-name {
            font-weight: 700;
        }

        p {
            margin-top: 0px;
            margin-bottom: 0px;
        }

        .skills-icon {
            display: inline-block;
            width: 18px;
            height: 18px;
            --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M10.1 3.94c.63-.29 1.04-.98.87-1.75c-.12-.56-.59-1.03-1.15-1.15c-.78-.17-1.47.23-1.76.86L6.27.11a.38.38 0 0 0-.54 0L4.18 1.66c-.19.19-.12.51.13.62a1.54 1.54 0 1 1-2.03 2.03c-.11-.25-.43-.32-.62-.13L.11 5.73a.38.38 0 0 0 0 .54L1.9 8.06c-.63.29-1.03.98-.87 1.75c.12.56.59 1.03 1.15 1.15c.77.17 1.46-.24 1.75-.87l1.79 1.79c.15.15.39.15.54 0l1.54-1.54c.19-.19.13-.51-.12-.62c-.53-.24-.91-.78-.91-1.41a1.54 1.54 0 0 1 2.95-.62c.11.25.43.32.62.12l1.54-1.54a.38.38 0 0 0 0-.54z'/%3E%3C/svg%3E");
            background-color: currentColor;
            -webkit-mask-image: var(--svg);
            mask-image: var(--svg);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
            transform: rotate(45deg);
        }

        .lets-icons--phone-light {
            margin-right: 8px;
            display: inline-block;
            width: 20px;
            height: 20px;
            --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19.506 7.96A16.03 16.03 0 0 1 7.96 19.506C5.819 20.051 4 18.21 4 16v-1c0-.552.449-.995.999-1.05a10 10 0 0 0 2.656-.639l1.519 1.52a12.05 12.05 0 0 0 5.657-5.657l-1.52-1.52a10 10 0 0 0 .64-2.656C14.005 4.448 14.448 4 15 4h1c2.208 0 4.05 1.819 3.505 3.96'/%3E%3C/svg%3E");
            background-color: currentColor;
            -webkit-mask-image: var(--svg);
            mask-image: var(--svg);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
            color: #DDCFB1;
        }

        .material-symbols--alternate-email {
            margin-right: 8px;
            display: inline-block;
            width: 17px;
            height: 17px;
            --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12v1.45q0 1.475-1.012 2.513T18.5 17q-.875 0-1.65-.375t-1.3-1.075q-.725.725-1.638 1.088T12 17q-2.075 0-3.537-1.463T7 12t1.463-3.537T12 7t3.538 1.463T17 12v1.45q0 .65.425 1.1T18.5 15t1.075-.45t.425-1.1V12q0-3.35-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20h5v2zm0-7q1.25 0 2.125-.875T15 12t-.875-2.125T12 9t-2.125.875T9 12t.875 2.125T12 15'/%3E%3C/svg%3E");
            background-color: currentColor;
            -webkit-mask-image: var(--svg);
            mask-image: var(--svg);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
            color: #DDCFB1;
        }

        .mingcute--location-2-line {
            margin-right: 8px;
            display: inline-block;
            width: 18px;
            height: 18px;
            --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z'/%3E%3Cpath fill='%23000' fill-rule='nonzero' d='M6.72 16.64a1 1 0 0 1 .56 1.92c-.5.146-.86.3-1.091.44c.238.143.614.303 1.136.452C8.48 19.782 10.133 20 12 20s3.52-.218 4.675-.548c.523-.149.898-.309 1.136-.452c-.23-.14-.59-.294-1.09-.44a1 1 0 0 1 .559-1.92c.668.195 1.28.445 1.75.766c.435.299.97.82.97 1.594c0 .783-.548 1.308-.99 1.607c-.478.322-1.103.573-1.786.768C15.846 21.77 14 22 12 22s-3.846-.23-5.224-.625c-.683-.195-1.308-.446-1.786-.768c-.442-.3-.99-.824-.99-1.607c0-.774.535-1.295.97-1.594c.47-.321 1.082-.571 1.75-.766M12 2a7.5 7.5 0 0 1 7.5 7.5c0 2.568-1.4 4.656-2.85 6.14a16.4 16.4 0 0 1-1.853 1.615c-.594.446-1.952 1.282-1.952 1.282a1.71 1.71 0 0 1-1.69 0a21 21 0 0 1-1.952-1.282A16 16 0 0 1 7.35 15.64C5.9 14.156 4.5 12.068 4.5 9.5A7.5 7.5 0 0 1 12 2m0 2a5.5 5.5 0 0 0-5.5 5.5c0 1.816.996 3.428 2.28 4.74c.966.988 2.03 1.74 2.767 2.202l.453.274l.453-.274c.736-.462 1.801-1.214 2.767-2.201c1.284-1.313 2.28-2.924 2.28-4.741A5.5 5.5 0 0 0 12 4m0 2.5a3 3 0 1 1 0 6a3 3 0 0 1 0-6m0 2a1 1 0 1 0 0 2a1 1 0 0 0 0-2'/%3E%3C/g%3E%3C/svg%3E");
            background-color: currentColor;
            -webkit-mask-image: var(--svg);
            mask-image: var(--svg);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
            color: #DDCFB1;
        }

        .tdesign--education-filled {
            display: inline-block;
            width: 24px;
            height: 24px;
            --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M23.835 8.5L12 .807L.165 8.5L12 16.192l8-5.2V16h2V9.693z'/%3E%3Cpath fill='%23000' d='M5 17.5v-3.665l7 4.55l7-4.55V17.5c0 1.47-1.014 2.615-2.253 3.338C15.483 21.576 13.802 22 12 22s-3.482-.424-4.747-1.162C6.014 20.115 5 18.97 5 17.5'/%3E%3C/svg%3E");
            background-color: currentColor;
            -webkit-mask-image: var(--svg);
            mask-image: var(--svg);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
        }

        .famicons--briefcase-sharp {
            display: inline-block;
            width: 512px;
            height: 512px;
            --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='%23000' d='M336 288H176v-32H16v196a12 12 0 0 0 12 12h456a12 12 0 0 0 12-12V256H336Zm160-164a12 12 0 0 0-12-12H384V56a8 8 0 0 0-8-8H136a8 8 0 0 0-8 8v56H28a12 12 0 0 0-12 12v100h480Zm-152-12H168V88h176Z'/%3E%3C/svg%3E");
            background-color: currentColor;
            -webkit-mask-image: var(--svg);
            mask-image: var(--svg);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
        }

        .basil--book-open-solid {
            display: inline-block;
            width: 24px;
            height: 24px;
            --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' fill-rule='evenodd' d='M11.49 4.11a10.45 10.45 0 0 0-9.26-.74a1.16 1.16 0 0 0-.731 1.08v11.66c0 .78.789 1.314 1.514 1.024a8.56 8.56 0 0 1 7.582.608l1.135.68c.087.053.18.075.269.074a.5.5 0 0 0 .27-.073l1.134-.681a8.56 8.56 0 0 1 7.582-.608a1.104 1.104 0 0 0 1.514-1.025V4.45c0-.476-.29-.903-.731-1.08a10.45 10.45 0 0 0-9.259.742l-.51.306zm1.26 2.39a.75.75 0 0 0-1.5 0V16a.75.75 0 0 0 1.5 0z' clip-rule='evenodd'/%3E%3Cpath fill='%23000' d='M2.725 19.042a6.5 6.5 0 0 1 6.55 0l1.087.634a3.25 3.25 0 0 0 3.276 0l1.087-.634a6.5 6.5 0 0 1 6.55 0l.103.06a.75.75 0 1 1-.756 1.296l-.103-.06a5 5 0 0 0-5.038 0l-1.088.634a4.75 4.75 0 0 1-4.786 0l-1.088-.634a5 5 0 0 0-5.038 0l-.103.06a.75.75 0 0 1-.756-1.296z'/%3E%3C/svg%3E");
            background-color: currentColor;
            -webkit-mask-image: var(--svg);
            mask-image: var(--svg);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
        }

        .item-subtitle-wrapper {
            display: flex;
            justify-content: space-between;
        }

        .nobold {
            font-weight: normal;
        }

        @media print {
            .page {
                box-shadow: none !important;
                margin: 0;
            }
        }
    </style>

    <div class="page" data-cid="FBFjL6">
        <div class="left-column" data-cid="4q41NU">
            <div class="background-shape editor-empty-block" data-cid="dBPcE2"></div>
            <div class="profile-pic-container" data-cid="K5TVhW">
                <img src="https://static-us-img.skywork.ai/router/agent/2025-10-22/women2_d4b53ac3c9724ab09e1412a6e49bc704.jpeg"
                    alt="Lorna Alvarado" class="profile-pic" data-cid="v4lcw6">
            </div>
            <div class="name-title" data-cid="qPpw06">
                <h1 class="name editor-empty-block" data-cid="29TBCY">Lorna<br data-cid="CeT95g">Alvarado</h1>
                <p class="job-title" data-cid="uf0gke">Marketing Manager</p>
            </div>

            <div class="section" data-cid="O7Y97h">
                <h2 class="section-title" data-cid="2VS0yZ">
                    <img src="https://api.iconify.design/mdi/phone.svg?color=%23656668" alt=""
                        style="width: 18px; height: 18px;" data-cid="nlJafw">
                    Contact
                </h2>
                <div class="contact-item" data-cid="2y37Ce">
                    <span class="lets-icons--phone-light img" alt="" data-cid="kINXoI"></span>
                    <span data-cid="4mVgRM">+123-456-7890</span>
                </div>
                <div class="contact-item" data-cid="j3MUeR">
                    <span class="material-symbols--alternate-email" data-cid="F2HRrl"></span>
                    <span data-cid="qQtfPB">hello@reallygreatsite.com</span>
                </div>
                <div class="contact-item" data-cid="MsBhNX">
                    <span class="mingcute--location-2-line" data-cid="sH7V1B"></span>
                    <span data-cid="PDjQip">123 Anywhere St., Any City, ST 12345</span>
                </div>
            </div>

            <div class="section" data-cid="wPbpsx">
                <h2 class="section-title" data-cid="L9XdRe">
                    <img src="https://api.iconify.design/mdi/person.svg?color=%23656668" alt=""
                        style="width: 18px; height: 18px;" data-cid="6hF5pM">
                    About Me
                </h2>
                <p class="about-me-text" data-cid="43eIna">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                    exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            </div>

            <div class="section" data-cid="Mrg5w4">
                <h2 class="section-title" data-cid="HtlK5B">
                    <span class="skills-icon" src="" alt="" style="width: 15px; height: 15px;" data-cid="N1sgbJ"></span>
                    Skills
                </h2>
                <ul class="skills-list" data-cid="SMNe2V">
                    <li data-cid="4x6ul7">Management Skills</li>
                    <li data-cid="EdScYk">Creativity</li>
                    <li data-cid="prUR3V">Digital Marketing</li>
                    <li data-cid="kYieNB">Negotiation</li>
                    <li data-cid="hnEv07">Critical Thinking</li>
                    <li data-cid="AteZsA">Leadership</li>
                </ul>
            </div>
        </div>

        <div class="right-column" data-cid="edViYm">
            <div class="section" data-cid="RvZq5i">
                <h2 class="section-title" data-cid="B7nVrs">
                    <span class="tdesign--education-filled" style="width: 20px; height: 20px;" data-cid="yAFs33"></span>
                    Education
                </h2>
                <div class="timeline-container" data-cid="aPzIqL">
                    <div class="timeline-line editor-empty-block" data-cid="CDPvkX"></div>
                    <div class="timeline-item" data-cid="dzWb2z">
                        <div class="item-header" data-cid="ZYNrqw">
                            <p class="item-title" data-cid="9hy7v7">Bachelor of Business Management</p>
                        </div>
                        <div class="item-subtitle-wrapper" data-cid="bnCsnU">
                            <p class="item-subtitle" data-cid="FRNC5t">Borcelle University</p>
                            <p class="item-date" data-cid="x4bzqn">2016 - 2020</p>
                        </div>
                        <p class="item-description" data-cid="hEICI8">Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Nunc sit amet sem nec risus egestas accumsan. In enim nunc, tincidunt ut quam eget,
                            luctus sollicitudin neque. Sed leo nisl, semper ac hendrerit a, sollicitudin in arcu.</p>
                    </div>
                    <div class="timeline-item" data-cid="PBEXkY">
                        <div class="item-header" data-cid="XV8OOD">
                            <p class="item-title" data-cid="iF2FQU">Bachelor of Business Management</p>
                        </div>
                        <div class="item-subtitle-wrapper" data-cid="7G72RR">
                            <p class="item-subtitle" data-cid="rlYwBd">Borcelle University</p>
                            <p class="item-date" data-cid="IRvvgq">2020 - 2023</p>
                        </div>
                        <p class="item-description" data-cid="rl5kJo">Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Nunc sit amet sem nec risus egestas accumsan. In enim nunc, tincidunt ut quam eget,
                            luctus sollicitudin neque. Sed leo nisl, semper ac hendrerit a, sollicitudin in arcu.</p>
                    </div>
                </div>
            </div>

            <div class="section" data-cid="RTXapN">
                <h2 class="section-title" data-cid="eCeWRG">
                    <span class="famicons--briefcase-sharp" style="width: 20px; height: 20px;" data-cid="HuR17Y"></span>
                    Experience
                </h2>
                <div class="timeline-container" data-cid="pRgTKw">
                    <div class="timeline-line editor-empty-block" data-cid="VZ99Sh"></div>
                    <div class="timeline-item" data-cid="Rlts7W">
                        <div class="item-header" data-cid="L7i2BN">
                            <p class="item-title" data-cid="XAw76x">Product Design Manager</p>
                        </div>
                        <div class="item-subtitle-wrapper" data-cid="Z58Z8F">
                            <p class="item-subtitle" data-cid="CATSkN">Arowwai Industries</p>
                            <p class="item-date nobold" data-cid="S6IntL">2016 -2020</p>
                        </div>
                        <p class="item-description" data-cid="O8xxbG">Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Nunc sit amet sem nec risus egestas accumsan. In enim nunc, tincidunt ut quam eget,
                            luctus sollicitudin neque.</p>
                    </div>
                    <div class="timeline-item" data-cid="CgMOGA">
                        <div class="item-header" data-cid="l4fCwb">
                            <p class="item-title" data-cid="cWNqhc">Marketing Manager</p>
                        </div>
                        <div class="item-subtitle-wrapper" data-cid="pEl4nP">
                            <p class="item-subtitle" data-cid="Y7I6up">Arowwai Industries</p>
                            <p class="item-date nobold" data-cid="YQgX3P">2019 - 2020</p>
                        </div>
                        <p class="item-description" data-cid="ch1iAY">Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Nunc sit amet sem nec risus egestas accumsan. In enim nunc, tincidunt ut quam eget,
                            luctus sollicitudin neque.</p>
                    </div>
                    <div class="timeline-item" data-cid="0BLjjo">
                        <div class="item-header" data-cid="lzfK0I">
                            <p class="item-title" data-cid="duKHUm">Marketing Manager</p>
                        </div>
                        <div class="item-subtitle-wrapper" data-cid="3wDY7S">
                            <p class="item-subtitle" data-cid="PZjKBj">Arowwai Industries</p>
                            <p class="item-date nobold" data-cid="OwvSWj">2017- 2019</p>
                        </div>
                        <p class="item-description" data-cid="88mULe">Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Nunc sit amet sem nec risus egestas accumsan. In enim nunc, tincidunt ut quam eget,
                            luctus sollicitudin neque.</p>
                    </div>
                    <div class="timeline-item" data-cid="9wTRZF">
                        <div class="item-header" data-cid="Kgj0rJ">
                            <p class="item-title" data-cid="wIsM3U">Marketing Manager</p>
                        </div>
                        <div class="item-subtitle-wrapper" data-cid="pDxfLj">
                            <p class="item-subtitle" data-cid="X0f4aJ">Arowwai Industries</p>
                            <p class="item-date nobold" data-cid="HRzRIs">2016- 2017</p>
                        </div>
                        <p class="item-description" data-cid="rCjBt6">Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Nunc sit amet sem nec risus egestas accumsan. In enim nunc, tincidunt ut quam eget,
                            luctus sollicitudin neque.</p>
                    </div>
                </div>
            </div>

            <div class="section" data-cid="H6uavo">
                <h2 class="section-title" data-cid="cVqw2T">
                    <span class="basil--book-open-solid" style="width: 20px; height: 20px;" data-cid="eJanEp"></span>
                    References
                </h2>
                <div class="references-container" data-cid="r2XnPV">
                    <div class="reference-item" data-cid="AWRAaO">
                        <p class="reference-name" data-cid="GvA2HV">Harumi Kobayashi</p>
                        <p data-cid="4BOoIW">Wardiere Inc. / CEO<br data-cid="0zEgZe">
                            <b data-cid="6QY1mL">Phone:</b> 123-456-7890<br data-cid="hYKjIF">
                            <b data-cid="3KZnl7">Email:</b> hello@reallygreatsite.com
                        </p>
                    </div>
                    <div class="reference-item" data-cid="Z9fe1b">
                        <p class="reference-name" data-cid="FBiAu0">Bailey Dupont</p>
                        <p data-cid="tQWKy0">Wardiere Inc. / CEO<br data-cid="mcnADf">
                            <b data-cid="rD6T41">Phone:</b> 123-456-7890<br data-cid="olYafy">
                            <b data-cid="SauUZN">Email:</b> hello@reallygreatsite.com
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>


`;

export const ModernProfessionalTemplate: ResumeTemplate = {
    id: 'modernprofessional',
    name: 'Modern professional',
    html: html,
    hasPhoto: true
};
