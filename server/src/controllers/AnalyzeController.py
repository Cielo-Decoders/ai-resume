"""
AnalyzeController module for handling resume analysis endpoints.
"""
import logging
from typing import Dict, Any, List
from fastapi import HTTPException, UploadFile, File
from pydantic import BaseModel

from ..config import settings
from ..services.analysis_service import extract_text_from_pdf, analyze_resume_against_job, generate_optimized_resume


class KeywordAnalysisRequest(BaseModel):
    """Request model for keyword analysis."""
    resume_text: str
    job_data: Dict[str, Any]


class ResumeOptimizationRequest(BaseModel):
    """Request model for resume optimization/generation."""
    original_resume_text: str
    job_description: str
    selected_keywords: List[Dict[str, str]]
    job_title: str = ""


class AnalyzeController:
    """Controller class for resume analysis operations."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def extract_text_from_resume(self, resume: UploadFile = File(...)) -> Dict[str, Any]:
        """
        Extract text from uploaded PDF resume.
        
        Args:
            resume (UploadFile): The uploaded PDF file
            
        Returns:
            Dict[str, Any]: Dictionary containing extraction results
            
        Raises:
            HTTPException: If file validation fails or extraction errors occur
        """
        try:
            # Validate file type
            if not resume.filename:
                raise HTTPException(
                    status_code=400, 
                    detail="Filename is required"
                )
            
            file_extension = "." + resume.filename.lower().split('.')[-1]
            if file_extension not in settings.allowed_file_types:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Only {', '.join(settings.allowed_file_types)} files are supported"
                )

            # Read file content
            resume_content = await resume.read()

            # Validate file content and size
            if not resume_content:
                raise HTTPException(
                    status_code=400, 
                    detail="Empty file provided"
                )
            
            if len(resume_content) > settings.max_file_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"File size exceeds maximum allowed size of {settings.max_file_size // (1024*1024)}MB"
                )

            self.logger.info(f"Extracting text from: {resume.filename}")

            # Call the text extraction service
            extracted_data = await extract_text_from_pdf(resume_content)

            # Prepare response
            response_data = {
                "success": True,
                "filename": resume.filename,
                "textLength": len(extracted_data["text"]),
                "text": extracted_data["text"][:2000],  # First 2000 chars for preview
                "fullTextLength": len(extracted_data["text"])
            }
            
            self.logger.info(
                f"Text extraction successful for {resume.filename}. "
                f"Extracted {response_data['textLength']} characters"
            )
            
            return response_data

        except HTTPException:
            # Re-raise HTTPExceptions as they are already properly formatted
            raise
        except Exception as e:
            self.logger.error(f"Text extraction error for {resume.filename}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Text extraction failed: {str(e)}"
            )
    
    async def get_health_status(self) -> Dict[str, str]:
        """
        Health check endpoint for the analyze service.
        
        Returns:
            Dict[str, str]: Health status information
        """
        return {
            "status": "healthy",
            "service": "analyze_controller",
            "message": "Resume analysis service is operational"
        }

    async def analyze_keywords(self, request: KeywordAnalysisRequest) -> Dict[str, Any]:
        """
        Analyze resume text against job data to find missing keywords.
        
        Args:
            request (KeywordAnalysisRequest): Contains resume_text and job_data
            
        Returns:
            Dict[str, Any]: Analysis results with missing/matching keywords
            
        Raises:
            HTTPException: If validation fails or analysis errors occur
        """
        try:
            # Validate inputs
            if not request.resume_text or len(request.resume_text.strip()) < 10:
                raise HTTPException(
                    status_code=400,
                    detail="Resume text is required and must contain meaningful content"
                )
            
            if not request.job_data:
                raise HTTPException(
                    status_code=400,
                    detail="Job data is required"
                )

            self.logger.info("Starting keyword analysis...")
            
            # Call the analysis service (now async with AI filtering)
            analysis_result = await analyze_resume_against_job(
                request.resume_text,
                request.job_data
            )
            
            self.logger.info(
                f"Keyword analysis complete. Match score: {analysis_result['matchScore']}%"
            )
            
            return analysis_result

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Keyword analysis error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Keyword analysis failed: {str(e)}"
            )

    async def optimize_resume(self, request: ResumeOptimizationRequest) -> Dict[str, Any]:
        """
        Generate an optimized resume based on selected keywords.
        
        Takes the original resume, job description, and user-selected keywords
        to create an ATS-optimized version of the resume.
        
        Args:
            request (ResumeOptimizationRequest): Contains original_resume_text,
                job_description, selected_keywords, and optional job_title
            
        Returns:
            Dict[str, Any]: Optimization results including the new resume text
            
        Raises:
            HTTPException: If validation fails or optimization errors occur
        """
        try:
            # Validate inputs
            if not request.original_resume_text or len(request.original_resume_text.strip()) < 50:
                raise HTTPException(
                    status_code=400,
                    detail="Original resume text is required and must contain meaningful content"
                )
            
            if not request.job_description or len(request.job_description.strip()) < 50:
                raise HTTPException(
                    status_code=400,
                    detail="Job description is required and must contain meaningful content"
                )
            
            if not request.selected_keywords or len(request.selected_keywords) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="At least one keyword must be selected for optimization"
                )

            self.logger.info(
                f"Starting resume optimization with {len(request.selected_keywords)} keywords..."
            )
            
            # Call the optimization service
            optimization_result = await generate_optimized_resume(
                original_resume_text=request.original_resume_text,
                job_description=request.job_description,
                selected_keywords=request.selected_keywords,
                job_title=request.job_title
            )
            
            if optimization_result.get("success"):
                self.logger.info(
                    f"Resume optimization complete. ATS Score: {optimization_result.get('atsScore', 'N/A')}%"
                )
            else:
                self.logger.warning(
                    f"Resume optimization failed: {optimization_result.get('message', 'Unknown error')}"
                )
            
            return optimization_result

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Resume optimization error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Resume optimization failed: {str(e)}"
            )
