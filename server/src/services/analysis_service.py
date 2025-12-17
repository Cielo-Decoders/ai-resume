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


