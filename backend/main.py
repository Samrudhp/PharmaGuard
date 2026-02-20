from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routes.analyze import router as analyze_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="PharmaGuard API",
    description="Pharmacogenomics analysis API for personalized drug recommendations",
    version="1.0.0"
)

# Configure CORS
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze_router, prefix="/api", tags=["analysis"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "PharmaGuard API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "PharmaGuard API"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
