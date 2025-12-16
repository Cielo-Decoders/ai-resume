import os
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from src.services.analysis_service import extract_text_from_pdf
import traceback

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ATS Resume Analyzer API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "ATS Resume Analyzer API"}

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

class JobDescriptionRequest(BaseModel):
    job_description: str

@app.post("/api/extract-job-data")
async def extract_job_data(request: JobDescriptionRequest):
    """
    Extract structured job data from job description using OpenAI API
    This endpoint is on the backend to keep the API key secure
    """
    try:
        import openai

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("❌ OPENAI_API_KEY not set in environment variables")
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured on server"
            )

        openai.api_key = api_key

        logger.info("🔍 Extracting job data from description...")

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a job description analyzer. Extract structured data from job descriptions and return it as valid JSON only."
                },
                {
                    "role": "user",
                    "content": f"""Extract the following information from this job description and return ONLY valid JSON (no markdown, no code blocks, just pure JSON):
{{
"title": "job title",
"company": "company name",
"location": "location",
"salary_range": "$XXk - $XXk or description",
"requirements": ["requirement 1", "requirement 2"],
"responsibilities": ["responsibility 1"],
"skills": ["skill 1", "skill 2"],
"experience_level": "Junior/Mid/Senior",
"job_type": "Full-time/Part-time/Contract",
"benefits": ["benefit 1", "benefit 2"]
}}

Job Description:
{request.job_description}"""
                }
            ],
            temperature=0.3,
            max_tokens=2000
        )

        # Extract and parse JSON response
        content = response.choices[0].message.content.strip()

        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        job_data = __import__('json').loads(content)

        logger.info("✅ Job data extracted successfully")
        return job_data

    except Exception as e:
        logger.error(f"❌ Job data extraction error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract job data: {str(e)}"
        )

@app.post("/api/extract-text")
async def extract_text(resume: UploadFile = File(...)):
    """
    Extract text from PDF and return analysis results
    """
    try:
        # Validate file type
        if not resume.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        resume_content = await resume.read()

        if not resume_content:
            raise HTTPException(status_code=400, detail="Empty file")

        logger.info(f"📄 Extracting text from: {resume.filename}")

        # Call the text extraction service
        extracted_data = await extract_text_from_pdf(resume_content)

        resume_text = extracted_data.get("text", "")

        # Return structured analysis results
        return {
            "overallScore": 0,
            "atsCompatibility": 0,
            "keywordMatch": 0,
            "formatting": 0,
            "jobData": {
                "title": "",
                "company": "",
                "location": "",
                "salary_range": "",
                "requirements": [],
                "responsibilities": [],
                "skills": [],
                "experience_level": "",
                "job_type": "",
                "benefits": []
            },
            "sections": {
                "contact": {"score": 0, "issues": []},
                "summary": {"score": 0, "issues": []},
                "experience": {"score": 0, "issues": []},
                "skills": {"score": 0, "issues": []},
                "education": {"score": 0, "issues": []}
            },
            "missingKeywords": [],
            "matchedKeywords": [],
            "suggestedKeywords": [],
            "improvements": [],
            "jobMatch": {
                "title": "",
                "company": "",
                "location": "",
                "matchPercentage": 0,
                "salaryRange": ""
            },
            "salaryInsights": {
                "estimatedSalary": "",
                "marketAverage": "",
                "topPercentile": "",
                "yourEstimate": "",
                "factors": []
            },
            "interviewPrep": {
                "likelyQuestions": [],
                "technicalTopics": [],
                "preparationTips": []
            },
            "linkedinOptimization": {
                "headlineScore": 0,
                "summaryScore": 0,
                "skillsScore": 0,
                "suggestions": []
            },
            "resumeText": resume_text[:5000]  # Include extracted text for reference
        }

    except Exception as e:
        logger.error(f"❌ Text extraction error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Text extraction failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    from dotenv import load_dotenv

    # Load environment variables from .env file
    load_dotenv()

    # Use environment variable PORT if available, otherwise default to 5001
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)