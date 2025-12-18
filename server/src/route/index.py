"""
Route configuration module for organizing API endpoints.
"""
from fastapi import APIRouter, File, UploadFile
from ..dependencies import AnalyzeControllerDep

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


def register_routes(app):
    """
    Register all route modules with the FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.include_router(analyze_router)
