"""
Route configuration module for organizing API endpoints.
"""
from fastapi import APIRouter, File, UploadFile, Form
from typing import List
import json
from ..dependencies import AnalyzeControllerDep, OptimizationControllerDep
from ..controllers.AnalyzeController import KeywordAnalysisRequest

# Create router for analyze-related endpoints
analyze_router = APIRouter(prefix="/api", tags=["analyze"])

# Create router for optimization endpoints
optimize_router = APIRouter(prefix="/api/optimize", tags=["optimize"])


@analyze_router.post("/extract-text")
async def extract_text_endpoint(
    resume: UploadFile = File(...),
    controller: AnalyzeControllerDep = None
):
    """
    Extract text from PDF resume for debugging/testing.
    
    Args:
        resume (UploadFile): The uploaded PDF file
        controller (AnalyzeController): Injected controller instance
        
    Returns:
        JSON response with extracted text information
    """
    return await controller.extract_text_from_resume(resume)


@analyze_router.get("/health")
async def health_check_endpoint(controller: AnalyzeControllerDep = None):
    """
    Health check endpoint for the analyze service.
    
    Args:
        controller (AnalyzeController): Injected controller instance
    
    Returns:
        JSON response with service health status
    """
    return await controller.get_health_status()


@analyze_router.post("/analyze-keywords")
async def analyze_keywords_endpoint(
    request: KeywordAnalysisRequest,
    controller: AnalyzeControllerDep = None
):
    """
    Analyze resume text against job data to find missing keywords.
    
    Args:
        request (KeywordAnalysisRequest): Contains resume_text and job_data
        controller (AnalyzeController): Injected controller instance
        
    Returns:
        JSON response with keyword analysis results
    """
    return await controller.analyze_keywords(request)


@optimize_router.post("/resume")
async def optimize_resume_endpoint(
    resume: UploadFile = File(...),
    selected_keywords: str = Form(...),
    job_data: str = Form(...),
    resume_text: str = Form(...),
    controller: OptimizationControllerDep = None
):
    """
    Optimize resume by incorporating selected keywords while preserving structure.

    Args:
        resume: The uploaded resume file (PDF or DOCX)
        selected_keywords: JSON string of keywords to incorporate
        job_data: JSON string of job description data
        resume_text: Extracted text from resume
        controller: Injected controller instance

    Returns:
        Optimized resume file as download
    """
    # Parse JSON strings
    keywords_list = json.loads(selected_keywords)
    job_data_dict = json.loads(job_data)

    return await controller.optimize_resume(
        resume=resume,
        selected_keywords=keywords_list,
        job_data=job_data_dict,
        resume_text=resume_text
    )


@optimize_router.post("/preview")
async def optimization_preview_endpoint(
    resume: UploadFile = File(...),
    selected_keywords: str = Form(...),
    job_data: str = Form(...),
    resume_text: str = Form(...),
    controller: OptimizationControllerDep = None
):
    """
    Get a preview of optimization changes without generating the full file.

    Args:
        resume: The uploaded resume file
        selected_keywords: JSON string of keywords to incorporate
        job_data: JSON string of job description data
        resume_text: Extracted text from resume
        controller: Injected controller instance

    Returns:
        JSON with preview of changes
    """
    # Parse JSON strings
    keywords_list = json.loads(selected_keywords)
    job_data_dict = json.loads(job_data)

    return await controller.get_optimization_preview(
        resume=resume,
        selected_keywords=keywords_list,
        job_data=job_data_dict,
        resume_text=resume_text
    )


def register_routes(app):
    """
    Register all route modules with the FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.include_router(analyze_router)
    app.include_router(optimize_router)
