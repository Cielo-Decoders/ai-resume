import os
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

@app.post("/api/extract-text")
async def extract_text(resume: UploadFile = File(...)):
    """
    Extract text from PDF for debugging/testing
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

        return {
            "success": True,
            "textLength": len(extracted_data["text"]),
            "text": extracted_data["text"][:2000],  # Return first 2000 chars
            "fullTextLength": len(extracted_data["text"])
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
    port = int(os.getenv("PORT", 5001))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)