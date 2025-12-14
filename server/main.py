import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ATS Resume Analyzer API")

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

if __name__ == "__main__":
    import uvicorn
    # Use environment variable PORT if available, otherwise default to 5001
    port = int(os.getenv("PORT", 5001))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)