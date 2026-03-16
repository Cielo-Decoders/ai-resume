"""
FastAPI application entry point for ATS Resume Analyzer API.

This module initializes the FastAPI application with proper configuration,
middleware, and route registration following industry best practices.
"""
import os
import sys
import logging
from contextlib import asynccontextmanager
from pathlib import Path


# Add the server directory to the path so src can be imported
sys.path.insert(0, str(Path(__file__).parent))


# Load environment variables from .env file at module import time
# Look for .env in the server directory
from dotenv import load_dotenv
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"✓ Loaded environment variables from {env_path}")
else:
    print(f"⚠ .env file not found at {env_path}")


# Also check for .env in parent directory
parent_env = Path(__file__).parent.parent / ".env"
if parent_env.exists() and not env_path.exists():
    load_dotenv(parent_env)
    print(f"✓ Loaded environment variables from {parent_env}")


from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.config import settings
from src.limiter import limiter
from src.route.index import register_routes


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add HTTP security headers to every response."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none'"
        )
        return response


# Verify API key is loaded
if settings.openai_api_key:
    print(f"✓ OpenAI API key configured (first 20 chars): {settings.openai_api_key[:20]}...")
else:
    print("⚠ WARNING: OpenAI API key not configured!")


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

    # Disable API docs in production to avoid exposing schema to attackers
    docs_url = "/api/docs" if settings.debug else None
    redoc_url = "/api/redoc" if settings.debug else None

    # Initialize FastAPI app with metadata
    app = FastAPI(
        title=settings.app_name,
        description="API for analyzing resumes and extracting text content",
        version=settings.app_version,
        docs_url=docs_url,
        redoc_url=redoc_url,
        lifespan=lifespan
    )
    
    # Attach rate limiter state and error handler
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Add security headers to all responses
    app.add_middleware(SecurityHeadersMiddleware)

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
    )
    
    # Register all routes
    register_routes(app)
    
    return app


# Create the app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn
    from dotenv import load_dotenv

    # Load environment variables from .env file
    load_dotenv()
    
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