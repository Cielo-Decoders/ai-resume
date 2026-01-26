import os
import re
import json
import tempfile
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from io import BytesIO

import PyPDF2
from pdf2image import convert_from_bytes
import pytesseract
from openai import OpenAI

from ..config.settings import settings


# =========================================================
# ---------------- ANALYSIS CACHE -------------------------
# =========================================================

# In-memory cache for analysis results
_analysis_cache: Dict[str, Dict[str, Any]] = {}
_keyword_filter_cache: Dict[str, Dict[str, Any]] = {}


def _generate_cache_key(resume_text: str, job_data: Dict) -> str:
    """
    Generate a unique cache key based on resume text and job data.
    Uses SHA256 hash to create a consistent identifier.
    """
    # Create a deterministic string from job data
    job_fields = ["title", "skills", "requirements", "technologies", "tools", "qualifications"]
    job_str = ""
    for field in job_fields:
        if field in job_data:
            value = job_data[field]
            if isinstance(value, list):
                # Sort list items for consistency
                job_str += f"{field}:" + ",".join(sorted([str(v) for v in value]))
            else:
                job_str += f"{field}:{value}"

    # Combine resume and job data
    combined = f"{resume_text.strip()}|||{job_str}"

    # Generate SHA256 hash
    return hashlib.sha256(combined.encode('utf-8')).hexdigest()


def _generate_keyword_cache_key(missing_phrases: List[str], job_title: str) -> str:
    """
    Generate cache key for keyword filtering.
    """
    # Sort phrases for consistency
    sorted_phrases = sorted(missing_phrases)
    combined = f"{job_title}|||{','.join(sorted_phrases)}"
    return hashlib.sha256(combined.encode('utf-8')).hexdigest()


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

        # Normalize text for consistency across extractions
        extracted_text = _normalize_extracted_text(extracted_text)

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
                extracted_text = _normalize_extracted_text(ocr_text)
                extracted_text = normalize_bullet_points(extracted_text)
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
        ocr_text = _normalize_extracted_text(ocr_text)
        ocr_text = normalize_bullet_points(ocr_text)
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

    return final_text


def _normalize_extracted_text(text: str) -> str:
    """
    Normalize extracted text to ensure consistency across multiple extractions.
    Removes inconsistent whitespace while preserving document structure.
    """
    if not text:
        return text

    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # Remove excessive whitespace while preserving single spaces
    text = re.sub(r'[ \t]+', ' ', text)  # Multiple spaces/tabs to single space

    # Normalize multiple blank lines to maximum of 2
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Remove trailing/leading whitespace from each line
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(lines)

    # Remove any zero-width or invisible characters
    text = re.sub(r'[\u200b\u200c\u200d\ufeff]', '', text)

    # Normalize unicode characters (e.g., different types of dashes, quotes)
    text = text.replace('\u2013', '-')  # En dash to hyphen
    text = text.replace('\u2014', '-')  # Em dash to hyphen
    text = text.replace('\u2018', "'")  # Left single quote
    text = text.replace('\u2019', "'")  # Right single quote
    text = text.replace('\u201c', '"')  # Left double quote
    text = text.replace('\u201d', '"')  # Right double quote
    text = text.replace('\u2022', '•')  # Bullet point normalization

    return text.strip()


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
    # Check cache first
    cache_key = _generate_cache_key(resume_text, job_data)

    if cache_key in _analysis_cache:
        print("Cache hit for analysis")
        return _analysis_cache[cache_key]

    # Extract all potential keywords from job description
    job_phrases = []
    for field in ["skills", "requirements", "technologies", "tools", "qualifications"]:
        if isinstance(job_data.get(field), list):
            job_phrases.extend(job_data[field])

    # Remove duplicates and clean - SORT for consistency
    job_phrases = sorted(list(set([p.strip() for p in job_phrases if p.strip()])))

    if not job_phrases:
        return {
            "success": True,
            "matchScore": 0,
            "missingPhrases": [],
            "matchingPhrases": [],
            "actionableKeywords": []
        }

    # Categorize keywords with improved matching logic
    missing = []
    matching = []
    resume_lower = resume_text.lower()

    # Normalize resume text for better matching
    resume_normalized = re.sub(r'[^\w\s]', ' ', resume_lower)  # Remove punctuation
    resume_words = set(resume_normalized.split())

    for phrase in job_phrases:
        phrase_lower = phrase.lower()
        phrase_normalized = re.sub(r'[^\w\s]', ' ', phrase_lower)

        # Multi-word phrases: check for exact phrase match or word boundary match
        if ' ' in phrase_normalized:
            phrase_words = phrase_normalized.split()
            # Check exact phrase match with word boundaries
            pattern = r'\b' + re.escape(phrase_lower.strip()) + r'\b'

            if re.search(pattern, resume_lower):
                matching.append(phrase)
            # Check if all words in the phrase appear in resume
            elif all(word in resume_words for word in phrase_words if len(word) > 2):
                matching.append(phrase)
            else:
                missing.append(phrase)
        else:
            # Single word: check with word boundaries to avoid false positives
            pattern = r'\b' + re.escape(phrase_lower.strip()) + r'\b'

            if re.search(pattern, resume_lower):
                matching.append(phrase)
            # Also check for plural/singular variations
            elif (phrase_lower.endswith('s') and re.search(r'\b' + re.escape(phrase_lower[:-1]) + r'\b', resume_lower)) or \
                 (re.search(r'\b' + re.escape(phrase_lower + 's') + r'\b', resume_lower)):
                matching.append(phrase)
            # Check common variations (e.g., "JavaScript" vs "JS")
            elif _check_skill_variations(phrase_lower, resume_lower):
                matching.append(phrase)
            else:
                missing.append(phrase)

    # Sort for consistency
    missing = sorted(missing)
    matching = sorted(matching)

    # Use AI to filter actionable keywords from missing list
    ai_filtered = await filter_keywords_with_ai(
        missing,
        job_data.get("title", ""),
        resume_text
    )

    # Calculate match score
    score = (len(matching) / max(len(job_phrases), 1)) * 100

    # Save to cache
    _analysis_cache[cache_key] = {
        "success": True,
        "matchScore": round(score, 1),
        "missingPhrases": missing,
        "matchingPhrases": matching,
        "actionableKeywords": ai_filtered.get("actionableKeywords", []),
        "totalKeywords": len(job_phrases)
    }

    return _analysis_cache[cache_key]


def _check_skill_variations(skill: str, resume_text: str) -> bool:
    """
    Check for common skill variations and abbreviations across all professions.
    Uses AI to dynamically identify variations for any skill in any industry.
    Results are cached for performance.
    """
    # Common hardcoded variations for performance (most frequently used)
    common_variations = {
        # Tech
        'javascript': ['js'], 'typescript': ['ts'], 'python': ['py'],
        'kubernetes': ['k8s'], 'artificial intelligence': ['ai'], 'machine learning': ['ml'],

        # Business
        'search engine optimization': ['seo'], 'customer relationship management': ['crm'],
        'return on investment': ['roi'], 'key performance indicator': ['kpi', 'kpis'],

        # Finance
        'generally accepted accounting principles': ['gaap'], 'profit and loss': ['p&l'],

        # Healthcare
        'electronic health records': ['ehr', 'emr'], 'registered nurse': ['rn'],

        # HR
        'human resources': ['hr'], 'diversity equity and inclusion': ['dei'],
    }

    skill_lower = skill.lower().strip()

    # Quick check: common variations first (no API call needed)
    if skill_lower in common_variations:
        for variant in common_variations[skill_lower]:
            pattern = r'\b' + re.escape(variant) + r'\b'
            if re.search(pattern, resume_text):
                return True

    # Reverse lookup for common variations
    for full_form, abbrevs in common_variations.items():
        if skill_lower in abbrevs:
            pattern = r'\b' + re.escape(full_form) + r'\b'
            if re.search(pattern, resume_text):
                return True

    # If not in common variations, use AI to check for variations dynamically
    return _check_skill_variations_with_ai(skill_lower, resume_text)


# Cache for AI-detected skill variations
_skill_variations_cache: Dict[str, List[str]] = {}


def _check_skill_variations_with_ai(skill: str, resume_text: str) -> bool:
    """
    Use AI to dynamically detect skill variations and abbreviations.
    Works for any skill in any profession. Results are cached.
    """
    skill_lower = skill.lower().strip()

    # Check if we've already looked up variations for this skill
    if skill_lower not in _skill_variations_cache:
        # Get variations from AI
        variations = _get_skill_variations_from_ai(skill_lower)
        _skill_variations_cache[skill_lower] = variations
    else:
        variations = _skill_variations_cache[skill_lower]

    # Check if any variation exists in resume
    resume_lower = resume_text.lower()
    for variant in variations:
        pattern = r'\b' + re.escape(variant.lower()) + r'\b'
        if re.search(pattern, resume_lower):
            return True

    return False


def _get_skill_variations_from_ai(skill: str) -> List[str]:
    """
    Ask AI to identify common variations and abbreviations for a skill.
    Returns list of variations including the original skill.
    """
    api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        # Fallback: return just the skill itself
        return [skill]

    try:
        client = OpenAI(api_key=api_key)

        prompt = f"""List ALL common variations, abbreviations, and alternative names for this skill/term: "{skill}"

Include:
- Common abbreviations (e.g., "JavaScript" → "JS")
- Alternative names (e.g., "Machine Learning" → "ML", "AI")
- Industry-specific terms
- Plural/singular forms if relevant

Return ONLY a JSON array of strings. No explanations.

Example for "JavaScript": ["javascript", "js", "ecmascript", "node.js", "nodejs"]
Example for "Search Engine Optimization": ["search engine optimization", "seo"]

Skill: "{skill}"
"""

        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a skill variation expert. Return ONLY a JSON array of strings with no markdown formatting."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
            max_tokens=200
        )

        content = response.choices[0].message.content.strip()
        content = re.sub(r"^```(?:json)?|```$", "", content, flags=re.MULTILINE).strip()

        variations = json.loads(content)

        # Ensure it's a list and includes the original skill
        if isinstance(variations, list):
            # Add original skill if not present
            if skill.lower() not in [v.lower() for v in variations]:
                variations.append(skill)
            return variations
        else:
            return [skill]

    except Exception as e:
        print(f"AI skill variation lookup error for '{skill}': {e}")
        # Fallback: return just the skill itself
        return [skill]


# =========================================================
# ---------------- KEYWORD FILTERING ---------------------
# =========================================================

def _basic_keyword_filter(missing_phrases: List[str]) -> Dict[str, Any]:
    """
    Basic keyword filter fallback when AI is unavailable.
    Filters out obvious non-actionable items like years of experience, degrees, etc.
    """
    non_actionable_patterns = [
        r'\d+\+?\s*years?',  # "5+ years", "3 years"
        r'years?\s+of\s+experience',  # "years of experience"
        r'bachelor[\'"]?s?\s+degree',  # "Bachelor's degree"
        r'master[\'"]?s?\s+degree',  # "Master's degree"
        r'phd',  # PhD
        r'doctorate',  # Doctorate
        r'security\s+clearance',  # Security clearance
        r'ability\s+to\s+travel',  # Ability to travel
        r'willing\s+to\s+relocate',  # Willing to relocate
        r'work\s+independently',  # Work independently
        r'team\s+player',  # Team player
        r'strong\s+communication',  # Strong communication
        r'certified\s+\w+',  # Certified X (e.g., Certified Public Accountant)
        r'\w+\s+certification',  # X certification
    ]

    actionable_keywords = []

    for phrase in missing_phrases:
        # Skip if matches non-actionable patterns
        is_non_actionable = False
        phrase_lower = phrase.lower()

        for pattern in non_actionable_patterns:
            if re.search(pattern, phrase_lower, re.IGNORECASE):
                is_non_actionable = True
                break

        if not is_non_actionable and len(phrase.strip()) > 2:
            # Add to actionable keywords with basic metadata
            actionable_keywords.append({
                "keyword": phrase,
                "category": "Skill",  # Default category
                "priority": "medium",  # Default priority
                "suggestedIntegration": f"Consider incorporating '{phrase}' into relevant experience bullets"
            })

    return {"actionableKeywords": actionable_keywords}


async def filter_keywords_with_ai(
        missing_phrases: List[str],
        job_title: str = "",
        resume_text: str = ""
) -> Dict[str, Any]:
    """
    Use AI to filter keywords into actionable vs non-actionable categories.
    Removes requirements like degrees, years of experience, certifications requiring time.
    """
    # Check keyword filter cache
    keyword_cache_key = _generate_keyword_cache_key(missing_phrases, job_title)

    if keyword_cache_key in _keyword_filter_cache:
        print("Cache hit for keyword filtering")
        return _keyword_filter_cache[keyword_cache_key]

    if not missing_phrases:
        return {"actionableKeywords": []}

    api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("No OpenAI API key found. Using basic keyword filter.")
        return _basic_keyword_filter(missing_phrases)

    try:
        client = OpenAI(api_key=api_key)

        prompt = f"""
Analyze these keywords or skills from a job posting for a {job_title or 'professional'} role.

TASK: Filter ONLY keywords or skills that can be incorporated into an existing resume through rewording experience bullets.

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
            temperature=0.0,
            top_p=0.1,
            frequency_penalty=0.0,
            presence_penalty=0.0,
            seed=12345,
            max_tokens=1500
        )

        content = response.choices[0].message.content.strip()
        content = re.sub(r"^```(?:json)?|```$", "", content, flags=re.MULTILINE).strip()

        print(f"Raw AI response (first 500 chars): {content[:500]}")

        try:
            result = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"Content that failed to parse: {content[:1000]}")
            return _basic_keyword_filter(missing_phrases)

        # Validate and return actionable keywords
        actionable_keywords = result.get("actionableKeywords", [])

        if not isinstance(actionable_keywords, list):
            print("ERROR: actionableKeywords is not a list")
            return _basic_keyword_filter(missing_phrases)

        print(f"Successfully extracted {len(actionable_keywords)} actionable keywords")

        # Save to keyword filter cache
        _keyword_filter_cache[keyword_cache_key] = {
            "actionableKeywords": actionable_keywords
        }

        return {
            "actionableKeywords": actionable_keywords
        }
    except Exception as e:
        print(f"AI keyword filtering error: {e}")
        return _basic_keyword_filter(missing_phrases)
def _dict_to_resume_text(data: Any) -> str:
    """
    Convert a dictionary or list structure back to formatted resume text.
    This is a fallback when AI returns structured data instead of plain text.
    """
    if isinstance(data, str):
        return data

    if isinstance(data, dict):
        # Try to extract text from common dictionary structures
        if "text" in data:
            return str(data["text"])
        elif "content" in data:
            return str(data["content"])
        elif "resume" in data:
            return str(data["resume"])
        else:
            # Convert dict to a readable text format
            lines = []
            for key, value in data.items():
                if isinstance(value, (list, dict)):
                    lines.append(f"{key.upper()}:")
                    lines.append(_dict_to_resume_text(value))
                else:
                    lines.append(f"{key}: {value}")
            return "\n".join(lines)

    if isinstance(data, list):
        # Convert list to text with bullet points
        lines = []
        for item in data:
            if isinstance(item, dict):
                lines.append(_dict_to_resume_text(item))
            else:
                lines.append(f"• {str(item)}")
        return "\n".join(lines)

    return str(data)


# =========================================================
# ---------------- RESUME OPTIMIZATION --------------------
# =========================================================

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
            messages=[{
                    "role": "system",
                    "content": (
                        "You are an expert ATS resume optimizer specializing in keyword integration. "
                        "Your task is to create a COMPLETE enhanced resume that:\n\n"
                        "1. PRESERVES ALL content from the original resume (every section, job, project, and achievement)\n"
                        "2. INTEGRATES the selected keywords naturally into existing content\n"
                        "3. ENHANCES bullet points to incorporate keywords without fabricating experiences\n"
                        "4. MAINTAINS the user's authentic work history and timeline\n\n"
                        "   USER SELECTED KEYWORDS/SLILLS INTEGRATION STRATEGY:\n"
                        "- Weave keywords into existing job descriptions and bullet points\n"
                        "- Add keywords to skills sections where they align with user's background\n"
                        "- Incorporate keywords into work experiences bullet points naturally\n"
                        "- Ensure keywords feel organic, not forced or repetitive\n\n"
                        "OUTPUT REQUIREMENTS:\n"
                        "- Return ONLY valid JSON with 'optimizedResume' field containing PLAIN TEXT (not a dictionary or list)\n"
                        "- The optimized resume MUST be at least as comprehensive as the original\n"
                        "- DO NOT omit, remove, or summarize any experiences, projects, or achievements\n"
                        "- DO NOT create fake experiences bullet points to accommodate keywords\n"
                        "- Use proper resume formatting with clear section headers and bullet points"
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
            top_p=0.1,
            frequency_penalty=0.0,
            presence_penalty=0.0,
            seed=54321,
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

        # Create job_data from job_description and selected_keywords for ATS score calculation
        job_data = {
            "title": job_title or "",
            "description": job_description,
            "skills": keywords,
            "requirements": [],
            "technologies": [],
            "tools": [],
            "qualifications": []
        }

        # Extract additional job data from job description if available
        if job_description:
            # Simple extraction - can be enhanced with AI parsing if needed
            job_desc_lower = job_description.lower()

            # Common technology/tool patterns
            tech_patterns = [
                'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
                'node', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'docker',
                'kubernetes', 'aws', 'azure', 'gcp', 'git', 'jenkins', 'ci/cd'
            ]

            for tech in tech_patterns:
                if tech in job_desc_lower and tech not in job_data["technologies"]:
                    job_data["technologies"].append(tech)

        # Calculate accurate ATS score based on optimization results
        calculated_ats_score = calculate_ats_score(
            optimized_text=optimized_text,
            original_text=original_resume_text,
            job_data=job_data,
            keyword_verification=keyword_check
        )

        return {
            "success": True,
            "message": "New resume generated successfully",
            "optimizedResume": optimized_text,
            "resumeSections": result.get("resumeSections", []),
            "keywordIntegration": result.get("keywordIntegration", []),
            "keywordVerification": keyword_check,
            "atsScore": calculated_ats_score,
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


def calculate_ats_score(
    optimized_text: str,
    original_text: str,
    job_data: Dict,
    keyword_verification: Dict[str, Any]
) -> int:
    """
    Calculate accurate ATS score based on multiple factors:
    - Keyword integration rate (40% weight)
    - Job requirements match (30% weight)
    - Resume completeness (20% weight)
    - Formatting quality (10% weight)
    """
    score = 0

    # Factor 1: Keyword Integration (40 points max)
    integration_rate = keyword_verification.get("integrationRate", 0)
    keyword_score = (integration_rate / 100) * 40
    score += keyword_score

    # Factor 2: Job Requirements Match (30 points max)
    job_phrases = []
    for field in ["skills", "requirements", "technologies", "tools", "qualifications"]:
        if isinstance(job_data.get(field), list):
            job_phrases.extend(job_data[field])

    job_phrases = list(set([p.strip() for p in job_phrases if p.strip()]))

    requirements_score = 0
    if job_phrases:
        matched_count = 0
        optimized_lower = optimized_text.lower()

        for phrase in job_phrases:
            phrase_lower = phrase.lower()
            pattern = r'\b' + re.escape(phrase_lower.strip()) + r'\b'

            if re.search(pattern, optimized_lower):
                matched_count += 1
            elif _check_skill_variations(phrase_lower, optimized_lower):
                matched_count += 1

        requirements_match_rate = (matched_count / len(job_phrases)) * 100
        requirements_score = (requirements_match_rate / 100) * 30
        score += requirements_score
    else:
        requirements_score = 20
        score += requirements_score

    # Factor 3: Resume Completeness (20 points max)
    original_sections = detect_resume_sections(original_text)
    optimized_sections = detect_resume_sections(optimized_text)
    original_bullets = count_bullet_points(original_text)
    optimized_bullets = count_bullet_points(optimized_text)

    completeness_score = 0

    if len(optimized_sections) >= len(original_sections):
        completeness_score += 10
    else:
        completeness_score += (len(optimized_sections) / max(len(original_sections), 1)) * 10

    if optimized_bullets >= original_bullets:
        completeness_score += 10
    else:
        completeness_score += (optimized_bullets / max(original_bullets, 1)) * 10

    score += completeness_score

    # Factor 4: Formatting Quality (10 points max)
    formatting_score = 0

    required_sections = ['education', 'skills', 'experience']
    found_sections = [s['type'] for s in optimized_sections]
    sections_found = sum(1 for req in required_sections if req in found_sections)
    formatting_score += (sections_found / len(required_sections)) * 5

    if optimized_bullets > 0:
        formatting_score += 5

    score += formatting_score

    final_score = max(0, min(100, round(score)))

    return final_score
