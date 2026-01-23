
import os
import re

TEMPLATES_DIR = "templates"
OUTPUT_DIR = "lib/templates"

def sanitize_name(filename):
    # Remove extension
    name = os.path.splitext(filename)[0]
    # Remove _Skywork, _Kuse suffix logic if desired, or just keep them
    # "2 column timeline_Skywork" -> "TwoColumnTimelineSkywork"
    # Replace weird chars
    name = name.replace(" ", "_").replace("-", "_").replace("&", "And")
    name = re.sub(r'[^a-zA-Z0-9_]', '', name)
    
    # CamelCase or PascalCase
    parts = name.split('_')
    pascal = "".join(p.capitalize() for p in parts if p)
    
    # Handle numbers at start
    if pascal[0].isdigit():
        pascal = "Template" + pascal
        
    return pascal

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple regex extraction to avoid heavy deps like bs4 (if not available, though standard usually)
    # We want everything in <style> and everything inside <body>
    
    styles = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL | re.IGNORECASE)
    body_match = re.search(r'<body[^>]*>(.*?)</body>', content, re.DOTALL | re.IGNORECASE)
    
    if not body_match:
        # Fallback: maybe it's just a fragment?
        # But looking at Classic_Kuse, it has body.
        print(f"Skipping {filepath}: No body tag found")
        return None, None

    body_content = body_match.group(1)
    
    # Clean scripts from body?
    # Remove <script> tags
    body_content = re.sub(r'<script[^>]*>.*?</script>', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Combine
    full_str = ""
    for s in styles:
        full_str += f"<style>{s}</style>\n"
    
    full_str += body_content
    
    return full_str, sanitize_name(os.path.basename(filepath))

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    ts_files = []
    
    # Read KuseTemplate to exclude? No, we will just not overwrite if it exists, 
    # OR we overwrite it and ensure index.ts is correct.
    # Existing kuseResume.ts is manually crafted. I should probably NOT overwrite it if it's special.
    # But "Classic_Kuse.html" might be the source of truth now.
    # I'll generate new files for ALL html files.
    
    for filename in os.listdir(TEMPLATES_DIR):
        if not filename.endswith(".html"):
            continue
            
        path = os.path.join(TEMPLATES_DIR, filename)
        html_content, ts_name = process_file(path)
        
        if not html_content:
            continue
            
        # Create unique ID from filename
        id_slug = ts_name.lower().replace("template", "")
        
        # Write TS file
        ts_filename = f"{ts_name}.ts"
        ts_path = os.path.join(OUTPUT_DIR, ts_filename)
        
        # Don't overwrite kuseResume.ts if it maps to ClassicKuse?
        # Classic_Kuse.html -> ClassicKuse.ts. existing is kuseResume.ts.
        # I will write ClassicKuse.ts.
        
        # Escape backticks in html_content
        html_content_escaped = html_content.replace("`", "\\`").replace("${", "\\${")
        
        # Check for photo support
        has_photo = "false"
        # Heuristic: Check for 'profile-pic' class OR if filename contains "Photo" or "Profile"
        if 'profile-pic' in html_content or 'Photo' in filename or 'Profile' in filename:
             has_photo = "true"
        
        # Explicit overrides if needed
        # if "Blue simple" in filename: has_photo = "true"

        # Construct TS content
        props = f"    id: '{id_slug}',\n    name: '{(filename.replace('.html','').replace('_', ' '))}',\n    html: html"
        if has_photo == "true":
            props += ",\n    hasPhoto: true"

        ts_content = f"""
import {{ ResumeTemplate }} from './types';

const html = `{html_content_escaped}`;

export const {ts_name}Template: ResumeTemplate = {{
{props}
}};
"""
        with open(ts_path, 'w', encoding='utf-8') as f:
            f.write(ts_content)
            
        ts_files.append(ts_name)
        print(f"Generated {ts_filename}")

    # Now update index.ts
    # We need to import all of them.
    # We should also include the existing KuseTemplate if it's NOT in the list (e.g. kuseResume.ts)
    # But wait, Classic_Kuse might be the new version of kuseResume.
    # I'll check if kuseResume.ts is in the list of generated files? No, generated are based on HTML filenames.
    
    # I will generate a NEW index.ts that imports all generated files + checks for kuseResume.
    
    index_content = "import { ResumeTemplate } from './types';\n"
    
    # Import existing kuseResume?
    # If ClassicKuse is generated, maybe we favor that.
    # But to be safe, I'll comment out the import for kuseResume if found, or keep it.
    
    template_list = []
    
    for name in ts_files:
        index_content += f"import {{ {name}Template }} from './{name}';\n"
        template_list.append(f"{name}Template")
        
    # Check if kuseResume.ts exists and if we want to include it
    # If "ClassicKuse" is present, it's likely the replacement.
    # I will Include ALL generated ones.
    
    index_content += "\nexport const RESUME_TEMPLATES: ResumeTemplate[] = [\n"
    for t in template_list:
        index_content += f"    {t},\n"
    index_content += "];\n\n"
    
    index_content += """export const getTemplateById = (id: string): ResumeTemplate | undefined => {
    return RESUME_TEMPLATES.find(t => t.id === id);
};
"""

    with open(os.path.join(OUTPUT_DIR, "index.ts"), 'w', encoding='utf-8') as f:
        f.write(index_content)
        
    print("Updated index.ts")

if __name__ == "__main__":
    main()
