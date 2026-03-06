"""
Route configuration module for organizing API endpoints.
"""
from fastapi import APIRouter, File, Request, UploadFile
from ..dependencies import AnalyzeControllerDep
from ..controllers.AnalyzeController import KeywordAnalysisRequest, ResumeOptimizationRequest, ExtractJobRequest
from ..limiter import limiter

# Create router for analyze-related endpoints
analyze_router = APIRouter(prefix="/api", tags=["analyze"])


@analyze_router.post("/extract-text")
@limiter.limit("10/minute")
async def extract_text_endpoint(
    request: Request,
    resume: UploadFile = File(...),
    controller: AnalyzeControllerDep = None
):
    """Extract text from an uploaded PDF resume."""
    return await controller.extract_text_from_resume(resume)


@analyze_router.get("/health")
async def health_check_endpoint(controller: AnalyzeControllerDep = None):
    """Health check endpoint for the analyze service."""
    return await controller.get_health_status()


@analyze_router.post("/analyze-keywords")
@limiter.limit("20/minute")
async def analyze_keywords_endpoint(
    request: Request,
    body: KeywordAnalysisRequest,
    controller: AnalyzeControllerDep = None
):
    """Analyze resume text against job data to find missing keywords."""
    return await controller.analyze_keywords(body)


@analyze_router.post("/optimize-resume")
@limiter.limit("5/minute")
async def optimize_resume_endpoint(
    request: Request,
    body: ResumeOptimizationRequest,
    controller: AnalyzeControllerDep = None
):
    """Generate an ATS-optimized resume based on selected keywords."""
    return await controller.optimize_resume(body)


@analyze_router.post("/extract-job")
@limiter.limit("20/minute")
async def extract_job_endpoint(
    request: Request,
    body: ExtractJobRequest,
    controller: AnalyzeControllerDep = None
):
    """
    Extract structured job data from a raw job description using server-side OpenAI.
    This avoids exposing the API key in the browser and bypasses CORS restrictions.
    """
    return await controller.extract_job_data(body)


def register_routes(app):
    """Register all route modules with the FastAPI app."""
    app.include_router(analyze_router)
