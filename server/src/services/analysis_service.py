import os
import re
import json
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Any
from io import BytesIO

import PyPDF2
from pdf2image import convert_from_bytes
import pytesseract
from openai import OpenAI

from ..config.settings import settings


# =========================================================
# ---------------- SYSTEM INSTRUCTIONS --------------------
# =========================================================

SYSTEM_INSTRUCTIONS = """You are an expert ATS resume optimizer and enhancer.

MISSION: 
Take the user's original resume and optimize it for the target job by:
1. Preserving all genuine user information (name, contact, experience, education, skills)
2. Enhancing existing content to naturally integrate selected keywords
3. Improving bullet points and descriptions to be more ATS-friendly
4. Maintaining the user's actual work history and achievements
5. Adding relevant skills and technologies where appropriate

KEY REQUIREMENTS:
✅ Use ONLY the user's real information from their original resume
✅ Enhance existing job experiences and bullet points (don't create fake ones)
✅ Integrate keywords naturally into existing content
✅ Improve formatting and ATS compatibility
✅ Preserve the user's genuine education and work timeline
✅ Add missing relevant skills that align with the job description
✅ 


HOW TO INTEGRATE KEYWORDS:
✓ Enhance existing bullet points to include keywords naturally
✓ Add keywords to skills sections where they fit the user's background
✓ Improve job descriptions to incorporate relevant technologies and methodologies
✓ Optimize the professional summary to include key terms
✓ Focus keyword integration on relevant experiences, but preserve all experiences

FORBIDDEN ACTIONS:
❌ Do NOT create fake job experiences
❌ Do NOT invent companies, dates, or achievements
❌ Do NOT add false educational credentials
❌ Do NOT fabricate project details
❌ Do NOT remove or omit any existing work experiences from the original resume


CRITICAL FORMATTING REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ DO NOT USE MARKDOWN FORMATTING (NO ** for bold, NO # for headers)
⚠️ Use PLAIN TEXT ONLY with proper spacing and capitalization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUIRED RESUME STRUCTURE:

[Full Name]
[Phone] | [Email] | [LinkedIn] | [GitHub]

EDUCATION
[School Name], [City, State]
[Degree and Major], Expected: [Date]
• [Achievement/Scholarship]
• Relevant Courses: [List courses]

TECHNICAL SKILLS
Languages: [List]
Technologies: [List]
Tools: [List]

EXPERIENCE
[Job Title], [Start Date] – [End Date]
[Company Name], [City, State]
• [Achievement/responsibility with metrics]
• [Achievement/responsibility with metrics]
• [Achievement/responsibility with metrics]

[Job Title], [Start Date] – [End Date]
[Company Name], [City, State]
• [Achievement/responsibility with metrics]
• [Achievement/responsibility with metrics]

PROJECTS (if applicable)
• [Project description with technologies used]
• [Project description with technologies used]


PROFESSIONAL AFFILIATIONS (if applicable)
• [Affiliation]


FORMATTING RULES:
1. Section headers (EDUCATION, TECHNICAL SKILLS, EXPERIENCE, etc.) must be in ALL CAPS
2. NO markdown symbols (**, ##, etc.) - use plain text only
3. Job titles and company names on separate lines
4. Use bullet points (•) for lists and achievements
5. Include dates in format: Month YYYY – Month YYYY
6. Keep consistent spacing between sections
7. Use proper comma placement for locations (City, State)
"""

OPTIMIZATION_EXAMPLES = """
EXAMPLE 1 - Software Developer Resume:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Developed web application features using React, implementing API integration for seamless data flow across client projects

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE 2 - Marketing Role:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Managed social media accounts using data-driven content strategy and analytics to increase follower engagement by tracking key performance metrics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE 3 - Project Manager:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Coordinated cross-functional teams using Scrum framework and stakeholder management practices to deliver projects on time and within budget

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


# =========================================================
# ---------------- PDF EXTRACTION -------------------------
# =========================================================

async def extract_text_from_pdf(pdf_buffer: bytes) -> Dict[str, Any]:
    """
    Extract text from PDF with fallback to OCR if needed.
    Returns both extracted text and formatting information.
    """
    extracted_text = ""
    formatting_info = {
        "sections": [],
        "hasDetectedFormatting": False,
        "bulletCount": 0
    }

    try:
        reader = PyPDF2.PdfReader(BytesIO(pdf_buffer))

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"

        # Normalize bullet points for consistency
        extracted_text = normalize_bullet_points(extracted_text)

        # Detect resume structure
        formatting_info["sections"] = detect_resume_sections(extracted_text)
        formatting_info["hasDetectedFormatting"] = bool(formatting_info["sections"])
        formatting_info["bulletCount"] = count_bullet_points(extracted_text)

        # Fallback to OCR if extraction failed
        if len(extracted_text.strip()) < 50:
            print("Primary extraction yielded minimal text. Attempting OCR...")
            ocr_text = await extract_text_with_ocr(pdf_buffer)
            if len(ocr_text) > len(extracted_text):
                extracted_text = ocr_text
                formatting_info["sections"] = detect_resume_sections(extracted_text)
                formatting_info["bulletCount"] = count_bullet_points(extracted_text)

        # Save for debugging and reference
        save_extracted_text_to_file(extracted_text)
        save_extracted_text_to_project_base(extracted_text)

        return {
            "text": extracted_text,
            "formatting": formatting_info
        }

    except Exception as e:
        print(f"PDF extraction error: {e}. Falling back to OCR...")
        ocr_text = await extract_text_with_ocr(pdf_buffer)
        formatting_info["bulletCount"] = count_bullet_points(ocr_text)
        save_extracted_text_to_project_base(ocr_text)
        return {
            "text": ocr_text,
            "formatting": formatting_info
        }


async def extract_text_with_ocr(pdf_buffer: bytes) -> str:
    """
    Use OCR to extract text from PDF images.
    Processes up to 5 pages with high DPI for accuracy.
    """
    images = convert_from_bytes(pdf_buffer, dpi=300)
    text = ""

    for i, image in enumerate(images[:5]):
        print(f"OCR processing page {i+1}...")
        text += pytesseract.image_to_string(image, config='--psm 6') + "\n"

    return normalize_bullet_points(text)


# =========================================================
# ---------------- TEXT NORMALIZATION ---------------------
# =========================================================

def normalize_bullet_points(text: str) -> str:
    """
    Standardize all bullet point styles to '•' for consistency.
    """
    bullet_patterns = [
        r'^(\s*)[-–—*▪▫■□◆◇➤➔✓✔>]\s+',
        r'^(\s*)\u2022\s+',
        r'^(\s*)·\s+',
        r'^(\s*)[o]\s+(?=[A-Z])',
    ]

    lines = text.split("\n")
    output = []

    for line in lines:
        modified = False
        for pattern in bullet_patterns:
            match = re.match(pattern, line)
            if match:
                # Replace with standard bullet
                line = f"{match.group(1)}• {line[match.end():].strip()}"
                modified = True
                break
        output.append(line)

    return "\n".join(output)


def count_bullet_points(text: str) -> int:
    """
    Count the number of bullet points in the text.
    """
    return len(re.findall(r'^\s*•\s+', text, re.MULTILINE))


def clean_encoding_artifacts(text: str) -> str:
    """
    Remove problematic encoding artifacts like %Ï that cause formatting issues
    while preserving proper line breaks and structure.
    """
    # DEBUG: Track input
    print("=" * 80)
    print("DEBUG: clean_encoding_artifacts() CALLED")
    print("=" * 80)
    print(f"Input type: {type(text)}")
    print(f"Input length: {len(text) if isinstance(text, str) else 'N/A'}")
    if isinstance(text, str):
        print(f"Input first 300 chars:\n{text[:300]}")
    else:
        print(f"Input value (non-string): {str(text)[:300]}")
    print("=" * 80)

    # Ensure text is a string
    if isinstance(text, dict):
        print("WARNING: Input is dict, converting to string")
        text = str(text)
    elif not isinstance(text, str):
        print(f"WARNING: Input is {type(text)}, converting to string")
        text = str(text) if text else ""

    if not text:
        print("WARNING: Empty text after conversion")
        return text

    original_length = len(text)

    # Remove ALL variations of the problematic characters
    text = re.sub(r'%[ÏïĪīÎîØø]', '', text)
    text = re.sub(r'[ÏïĪīÎîØø]', '', text)
    text = re.sub(r'%\s*[ÏïĪīÎîØø]', '', text)
    text = re.sub(r'[ÏïĪīÎîØø]\s*%', '', text)

    # Fix common encoding issues
    text = text.replace('â€¢', '•')  # Fix bullet points
    text = text.replace('â€"', '–')  # Fix em dashes
    text = text.replace('â€™', "'")  # Fix apostrophes
    text = text.replace('â€œ', '"')  # Fix quotes
    text = text.replace('â€', '"')   # Fix quotes

    # Clean up multiple spaces but preserve line structure
    text = re.sub(r'[ \t]+', ' ', text)  # Multiple spaces/tabs to single space
    text = re.sub(r' *\n+ *', '\n', text)  # Clean line breaks but keep them

    # Fix bullet point issues - ensure proper bullet formatting
    text = re.sub(r'^\s*[•●]\s*%[ÏïĪīÎîØø]?\s*', '• ', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*%[ÏïĪīÎîØø]\s*', '• ', text, flags=re.MULTILINE)

    # Fix split section headers
    text = re.sub(r'PROFESSIONAL\s+EXPERIENCES', 'PROFESSIONAL EXPERIENCES', text)
    text = re.sub(r'TECHNICAL\s+PROJECTS', 'TECHNICAL PROJECTS', text)

    # Ensure proper section formatting - add line breaks before section headers
    section_headers = ['EDUCATION', 'TECHNICAL SKILLS', 'PROFESSIONAL EXPERIENCES',
                      'TECHNICAL PROJECTS', 'PROJECTS', 'LEADERSHIP', 'CERTIFICATIONS']

    for header in section_headers:
        text = re.sub(f'([^\n]){header}', f'\\1\n\n{header}', text)

    # Ensure bullet points start on new lines and are properly formatted
    text = re.sub(r'([^\n])•', r'\1\n•', text)
    text = re.sub(r'([^\n])●', r'\1\n●', text)

    final_text = text.strip()

    # DEBUG: Track output
    print("=" * 80)
    print("DEBUG: clean_encoding_artifacts() OUTPUT")
    print("=" * 80)
    print(f"Original length: {original_length} → Final length: {len(final_text)}")
    print(f"Characters removed/changed: {original_length - len(final_text)}")
    print(f"Output first 300 chars:\n{final_text[:300]}")
    print(f"Output last 300 chars:\n{final_text[-300:]}")
    print("=" * 80)

    return final_text


# =========================================================
# ---------------- SECTION DETECTION ---------------------
# =========================================================

def detect_resume_sections(text: str) -> List[Dict[str, Any]]:
    """
    Identify major resume sections and their positions.
    """
    sections = []

    # Common section headers with variations
    patterns = [
        (r'^(SUMMARY|PROFESSIONAL SUMMARY|PROFILE|OBJECTIVE|CAREER OBJECTIVE)$', 'summary'),
        (r'^(EXPERIENCES|WORK EXPERIENCE|PROFESSIONAL EXPERIENCES|EMPLOYMENT HISTORY|WORK HISTORY)$', 'experience'),
        (r'^(EDUCATION|ACADEMIC BACKGROUND)$', 'education'),
        (r'^(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|EXPERTISE)$', 'skills'),
        (r'^(CERTIFICATIONS|CERTIFICATES|LICENSES)$', 'certifications'),
        (r'^(PROJECTS|KEY PROJECTS)$', 'projects'),
    ]

    lines = text.split("\n")

    for i, line in enumerate(lines):
        stripped = line.strip().upper()
        for pattern, section_type in patterns:
            if re.match(pattern, stripped):
                sections.append({
                    "name": line.strip(),  # Keep original casing
                    "type": section_type,
                    "lineNumber": i
                })
                break

    return sections


def extract_experience_bullets(text: str) -> List[str]:
    """
    Extract all bullet points from the experience section.
    """
    sections = detect_resume_sections(text)
    experience_section = next((s for s in sections if s['type'] == 'experience'), None)

    if not experience_section:
        return []

    lines = text.split("\n")
    start_line = experience_section['lineNumber']

    # Find next section or end of document
    next_section = next((s for s in sections if s['lineNumber'] > start_line), None)
    end_line = next_section['lineNumber'] if next_section else len(lines)

    # Extract bullets between start and end
    bullets = []
    for line in lines[start_line:end_line]:
        if re.match(r'^\s*•\s+', line):
            bullets.append(line.strip())

    return bullets

def count_bullets_per_section(text: str) -> Dict[str, int]:
    """
    Count bullets in each section for validation.
    """
    sections = detect_resume_sections(text)
    lines = text.split("\n")
    bullet_counts = {}

    for i, section in enumerate(sections):
        start_line = section['lineNumber']
        # Find next section or end
        next_section = sections[i + 1] if i + 1 < len(sections) else None
        end_line = next_section['lineNumber'] if next_section else len(lines)

        # Count bullets in this section
        count = 0
        for line in lines[start_line:end_line]:
            if re.match(r'^\s*•\s+', line):
                count += 1

        bullet_counts[section['type']] = count

    return bullet_counts

# =========================================================
# ---------------- FILE SAVING ----------------------------
# =========================================================

def save_extracted_text_to_file(text: str) -> Optional[str]:
    """
    Save extracted text to temporary file for debugging.
    """
    try:
        tmp = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".txt",
            mode="w",
            encoding="utf-8"
        )
        tmp.write(text)
        tmp.close()
        print(f"Extracted text saved to: {tmp.name}")
        return tmp.name
    except Exception as e:
        print(f"Failed to save extracted text: {e}")
        return None

def save_extracted_text_to_project_base(text: str) -> None:
    """
    Save extracted text to project directory for reference.
    """
    try:
        base = Path(__file__).parent.parent.parent / "resume"
        base.mkdir(exist_ok=True)
        path = base / "baseResume.txt"
        path.write_text(text, encoding="utf-8")
        print(f"Base resume saved to: {path}")
    except Exception as e:
        print(f"Failed to save base resume: {e}")


def save_optimized_resume_to_file(text: str) -> Optional[str]:
    """
    Save optimized resume to project directory.
    """
    try:
        base = Path(__file__).parent.parent.parent / "resume"
        base.mkdir(exist_ok=True)
        path = base / "optimizedResume.txt"
        path.write_text(text, encoding="utf-8")
        print(f"Optimized resume saved to: {path}")
        return str(path)
    except Exception as e:
        print(f"Failed to save optimized resume: {e}")
        return None


# =========================================================
# ---------------- RESUME ANALYSIS ------------------------
# =========================================================

async def analyze_resume_against_job(resume_text: str, job_data: Dict) -> Dict[str, Any]:
    """
    Compare resume against job description to identify missing and matching keywords.
    Uses AI to filter out non-actionable keywords.
    """
    # Extract all potential keywords from job description
    job_phrases = []
    for field in ["skills", "requirements", "technologies", "tools", "qualifications"]:
        if isinstance(job_data.get(field), list):
            job_phrases.extend(job_data[field])

    # Remove duplicates and clean
    job_phrases = list(set([p.strip() for p in job_phrases if p.strip()]))

    if not job_phrases:
        return {
            "success": True,
            "matchScore": 0,
            "missingPhrases": [],
            "matchingPhrases": [],
            "actionableKeywords": []
        }

    # Categorize keywords
    missing = []
    matching = []
    resume_lower = resume_text.lower()

    for phrase in job_phrases:
        phrase_lower = phrase.lower()
        # Check for exact match or close variations
        if phrase_lower in resume_lower or any(word in resume_lower for word in phrase_lower.split() if len(word) > 3):
            matching.append(phrase)
        else:
            missing.append(phrase)

    # Use AI to filter actionable keywords from missing list
    ai_filtered = await filter_keywords_with_ai(
        missing,
        job_data.get("title", ""),
        resume_text
    )

    # Calculate match score
    score = (len(matching) / max(len(job_phrases), 1)) * 100

    return {
        "success": True,
        "matchScore": round(score, 1),
        "missingPhrases": missing,
        "matchingPhrases": matching,
        "actionableKeywords": ai_filtered.get("actionableKeywords", []),
        "totalKeywords": len(job_phrases)
    }


# =========================================================
# ---------------- KEYWORD FILTERING ---------------------
# =========================================================

async def filter_keywords_with_ai(
        missing_phrases: List[str],
        job_title: str = "",
        resume_text: str = ""
) -> Dict[str, Any]:
    """
    Use AI to filter keywords into actionable vs non-actionable categories.
    Removes requirements like degrees, years of experience, certifications requiring time.
    """
    if not missing_phrases:
        return {"actionableKeywords": []}

    api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("No OpenAI API key found. Using basic keyword filter.")
        return _basic_keyword_filter(missing_phrases)

    try:
        client = OpenAI(api_key=api_key)

        prompt = f"""
Analyze these keywords from a job posting for a {job_title or 'professional'} role.

TASK: Filter ONLY keywords that can be incorporated into an existing resume through rewording experience bullets.

INCLUDE (Actionable):
✓ Skills (e.g., "data analysis", "project management")
✓ Tools/Technologies (e.g., "Python", "SQL", "Tableau")
✓ Methodologies (e.g., "Agile", "Six Sigma")
✓ Soft skills if specific (e.g., "stakeholder communication")
✓ Industry terms (e.g., "A/B testing", "ETL pipelines")

EXCLUDE (Non-Actionable):
✗ Years of experience (e.g., "5+ years", "3-5 years experience")
✗ Education requirements (e.g., "Bachelor's degree", "Master's in CS")
✗ Certifications requiring exams/time (e.g., "PMP", "CPA", "AWS Certified")
✗ Clearance requirements (e.g., "Security Clearance")
✗ Vague phrases (e.g., "strong communication", "team player")
✗ Job requirements (e.g., "ability to travel", "work independently")

KEYWORDS TO FILTER:
{chr(10).join(f"- {p}" for p in missing_phrases[:40])}

Return ONLY valid JSON with this exact structure:
{{
  "actionableKeywords": [
    {{
      "keyword": "exact keyword text",
      "category": "Skill|Tool|Methodology|Technology",
      "priority": "high|medium|low",
      "suggestedIntegration": "brief tip on how to integrate this into experience bullets"
    }}
  ]
}}

Priority guidelines:
- high: Core technical skills and tools directly mentioned multiple times in job description
- medium: Supplementary skills and methodologies
- low: Nice-to-have skills or tangential technologies
"""

        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert ATS keyword analyzer. Return only valid JSON, no markdown formatting."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )

        content = response.choices[0].message.content.strip()
        content = re.sub(r"^```(?:json)?|```$", "", content, flags=re.MULTILINE).strip()

        print(f"Raw AI response (first 500 chars): {content[:500]}")

        try:
            result = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"JSON error: {e}")
            print(f"Content that failed to parse: {content[:1000]}")
            return _basic_keyword_filter(missing_phrases)

        # Validate and return actionable keywords
        actionable_keywords = result.get("actionableKeywords", [])

        if not isinstance(actionable_keywords, list):
            print("ERROR: actionableKeywords is not a list")
            return _basic_keyword_filter(missing_phrases)

        print(f"Successfully extracted {len(actionable_keywords)} actionable keywords")

        return {
            "actionableKeywords": actionable_keywords
        }
    except Exception as e:
        print(f"AI keyword filtering error: {e}")
        return _basic_keyword_filter(missing_phrases)


def _basic_keyword_filter(missing_phrases: List[str]) -> Dict[str, Any]:
    """
    Basic keyword filtering without AI - filters out obvious non-actionable keywords.
    """
    non_actionable_patterns = [
        r'\d+\+?\s*years?',  # "5+ years", "3 years"
        r'bachelor',
        r'master',
        r'ph\.?d',
        r'degree',
        r'clearance',
        r'certification',
        r'travel',
        r'ability to',
        r'strong\s+\w+',  # "strong communication"
        r'excellent\s+\w+',
        r'team player',
    ]

    actionable = []
    for phrase in missing_phrases:
        phrase_lower = phrase.lower()
        is_actionable = True

        for pattern in non_actionable_patterns:
            if re.search(pattern, phrase_lower, re.IGNORECASE):
                is_actionable = False
                break

        if is_actionable:
            actionable.append({
                "keyword": phrase,
                "category": "Skill",
                "priority": "medium",
                "suggestedIntegration": "Add to relevant experience bullets or skills section"
            })

    return {"actionableKeywords": actionable}


async def generate_optimized_resume(
        original_resume_text: str,
        selected_keywords: List[Dict[str, str]],
        job_description: str = "",
        job_title: str = "",

) -> Dict[str, Any]:

    if not selected_keywords:
        return {"success": False, "optimizedResume": "", "message": "No keywords selected."}

    api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"success": False, "optimizedResume": "", "message": "OpenAI API key missing."}

    # Extract keywords with robust handling for different input formats
    keywords = []
    for k in selected_keywords:
        if isinstance(k, dict):
            keyword_value = k.get("keyword", "")
        elif isinstance(k, str):
            keyword_value = k
        else:
            keyword_value = str(k)

        if keyword_value:
            keywords.append(str(keyword_value).strip())

    if not keywords:
        return {"success": False, "optimizedResume": "", "message": "No valid keywords."}

    # Count sections in original
    original_sections = detect_resume_sections(original_resume_text)
    print(f"\nSections detected in original: {[s['name'] for s in original_sections]}")
    original_bullet_count = count_bullet_points(original_resume_text)
    print(f"Bullet points in original: {original_bullet_count}")
    print("=" * 80)

    print(f"Generating new resume with {len(keywords)} keywords")

    try:
        client = OpenAI(api_key=api_key)

        prompt = f"""{SYSTEM_INSTRUCTIONS}

ORIGINAL USER RESUME TO OPTIMIZE:
{original_resume_text}

TARGET ROLE: {job_title or "Not specified"}

SELECTED KEYWORDS TO INTEGRATE ({len(keywords)} total):
{chr(10).join(f"→ {kw}" for kw in keywords)}

JOB DESCRIPTION FOR CONTEXT:
{job_description[:2000] if job_description else "Not provided"}

CRITICAL REQUIREMENTS:
1. The optimized resume MUST contain ALL experiences, projects, and achievements from the original
2. DO NOT remove or omit any work experiences
3. DO NOT remove any projects or skills
4. ONLY enhance the existing content by integrating keywords naturally
5. The optimized resume should be AT LEAST as long as the original resume

Return the optimized resume as PLAIN TEXT ONLY in the "optimizedResume" field, not as a dictionary or list.

OUTPUT (valid JSON only, no markdown):
{{
  "optimizedResume": "COMPLETE FULL-LENGTH TEXT of the enhanced resume with ALL sections, ALL experiences, ALL projects",
  "atsScore": 85,
  "tips": ["Improvement 1", "Improvement 2"]
}}"""

        print("Sending comprehensive optimization request to OpenAI...")

        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-4o",
            messages=[
                {"role": "system", "content": "You are a resume optimizer. Create a COMPLETE enhanced resume using ALL the user's real information. Return ONLY valid JSON with the optimizedResume field containing the FULL FORMATTED RESUME TEXT (not a dictionary). Include EVERY SINGLE section, job, project, and achievement from the original. DO NOT omit or summarize anything."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=16000
        )

        content = response.choices[0].message.content.strip()

        content = re.sub(r"^```(?:json)?|```$", "", content, flags=re.MULTILINE).strip()

        try:
            result = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Content that failed to parse: {content[:500]}")
            return {"success": False, "optimizedResume": "", "message": "AI returned invalid JSON."}

        optimized_text = result.get("optimizedResume", "")


        if isinstance(optimized_text, dict):
            print(f"WARNING: optimizedResume is a dict with keys: {list(optimized_text.keys())}")
            print(f"Dict content preview: {str(optimized_text)[:500]}")
        elif isinstance(optimized_text, list):
            print(f"WARNING: optimizedResume is a list with {len(optimized_text)} items")
            print(f"List content preview: {str(optimized_text)[:500]}")
        else:
            print(f"optimizedResume length before conversion: {len(str(optimized_text))} characters")
        print("=" * 80)

        # Check if optimizedResume is a dict/list (meaning AI returned wrong format)
        if isinstance(optimized_text, (dict, list)):

            # Convert dict structure back to formatted resume text
            optimized_text = _dict_to_resume_text(optimized_text)

        if not optimized_text:
            print("ERROR: No optimized_text extracted from AI response")
            return {"success": False, "optimizedResume": "", "message": "No resume generated."}

        if not isinstance(optimized_text, str):
            optimized_text = str(optimized_text)

        print(f"Extracted resume text length: {len(optimized_text)} characters")
        print(f"Extracted resume line count: {len(optimized_text.splitlines())}")

        # Clean encoding artifacts from the generated resume
        optimized_text = clean_encoding_artifacts(optimized_text)

        # Check sections in optimized
        optimized_sections = detect_resume_sections(optimized_text)
        print(f"\nSections detected in optimized: {[s['name'] for s in optimized_sections]}")
        optimized_bullet_count = count_bullet_points(optimized_text)
        print(f"Bullet points in optimized: {optimized_bullet_count}")

        # Compare
        print(f"\nCOMPARISON:")
        print(f"  Original bullets: {original_bullet_count} → Optimized bullets: {optimized_bullet_count}")
        print(f"  Original sections: {len(original_sections)} → Optimized sections: {len(optimized_sections)}")
        print(f"  Original length: {len(original_resume_text)} → Optimized length: {len(optimized_text)}")

        # WARN if content was significantly reduced
        if len(optimized_text) < len(original_resume_text) * 0.8:
            print(f"⚠️  WARNING: Optimized resume is {len(original_resume_text) - len(optimized_text)} characters shorter!")
            print(f"⚠️  This suggests the AI may have omitted content from the original resume.")

        if optimized_bullet_count < original_bullet_count:
            print(f"⚠️  WARNING: Optimized resume has {original_bullet_count - optimized_bullet_count} fewer bullet points!")
            print(f"⚠️  Some experiences or achievements may have been omitted.")

        print("=" * 80)

        keyword_check = verify_keyword_integration(optimized_text, keywords)
        save_optimized_resume_to_file(optimized_text)

        print(f"Success! {len(keyword_check['integrated'])} keywords integrated")

        return {
            "success": True,
            "message": "New resume generated successfully",
            "optimizedResume": optimized_text,
            "resumeSections": result.get("resumeSections", []),
            "keywordIntegration": result.get("keywordIntegration", []),
            "keywordVerification": keyword_check,
            "atsScore": result.get("atsScore", 0),
            "tips": result.get("tips", []),
            "metadata": {
                "keywordsRequested": len(keywords),
                "keywordsIntegrated": len(keyword_check['integrated'])
            }
        }

    except Exception as e:
        import traceback
        print(f"Generation error: {e}")
        print(f"Error traceback: {traceback.format_exc()}")
        return {"success": False, "optimizedResume": "", "message": f"Generation failed: {str(e)}"}



def verify_keyword_integration(optimized_text: str, keywords: List[str]) -> Dict[str, Any]:
    """
    Verify that selected keywords were actually integrated into the resume.
    """
    optimized_lower = optimized_text.lower()

    integrated = []
    missing = []

    for keyword in keywords:
        # Ensure keyword is a string
        if isinstance(keyword, dict):
            keyword = keyword.get("keyword", "")
        elif not isinstance(keyword, str):
            keyword = str(keyword)

        if not keyword:
            continue

        keyword_lower = keyword.lower()
        if keyword_lower in optimized_lower:
            integrated.append(keyword)
        else:
            # Check for partial matches (e.g., "machine learning" might appear as "ML")
            keyword_words = keyword_lower.split()
            if len(keyword_words) > 1 and all(word in optimized_lower for word in keyword_words):
                integrated.append(keyword)
            else:
                missing.append(keyword)

    return {
        "integrated": integrated,
        "missing": missing,
        "integrationRate": round((len(integrated) / max(len(keywords), 1)) * 100, 1)
    }


# =========================================================
# ---------------- HELPER FUNCTIONS ----------------------
# =========================================================

def validate_resume_structure(original: str, optimized: str) -> Dict[str, Any]:
    """
    Validate that optimized resume maintains original structure.
    """
    original_sections = detect_resume_sections(original)
    optimized_sections = detect_resume_sections(optimized)

    return {
        "sectionsPreserved": len(original_sections) == len(optimized_sections),
        "originalSections": [s['type'] for s in original_sections],
        "optimizedSections": [s['type'] for s in optimized_sections],
        "bulletCountOriginal": count_bullet_points(original),
        "bulletCountOptimized": count_bullet_points(optimized)
    }


def _dict_to_resume_text(resume_dict: Any) -> str:
    """
    Convert a resume dictionary back to formatted text.
    Handles cases where AI returns structured data instead of plain text.
    Formats resume with proper professional structure: ALL CAPS headers, inline job titles with dates.
    """
    # DEBUG: Track input
    print("=" * 80)
    print("DEBUG: _dict_to_resume_text() CALLED")
    print("=" * 80)
    print(f"Input type: {type(resume_dict)}")

    if not isinstance(resume_dict, dict):
        print(f"WARNING: Input is not a dict, it's {type(resume_dict)}")
        print(f"Input value: {str(resume_dict)[:500]}")
        return str(resume_dict)

    print(f"Dictionary keys: {list(resume_dict.keys())}")
    print(f"Full dictionary structure (first 1000 chars): {str(resume_dict)[:1000]}")
    print("=" * 80)

    resume_text = []

    # Name and contact
    if 'name' in resume_dict:
        resume_text.append(resume_dict['name'])

    if 'contact' in resume_dict:
        contact = resume_dict['contact']
        contact_info = []
        for key, value in contact.items():
            if value and value not in ['GitHub', 'LinkedIn', 'github', 'linkedin']:
                contact_info.append(str(value))
        if contact_info:
            resume_text.append(' | '.join(contact_info))

    # Education
    if 'education' in resume_dict:
        resume_text.append('\nEDUCATION')
        edu = resume_dict['education']
        if isinstance(edu, dict):
            if 'institution' in edu:
                inst_line = f"{edu['institution']}, {edu.get('location', '')}"
                if 'expectedGraduation' in edu:
                    inst_line += f", Expected: {edu['expectedGraduation']}"
                resume_text.append(inst_line)

            if 'degree' in edu:
                resume_text.append(edu['degree'])
            if 'gpa' in edu:
                resume_text.append(f"GPA: {edu['gpa']}")
            if 'honors' in edu and isinstance(edu['honors'], list):
                for honor in edu['honors']:
                    resume_text.append(f"• {honor}")
            if 'courses' in edu and isinstance(edu['courses'], list):
                resume_text.append(f"• Relevant Courses: {', '.join(edu['courses'])}")
        else:
            resume_text.append(str(edu))

    # Technical Skills - check multiple possible keys
    skills_key = None
    for possible_key in ['skills', 'technicalSkills', 'technical_skills']:
        if possible_key in resume_dict:
            skills_key = possible_key
            break

    if skills_key:
        print(f"Found skills under key '{skills_key}': {resume_dict[skills_key]}")
        resume_text.append('\nTECHNICAL SKILLS')
        skills = resume_dict[skills_key]
        if isinstance(skills, dict):
            for skill_category, skill_list in skills.items():
                if isinstance(skill_list, list) and skill_list:
                    category_name = skill_category.replace('_', ' ').title()
                    skills_str = ', '.join(str(s) for s in skill_list)
                    resume_text.append(f"{category_name}: {skills_str}")
        else:
            resume_text.append(str(skills))

    # Professional Experiences - check multiple possible keys
    exp_key = None
    for possible_key in ['professionalExperiences', 'experiences', 'workExperience', 'professional_experiences']:
        if possible_key in resume_dict:
            exp_key = possible_key
            break

    if exp_key:
        print(f"Found experiences under key '{exp_key}'")
        experiences = resume_dict[exp_key]
        print(f"Number of experiences: {len(experiences) if isinstance(experiences, list) else 'N/A (not a list)'}")
        print(f"Experiences preview: {str(experiences)[:500]}")

        resume_text.append('\nPROFESSIONAL EXPERIENCES')
        if isinstance(experiences, list):
            for idx, exp in enumerate(experiences):
                print(f"  Processing experience #{idx + 1}: {type(exp)}")
                if isinstance(exp, dict):
                    print(f"    Experience keys: {list(exp.keys())}")
                    title = exp.get('title', '') or exp.get('jobTitle', '') or exp.get('position', '')
                    company = exp.get('company', '') or exp.get('employer', '')
                    location = exp.get('location', '')
                    dates = exp.get('dates', '') or exp.get('dateRange', '') or exp.get('duration', '')

                    # Format: "Job Title, Date Range" on one line
                    exp_line = f"{title}"
                    if dates:
                        exp_line += f", {dates}"
                    resume_text.append(exp_line)
                    print(f"    Added title line: {exp_line}")

                    # Company and location on next line
                    company_line = company
                    if location:
                        company_line += f", {location}"
                    if company:
                        resume_text.append(company_line)
                        print(f"    Added company line: {company_line}")

                    # Responsibilities as bullets - check multiple keys
                    responsibilities = (exp.get('responsibilities') or
                                      exp.get('bullets') or
                                      exp.get('achievements') or
                                      exp.get('duties') or [])

                    print(f"    Responsibilities count: {len(responsibilities) if isinstance(responsibilities, list) else 'N/A'}")

                    if isinstance(responsibilities, list):
                        for resp in responsibilities:
                            resume_text.append(f"• {resp}")
                    elif responsibilities:
                        # Single string - split by lines
                        for line in str(responsibilities).split('\n'):
                            if line.strip():
                                resume_text.append(f"• {line.strip()}")
        else:
            print(f"WARNING: Experiences is not a list, it's {type(experiences)}")
    else:
        print("WARNING: No experiences key found in dictionary!")

    # Technical Projects
    if 'technicalProjects' in resume_dict or 'projects' in resume_dict:
        projects_key = 'technicalProjects' if 'technicalProjects' in resume_dict else 'projects'
        projects = resume_dict[projects_key]
        print(f"Found projects under key '{projects_key}': {len(projects) if isinstance(projects, list) else 'N/A'}")

        if projects and isinstance(projects, list) and len(projects) > 0:
            resume_text.append('\nTECHNICAL PROJECTS')
            for project in projects:
                if isinstance(project, dict):
                    title = project.get('title', '') or project.get('name', '')
                    description = project.get('description', '') or project.get('summary', '')
                    if title:
                        resume_text.append(f"• {title}")
                    if description:
                        resume_text.append(f"  {description}")

    # Leadership and Affiliations
    if 'leadership' in resume_dict:
        leadership = resume_dict['leadership']
        print(f"Found leadership: {len(leadership) if isinstance(leadership, list) else 'N/A'}")
        if leadership and isinstance(leadership, list) and len(leadership) > 0:
            resume_text.append('\nLEADERSHIP')
            for item in leadership:
                resume_text.append(f"• {item}")

    # Certifications
    if 'certifications' in resume_dict:
        certs = resume_dict['certifications']
        print(f"Found certifications: {len(certs) if isinstance(certs, list) else 'N/A'}")
        if certs and isinstance(certs, list) and len(certs) > 0:
            resume_text.append('\nCERTIFICATIONS')
            for cert in certs:
                resume_text.append(f"• {cert}")

    final_text = '\n'.join(resume_text).strip()

    # DEBUG: Track output
    print("=" * 80)
    print("DEBUG: _dict_to_resume_text() OUTPUT")
    print("=" * 80)
    print(f"Total lines generated: {len(resume_text)}")
    print(f"Final text length: {len(final_text)} characters")
    print(f"Final text first 500 chars:\n{final_text[:500]}")
    print(f"Final text last 500 chars:\n{final_text[-500:]}")
    print("=" * 80)

    return final_text
