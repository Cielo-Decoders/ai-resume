"""
Configuration settings for the ATS Resume Analyzer API.

Settings are loaded from environment variables with sensible defaults.
"""
import os
from typing import List


class Settings:
    """Application settings class."""

    # App metadata
    app_name: str = "ATS Resume Analyzer"
    app_version: str = "1.0.0"

    # Server configuration
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "8000"))
    debug: bool = os.getenv("DEBUG", "True").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # CORS configuration
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "http://127.0.0.1",
    ]

    # File upload configuration
    allowed_file_types: List[str] = [".pdf", ".doc", ".docx", ".txt"]
    max_file_size: int = 10 * 1024 * 1024  # 10MB in bytes

    # OpenAI configuration
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


# Create a singleton instance
settings = Settings()

# Debug: Print if API key is set
if settings.openai_api_key:
    print(f"✓ Settings: OpenAI API key is configured")
else:
    print("✗ Settings: OpenAI API key is NOT configured")
