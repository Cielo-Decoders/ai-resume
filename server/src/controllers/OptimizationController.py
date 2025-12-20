"""
Optimization Controller for resume optimization endpoints.
"""
import logging
from typing import Dict, Any, List
from fastapi import HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from io import BytesIO

from ..services.optimization_service import optimize_resume_pdf, optimize_resume_docx
from ..services.analysis_service import extract_text_from_pdf


class OptimizationRequest(BaseModel):
    """Request model for resume optimization."""
    selected_keywords: List[str]
    job_data: Dict[str, Any]
    resume_text: str


class OptimizationController:
    """Controller class for resume optimization operations."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def optimize_resume(
        self,
        resume: UploadFile = File(...),
        selected_keywords: List[str] = None,
        job_data: Dict[str, Any] = None,
        resume_text: str = None
    ) -> StreamingResponse:
        """
        Optimize resume while preserving structure and formatting.

        Args:
            resume: The uploaded resume file (PDF or DOCX)
            selected_keywords: Keywords to incorporate
            job_data: Job description data for context
            resume_text: Extracted text from resume

        Returns:
            StreamingResponse with optimized resume file

        Raises:
            HTTPException: If optimization fails
        """
        try:
            # Validate inputs
            if not resume.filename:
                raise HTTPException(status_code=400, detail="Filename is required")

            if not selected_keywords or len(selected_keywords) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Please select at least one keyword to optimize"
                )

            # Read file content
            resume_content = await resume.read()

            if not resume_content:
                raise HTTPException(status_code=400, detail="Empty file provided")

            # Determine file type
            file_extension = resume.filename.lower().split('.')[-1]

            self.logger.info(f"Optimizing {file_extension.upper()} resume with {len(selected_keywords)} keywords")

            # Process based on file type
            if file_extension == "pdf":
                optimized_content = await optimize_resume_pdf(
                    resume_content,
                    selected_keywords,
                    job_data or {},
                    resume_text or ""
                )
                media_type = "application/pdf"
                output_filename = f"optimized_{resume.filename}"

            elif file_extension in ["docx", "doc"]:
                optimized_content = await optimize_resume_docx(
                    resume_content,
                    selected_keywords,
                    job_data or {},
                    resume_text or ""
                )
                media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                output_filename = f"optimized_{resume.filename}"

            else:
                raise HTTPException(
                    status_code=400,
                    detail="Unsupported file format. Please upload PDF or DOCX"
                )

            self.logger.info(f"Optimization successful. Output size: {len(optimized_content)} bytes")

            # Return optimized file as streaming response
            return StreamingResponse(
                BytesIO(optimized_content),
                media_type=media_type,
                headers={
                    "Content-Disposition": f'attachment; filename="{output_filename}"'
                }
            )

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Resume optimization error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Optimization failed: {str(e)}"
            )

    async def get_optimization_preview(
        self,
        resume: UploadFile = File(...),
        selected_keywords: List[str] = None,
        job_data: Dict[str, Any] = None,
        resume_text: str = None
    ) -> Dict[str, Any]:
        """
        Get a preview of what changes will be made without generating the full file.

        Args:
            resume: The uploaded resume file
            selected_keywords: Keywords to incorporate
            job_data: Job description data
            resume_text: Extracted resume text

        Returns:
            Dictionary with preview of changes
        """
        try:
            if not selected_keywords or len(selected_keywords) == 0:
                return {
                    "success": False,
                    "message": "No keywords selected"
                }

            # For now, return a simple preview
            # In production, you'd call the AI to generate the plan without applying it
            return {
                "success": True,
                "keywords_to_add": selected_keywords,
                "estimated_changes": len(selected_keywords),
                "message": f"Ready to optimize with {len(selected_keywords)} keywords"
            }

        except Exception as e:
            self.logger.error(f"Preview generation error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Preview generation failed: {str(e)}"
            )

