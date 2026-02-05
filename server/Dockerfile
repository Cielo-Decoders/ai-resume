# CareerLab AI Backend - Python FastAPI Application
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Build argument for environment
ARG ENVIRONMENT=development

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=${ENVIRONMENT}

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the entire server application
COPY . .

# Create directory for resume files
RUN mkdir -p /app/resume

# Create non-root user for production security
RUN if [ "$ENVIRONMENT" = "production" ]; then \
        useradd -m -u 1000 appuser && \
        chown -R appuser:appuser /app; \
    fi

# Expose port 8000 for FastAPI
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Switch to non-root user in production
RUN if [ "$ENVIRONMENT" = "production" ]; then \
        echo "USER appuser" >> /tmp/user.txt; \
    fi

# Run the application
CMD if [ "$ENVIRONMENT" = "production" ]; then \
        su appuser -c "uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4"; \
    else \
        uvicorn main:app --host 0.0.0.0 --port 8000 --reload; \
    fi
