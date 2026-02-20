FROM python:3.12-slim

# Install system dependencies required by pdf2image and pytesseract
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer-cache friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Cloud Run injects PORT; bind to all interfaces so the container is reachable
ENV HOST=0.0.0.0
ENV PORT=8080
ENV DEBUG=False

# Run uvicorn directly (no --reload in production)
CMD ["sh", "-c", "uvicorn main:app --host $HOST --port $PORT --workers 2"]
