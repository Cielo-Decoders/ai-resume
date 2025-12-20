"""
FastAPI application entry point for ATS Resume Analyzer API.

This module initializes the FastAPI application with proper configuration,
middleware, and route registration following industry best practices.
"""
import sys
from pathlib import Path

# Ensure server and repository root are on sys.path so imports like
# `from src.config import settings` work correctly both when running
# the app directly and when uvicorn's reloader spawns subprocesses.
ROOT = Path(__file__).resolve().parent  # .../ai-resume/server
REPO_ROOT = ROOT.parent                   # .../ai-resume
for p in (str(ROOT), str(REPO_ROOT)):
    if p not in sys.path:
        sys.path.insert(0, p)

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file BEFORE importing settings
load_dotenv(dotenv_path=ROOT / ".env")

from src.config import settings
from src.route.index import register_routes

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        FastAPI: Configured FastAPI application instance
    """
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """Handle application startup and shutdown using lifespan context."""
        logger.info("ATS Resume Analyzer API starting up...")
        yield
        logger.info("ATS Resume Analyzer API shutting down...")

    # Initialize FastAPI app with metadata
    app = FastAPI(
        title=settings.app_name,
        description="API for analyzing resumes and extracting text content",
        version=settings.app_version,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        lifespan=lifespan
    )
    
    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )
    
    # Register all routes
    register_routes(app)
    
    return app


# Create the app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting server on {settings.host}:{settings.port}")
    logger.info(f"Debug mode: {settings.debug}")
    
    # Run the application
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )