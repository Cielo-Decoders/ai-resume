"""
Route configuration module for organizing API endpoints.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from ..dependencies import AnalyzeControllerDep
from ..controllers.AnalyzeController import KeywordAnalysisRequest, ResumeOptimizationRequest, ExtractJobRequest
from ..config import settings

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


@analyze_router.post("/extract-job")
async def extract_job_endpoint(
    request: ExtractJobRequest,
    controller: AnalyzeControllerDep = None
):
    """
    Extract structured job data from a raw job description using server-side OpenAI.
    This avoids exposing the API key in the browser and bypasses CORS restrictions.
    """
    return await controller.extract_job_data(request)


def register_routes(app):
    """
    Register all route modules with the FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.include_router(analyze_router)
