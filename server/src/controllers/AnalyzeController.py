"""
AnalyzeController module for handling resume analysis endpoints.
"""
import logging
import json
from typing import Dict, Any, List
from fastapi import HTTPException, UploadFile, File
from pydantic import BaseModel, field_validator

from ..config import settings
from ..services.analysis_service import extract_text_from_pdf, analyze_resume_against_job, generate_optimized_resume, generate_cover_letter, scan_job_red_flags, generate_interview_questions, evaluate_interview_answer, _condense_job_description

# Maximum character limits for text inputs to prevent abuse and unbounded OpenAI costs
_MAX_RESUME_TEXT = 50_000   # ~25 pages of dense text
_MAX_JOB_DESC = 20_000      # generous for any real job posting

# Magic bytes for allowed file types (M3 — file type validation beyond extension)
_MAGIC_BYTES: Dict[str, List[bytes]] = {
    ".pdf":  [b"%PDF"],
    ".doc":  [b"\xd0\xcf\x11\xe0"],          # OLE2 compound document
    ".docx": [b"PK\x03\x04"],                 # ZIP (OOXML)
    ".txt":  [],                               # no magic bytes; any content allowed
}


def _validate_file_magic(content: bytes, extension: str) -> bool:
    """Return True if file content starts with a known magic byte sequence."""
    signatures = _MAGIC_BYTES.get(extension, [])
    if not signatures:
        return True  # .txt has no signature — accept as-is
    return any(content.startswith(sig) for sig in signatures)


class KeywordAnalysisRequest(BaseModel):
    """Request model for keyword analysis."""
    resume_text: str
    job_data: Dict[str, Any]

    @field_validator("resume_text")
    @classmethod
    def resume_text_max_length(cls, v: str) -> str:
        if len(v) > _MAX_RESUME_TEXT:
            raise ValueError(f"resume_text exceeds maximum length of {_MAX_RESUME_TEXT} characters")
        return v


class ResumeOptimizationRequest(BaseModel):
    """Request model for resume optimization/generation."""
    original_resume_text: str
    job_description: str
    selected_keywords: List[Dict[str, str]]
    job_title: str = ""

    @field_validator("original_resume_text")
    @classmethod
    def resume_max_length(cls, v: str) -> str:
        if len(v) > _MAX_RESUME_TEXT:
            raise ValueError(f"original_resume_text exceeds maximum length of {_MAX_RESUME_TEXT} characters")
        return v

    @field_validator("job_description")
    @classmethod
    def job_desc_max_length(cls, v: str) -> str:
        if len(v) > _MAX_JOB_DESC:
            raise ValueError(f"job_description exceeds maximum length of {_MAX_JOB_DESC} characters")
        return v


class ExtractJobRequest(BaseModel):
    """Request model for AI job data extraction."""
    job_description: str

    @field_validator("job_description")
    @classmethod
    def job_desc_max_length(cls, v: str) -> str:
        if len(v) > _MAX_JOB_DESC:
            raise ValueError(f"job_description exceeds maximum length of {_MAX_JOB_DESC} characters")
        return v


class RedFlagScanRequest(BaseModel):
    """Request model for job description red flag scanning."""
    job_description: str

    @field_validator("job_description")
    @classmethod
    def job_desc_max_length(cls, v: str) -> str:
        if len(v) > _MAX_JOB_DESC:
            raise ValueError(f"job_description exceeds maximum length of {_MAX_JOB_DESC} characters")
        return v


class CoverLetterRequest(BaseModel):
    """Request model for cover letter generation."""
    resume_text: str
    job_description: str
    job_title: str = ""
    company: str = ""
    tone: str = "professional"

    @field_validator("resume_text")
    @classmethod
    def resume_text_max_length(cls, v: str) -> str:
        if len(v) > _MAX_RESUME_TEXT:
            raise ValueError(f"resume_text exceeds maximum length of {_MAX_RESUME_TEXT} characters")
        return v

    @field_validator("job_description")
    @classmethod
    def job_desc_max_length(cls, v: str) -> str:
        if len(v) > _MAX_JOB_DESC:
            raise ValueError(f"job_description exceeds maximum length of {_MAX_JOB_DESC} characters")
        return v

    @field_validator("tone")
    @classmethod
    def validate_tone(cls, v: str) -> str:
        allowed = {"professional", "conversational", "enthusiastic", "executive"}
        if v not in allowed:
            raise ValueError(f"tone must be one of: {', '.join(allowed)}")
        return v


class MockInterviewRequest(BaseModel):
    """Request model for generating mock interview questions."""
    job_description: str
    resume_text: str
    count: int = 5

    @field_validator("job_description")
    @classmethod
    def job_desc_max_length(cls, v: str) -> str:
        if len(v) > _MAX_JOB_DESC:
            raise ValueError(f"job_description exceeds maximum length of {_MAX_JOB_DESC} characters")
        return v

    @field_validator("resume_text")
    @classmethod
    def resume_text_max_length(cls, v: str) -> str:
        if len(v) > _MAX_RESUME_TEXT:
            raise ValueError(f"resume_text exceeds maximum length of {_MAX_RESUME_TEXT} characters")
        return v

    @field_validator("count")
    @classmethod
    def validate_count(cls, v: int) -> int:
        if v < 1 or v > 10:
            raise ValueError("count must be between 1 and 10")
        return v


class EvaluateAnswerRequest(BaseModel):
    """Request model for evaluating an interview answer."""
    question: str
    answer: str
    job_description: str

    @field_validator("question")
    @classmethod
    def question_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 5:
            raise ValueError("question must be at least 5 characters")
        return v

    @field_validator("answer")
    @classmethod
    def answer_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError("answer must be at least 10 characters")
        return v

    @field_validator("job_description")
    @classmethod
    def job_desc_max_length(cls, v: str) -> str:
        if len(v) > _MAX_JOB_DESC:
            raise ValueError(f"job_description exceeds maximum length of {_MAX_JOB_DESC} characters")
        return v


class AnalyzeController:
    """Controller class for resume analysis operations."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def extract_text_from_resume(self, resume: UploadFile = File(...)) -> Dict[str, Any]:
        """Extract text from uploaded PDF resume."""
        try:
            # Validate file type by extension
            if not resume.filename:
                raise HTTPException(status_code=400, detail="Filename is required")

            file_extension = "." + resume.filename.lower().split('.')[-1]
            if file_extension not in settings.allowed_file_types:
                raise HTTPException(
                    status_code=400,
                    detail=f"Only {', '.join(settings.allowed_file_types)} files are supported"
                )

            # Read file content
            resume_content = await resume.read()

            if not resume_content:
                raise HTTPException(status_code=400, detail="Empty file provided")

            if len(resume_content) > settings.max_file_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"File size exceeds maximum allowed size of {settings.max_file_size // (1024 * 1024)}MB"
                )

            # Validate file magic bytes to reject files misrepresented by extension (M3)
            if not _validate_file_magic(resume_content, file_extension):
                raise HTTPException(
                    status_code=400,
                    detail="File content does not match the declared file type"
                )

            self.logger.info(f"Extracting text from resume (ext={file_extension})")

            extracted_data = await extract_text_from_pdf(resume_content)

            response_data = {
                "success": True,
                "filename": resume.filename,
                "textLength": len(extracted_data["text"]),
                "text": extracted_data["text"],
                "fullText": extracted_data["text"],
                "preview": extracted_data["text"][:2000],
                "fullTextLength": len(extracted_data["text"])
            }

            self.logger.info(f"Text extraction successful. Extracted {response_data['textLength']} characters")
            return response_data

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Text extraction error: {str(e)}")
            raise HTTPException(status_code=500, detail="Text extraction failed. Please try again.")

    async def get_health_status(self) -> Dict[str, str]:
        """Health check endpoint for the analyze service."""
        return {
            "status": "healthy",
            "service": "analyze_controller",
            "message": "Resume analysis service is operational"
        }

    async def analyze_keywords(self, request: KeywordAnalysisRequest) -> Dict[str, Any]:
        """Analyze resume text against job data to find missing keywords."""
        try:
            if not request.resume_text or len(request.resume_text.strip()) < 10:
                raise HTTPException(
                    status_code=400,
                    detail="Resume text is required and must contain meaningful content"
                )

            if not request.job_data:
                raise HTTPException(status_code=400, detail="Job data is required")

            self.logger.info("Starting keyword analysis...")

            analysis_result = await analyze_resume_against_job(
                request.resume_text,
                request.job_data
            )

            self.logger.info(f"Keyword analysis complete. Match score: {analysis_result['matchScore']}%")
            return analysis_result

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Keyword analysis error: {str(e)}")
            raise HTTPException(status_code=500, detail="Keyword analysis failed. Please try again.")

    async def optimize_resume(self, request: ResumeOptimizationRequest) -> Dict[str, Any]:
        """Generate an optimized resume based on selected keywords."""
        try:
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

            if not request.selected_keywords:
                raise HTTPException(
                    status_code=400,
                    detail="At least one keyword must be selected for optimization"
                )

            self.logger.info(f"Starting resume optimization with {len(request.selected_keywords)} keywords...")

            optimization_result = await generate_optimized_resume(
                original_resume_text=request.original_resume_text,
                job_description=request.job_description,
                selected_keywords=request.selected_keywords,
                job_title=request.job_title
            )

            if optimization_result.get("success"):
                self.logger.info(f"Resume optimization complete. ATS Score: {optimization_result.get('atsScore', 'N/A')}%")
            else:
                self.logger.warning(f"Resume optimization returned failure: {optimization_result.get('message', 'Unknown error')}")

            return optimization_result

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Resume optimization error: {str(e)}")
            raise HTTPException(status_code=500, detail="Resume optimization failed. Please try again.")

    async def extract_job_data(self, request: ExtractJobRequest) -> Dict[str, Any]:
        """
        Extract structured job data from a raw job description using OpenAI.
        Proxies the OpenAI call server-side so the API key is never exposed
        to the browser and CORS is not an issue.
        """
        try:
            if not request.job_description or len(request.job_description.strip()) < 20:
                raise HTTPException(
                    status_code=400,
                    detail="Job description is required and must contain meaningful content"
                )

            if not settings.openai_api_key:
                raise HTTPException(status_code=500, detail="Service configuration error. Please contact support.")

            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.openai_api_key)

            self.logger.info("Extracting job data via server-side OpenAI call...")

            # Smart-condense long JDs to avoid OpenAI timeouts
            condensed_jd = _condense_job_description(request.job_description)

            completion = await client.chat.completions.create(
                model=settings.openai_model,
                temperature=0.3,
                max_tokens=2000,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a job description analyzer. Extract structured data from job descriptions and return it as JSON."
                    },
                    {
                        "role": "user",
                        "content": (
                            "Extract the following information from this job description and return ONLY valid JSON "
                            "(no markdown, no code blocks, just pure JSON):\n"
                            "{\n"
                            '  "title": "job title",\n'
                            '  "company": "company name",\n'
                            '  "location": "location",\n'
                            '  "salary": "$XXk - $XXk or description",\n'
                            '  "requirements": ["requirement 1", "requirement 2"],\n'
                            '  "responsibilities": ["responsibility 1"],\n'
                            '  "skills": ["skill 1", "skill 2"],\n'
                            '  "technologies": ["tech 1", "tech 2"],\n'
                            '  "tools": ["tool 1", "tool 2"],\n'
                            '  "qualifications": ["qualification 1"]\n'
                            "}\n\n"
                            f"Job Description:\n{condensed_jd}"
                        )
                    }
                ]
            )

            raw = completion.choices[0].message.content.strip()
            self.logger.info("OpenAI job extraction response received")

            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            try:
                job_data = json.loads(raw)
            except json.JSONDecodeError:
                self.logger.error("Failed to parse OpenAI response as JSON")
                raise HTTPException(status_code=500, detail="AI response could not be parsed as JSON")

            return job_data

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Job data extraction error: {str(e)}")
            raise HTTPException(status_code=500, detail="Job data extraction failed. Please try again.")

    async def generate_cover_letter_endpoint(self, request: CoverLetterRequest) -> Dict[str, Any]:
        """Generate a tailored cover letter based on resume and job description."""
        try:
            if not request.resume_text or len(request.resume_text.strip()) < 50:
                raise HTTPException(
                    status_code=400,
                    detail="Resume text is required and must contain meaningful content"
                )

            if not request.job_description or len(request.job_description.strip()) < 50:
                raise HTTPException(
                    status_code=400,
                    detail="Job description is required and must contain meaningful content"
                )

            self.logger.info(f"Generating cover letter (tone={request.tone})...")

            result = await generate_cover_letter(
                resume_text=request.resume_text,
                job_description=request.job_description,
                job_title=request.job_title,
                company=request.company,
                tone=request.tone,
            )

            if result.get("success"):
                self.logger.info(f"Cover letter generated. Words: {result.get('wordCount', 0)}")
            else:
                self.logger.warning(f"Cover letter generation failed: {result.get('message')}")

            return result

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Cover letter generation error: {str(e)}")
            raise HTTPException(status_code=500, detail="Cover letter generation failed. Please try again.")

    async def scan_red_flags(self, request: RedFlagScanRequest) -> Dict[str, Any]:
        """Scan a job description for red flags."""
        try:
            if not request.job_description or len(request.job_description.strip()) < 20:
                raise HTTPException(
                    status_code=400,
                    detail="Job description is required and must contain meaningful content"
                )

            self.logger.info("Scanning job description for red flags...")

            result = await scan_job_red_flags(request.job_description)

            self.logger.info(f"Red flag scan complete. Score: {result.get('score')}, Flags: {len(result.get('flags', []))}")
            return result

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Red flag scan error: {str(e)}")
            raise HTTPException(status_code=500, detail="Red flag scan failed. Please try again.")

    async def generate_interview(self, request: MockInterviewRequest) -> Dict[str, Any]:
        """Generate mock interview questions based on JD and resume."""
        try:
            if not request.job_description or len(request.job_description.strip()) < 20:
                raise HTTPException(
                    status_code=400,
                    detail="Job description is required and must contain meaningful content"
                )

            if not request.resume_text or len(request.resume_text.strip()) < 50:
                raise HTTPException(
                    status_code=400,
                    detail="Resume text is required and must contain meaningful content"
                )

            self.logger.info(f"Generating {request.count} mock interview questions...")

            result = await generate_interview_questions(
                job_description=request.job_description,
                resume_text=request.resume_text,
                count=request.count,
            )

            self.logger.info(f"Interview generation complete. Questions: {len(result.get('questions', []))}")
            return result

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Interview generation error: {str(e)}")
            raise HTTPException(status_code=500, detail="Interview question generation failed. Please try again.")

    async def evaluate_answer(self, request: EvaluateAnswerRequest) -> Dict[str, Any]:
        """Evaluate a candidate's interview answer."""
        try:
            self.logger.info("Evaluating interview answer...")

            result = await evaluate_interview_answer(
                question=request.question,
                answer=request.answer,
                job_description=request.job_description,
            )

            self.logger.info(f"Answer evaluation complete. Score: {result.get('feedback', {}).get('score', 'N/A')}")
            return result

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Answer evaluation error: {str(e)}")
            raise HTTPException(status_code=500, detail="Answer evaluation failed. Please try again.")
