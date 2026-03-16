"""
Unit tests for AnalyzeController validation logic.
External service calls (extract_text_from_pdf, analyze_resume_against_job,
generate_optimized_resume) are mocked with unittest.mock.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException

from src.controllers.AnalyzeController import (
    AnalyzeController,
    KeywordAnalysisRequest,
    ResumeOptimizationRequest,
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def make_upload_file(
    filename: str = "resume.pdf",
    content: bytes = b"%PDF-1.4 mock pdf content",
    size_override: int | None = None,
) -> MagicMock:
    """Create a mock UploadFile with realistic magic bytes."""
    mock_file = MagicMock()
    mock_file.filename = filename
    actual_content = b"x" * size_override if size_override else content
    mock_file.read = AsyncMock(return_value=actual_content)
    return mock_file


MOCK_EXTRACTED = {"text": "Extracted resume text here", "formatting": {}}
MOCK_ANALYSIS = {
    "success": True,
    "matchScore": 75.0,
    "missingPhrases": ["Docker"],
    "matchingPhrases": ["Python"],
    "actionableKeywords": [],
}
MOCK_OPTIMIZATION = {
    "success": True,
    "message": "Optimized",
    "optimizedResume": "Optimized resume text",
    "changes": [],
    "atsScore": 85,
}


# ─────────────────────────────────────────────────────────────────────────────
# extract_text_from_resume
# ─────────────────────────────────────────────────────────────────────────────
class TestExtractTextFromResume:
    @pytest.mark.asyncio
    async def test_raises_400_when_filename_is_missing(self):
        controller = AnalyzeController()
        mock_file = make_upload_file()
        mock_file.filename = None

        with pytest.raises(HTTPException) as exc_info:
            await controller.extract_text_from_resume(resume=mock_file)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_400_for_unsupported_file_type(self):
        controller = AnalyzeController()
        mock_file = make_upload_file(filename="resume.exe")

        with pytest.raises(HTTPException) as exc_info:
            await controller.extract_text_from_resume(resume=mock_file)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_400_for_empty_file(self):
        controller = AnalyzeController()
        mock_file = make_upload_file(content=b"")

        with pytest.raises(HTTPException) as exc_info:
            await controller.extract_text_from_resume(resume=mock_file)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_400_when_file_exceeds_size_limit(self):
        controller = AnalyzeController()
        # 11MB > max 10MB
        mock_file = make_upload_file(size_override=11 * 1024 * 1024)

        with pytest.raises(HTTPException) as exc_info:
            await controller.extract_text_from_resume(resume=mock_file)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_valid_pdf_returns_success_response(self):
        controller = AnalyzeController()
        mock_file = make_upload_file(filename="resume.pdf")

        with patch(
            "src.controllers.AnalyzeController.extract_text_from_pdf",
            new_callable=AsyncMock,
            return_value=MOCK_EXTRACTED,
        ):
            result = await controller.extract_text_from_resume(resume=mock_file)

        assert result["success"] is True
        assert result["filename"] == "resume.pdf"
        assert "text" in result
        assert "textLength" in result

    @pytest.mark.asyncio
    async def test_service_exception_raises_500(self):
        controller = AnalyzeController()
        mock_file = make_upload_file()

        with patch(
            "src.controllers.AnalyzeController.extract_text_from_pdf",
            new_callable=AsyncMock,
            side_effect=RuntimeError("PDF parsing crashed"),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await controller.extract_text_from_resume(resume=mock_file)
        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_txt_file_is_accepted(self):
        controller = AnalyzeController()
        mock_file = make_upload_file(filename="resume.txt")

        with patch(
            "src.controllers.AnalyzeController.extract_text_from_pdf",
            new_callable=AsyncMock,
            return_value=MOCK_EXTRACTED,
        ):
            result = await controller.extract_text_from_resume(resume=mock_file)

        assert result["success"] is True


# ─────────────────────────────────────────────────────────────────────────────
# analyze_keywords
# ─────────────────────────────────────────────────────────────────────────────
class TestAnalyzeKeywords:
    VALID_JOB_DATA = {"title": "Engineer", "skills": ["Python"]}

    @pytest.mark.asyncio
    async def test_raises_400_when_resume_text_is_empty(self):
        controller = AnalyzeController()
        request = KeywordAnalysisRequest(resume_text="", job_data=self.VALID_JOB_DATA)

        with pytest.raises(HTTPException) as exc_info:
            await controller.analyze_keywords(request=request)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_400_when_resume_text_is_too_short(self):
        controller = AnalyzeController()
        request = KeywordAnalysisRequest(resume_text="Hi", job_data=self.VALID_JOB_DATA)

        with pytest.raises(HTTPException) as exc_info:
            await controller.analyze_keywords(request=request)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_400_when_job_data_is_empty_dict(self):
        controller = AnalyzeController()
        request = KeywordAnalysisRequest(
            resume_text="A" * 50,
            job_data={},
        )

        with pytest.raises(HTTPException) as exc_info:
            await controller.analyze_keywords(request=request)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_valid_request_returns_analysis_result(self):
        controller = AnalyzeController()
        request = KeywordAnalysisRequest(
            resume_text="Python developer with 3 years of experience in software engineering",
            job_data=self.VALID_JOB_DATA,
        )

        with patch(
            "src.controllers.AnalyzeController.analyze_resume_against_job",
            new_callable=AsyncMock,
            return_value=MOCK_ANALYSIS,
        ):
            result = await controller.analyze_keywords(request=request)

        assert result == MOCK_ANALYSIS

    @pytest.mark.asyncio
    async def test_service_exception_raises_500(self):
        controller = AnalyzeController()
        request = KeywordAnalysisRequest(
            resume_text="Python developer with extensive experience",
            job_data=self.VALID_JOB_DATA,
        )

        with patch(
            "src.controllers.AnalyzeController.analyze_resume_against_job",
            new_callable=AsyncMock,
            side_effect=RuntimeError("AI service down"),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await controller.analyze_keywords(request=request)
        assert exc_info.value.status_code == 500


# ─────────────────────────────────────────────────────────────────────────────
# optimize_resume
# ─────────────────────────────────────────────────────────────────────────────
class TestOptimizeResume:
    VALID_KEYWORDS = [{"keyword": "Python", "category": "Skill", "priority": "high"}]
    LONG_RESUME = "A" * 60
    LONG_JOB_DESC = "B" * 60

    @pytest.mark.asyncio
    async def test_raises_400_when_resume_too_short(self):
        controller = AnalyzeController()
        request = ResumeOptimizationRequest(
            original_resume_text="Short",
            job_description=self.LONG_JOB_DESC,
            selected_keywords=self.VALID_KEYWORDS,
        )

        with pytest.raises(HTTPException) as exc_info:
            await controller.optimize_resume(request=request)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_400_when_job_description_too_short(self):
        controller = AnalyzeController()
        request = ResumeOptimizationRequest(
            original_resume_text=self.LONG_RESUME,
            job_description="Short",
            selected_keywords=self.VALID_KEYWORDS,
        )

        with pytest.raises(HTTPException) as exc_info:
            await controller.optimize_resume(request=request)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_400_when_keywords_list_is_empty(self):
        controller = AnalyzeController()
        request = ResumeOptimizationRequest(
            original_resume_text=self.LONG_RESUME,
            job_description=self.LONG_JOB_DESC,
            selected_keywords=[],
        )

        with pytest.raises(HTTPException) as exc_info:
            await controller.optimize_resume(request=request)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_valid_request_returns_optimization_result(self):
        controller = AnalyzeController()
        request = ResumeOptimizationRequest(
            original_resume_text=self.LONG_RESUME,
            job_description=self.LONG_JOB_DESC,
            selected_keywords=self.VALID_KEYWORDS,
            job_title="Software Engineer",
        )

        with patch(
            "src.controllers.AnalyzeController.generate_optimized_resume",
            new_callable=AsyncMock,
            return_value=MOCK_OPTIMIZATION,
        ):
            result = await controller.optimize_resume(request=request)

        assert result == MOCK_OPTIMIZATION

    @pytest.mark.asyncio
    async def test_service_exception_raises_500(self):
        controller = AnalyzeController()
        request = ResumeOptimizationRequest(
            original_resume_text=self.LONG_RESUME,
            job_description=self.LONG_JOB_DESC,
            selected_keywords=self.VALID_KEYWORDS,
        )

        with patch(
            "src.controllers.AnalyzeController.generate_optimized_resume",
            new_callable=AsyncMock,
            side_effect=RuntimeError("OpenAI API failure"),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await controller.optimize_resume(request=request)
        assert exc_info.value.status_code == 500
