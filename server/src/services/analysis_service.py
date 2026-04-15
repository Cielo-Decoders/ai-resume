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
import httpx

from ..config.settings import settings


# =========================================================
# ---------------- OPENAI CLIENT FACTORY ------------------
# =========================================================

def _get_openai_client() -> OpenAI:
    """
    Return a shared OpenAI client configured with explicit timeouts.
    This is required for Google Cloud Run (serverless) where default
    connection settings can cause silent 'Connection error.' failures.
    API key is stripped to remove any trailing newline injected by Secret Manager.
    """
    api_key = (settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")).strip()
    return OpenAI(
        api_key=api_key,
        timeout=httpx.Timeout(
            connect=10.0,    # seconds to establish connection
            read=120.0,      # seconds to wait for response data
            write=10.0,      # seconds to send data
            pool=10.0,       # seconds to wait for a connection from pool
        ),
        max_retries=2,
    )


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
    # Ensure text is a string
    if isinstance(text, dict):
        text = str(text)
    elif not isinstance(text, str):
        text = str(text) if text else ""

    if not text:
        return text

    # Remove ALL variations of the problematic characters
    text = re.sub(r'%[ÏïĪīÎîØø]', '', text)
    text = re.sub(r'[ÏïĪīÎîØø]', '', text)
    text = re.sub(r'%\s*[ÏïĪīÎîØø]', '', text)
    text = re.sub(r'[ÏïĪīÎîØø]\s*%', '', text)

    # Fix common encoding issues
    text = text.replace('â€¢', '•')
    text = text.replace('â€"', '–')
    text = text.replace('â€™', "'")
    text = text.replace('â€œ', '"')
    text = text.replace('â€', '"')

    # Clean up multiple spaces but preserve line structure
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r' *\n+ *', '\n', text)

    # Fix bullet point issues
    text = re.sub(r'^\s*[•●]\s*%[ÏïĪīÎîØø]?\s*', '• ', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*%[ÏïĪīÎîØø]\s*', '• ', text, flags=re.MULTILINE)

    # Fix split section headers
    text = re.sub(r'PROFESSIONAL\s+EXPERIENCES', 'PROFESSIONAL EXPERIENCES', text)
    text = re.sub(r'TECHNICAL\s+PROJECTS', 'TECHNICAL PROJECTS', text)

    # Ensure proper section formatting
    section_headers = ['EDUCATION', 'TECHNICAL SKILLS', 'PROFESSIONAL EXPERIENCES',
                      'TECHNICAL PROJECTS', 'PROJECTS', 'LEADERSHIP', 'CERTIFICATIONS']

    for header in section_headers:
        text = re.sub(f'([^\n]){header}', f'\\1\n\n{header}', text)

    # Ensure bullet points start on new lines
    text = re.sub(r'([^\n])•', r'\1\n•', text)
    text = re.sub(r'([^\n])●', r'\1\n●', text)

    return text.strip()


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
        return tmp.name
    except Exception as e:
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
    except Exception as e:
        pass


def save_optimized_resume_to_file(text: str) -> Optional[str]:
    """
    Save optimized resume to project directory.
    """
    try:
        base = Path(__file__).parent.parent.parent / "resume"
        base.mkdir(exist_ok=True)
        path = base / "optimizedResume.txt"
        path.write_text(text, encoding="utf-8")
        return str(path)
    except Exception as e:
        return None


# =========================================================
# ------- SMART JD CONDENSER (prevent timeout) -----------
# =========================================================

_JD_SECTION_PATTERNS = re.compile(
    r'(?:^|\n)\s*'
    r'(?:required|preferred|minimum|desired|must[\s-]have|nice[\s-]to[\s-]have|'
    r'qualifications?|requirements?|skills?|responsibilities|what you.?ll|'
    r'who you are|about the role|about you|tech[\s-]?stack|tools?|competenc)'
    r'[^\n]{0,60}',
    re.IGNORECASE,
)

_MAX_JD_CHARS_FOR_AI = 6_000  # ~1 500 tokens – plenty for extraction


def _condense_job_description(raw_jd: str) -> str:
    """
    Return a shorter version of a job description that keeps only the
    sections most relevant for keyword extraction (requirements, skills,
    qualifications, tools).

    If the JD is already short enough it is returned unchanged.
    """
    if len(raw_jd) <= _MAX_JD_CHARS_FOR_AI:
        return raw_jd

    lines = raw_jd.split('\n')

    # ── Pass 1: find section boundaries ──────────────────────
    keep_ranges: list[tuple[int, int]] = []
    in_relevant = False
    start = 0

    for i, line in enumerate(lines):
        if _JD_SECTION_PATTERNS.search(line):
            if not in_relevant:
                start = i
                in_relevant = True
        elif in_relevant and line.strip() == '':
            # Blank line might be a paragraph break, keep going for a bit
            pass
        elif in_relevant and re.match(r'^[A-Z][A-Za-z\s]{2,40}:?\s*$', line.strip()):
            # New section header that isn't relevant → close range
            keep_ranges.append((start, i))
            in_relevant = False

    if in_relevant:
        keep_ranges.append((start, len(lines)))

    # ── Pass 2: merge kept lines ──────────────────────────────
    if keep_ranges:
        kept_lines: list[str] = []
        for s, e in keep_ranges:
            kept_lines.extend(lines[s:e])
        condensed = '\n'.join(kept_lines).strip()
        # If we extracted meaningful content, use it
        if len(condensed) >= 200:
            return condensed[:_MAX_JD_CHARS_FOR_AI]

    # Fallback: take the first + last chunks (title area + requirements usually at end)
    half = _MAX_JD_CHARS_FOR_AI // 2
    return (raw_jd[:half] + '\n...\n' + raw_jd[-half:]).strip()


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

    # Batch-load skill variations for ALL job phrases in one call
    # This replaces N serial OpenAI calls with a single batch call
    _batch_load_skill_variations(job_phrases)

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
    Uses a hardcoded lookup only — AI batch lookup happens separately.
    """
    common_variations = {
        # Tech
        'javascript': ['js', 'ecmascript'], 'typescript': ['ts'], 'python': ['py'],
        'kubernetes': ['k8s'], 'artificial intelligence': ['ai'], 'machine learning': ['ml'],
        'continuous integration': ['ci'], 'continuous delivery': ['cd'], 'ci/cd': ['cicd'],
        'amazon web services': ['aws'], 'google cloud platform': ['gcp'],
        'microsoft azure': ['azure'], 'structured query language': ['sql'],
        'nosql': ['mongodb', 'dynamodb', 'cassandra'], 'react.js': ['react', 'reactjs'],
        'node.js': ['node', 'nodejs'], 'vue.js': ['vue', 'vuejs'],
        'next.js': ['next', 'nextjs'], 'angular.js': ['angular', 'angularjs'],

        # Business
        'search engine optimization': ['seo'], 'customer relationship management': ['crm'],
        'return on investment': ['roi'], 'key performance indicator': ['kpi', 'kpis'],
        'enterprise resource planning': ['erp'], 'business intelligence': ['bi'],

        # Finance
        'generally accepted accounting principles': ['gaap'], 'profit and loss': ['p&l'],

        # Healthcare
        'electronic health records': ['ehr', 'emr'], 'registered nurse': ['rn'],

        # HR
        'human resources': ['hr'], 'diversity equity and inclusion': ['dei'],
    }

    skill_lower = skill.lower().strip()
    resume_lower = resume_text.lower()

    # Quick check: common variations first (no API call needed)
    if skill_lower in common_variations:
        for variant in common_variations[skill_lower]:
            pattern = r'\b' + re.escape(variant) + r'\b'
            if re.search(pattern, resume_lower):
                return True

    # Reverse lookup for common variations
    for full_form, abbrevs in common_variations.items():
        if skill_lower in abbrevs:
            pattern = r'\b' + re.escape(full_form) + r'\b'
            if re.search(pattern, resume_lower):
                return True

    # Check the batch cache (populated by _batch_check_skill_variations)
    if skill_lower in _skill_variations_cache:
        for variant in _skill_variations_cache[skill_lower]:
            pattern = r'\b' + re.escape(variant.lower()) + r'\b'
            if re.search(pattern, resume_lower):
                return True

    return False


# Cache for AI-detected skill variations
_skill_variations_cache: Dict[str, List[str]] = {}


def _batch_load_skill_variations(skills: List[str]) -> None:
    """
    Batch-fetch variations for multiple skills in ONE OpenAI call.
    Replaces the old per-skill serial approach that caused timeouts.
    """
    # Filter to only skills not already cached
    uncached = [s for s in skills if s.lower().strip() not in _skill_variations_cache]
    if not uncached:
        return

    # Limit batch size to keep prompt reasonable
    batch = uncached[:30]

    client = _get_openai_client()
    try:
        prompt = (
            "For each skill below, list its common abbreviations and alternative names.\n"
            "Return ONLY a JSON object mapping each skill to an array of variations.\n"
            "Example: {\"javascript\": [\"js\", \"ecmascript\"], \"machine learning\": [\"ml\"]}\n\n"
            "Skills:\n" + "\n".join(f"- {s}" for s in batch)
        )

        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Return ONLY valid JSON, no markdown."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            max_tokens=1000,
        )

        content = response.choices[0].message.content.strip()
        content = re.sub(r"^```(?:json)?|```$", "", content, flags=re.MULTILINE).strip()
        mapping = json.loads(content)

        if isinstance(mapping, dict):
            for skill, variants in mapping.items():
                if isinstance(variants, list):
                    _skill_variations_cache[skill.lower().strip()] = variants

    except Exception as e:
        print(f"Batch skill variation lookup error: {e}")
        # On failure, cache empty lists so we don't retry
        for s in batch:
            _skill_variations_cache[s.lower().strip()] = []


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

    client = _get_openai_client()

    try:
        prompt = f"""
Analyze these keywords or skills from a job posting for a {job_title or 'professional'} role.

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
        client = _get_openai_client()

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

        # Count how many resume sections contain at least one integrated keyword
        integrated_lower = [k.lower() for k in keyword_check['integrated']]
        sections_with_keywords = 0
        for section in optimized_sections:
            section_text_lower = section.get('content', '').lower()
            if any(kw in section_text_lower for kw in integrated_lower):
                sections_with_keywords += 1
        sections_modified = sections_with_keywords or len(optimized_sections)

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
                "keywordsIntegrated": len(keyword_check['integrated']),
                "sectionsModified": sections_modified
            }
        }

    except Exception as e:
        import traceback
        print(f"Generation error: {e}")
        print(f"Error traceback: {traceback.format_exc()}")
        return {"success": False, "optimizedResume": "", "message": f"Generation failed: {str(e)}"}


# =========================================================
# ---------------- RED FLAG SCANNER -----------------------
# =========================================================

# Rule-based red flag patterns (cheap, deterministic, no API call)
_RED_FLAG_RULES: List[Dict[str, Any]] = [
    {
        "id": "missing_salary",
        "title": "No salary or compensation mentioned",
        "severity": "medium",
        "reason": "Legitimate employers increasingly disclose pay ranges. Absence may signal below-market compensation.",
        "patterns": [],  # special logic: flag when NO salary-related terms found
        "detect": "absence",
        "absence_terms": [
            r"\$\d", r"salary", r"compensation", r"pay\s*range", r"per\s*(hour|year|annum)",
            r"\d+k\s*[-–]\s*\d+k", r"competitive\s+pay", r"base\s+pay", r"hourly\s+rate",
        ],
    },
    {
        "id": "scope_creep",
        "title": "Role spans too many unrelated functions",
        "severity": "high",
        "reason": "When a single role covers engineering, support, QA, and operations it often means an understaffed team where one person does everything.",
        "detect": "threshold",
        "threshold": 4,
        "buckets": {
            "engineering": [r"develop", r"engineer", r"architect", r"code", r"programming"],
            "support": [r"customer\s+support", r"help\s*desk", r"troubleshoot.*customer", r"client.*issue"],
            "qa": [r"test.*quality", r"quality\s+assurance", r"\bQA\b", r"write.*test"],
            "design": [r"UI\s*/?\s*UX", r"user\s+interface", r"figma", r"design.*mockup"],
            "ops": [r"deploy", r"infrastructure", r"devops", r"CI\s*/?\s*CD", r"monitor.*production"],
            "product": [r"product\s+manag", r"roadmap", r"stakeholder.*priorit"],
            "marketing": [r"SEO", r"content.*market", r"social\s+media", r"brand"],
            "sales": [r"sales.*target", r"revenue.*generat", r"prospect", r"close.*deal"],
        },
    },
    {
        "id": "buzzword_culture",
        "title": "Excessive buzzword culture signals",
        "severity": "low",
        "reason": "Terms like 'rockstar', 'ninja', or 'guru' can indicate an immature hiring process or unrealistic expectations.",
        "detect": "any",
        "patterns": [
            r"\brockstar\b", r"\bninja\b", r"\bguru\b", r"\bunicorn\b",
            r"\bhustl", r"\bgrind\b", r"work\s+hard.*play\s+hard",
        ],
    },
    {
        "id": "unrealistic_experience",
        "title": "Unrealistic experience requirements for the level",
        "severity": "high",
        "reason": "Requiring 5+ years of experience for an entry-level or junior title is a common red flag that suggests the employer wants senior work at junior pay.",
        "detect": "mismatch",
        "junior_patterns": [r"\bjunior\b", r"\bentry[\s-]*level\b", r"\bintern\b", r"\bassociate\b"],
        "high_exp_patterns": [r"[5-9]\+?\s*years", r"\b[1-9]\d\+?\s*years", r"10\+?\s*years"],
    },
    {
        "id": "vague_responsibilities",
        "title": "Vague or generic responsibilities",
        "severity": "medium",
        "reason": "Phrases like 'wear many hats' or 'whatever it takes' often mean the role is poorly defined and the workload is unpredictable.",
        "detect": "any",
        "patterns": [
            r"wear\s+many\s+hats", r"whatever\s+it\s+takes", r"other\s+duties\s+as\s+assigned",
            r"self[\s-]*starter", r"must\s+thrive\s+under\s+pressure",
            r"comfortable\s+with\s+ambiguity",
        ],
    },
    {
        "id": "unpaid_signals",
        "title": "Possible unpaid or exploitative arrangement",
        "severity": "high",
        "reason": "Mentions of unpaid trials, equity-only compensation, or 'passion projects' can signal exploitation.",
        "detect": "any",
        "patterns": [
            r"unpaid\s+(trial|test|period|internship)",
            r"equity[\s-]*only", r"sweat\s+equity",
            r"volunteer\s+(position|role|opportunity)",
            r"no\s+monetary\s+compensation",
        ],
    },
    {
        "id": "excessive_qualifications",
        "title": "Excessive qualification list",
        "severity": "medium",
        "reason": "Listing 15+ requirements often means the employer hasn't prioritized what truly matters, or is trying to justify a low offer by demanding everything.",
        "detect": "count",
        "count_pattern": r"(?:^|\n)\s*[-•●▪]\s+",
        "threshold": 20,
    },
    {
        "id": "urgency_pressure",
        "title": "Unusual urgency language",
        "severity": "low",
        "reason": "Phrases like 'ASAP', 'immediately', or 'we need someone yesterday' can indicate poor planning or high turnover.",
        "detect": "any",
        "patterns": [
            r"\bASAP\b", r"start\s+immediately", r"need.*yesterday",
            r"urgent\s+(hire|opening|need)", r"fill.*position.*immediately",
        ],
    },
]


def _run_rule_based_scan(job_description: str) -> List[Dict[str, Any]]:
    """Run deterministic rule-based red flag checks. No API calls."""
    flags = []
    text = job_description
    text_lower = text.lower()

    for rule in _RED_FLAG_RULES:
        detected = False
        evidence = ""

        if rule["detect"] == "absence":
            found_any = False
            for term_pat in rule["absence_terms"]:
                if re.search(term_pat, text_lower):
                    found_any = True
                    break
            if not found_any:
                detected = True
                evidence = "No salary, compensation, or pay range mentioned anywhere in the posting."

        elif rule["detect"] == "any":
            for pat in rule["patterns"]:
                m = re.search(pat, text_lower)
                if m:
                    detected = True
                    start = max(0, m.start() - 30)
                    end = min(len(text), m.end() + 30)
                    evidence = "..." + text[start:end].strip() + "..."
                    break

        elif rule["detect"] == "threshold":
            hit_buckets = []
            for bucket_name, patterns in rule["buckets"].items():
                for pat in patterns:
                    if re.search(pat, text_lower):
                        hit_buckets.append(bucket_name)
                        break
            if len(hit_buckets) >= rule["threshold"]:
                detected = True
                evidence = f"Role spans {len(hit_buckets)} distinct functions: {', '.join(hit_buckets)}"

        elif rule["detect"] == "mismatch":
            is_junior = any(re.search(p, text_lower) for p in rule["junior_patterns"])
            has_high_exp = any(re.search(p, text_lower) for p in rule["high_exp_patterns"])
            if is_junior and has_high_exp:
                detected = True
                evidence = "Junior/entry-level title combined with 5+ years experience requirement."

        elif rule["detect"] == "count":
            matches = re.findall(rule["count_pattern"], text)
            if len(matches) >= rule["threshold"]:
                detected = True
                evidence = f"Found {len(matches)} bullet-point requirements in the listing."

        if detected:
            flags.append({
                "id": rule["id"],
                "title": rule["title"],
                "severity": rule["severity"],
                "reason": rule["reason"],
                "evidence": evidence,
            })

    return flags


async def scan_job_red_flags(job_description: str) -> Dict[str, Any]:
    """
    Scan a job description for red flags using hybrid approach:
    1. Fast rule-based checks (deterministic, free)
    2. AI-powered analysis for nuanced concerns
    Returns structured risk assessment.
    """
    # Phase 1: Rule-based scan
    rule_flags = _run_rule_based_scan(job_description)

    # Phase 2: AI analysis for nuance
    ai_result = await _ai_red_flag_analysis(job_description)

    # Merge: rule-based flags first, then AI flags (deduplicated by id)
    seen_ids = {f["id"] for f in rule_flags}
    all_flags = list(rule_flags)
    for af in ai_result.get("flags", []):
        if af.get("id", af.get("title", "")) not in seen_ids:
            all_flags.append(af)
            seen_ids.add(af.get("id", af.get("title", "")))

    # Score: start at 100, subtract based on severity
    score = 100
    for f in all_flags:
        sev = f.get("severity", "low")
        if sev == "high":
            score -= 20
        elif sev == "medium":
            score -= 10
        elif sev == "low":
            score -= 5
    score = max(0, min(100, score))

    # Verdict
    if score >= 80:
        verdict = "Looks Good"
        overall_risk = "low"
    elif score >= 55:
        verdict = "Proceed With Caution"
        overall_risk = "medium"
    else:
        verdict = "High Risk"
        overall_risk = "high"

    return {
        "success": True,
        "score": score,
        "verdict": verdict,
        "overallRisk": overall_risk,
        "summary": ai_result.get("summary", ""),
        "flags": all_flags,
        "positives": ai_result.get("positives", []),
        "questionsToAsk": ai_result.get("questionsToAsk", []),
    }


async def _ai_red_flag_analysis(job_description: str) -> Dict[str, Any]:
    """Use AI to detect nuanced red flags and generate positives + recruiter questions."""
    try:
        client = _get_openai_client()

        prompt = f"""Analyze this job description for red flags and positive signals.

JOB DESCRIPTION:
{job_description[:6000]}

Return ONLY valid JSON (no markdown fences):
{{
  "summary": "1-2 sentence overall assessment of this posting's quality and legitimacy",
  "flags": [
    {{
      "id": "unique_short_id",
      "title": "Short title of concern",
      "severity": "high|medium|low",
      "reason": "Why this is a concern",
      "evidence": "Exact quote or paraphrased evidence from the posting"
    }}
  ],
  "positives": ["Positive signal 1", "Positive signal 2"],
  "questionsToAsk": ["Smart question to ask the recruiter 1", "Question 2", "Question 3"]
}}

ANALYSIS RULES:
- Only flag genuinely concerning patterns, NOT normal job requirements
- severity: high = likely problematic, medium = worth noting, low = minor concern
- Include 2-5 flags maximum (only real issues)
- Include 2-4 positives (genuine strengths of the posting)
- Include 3-5 smart questions the candidate should ask about flagged concerns
- Do NOT flag standard items like "team player", "communication skills", or normal tech stacks
- DO flag: compensation red flags, scope creep, unrealistic expectations, high-turnover signals, discriminatory language, vague role definitions"""

        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a career advisor who helps job seekers evaluate opportunities objectively. "
                        "You are balanced — you highlight both concerns and positives. "
                        "You never manufacture issues where none exist."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500,
        )

        content = response.choices[0].message.content.strip()
        content = re.sub(r"^```(?:json)?|```$", "", content, flags=re.MULTILINE).strip()
        result = json.loads(content)

        if not isinstance(result, dict):
            return {"flags": [], "positives": [], "questionsToAsk": [], "summary": ""}

        return result

    except Exception as e:
        print(f"AI red flag analysis error: {e}")
        return {"flags": [], "positives": [], "questionsToAsk": [], "summary": "Could not complete AI analysis."}


# =========================================================
# ---------------- COVER LETTER GENERATION ----------------
# =========================================================

COVER_LETTER_TONES = {
    "professional": "Write in a polished, formal tone suitable for corporate environments. Use confident, precise language.",
    "conversational": "Write in a warm, approachable tone that still maintains professionalism. Use first-person naturally and show personality.",
    "enthusiastic": "Write with genuine excitement and energy about the opportunity. Show passion while remaining professional.",
    "executive": "Write in a commanding, strategic tone suitable for senior leadership roles. Emphasize vision and impact.",
}

async def generate_cover_letter(
    resume_text: str,
    job_description: str,
    job_title: str = "",
    company: str = "",
    tone: str = "professional",
) -> Dict[str, Any]:
    """
    Generate a tailored cover letter based on the user's resume and the target job.
    """
    api_key = (settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")).strip()
    if not api_key:
        return {"success": False, "coverLetter": "", "message": "OpenAI API key missing."}

    tone_instruction = COVER_LETTER_TONES.get(tone, COVER_LETTER_TONES["professional"])

    try:
        client = _get_openai_client()

        prompt = f"""Generate a compelling, tailored cover letter for this candidate.

CANDIDATE'S RESUME:
{resume_text[:8000]}

TARGET POSITION: {job_title or "Not specified"}
TARGET COMPANY: {company or "Not specified"}

JOB DESCRIPTION:
{job_description[:4000]}

TONE: {tone}
{tone_instruction}

REQUIREMENTS:
1. Use ONLY real information from the candidate's resume — do NOT fabricate achievements, companies, or dates
2. Open with a strong, specific hook — avoid generic "I am writing to apply" openers
3. Connect the candidate's actual experience to the job requirements with concrete examples
4. Show knowledge of the company and why the candidate is specifically interested
5. Keep it to 3-4 paragraphs, approximately 250-350 words
6. End with a confident call-to-action
7. Return ONLY the cover letter text — no subject lines, no "Dear Hiring Manager" alternatives list
8. Start with "Dear Hiring Manager," (or use the company name if available)
9. Sign off with just the candidate's name extracted from the resume

OUTPUT: Return ONLY the plain text cover letter, nothing else."""

        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert career coach who writes exceptional, personalized cover letters. "
                        "You never use filler phrases like 'I believe I would be a great fit' or 'I am excited to apply'. "
                        "Instead, you craft letters that read like they were written by a confident professional "
                        "who knows their worth and can articulate exactly why they're the right person for the role. "
                        "You always use specific examples from the candidate's actual resume."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000,
        )

        cover_letter = response.choices[0].message.content.strip()

        if not cover_letter:
            return {"success": False, "coverLetter": "", "message": "AI returned empty response."}

        word_count = len(cover_letter.split())

        return {
            "success": True,
            "message": "Cover letter generated successfully",
            "coverLetter": cover_letter,
            "tone": tone,
            "wordCount": word_count,
        }

    except Exception as e:
        import traceback
        print(f"Cover letter generation error: {e}")
        print(f"Error traceback: {traceback.format_exc()}")
        return {"success": False, "coverLetter": "", "message": f"Generation failed: {str(e)}"}


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


# =========================================================
# ----------- MOCK INTERVIEW GENERATION -------------------
# =========================================================

async def generate_interview_questions(
    job_description: str,
    resume_text: str,
    count: int = 5,
) -> Dict[str, Any]:
    """
    Generate role-specific mock interview questions based on the job
    description and candidate resume.
    """
    api_key = (settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")).strip()
    if not api_key:
        return {"success": False, "questions": [], "message": "OpenAI API key missing."}

    try:
        client = _get_openai_client()

        prompt = f"""You are a senior hiring manager conducting interviews.
Based on the job description and the candidate's resume below, generate exactly {count} interview questions.

JOB DESCRIPTION:
{job_description[:5000]}

CANDIDATE RESUME:
{resume_text[:5000]}

RULES:
- Mix question types: behavioral, technical, situational, and role-specific
- Target gaps between the resume and job requirements
- Also probe strengths the candidate can leverage
- Order questions from easier to harder to simulate a real interview flow
- Each question must have a clear "context" explaining why you'd ask it

Return ONLY valid JSON (no markdown fences):
[
  {{
    "id": 1,
    "type": "behavioral|technical|situational|role-specific",
    "question": "The full interview question",
    "context": "Why this question matters for this role",
    "difficulty": "easy|medium|hard"
  }}
]"""

        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a seasoned hiring manager who conducts structured, insightful interviews. "
                        "Your questions are specific to the role and candidate — never generic. "
                        "You probe for real competence, not rehearsed answers."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
            max_tokens=2000,
        )

        content = response.choices[0].message.content.strip()
        content = re.sub(r"^```(?:json)?|```$", "", content, flags=re.MULTILINE).strip()
        questions = json.loads(content)

        if not isinstance(questions, list):
            return {"success": False, "questions": [], "message": "Unexpected AI response format."}

        return {"success": True, "questions": questions}

    except Exception as e:
        print(f"Interview question generation error: {e}")
        return {"success": False, "questions": [], "message": f"Generation failed: {str(e)}"}


async def evaluate_interview_answer(
    question: str,
    answer: str,
    job_description: str,
) -> Dict[str, Any]:
    """
    Evaluate a candidate's interview answer for relevance, completeness,
    and overall quality.
    """
    api_key = (settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")).strip()
    if not api_key:
        return {"success": False, "feedback": None, "message": "OpenAI API key missing."}

    try:
        client = _get_openai_client()

        prompt = f"""You are an experienced interview coach evaluating a candidate's answer.

INTERVIEW QUESTION:
{question}

CANDIDATE'S ANSWER:
{answer[:3000]}

JOB CONTEXT:
{job_description[:3000]}

Score the answer on three dimensions (0-100 each):
1. relevance — Does the answer actually address the question asked?
2. completeness — Does it provide enough depth, examples, and the STAR method where applicable?
3. overall score — Holistic quality considering clarity, confidence, and impact

Provide:
- 2-3 specific strengths of the answer
- 2-3 concrete improvements
- A sample strong answer (150-200 words) the candidate can learn from

Return ONLY valid JSON (no markdown fences):
{{
  "score": <overall 0-100>,
  "relevance": <0-100>,
  "completeness": <0-100>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "sampleAnswer": "A well-structured sample answer..."
}}"""

        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a supportive but honest interview coach. "
                        "You give constructive feedback that helps candidates improve. "
                        "You never score too generously — an average answer gets 50-60, "
                        "a good one 70-80, and only exceptional answers score 85+."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=1500,
        )

        content = response.choices[0].message.content.strip()
        content = re.sub(r"^```(?:json)?|```$", "", content, flags=re.MULTILINE).strip()
        feedback = json.loads(content)

        if not isinstance(feedback, dict):
            return {"success": False, "feedback": None, "message": "Unexpected AI response format."}

        return {"success": True, "feedback": feedback}

    except Exception as e:
        print(f"Interview answer evaluation error: {e}")
        return {"success": False, "feedback": None, "message": f"Evaluation failed: {str(e)}"}
