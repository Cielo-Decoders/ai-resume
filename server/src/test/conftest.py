"""
Shared pytest fixtures for the CareerLab AI server test suite.
"""
import sys
import os

# Ensure the server/ directory is on sys.path so that `src.*` imports resolve
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

import pytest


@pytest.fixture
def sample_resume_text() -> str:
    return (
        "John Doe\n"
        "john@example.com | linkedin.com/in/johndoe | github.com/johndoe\n"
        "\n"
        "EDUCATION\n"
        "University of Example, Houston, TX\n"
        "Bachelor of Science in Computer Science, Expected: May 2025\n"
        "• GPA: 3.8 / 4.0\n"
        "\n"
        "TECHNICAL SKILLS\n"
        "Languages: Python, JavaScript, Java, SQL\n"
        "Technologies: React, Node.js, FastAPI, PostgreSQL\n"
        "Tools: Git, Docker, Linux\n"
        "\n"
        "WORK EXPERIENCE\n"
        "Software Engineer Intern, June 2023 – August 2023\n"
        "Acme Corp, Houston, TX\n"
        "• Developed REST API endpoints using Python and FastAPI\n"
        "• Implemented CI/CD pipeline with Docker and Jenkins\n"
        "• Collaborated with a team of 5 engineers on an Agile project\n"
        "\n"
        "PROJECTS\n"
        "• Built a web application using React and Node.js with PostgreSQL backend\n"
        "• Created a data pipeline that processed 10k records per minute\n"
    )


@pytest.fixture
def sample_job_data() -> dict:
    return {
        "title": "Software Engineer",
        "company": "TechCorp",
        "location": "Austin, TX",
        "skills": ["Python", "React", "Docker", "Kubernetes"],
        "requirements": ["3+ years experience", "Bachelor's degree"],
        "technologies": ["AWS", "Kubernetes", "PostgreSQL"],
        "tools": ["Git", "Jenkins"],
        "qualifications": [],
    }
