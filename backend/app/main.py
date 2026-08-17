"""FastAPI Main Application Entrypoint for BRICS AI Governance Platform."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes import complaints, dashboard, analytics, recommendations

load_dotenv()

app = FastAPI(
    title="BRICS AI Governance Platform API",
    description="Backend API supporting citizen complaint intelligence, infrastructure hotspots, and AI policy recommendations.",
    version="1.0.0",
)

# CORS setup
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(complaints.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "brics-ai-governance-backend"}
