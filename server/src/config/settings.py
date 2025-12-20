from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Application
    app_name: str = "ATS Resume Analyzer API"
    app_version: str = "0.1.0"

    # Server
    host: str = "127.0.0.1"
    port: int = 8000
    debug: bool = True
    log_level: str = "INFO"

    # CORS and uploads
    allowed_origins: List[str] = ["*"]
    allowed_file_types: List[str] = [".pdf", ".docx"]
    max_file_size: int = 5 * 1024 * 1024  # 5 MB

    # OpenAI
    openai_api_key: Optional[str] = None
    openai_model: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
