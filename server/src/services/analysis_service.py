import os
import re
import json
import tempfile
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import asyncio

import PyPDF2
from PIL import Image
from pdf2image import convert_from_bytes
import pytesseract
from openai import OpenAI

from ..config.settings import settings


async def extract_text_from_pdf(pdf_buffer: bytes) -> Dict[str, str]:
    """
    Extract text from PDF using PyPDF2 with OCR fallback
    Saves extracted text to temporary file and project base file
    """
    extracted_text = ""

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

        # If text is too short, try OCR
        if len(extracted_text.strip()) < 50:
            print("Text too short, attempting OCR fallback...")
            ocr_text = await extract_text_with_ocr(pdf_buffer)

            if len(ocr_text) > len(extracted_text):
                extracted_text = ocr_text
                print(f"OCR provided better results: {len(extracted_text)} characters")

        # Save to files
        save_extracted_text_to_file(extracted_text)
        save_extracted_text_to_project_base(extracted_text)

        return {"text": extracted_text}

    except Exception as e:
        print(f"PyPDF2 extraction failed: {str(e)}")

        # Fallback to OCR
        try:
            print("Falling back to OCR...")
            ocr_text = await extract_text_with_ocr(pdf_buffer)
            save_extracted_text_to_file(ocr_text)
            save_extracted_text_to_project_base(ocr_text)
            return {"text": ocr_text}
        except Exception as ocr_error:
            print(f"OCR fallback also failed: {str(ocr_error)}")
            error_msg = "Could not extract text from PDF. The file may be image-based, corrupted, or use unsupported formatting."
            save_extracted_text_to_project_base(error_msg)
            return {"text": ""}
        
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


