
const fs = require('fs');
const path = require('path');

const filename = '[Kuse] Becky Shu Resume Kuse AI Kuse AI Kuse AI Kuse AI K....html';
const inputPath = path.join(__dirname, '..', filename);
const outputPath = path.join(__dirname, '..', 'lib', 'templates', 'kuseResume.ts');

try {
    const rawHtml = fs.readFileSync(inputPath, 'utf-8');

    // Quick and dirty robust extraction
    // We want everything inside <style>...</style> and <body>...</body>
    // But honestly, for the purpose of the Editor, we can probably just use the Whole HTML
    // minus the outer <html> wrapper if we render it in a div. 
    // BUT rendering headers/meta in a div is bad.

    // Let's just grab the style block and the body content.
    const styleMatch = rawHtml.match(/<style>([\s\S]*?)<\/style>/);
    const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    let styles = styleMatch ? styleMatch[1] : '';

    // The file has MULTIPLE style tags (user provided log shows that).
    // Let's grab ALL style tags.
    const allStyles = [...rawHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');

    let bodyContent = bodyMatch ? bodyMatch[1] : '';

    // Remove scripts which might interfere or cause hydration errors in React
    bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/g, '');

    const tsContent = `
export const KUSE_RESUME_TEMPLATE = \`
<style>
${allStyles}
</style>
<div id="resume-page" class="resume-page">
${bodyContent}
</div>
\`;
`;

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(outputPath, tsContent);
    console.log('Successfully wrote template to', outputPath);

} catch (e) {
    console.error('Error processing HTML:', e);
}
