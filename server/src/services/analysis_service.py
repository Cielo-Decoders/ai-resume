import os
import re
import json
import tempfile
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
import asyncio

import PyPDF2
from PIL import Image
from pdf2image import convert_from_bytes
import pytesseract
from openai import OpenAI

from ..config.settings import settings


async def extract_text_from_pdf(pdf_buffer: bytes) -> Dict[str, Any]:
    """
    Extract text from PDF using PyPDF2 with OCR fallback.
    Also extracts formatting metadata to preserve resume structure.
    Saves extracted text to temporary file and project base file.
    """
    extracted_text = ""
    formatting_info = {
        "sections": [],
        "fontFamily": "Times New Roman",  # Default
        "fontSize": 12,  # Default
        "hasDetectedFormatting": False
    }

    try:
       
        # Try PyPDF2 first
        print("Attempting PyPDF2 extraction...")
        from io import BytesIO
        pdf_file = BytesIO(pdf_buffer)
        pdf_reader = PyPDF2.PdfReader(pdf_file)

        for page_num, page in enumerate(pdf_reader.pages, 1):
            text = page.extract_text()
            if text:
                extracted_text += text + "\n\n"

        print(f"PyPDF2 extraction complete: {len(extracted_text)} characters")
        print(f"Total pages processed: {len(pdf_reader.pages)}")
        
        # Normalize bullet points that may have been garbled during extraction
        extracted_text = normalize_bullet_points(extracted_text)
        
        # Detect sections from the extracted text
        formatting_info["sections"] = detect_resume_sections(extracted_text)
        formatting_info["hasDetectedFormatting"] = len(formatting_info["sections"]) > 0

        # If text is too short, try OCR
        if len(extracted_text.strip()) < 50:
            print("Text too short, attempting OCR fallback...")
            ocr_text = await extract_text_with_ocr(pdf_buffer)

            if len(ocr_text) > len(extracted_text):
                extracted_text = ocr_text
                print(f"OCR provided better results: {len(extracted_text)} characters")
                # Re-detect sections from OCR text
                formatting_info["sections"] = detect_resume_sections(extracted_text)

        # Save to files
        save_extracted_text_to_file(extracted_text)
        save_extracted_text_to_project_base(extracted_text)

        return {
            "text": extracted_text,
            "formatting": formatting_info
        }

    except Exception as e:
        print(f"PyPDF2 extraction failed: {str(e)}")

        # Fallback to OCR
        try:
            print("Falling back to OCR...")
            ocr_text = await extract_text_with_ocr(pdf_buffer)
            save_extracted_text_to_file(ocr_text)
            save_extracted_text_to_project_base(ocr_text)
            formatting_info["sections"] = detect_resume_sections(ocr_text)
            return {
                "text": ocr_text,
                "formatting": formatting_info
            }
        except Exception as ocr_error:
            print(f"OCR fallback also failed: {str(ocr_error)}")
            error_msg = "Could not extract text from PDF. The file may be image-based, corrupted, or use unsupported formatting."
            save_extracted_text_to_project_base(error_msg)
            return {
                "text": "",
                "formatting": formatting_info
            }


def detect_resume_sections(text: str) -> List[Dict[str, Any]]:
    """
    Detect common resume sections from extracted text.
    Returns a list of section objects with name, start position, and type.
    """
    sections = []
    
    # Common resume section headers (case-insensitive patterns)
    section_patterns = [
        (r'^(CONTACT\s*(?:INFORMATION)?|PERSONAL\s*(?:INFORMATION|DETAILS)?)\s*$', 'contact'),
        (r'^(SUMMARY|PROFESSIONAL\s*SUMMARY|EXECUTIVE\s*SUMMARY|PROFILE|OBJECTIVE|CAREER\s*OBJECTIVE)\s*$', 'summary'),
        (r'^(EXPERIENCE|WORK\s*EXPERIENCE|PROFESSIONAL\s*EXPERIENCE|EMPLOYMENT\s*(?:HISTORY)?|WORK\s*HISTORY)\s*$', 'experience'),
        (r'^(EDUCATION|ACADEMIC\s*(?:BACKGROUND|QUALIFICATIONS)?|EDUCATIONAL\s*BACKGROUND)\s*$', 'education'),
        (r'^(SKILLS|TECHNICAL\s*SKILLS|CORE\s*COMPETENCIES|KEY\s*SKILLS|COMPETENCIES|AREAS\s*OF\s*EXPERTISE)\s*$', 'skills'),
        (r'^(CERTIFICATIONS?|LICENSES?\s*(?:AND|&)?\s*CERTIFICATIONS?|PROFESSIONAL\s*CERTIFICATIONS?)\s*$', 'certifications'),
        (r'^(PROJECTS|KEY\s*PROJECTS|NOTABLE\s*PROJECTS|SELECTED\s*PROJECTS)\s*$', 'projects'),
        (r'^(AWARDS?|HONORS?|ACHIEVEMENTS?|ACCOMPLISHMENTS?|AWARDS?\s*(?:AND|&)?\s*HONORS?)\s*$', 'awards'),
        (r'^(PUBLICATIONS?|RESEARCH|PRESENTATIONS?)\s*$', 'publications'),
        (r'^(VOLUNTEER|VOLUNTEER\s*(?:EXPERIENCE|WORK)|COMMUNITY\s*(?:SERVICE|INVOLVEMENT))\s*$', 'volunteer'),
        (r'^(LANGUAGES?|LANGUAGE\s*SKILLS?)\s*$', 'languages'),
        (r'^(INTERESTS?|HOBBIES?|PERSONAL\s*INTERESTS?)\s*$', 'interests'),
        (r'^(REFERENCES?|PROFESSIONAL\s*REFERENCES?)\s*$', 'references'),
    ]
    
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue
            
        for pattern, section_type in section_patterns:
            if re.match(pattern, line_stripped, re.IGNORECASE):
                sections.append({
                    "name": line_stripped,
                    "type": section_type,
                    "lineNumber": i,
                    "originalText": line_stripped
                })
                break
    
    print(f"Detected {len(sections)} resume sections: {[s['type'] for s in sections]}")
    return sections
        
def normalize_bullet_points(text: str) -> str:
    """
    Normalize various bullet point characters and OCR artifacts to standard bullets.
    OCR can produce strange characters like %Ï, ¡, etc. instead of proper bullets.
    """
    import re
    
    # Common OCR misreadings and bullet variants to normalize
    # These patterns appear at the start of lines (with optional leading whitespace)
    bullet_patterns = [
        r'^(\s*)%[ÏIi]\s*',       # OCR artifact %Ï or %I
        r'^(\s*)¡\s*',            # Inverted exclamation mark
        r'^(\s*)©\s*',            # Copyright symbol misread
        r'^(\s*)®\s*',            # Registered trademark misread
        r'^(\s*)¢\s*',            # Cent sign misread
        r'^(\s*)§\s*',            # Section sign misread
        r'^(\s*)¤\s*',            # Currency sign misread
        r'^(\s*)†\s*',            # Dagger misread
        r'^(\s*)‡\s*',            # Double dagger misread
        r'^(\s*)°\s*',            # Degree symbol misread
        r'^(\s*)»\s*',            # Right angle quote
        r'^(\s*)›\s*',            # Single right angle quote
        r'^(\s*)>\s*',            # Greater than as bullet
        r'^(\s*)\*\s*',           # Asterisk
        r'^(\s*)-\s*',            # Hyphen/dash
        r'^(\s*)–\s*',            # En dash
        r'^(\s*)—\s*',            # Em dash
        r'^(\s*)·\s*',            # Middle dot
        r'^(\s*)•\s*',            # Bullet (normalize spacing)
        r'^(\s*)○\s*',            # Open circle
        r'^(\s*)◦\s*',            # White bullet
        r'^(\s*)▪\s*',            # Black small square
        r'^(\s*)▫\s*',            # White small square
        r'^(\s*)■\s*',            # Black square
        r'^(\s*)□\s*',            # White square
        r'^(\s*)◆\s*',            # Black diamond
        r'^(\s*)◇\s*',            # White diamond
        r'^(\s*)➢\s*',            # Arrow
        r'^(\s*)➤\s*',            # Arrow
        r'^(\s*)➔\s*',            # Arrow
        r'^(\s*)✓\s*',            # Checkmark
        r'^(\s*)✔\s*',            # Heavy checkmark
        r'^(\s*)→\s*',            # Arrow
    ]
    
    lines = text.split('\n')
    normalized_lines = []
    
    for line in lines:
        normalized_line = line
        # Check if line starts with any bullet pattern
        for pattern in bullet_patterns:
            match = re.match(pattern, normalized_line)
            if match:
                # Replace with standard bullet, preserving indentation
                indent = match.group(1) if match.group(1) else ''
                remaining = normalized_line[match.end():]
                normalized_line = f"{indent}• {remaining}"
                break
        
        normalized_lines.append(normalized_line)
    
    return '\n'.join(normalized_lines)


        #Research how to directly pdf to text
async def extract_text_with_ocr(pdf_buffer: bytes) -> str:
    """
    Extract text using OCR (Tesseract) for image-based PDFs
    """
    try:
        print("Starting OCR extraction...")

        # Convert PDF pages to images
        images = convert_from_bytes(pdf_buffer, dpi=300, fmt='png')

        full_text = ""

        for page_num, image in enumerate(images[:5], 1):  # Limit to first 5 pages
            print(f"Processing page {page_num} with OCR...")

            # Perform OCR on image
            text = pytesseract.image_to_string(image, lang='eng')
            full_text += text + "\n\n"

            print(f"Page {page_num} OCR complete: {len(text)} characters")

        print(f"OCR extraction complete: {len(full_text)} characters total")
        
        # Normalize bullet points that may have been misread by OCR
        full_text = normalize_bullet_points(full_text)
        
        return full_text

    except Exception as e:
        print(f"OCR extraction failed: {str(e)}")
        return ""
def save_extracted_text_to_file(text: str) -> Optional[str]:
    """Save extracted text to temporary file"""
    try:
        # Create temp file
        temp_file = tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.txt',
            prefix='resume_',
            delete=False,
            encoding='utf-8'
        )

        temp_file.write(text)
        temp_file.close()

        file_size = os.path.getsize(temp_file.name)
        print(f"Extracted text saved to temporary file: {temp_file.name}")
        print(f"File size: {file_size} bytes")

        return temp_file.name

    except Exception as e:
        print(f"Error saving temporary file: {str(e)}")
        return None


def save_extracted_text_to_project_base(text: str) -> Optional[str]:
    """Save extracted text to project's resume/baseResume.txt"""
    try:
        # Get project root (3 levels up from services/analysis_service.py)
        project_root = Path(__file__).parent.parent.parent
        resume_dir = project_root / "resume"

        # Create directory if it doesn't exist
        resume_dir.mkdir(exist_ok=True)

        base_file_path = resume_dir / "baseResume.txt"

        # Write text to file (overwrites existing content)
        with open(base_file_path, 'w', encoding='utf-8') as f:
            f.write(text)

        file_size = os.path.getsize(base_file_path)
        print(f"Extracted text written to project base file: {base_file_path}")
        print(f"New file size: {file_size} bytes")

        return str(base_file_path)

    except Exception as e:
        print(f"Error writing project base resume file: {str(e)}")
        return None


async def filter_keywords_with_ai(
    missing_phrases: List[str], 
    job_title: str = ""
) -> Dict[str, List]:
    """
    Use OpenAI to filter and categorize missing keywords, removing qualification-based 
    requirements and returning only actionable skills/technologies.
    
    Args:
        missing_phrases: List of missing keywords/phrases from the job description
        job_title: The job title for context
    
    Returns:
        Dictionary with categorized, actionable keywords for user selection
    """
    if not missing_phrases:
        return {"actionableKeywords": [], "suggestions": []}
    
    # Get API key from environment or settings
    api_key = os.getenv("OPENAI_API_KEY") or settings.openai_api_key
    
    if not api_key:
        print("OpenAI API key not configured, returning unfiltered results")
        return _basic_keyword_filter(missing_phrases)
    
    try:
        client = OpenAI(api_key=api_key)
        
        keywords_text = "\n".join([f"- {phrase}" for phrase in missing_phrases[:40]])
        
        prompt = f"""Analyze these missing keywords/phrases from a job description for a {job_title or 'professional'} position.

MISSING FROM RESUME:
{keywords_text}

Your task:
1. REMOVE any items that are qualification-based requirements that cannot be added to a resume, such as:
   - Years of experience requirements (e.g., "5+ years experience", "3-5 years")
   - Degree requirements (e.g., "Bachelor's Degree", "Master's required", "JD/Law Degree")
   - Certifications that require time to obtain (e.g., "CPA required", "bar admission")
   - Age or time-based qualifications

2. KEEP and categorize actionable items that can be added to a resume:
   - Technical skills and technologies
   - Software and tools
   - Industry-specific terminology
   - Soft skills and competencies
   - Methodologies and frameworks
   - Domain knowledge areas

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{{
    "actionableKeywords": [
        {{"keyword": "keyword text", "category": "Technical Skill|Tool|Methodology|Domain Knowledge|Soft Skill", "priority": "high|medium|low"}},
    ],
    "filteredOut": ["items removed and why"],
    "suggestions": ["1-2 specific suggestions for improving resume match"]
}}

Limit to the top 15 most impactful actionable keywords."""

        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a resume optimization expert. You help candidates identify actionable keywords they can add to their resumes. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        response_text = response.choices[0].message.content.strip()
        print(f"AI keyword filtering response: {response_text[:200]}...")
        
        result = json.loads(response_text)
        
        return {
            "actionableKeywords": result.get("actionableKeywords", []),
            "filteredOut": result.get("filteredOut", []),
            "suggestions": result.get("suggestions", [])
        }
        
    except json.JSONDecodeError as e:
        print(f"Failed to parse AI response as JSON: {e}")
        return _basic_keyword_filter(missing_phrases)
    except Exception as e:
        print(f"AI keyword filtering failed: {e}")
        return _basic_keyword_filter(missing_phrases)


def _basic_keyword_filter(missing_phrases: List[str]) -> Dict[str, List]:
    """
    Fallback keyword filtering without AI.
    Filters out obvious qualification-based requirements.
    """
    qualification_patterns = [
        r'\d+\s*\+?\s*years?',
        r'bachelor\'?s?\s*degree',
        r'master\'?s?\s*degree',
        r'phd|doctorate',
        r'law\s*degree|jd\s*required|juris\s*doctor',
        r'required\s*certification',
        r'cpa\s*required',
        r'bar\s*admission',
        r'must\s*have\s*\d+',
        r'minimum\s*\d+\s*years?',
    ]
    
    actionable = []
    for phrase in missing_phrases:
        phrase_lower = phrase.lower()
        is_qualification = any(re.search(pattern, phrase_lower) for pattern in qualification_patterns)
        
        if not is_qualification and len(phrase) > 2:
            actionable.append({
                "keyword": phrase,
                "category": "Skill",
                "priority": "medium"
            })
    
    return {
        "actionableKeywords": actionable[:15],
        "filteredOut": [],
        "suggestions": ["Consider adding the highlighted skills to your resume"]
    }


async def analyze_resume_against_job(resume_text: str, job_data: Dict) -> Dict:
    """
    Compare resume text against job description to find missing keywords and phrases.
    
    Args:
        resume_text: Extracted text from the user's resume
        job_data: Extracted job data containing requirements, skills, etc.
    
    Returns:
        Dictionary with missing keywords, matching keywords, and optimization suggestions
    """
    # Normalize resume text for comparison
    resume_lower = resume_text.lower()
    resume_words = set(re.findall(r'\b[a-z]+(?:[a-z\-]+[a-z])?\b', resume_lower))
    
    # Extract keywords from job data
    job_keywords = set()
    job_phrases = []
    
    # Common fields to check in job_data
    keyword_fields = ['skills', 'requirements', 'qualifications', 'technologies', 'tools']
    text_fields = ['description', 'responsibilities', 'about']
    
    for field in keyword_fields:
        if field in job_data and isinstance(job_data[field], list):
            for item in job_data[field]:
                if isinstance(item, str):
                    job_keywords.add(item.lower().strip())
                    job_phrases.append(item.strip())
    
    for field in text_fields:
        if field in job_data and isinstance(job_data[field], str):
            # Extract important words from text fields
            words = re.findall(r'\b[a-z]+(?:[a-z\-]+[a-z])?\b', job_data[field].lower())
            job_keywords.update(words)
    
    # Filter out common stop words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
        'we', 'you', 'your', 'our', 'their', 'this', 'that', 'these', 'those',
        'it', 'its', 'they', 'them', 'he', 'she', 'his', 'her', 'who', 'what',
        'which', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both',
        'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
        'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'bachelor’s', 
        'master’s', 'phd', 'degree'
    }
    
    job_keywords = job_keywords - stop_words
    
    # Find missing and matching keywords
    missing_keywords = []
    matching_keywords = []
    
    for keyword in job_keywords:
        if keyword in resume_lower or keyword in resume_words:
            matching_keywords.append(keyword)
        else:
            missing_keywords.append(keyword)
    
    # Find missing phrases (multi-word terms from skills/requirements)
    missing_phrases = []
    matching_phrases = []
    
    for phrase in job_phrases:
        if phrase.lower() in resume_lower:
            matching_phrases.append(phrase)
        else:
            missing_phrases.append(phrase)
    
    # Calculate match score
    total_keywords = len(job_keywords)
    match_score = (len(matching_keywords) / total_keywords * 100) if total_keywords > 0 else 0
    
    # Get job title for context
    job_title = job_data.get("title", "")
    
    # Use AI to filter and categorize missing keywords
    ai_filtered = await filter_keywords_with_ai(missing_phrases, job_title)
    
    # Generate enhanced suggestions
    suggestions = ai_filtered.get("suggestions", [])
    if not suggestions:
        suggestions = generate_optimization_suggestions(missing_keywords, missing_phrases)
    
    return {
        "success": True,
        "matchScore": round(match_score, 1),
        "missingKeywords": sorted(set(missing_keywords))[:30],
        "matchingKeywords": sorted(set(matching_keywords)),
        "missingPhrases": missing_phrases[:20],
        "matchingPhrases": matching_phrases,
        "totalJobKeywords": total_keywords,
        "suggestions": suggestions,
        # AI-enhanced fields for user selection
        "actionableKeywords": ai_filtered.get("actionableKeywords", []),
        "filteredOutReasons": ai_filtered.get("filteredOut", [])
    }


def generate_optimization_suggestions(missing_keywords: List[str], missing_phrases: List[str]) -> List[str]:
    """Generate actionable suggestions based on missing keywords and phrases."""
    suggestions = []
    
    if missing_phrases:
        top_phrases = missing_phrases[:10]
        suggestions.append(f"Add these key skills/technologies to your resume: {', '.join(top_phrases)}")
    
    if len(missing_keywords) > 10:
        suggestions.append(f"Consider incorporating {len(missing_keywords)} additional keywords from the job description")
    
    if missing_phrases:
        suggestions.append("Tailor your experience descriptions to include the job's specific terminology")
    
    if not suggestions:
        suggestions.append("Your resume already covers most of the job requirements - great job!")
    
    return suggestions


async def generate_optimized_resume(
    original_resume_text: str,
    job_description: str,
    selected_keywords: List[Dict[str, str]],
    job_title: str = "",
    formatting_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate an optimized version of the resume incorporating selected keywords.
    
    This function uses AI to intelligently integrate the selected keywords into
    the original resume content while maintaining the resume's structure,
    formatting, and authenticity.
    
    Args:
        original_resume_text: The extracted text from the user's original resume
        job_description: The full job description text
        selected_keywords: List of keyword objects the user selected to incorporate
                          Each object has: {"keyword": str, "category": str, "priority": str}
        job_title: The target job title for context
        formatting_info: Optional formatting metadata from the original resume
    
    Returns:
        Dictionary containing:
            - success: bool
            - optimizedResume: str - The full optimized resume text
            - resumeSections: List[Dict] - Structured sections for PDF generation
            - changes: List[Dict] - Summary of changes made
            - atsScore: int - Estimated ATS compatibility score
            - formatting: Dict - Formatting specifications for PDF generation
            - message: str - Status message
    """
    # Default formatting settings
    default_formatting = {
        "fontFamily": "Times New Roman",
        "fontSize": 12,
        "headerStyle": "bold-italic",
        "bulletStyle": "•",
        "lineSpacing": 1.15,
        "margins": {"top": 1, "bottom": 1, "left": 1, "right": 1}
    }
    
    if formatting_info:
        default_formatting.update({
            k: v for k, v in formatting_info.items() 
            if v and k in default_formatting
        })
    
    if not original_resume_text or len(original_resume_text.strip()) < 50:
        return {
            "success": False,
            "message": "Original resume text is too short or missing",
            "optimizedResume": "",
            "resumeSections": [],
            "changes": [],
            "atsScore": 0,
            "formatting": default_formatting
        }
    
    if not selected_keywords:
        return {
            "success": False,
            "message": "No keywords selected for optimization",
            "optimizedResume": original_resume_text,
            "resumeSections": [],
            "changes": [],
            "atsScore": 0,
            "formatting": default_formatting
        }
    
    # Get API key from environment or settings
    api_key = os.getenv("OPENAI_API_KEY") or settings.openai_api_key
    
    if not api_key:
        return {
            "success": False,
            "message": "OpenAI API key not configured. Cannot generate optimized resume.",
            "optimizedResume": "",
            "resumeSections": [],
            "changes": [],
            "atsScore": 0,
            "formatting": default_formatting
        }
    
    try:
        client = OpenAI(api_key=api_key)
        
        # Format selected keywords for the prompt
        keywords_list = []
        for kw in selected_keywords:
            if isinstance(kw, dict):
                keyword = kw.get("keyword", "")
                category = kw.get("category", "Skill")
                keywords_list.append(f"- {keyword} ({category})")
            else:
                keywords_list.append(f"- {kw}")
        
        keywords_text = "\n".join(keywords_list)
        
        # Detect sections from original resume for context
        detected_sections = detect_resume_sections(original_resume_text)
        sections_context = ""
        if detected_sections:
            sections_context = f"\n\nDETECTED SECTIONS IN ORIGINAL RESUME:\n{', '.join([s['name'] for s in detected_sections])}"
        
        prompt = f"""You are an expert ATS (Applicant Tracking System) resume optimizer. Your task is to create an optimized version of a resume that incorporates specific keywords while STRICTLY PRESERVING the original resume's EXACT structure and formatting.

TARGET POSITION: {job_title or "Not specified"}

ORIGINAL RESUME:
---
{original_resume_text}
---

JOB DESCRIPTION CONTEXT:
---
{job_description[:3000]}
---

SELECTED KEYWORDS TO INCORPORATE:
{keywords_text}
{sections_context}

CRITICAL FORMATTING REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:

1. FIRST LINE: Full name only (e.g., "Kyle Drummonds")

2. SECOND LINE: Contact info on ONE line, separated by | characters
   Example: "phone | email | github.com/username | linkedin.com/in/username"

3. SECTION HEADERS: Use ALL CAPS, exactly as in original (e.g., "EDUCATION", "TECHNICAL SKILLS", "WORK EXPERIENCE", "PROJECTS")

4. For TECHNICAL SKILLS section, format as:
   "Category Name:" followed by skills on same line
   Example: "Programming Languages: Python, Java, JavaScript"

5. For WORK EXPERIENCE / EXPERIENCE entries, format EXACTLY as:
    Line 1: "Company Name                                                    City, State"
    Line 2: "Job Title                                                       Month Year – Month Year"
    Then bullet points starting with • character

6. For EDUCATION entries, format as:
   Line 1: "School Name                                                     City, State"
   Line 2: "Degree Name                                                     Month Year"
   Additional details on subsequent lines

7. BULLET POINTS: Always use the • character (standard filled circle), NOT -, *, or other symbols
    Each bullet must start with "• " followed by the content

8. For entries with LOCATION and DATE on same line, use multiple spaces to separate left and right content

9. PRESERVE the exact section order from the original resume
10. DO NOT add any sections that don't exist in the original
11. DO NOT remove any sections from the original
12. DO NOT change section header names
13. DO NOT DROP ANY LINES: Reproduce every line and bullet from the original resume in the same order; only edit wording to add keywords. Lines that are not changed must be copied verbatim.

CONTENT REQUIREMENTS:
1. Naturally incorporate the selected keywords into existing bullet points and descriptions
2. Only modify content the candidate could reasonably claim based on their existing experience
3. Do NOT fabricate new positions, companies, degrees, or achievements
4. Integrate keywords into relevant existing sections only
5. Ensure the resume reads naturally and professionally

Return your response in the following JSON format (no markdown, no code blocks):
{{
    "optimizedResume": "The complete optimized resume text with EXACT formatting as specified above",
    "resumeSections": [
        {{
            "type": "header|contact|summary|experience|education|skills|certifications|projects|leadership|interests|other",
            "title": "Section header text in ALL CAPS exactly as it should appear",
            "content": "Full section content with proper formatting",
            "items": ["array of individual items if applicable"]
        }}
    ],
    "changes": [
        {{"section": "section name", "description": "brief description of what was changed", "keywordsAdded": ["keywords"]}}
    ],
    "atsScore": 85,
    "tips": ["Additional tips for the candidate"]
}}

The atsScore should be your estimate (0-100) of how well the optimized resume will perform in ATS systems for this job.
"""

        response = client.chat.completions.create(
            model=settings.openai_model if hasattr(settings, 'openai_model') else "gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert resume writer and ATS optimization specialist. You help candidates optimize their resumes to pass ATS systems while maintaining authenticity and PRESERVING the original resume's formatting and structure. Always return valid JSON only, no markdown formatting."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=6000
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Clean up response if it has markdown code blocks
        if response_text.startswith("```"):
            response_text = re.sub(r'^```(?:json)?\s*', '', response_text)
            response_text = re.sub(r'\s*```$', '', response_text)
        
        print(f"Resume generation response received: {len(response_text)} characters")
        
        result = json.loads(response_text)
        
        optimized_resume = result.get("optimizedResume", "")
        resume_sections = result.get("resumeSections", [])

        # Safety net: if the optimized resume is significantly shorter than the original,
        # fall back to the original text to avoid missing sections/lines.
        original_lines = [ln for ln in original_resume_text.split('\n') if ln.strip()]
        optimized_lines = [ln for ln in optimized_resume.split('\n') if ln.strip()]
        if len(optimized_lines) < 0.8 * len(original_lines):
            print("Optimized resume shorter than original; using original text to preserve structure.")
            optimized_resume = normalize_bullet_points(original_resume_text)
        
        # Save the optimized resume to a file
        save_optimized_resume_to_file(optimized_resume)
        
        return {
            "success": True,
            "message": "Resume successfully optimized",
            "optimizedResume": optimized_resume,
            "resumeSections": resume_sections,
            "changes": result.get("changes", []),
            "atsScore": result.get("atsScore", 0),
            "tips": result.get("tips", []),
            "formatting": default_formatting
        }
        
    except json.JSONDecodeError as e:
        print(f"Failed to parse AI response as JSON: {e}")
        print(f"Raw response: {response_text[:500]}...")
        return {
            "success": False,
            "message": f"Failed to parse optimization response: {str(e)}",
            "optimizedResume": "",
            "resumeSections": [],
            "changes": [],
            "atsScore": 0,
            "formatting": default_formatting
        }
    except Exception as e:
        print(f"Resume optimization failed: {e}")
        return {
            "success": False,
            "message": f"Resume optimization failed: {str(e)}",
            "optimizedResume": "",
            "resumeSections": [],
            "changes": [],
            "atsScore": 0,
            "formatting": default_formatting
        }


def save_optimized_resume_to_file(text: str) -> Optional[str]:
    """
    Save the optimized resume to the project's resume folder.
    
    Args:
        text: The optimized resume text
    
    Returns:
        The file path where the resume was saved, or None if failed
    """
    try:
        from datetime import datetime
        
        # Get project root
        project_root = Path(__file__).parent.parent.parent
        resume_dir = project_root / "resume"
        
        # Create directory if it doesn't exist
        resume_dir.mkdir(exist_ok=True)
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        optimized_file_path = resume_dir / f"optimizedResume_{timestamp}.txt"
        
        # Write optimized resume
        with open(optimized_file_path, 'w', encoding='utf-8') as f:
            f.write(text)
        
        file_size = os.path.getsize(optimized_file_path)
        print(f"Optimized resume saved to: {optimized_file_path}")
        print(f"File size: {file_size} bytes")
        
        return str(optimized_file_path)
        
    except Exception as e:
        print(f"Error saving optimized resume: {str(e)}")
        return None


