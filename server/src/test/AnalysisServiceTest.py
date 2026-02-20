"""
Unit tests for pure functions in src/services/analysis_service.py.
No external API calls are made — these functions are deterministic.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

import pytest

from src.services.analysis_service import (
    normalize_bullet_points,
    _normalize_extracted_text,
    clean_encoding_artifacts,
    detect_resume_sections,
    count_bullet_points,
    extract_experience_bullets,
    verify_keyword_integration,
    calculate_ats_score,
)


# ─────────────────────────────────────────────────────────────────────────────
# normalize_bullet_points
# ─────────────────────────────────────────────────────────────────────────────
class TestNormalizeBulletPoints:
    def test_converts_dash_bullet(self):
        result = normalize_bullet_points("- Python developer")
        assert result == "• Python developer"

    def test_converts_en_dash_bullet(self):
        result = normalize_bullet_points("– Did great work")
        assert result == "• Did great work"

    def test_converts_em_dash_bullet(self):
        result = normalize_bullet_points("— Led the team")
        assert result == "• Led the team"

    def test_converts_asterisk_bullet(self):
        result = normalize_bullet_points("* Built a pipeline")
        assert result == "• Built a pipeline"

    def test_converts_filled_square_bullet(self):
        result = normalize_bullet_points("▪ Managed project")
        assert result == "• Managed project"

    def test_converts_unicode_bullet(self):
        result = normalize_bullet_points("\u2022 Item here")
        assert result == "• Item here"

    def test_preserves_existing_standard_bullet(self):
        result = normalize_bullet_points("• Already standard")
        assert result == "• Already standard"

    def test_non_bullet_lines_unchanged(self):
        result = normalize_bullet_points("John Doe\nSoftware Engineer")
        assert result == "John Doe\nSoftware Engineer"

    def test_multiline_mixed_bullets(self):
        text = "- Python\n• React\n* Docker"
        result = normalize_bullet_points(text)
        lines = result.split("\n")
        assert all(line.startswith("•") for line in lines)

    def test_preserves_indentation_before_bullet(self):
        result = normalize_bullet_points("  - Indented bullet")
        assert result.startswith("  •")

    def test_o_bullet_converted_when_followed_by_uppercase(self):
        result = normalize_bullet_points("o Organized the team")
        assert result == "• Organized the team"


# ─────────────────────────────────────────────────────────────────────────────
# _normalize_extracted_text
# ─────────────────────────────────────────────────────────────────────────────
class TestNormalizeExtractedText:
    def test_normalizes_crlf_to_lf(self):
        result = _normalize_extracted_text("line1\r\nline2")
        assert "\r" not in result
        assert "line1" in result and "line2" in result

    def test_normalizes_cr_to_lf(self):
        result = _normalize_extracted_text("line1\rline2")
        assert "\r" not in result

    def test_collapses_multiple_spaces(self):
        result = _normalize_extracted_text("Hello    World")
        assert "Hello World" in result

    def test_collapses_tabs_to_single_space(self):
        result = _normalize_extracted_text("Hello\t\tWorld")
        assert "Hello World" in result

    def test_collapses_three_or_more_newlines_to_two(self):
        result = _normalize_extracted_text("A\n\n\n\nB")
        assert "\n\n\n" not in result
        assert "A" in result and "B" in result

    def test_removes_zero_width_space(self):
        result = _normalize_extracted_text("Hello\u200bWorld")
        assert "\u200b" not in result

    def test_removes_bom(self):
        result = _normalize_extracted_text("\ufeffHello")
        assert "\ufeff" not in result

    def test_converts_en_dash_to_hyphen(self):
        result = _normalize_extracted_text("2020\u20132021")
        assert "\u2013" not in result
        assert "2020-2021" in result

    def test_converts_left_single_quote(self):
        result = _normalize_extracted_text("\u2018Hello\u2019")
        assert "'" in result

    def test_converts_unicode_bullet_to_standard(self):
        result = _normalize_extracted_text("\u2022 item")
        assert "• item" in result

    def test_strips_whitespace_from_each_line(self):
        result = _normalize_extracted_text("  hello  \n  world  ")
        for line in result.split("\n"):
            if line:
                assert line == line.strip()

    def test_empty_string_returns_empty(self):
        assert _normalize_extracted_text("") == ""


# ─────────────────────────────────────────────────────────────────────────────
# clean_encoding_artifacts
# ─────────────────────────────────────────────────────────────────────────────
class TestCleanEncodingArtifacts:
    def test_removes_percent_I_artifact(self):
        result = clean_encoding_artifacts("%Ï bullet point text")
        assert "%Ï" not in result

    def test_replaces_corrupted_bullet(self):
        result = clean_encoding_artifacts("â€¢ item")
        assert "â€¢" not in result
        assert "•" in result

    def test_replaces_corrupted_em_dash(self):
        # â€" = â (U+00E2) + € (U+20AC) + " (U+0022) — use single quotes to avoid premature string close
        result = clean_encoding_artifacts('2020 â€" 2021')
        assert 'â€"' not in result
        assert '–' in result

    def test_replaces_corrupted_apostrophe(self):
        result = clean_encoding_artifacts("It â€™s working")
        assert "â€™" not in result
        assert "'" in result

    def test_empty_string_returns_empty(self):
        result = clean_encoding_artifacts("")
        assert result == ""

    def test_dict_input_converted_to_string(self):
        result = clean_encoding_artifacts({"key": "value"})
        assert isinstance(result, str)

    def test_plain_text_passes_through(self):
        text = "John Doe\nPython developer with 3 years experience"
        result = clean_encoding_artifacts(text)
        assert "John Doe" in result
        assert "Python developer" in result


# ─────────────────────────────────────────────────────────────────────────────
# detect_resume_sections
# ─────────────────────────────────────────────────────────────────────────────
class TestDetectResumeSections:
    def test_detects_education_section(self):
        sections = detect_resume_sections("John Doe\nEDUCATION\nUniversity of Texas")
        assert any(s["type"] == "education" for s in sections)

    def test_detects_technical_skills_section(self):
        sections = detect_resume_sections("TECHNICAL SKILLS\nPython, React")
        assert any(s["type"] == "skills" for s in sections)

    def test_detects_work_experience_section(self):
        sections = detect_resume_sections("WORK EXPERIENCE\nEngineer at Acme")
        assert any(s["type"] == "experience" for s in sections)

    def test_detects_projects_section(self):
        sections = detect_resume_sections("PROJECTS\n• Built a web app")
        assert any(s["type"] == "projects" for s in sections)

    def test_detects_certifications_section(self):
        sections = detect_resume_sections("CERTIFICATIONS\nAWS Certified Developer")
        assert any(s["type"] == "certifications" for s in sections)

    def test_detects_summary_section(self):
        sections = detect_resume_sections("SUMMARY\nExperienced software engineer")
        assert any(s["type"] == "summary" for s in sections)

    def test_returns_correct_line_number(self):
        text = "John Doe\nEDUCATION\nUniversity"
        sections = detect_resume_sections(text)
        edu = next(s for s in sections if s["type"] == "education")
        assert edu["lineNumber"] == 1

    def test_returns_empty_list_when_no_sections(self):
        assert detect_resume_sections("No sections here at all") == []

    def test_case_insensitive_detection(self):
        sections = detect_resume_sections("education\nUniversity")
        assert any(s["type"] == "education" for s in sections)

    def test_detects_multiple_sections(self, sample_resume_text):
        sections = detect_resume_sections(sample_resume_text)
        types = [s["type"] for s in sections]
        assert "education" in types
        assert "skills" in types
        assert "experience" in types


# ─────────────────────────────────────────────────────────────────────────────
# count_bullet_points
# ─────────────────────────────────────────────────────────────────────────────
class TestCountBulletPoints:
    def test_returns_zero_for_no_bullets(self):
        assert count_bullet_points("No bullets here") == 0

    def test_counts_standard_bullet_lines(self):
        text = "• Item one\n• Item two\n• Item three"
        assert count_bullet_points(text) == 3

    def test_does_not_count_mid_line_bullet(self):
        text = "Skills include • Python and • React"
        assert count_bullet_points(text) == 0

    def test_counts_indented_bullets(self):
        text = "  • Indented bullet\n  • Another indented"
        assert count_bullet_points(text) == 2

    def test_counts_bullets_in_resume(self, sample_resume_text):
        count = count_bullet_points(sample_resume_text)
        assert count >= 5


# ─────────────────────────────────────────────────────────────────────────────
# extract_experience_bullets
# ─────────────────────────────────────────────────────────────────────────────
class TestExtractExperienceBullets:
    def test_returns_empty_when_no_experience_section(self):
        assert extract_experience_bullets("EDUCATION\n• Studied CS") == []

    def test_extracts_bullets_from_experience_section(self, sample_resume_text):
        bullets = extract_experience_bullets(sample_resume_text)
        assert len(bullets) >= 1
        assert all(b.startswith("•") for b in bullets)

    def test_excludes_bullets_from_subsequent_section(self):
        text = (
            "WORK EXPERIENCE\n"
            "• Wrote Python code\n"
            "• Built APIs\n"
            "PROJECTS\n"
            "• Made a web app\n"
        )
        bullets = extract_experience_bullets(text)
        assert len(bullets) == 2


# ─────────────────────────────────────────────────────────────────────────────
# verify_keyword_integration
# ─────────────────────────────────────────────────────────────────────────────
class TestVerifyKeywordIntegration:
    def test_present_keyword_is_integrated(self):
        result = verify_keyword_integration("I know Python and React", ["Python"])
        assert "Python" in result["integrated"]

    def test_absent_keyword_is_missing(self):
        result = verify_keyword_integration("I know Python", ["Docker"])
        assert "Docker" in result["missing"]

    def test_integration_rate_calculation(self):
        result = verify_keyword_integration(
            "Python developer with React skills",
            ["Python", "React", "Docker"],
        )
        assert result["integrationRate"] == pytest.approx(66.7, abs=0.1)

    def test_100_percent_integration(self):
        result = verify_keyword_integration(
            "Python React Docker Kubernetes",
            ["Python", "React", "Docker"],
        )
        assert result["integrationRate"] == 100.0
        assert len(result["missing"]) == 0

    def test_empty_keywords_returns_zero_rate(self):
        result = verify_keyword_integration("Some resume text", [])
        assert result["integrationRate"] == 0.0
        assert result["integrated"] == []
        assert result["missing"] == []

    def test_multi_word_keyword_integrated_when_all_words_present(self):
        result = verify_keyword_integration(
            "Experience with machine learning algorithms",
            ["machine learning"],
        )
        assert "machine learning" in result["integrated"]

    def test_dict_keyword_input_handled(self):
        result = verify_keyword_integration("Python developer", [{"keyword": "Python"}])
        assert "Python" in result["integrated"]


# ─────────────────────────────────────────────────────────────────────────────
# calculate_ats_score
# ─────────────────────────────────────────────────────────────────────────────
class TestCalculateAtsScore:
    FULL_RESUME = (
        "John Doe\n"
        "EDUCATION\n"
        "• Computer Science degree\n"
        "TECHNICAL SKILLS\n"
        "Python React Docker\n"
        "WORK EXPERIENCE\n"
        "• Developed features using Python and React\n"
        "• Deployed services with Docker\n"
    )
    JOB_DATA_FULL = {
        "skills": ["Python", "React", "Docker"],
        "requirements": [],
        "technologies": [],
        "tools": [],
        "qualifications": [],
    }
    KW_ALL_INTEGRATED = {
        "integrated": ["Python", "React", "Docker"],
        "missing": [],
        "integrationRate": 100.0,
    }

    def test_high_integration_yields_high_score(self):
        score = calculate_ats_score(
            optimized_text=self.FULL_RESUME,
            original_text=self.FULL_RESUME,
            job_data=self.JOB_DATA_FULL,
            keyword_verification=self.KW_ALL_INTEGRATED,
        )
        assert score >= 80

    def test_zero_integration_yields_low_score(self):
        text = "John Doe\nJavaScript developer"
        score = calculate_ats_score(
            optimized_text=text,
            original_text=text,
            job_data={"skills": ["Python", "React"], "requirements": [], "technologies": [], "tools": [], "qualifications": []},
            keyword_verification={"integrated": [], "missing": ["Python", "React"], "integrationRate": 0.0},
        )
        assert score < 40

    def test_score_clamped_between_0_and_100(self):
        score = calculate_ats_score(
            optimized_text=self.FULL_RESUME,
            original_text=self.FULL_RESUME,
            job_data=self.JOB_DATA_FULL,
            keyword_verification=self.KW_ALL_INTEGRATED,
        )
        assert 0 <= score <= 100

    def test_returns_integer(self):
        score = calculate_ats_score(
            optimized_text=self.FULL_RESUME,
            original_text=self.FULL_RESUME,
            job_data=self.JOB_DATA_FULL,
            keyword_verification=self.KW_ALL_INTEGRATED,
        )
        assert isinstance(score, int)

    def test_no_job_phrases_adds_20_requirements_default(self):
        empty_job = {"skills": [], "requirements": [], "technologies": [], "tools": [], "qualifications": []}
        kw = {"integrated": [], "missing": [], "integrationRate": 0.0}
        score = calculate_ats_score(
            optimized_text="Plain text no sections",
            original_text="Plain text no sections",
            job_data=empty_job,
            keyword_verification=kw,
        )
        # keyword=0, requirements=20 (default), completeness=20 (0>=0 for both sections/bullets), formatting=0 → 40
        assert score == 40

    def test_structured_resume_scores_higher_than_plain_text(self):
        empty_job = {"skills": [], "requirements": [], "technologies": [], "tools": [], "qualifications": []}
        kw = {"integrated": [], "missing": [], "integrationRate": 0.0}

        plain = calculate_ats_score(
            optimized_text="Plain text resume no sections",
            original_text="Plain text resume no sections",
            job_data=empty_job,
            keyword_verification=kw,
        )
        structured = calculate_ats_score(
            optimized_text=self.FULL_RESUME,
            original_text=self.FULL_RESUME,
            job_data=empty_job,
            keyword_verification=kw,
        )
        assert structured > plain
