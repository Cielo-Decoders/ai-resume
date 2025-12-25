"""
Route configuration module for organizing API endpoints.
"""
from fastapi import APIRouter, File, UploadFile
from ..dependencies import AnalyzeControllerDep
from ..controllers.AnalyzeController import KeywordAnalysisRequest, ResumeOptimizationRequest

# Create router for analyze-related endpoints
analyze_router = APIRouter(prefix="/api", tags=["analyze"])


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


@analyze_router.post("/optimize-resume")
async def optimize_resume_endpoint(
    request: ResumeOptimizationRequest,
    controller: AnalyzeControllerDep = None
):
    """
    Generate an optimized resume based on selected keywords.
    
    Takes the user's original resume, job description, and selected keywords
    to create an ATS-optimized version that incorporates the chosen keywords.
    
    Args:
        request (ResumeOptimizationRequest): Contains original_resume_text,
            job_description, selected_keywords, and optional job_title
        controller (AnalyzeController): Injected controller instance
        
    Returns:
        JSON response with optimized resume and optimization details
    """
    return await controller.optimize_resume(request)


def register_routes(app):
    """
    Register all route modules with the FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.include_router(analyze_router)
