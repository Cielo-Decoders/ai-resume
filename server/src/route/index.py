"""
Route configuration module for organizing API endpoints.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
from fastapi import APIRouter, File, Request, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from ..dependencies import AnalyzeControllerDep
from ..controllers.AnalyzeController import KeywordAnalysisRequest, ResumeOptimizationRequest, ExtractJobRequest, CoverLetterRequest, RedFlagScanRequest, MockInterviewRequest, EvaluateAnswerRequest
from ..config import settings
from ..limiter import limiter

# Trusted external job board proxy targets (server-side only, no API key required)
_JOB_PROXY_TARGETS = {
    "working-nomads": "https://www.workingnomads.com/api/exposed_jobs/",
    "himalayas": "https://himalayas.app/jobs/api",
}

# Create router for analyze-related endpoints
analyze_router = APIRouter(prefix="/api", tags=["analyze"])


class ContactFormRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str


@analyze_router.post("/contact")
async def contact_form_endpoint(body: ContactFormRequest):
    """
    Send contact form submission as an email via Gmail SMTP.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[CareerDev AI Contact] {body.subject}"
        msg["From"] = settings.gmail_user
        msg["To"] = settings.gmail_user
        msg["Reply-To"] = body.email

        text_body = (
            f"New message from CareerDev AI Contact Form\n\n"
            f"Name: {body.name}\n"
            f"Email: {body.email}\n"
            f"Subject: {body.subject}\n\n"
            f"Message:\n{body.message}"
        )
        html_body = f"""
        <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px;border-radius:12px 12px 0 0">
            <h2 style="color:white;margin:0">CareerDev AI — New Contact Message</h2>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
            <p><strong>Name:</strong> {body.name}</p>
            <p><strong>Email:</strong> <a href="mailto:{body.email}">{body.email}</a></p>
            <p><strong>Subject:</strong> {body.subject}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
            <p><strong>Message:</strong></p>
            <p style="background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb">{body.message}</p>
          </div>
        </body></html>
        """

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.gmail_user, settings.gmail_app_password)
            server.sendmail(settings.gmail_user, settings.gmail_user, msg.as_string())

        return JSONResponse({"success": True, "message": "Message sent successfully!"})

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Failed to send message: {str(e)}"}
        )


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


@analyze_router.get("/jobs/{source}")
@limiter.limit("60/minute")
async def job_proxy_endpoint(source: str, request: Request):
    """
    Server-side proxy for external job APIs that lack CORS headers.
    Only proxies pre-approved, trusted job board sources.
    """
    target_url = _JOB_PROXY_TARGETS.get(source)
    if not target_url:
        return JSONResponse(status_code=404, content={"error": "Unknown job source"})

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(target_url, headers={"Accept": "application/json"})
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as exc:
        return JSONResponse(
            status_code=502,
            content={"error": f"Upstream error: {exc.response.status_code}"},
        )
    except Exception as exc:
        return JSONResponse(status_code=502, content={"error": "Failed to fetch job data"})


@analyze_router.post("/generate-cover-letter")
@limiter.limit("5/minute")
async def generate_cover_letter_endpoint(
    request: Request,
    body: CoverLetterRequest,
    controller: AnalyzeControllerDep = None
):
    """Generate a tailored cover letter based on resume and job description."""
    return await controller.generate_cover_letter_endpoint(body)


@analyze_router.post("/scan-red-flags")
@limiter.limit("20/minute")
async def scan_red_flags_endpoint(
    request: Request,
    body: RedFlagScanRequest,
    controller: AnalyzeControllerDep = None
):
    """Scan a job description for red flags and risks."""
    return await controller.scan_red_flags(body)


@analyze_router.post("/generate-interview")
@limiter.limit("5/minute")
async def generate_interview_endpoint(
    request: Request,
    body: MockInterviewRequest,
    controller: AnalyzeControllerDep = None
):
    """Generate mock interview questions based on JD and resume."""
    return await controller.generate_interview(body)


@analyze_router.post("/evaluate-answer")
@limiter.limit("20/minute")
async def evaluate_answer_endpoint(
    request: Request,
    body: EvaluateAnswerRequest,
    controller: AnalyzeControllerDep = None
):
    """Evaluate a candidate's interview answer."""
    return await controller.evaluate_answer(body)


def register_routes(app):
    """Register all route modules with the FastAPI app."""
    app.include_router(analyze_router)
