"""Dashboard and Hotspots router for governance and citizen overviews."""

from datetime import datetime, timezone
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="", tags=["Dashboard"])


@router.get("/governance/overview")
async def get_governance_overview(
    country: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    dateRange: Optional[str] = Query(None),
):
    """Retrieves top-level KPIs for BRICS governance dashboard."""
    return {
        "success": True,
        "data": {
            "totalComplaints": 35050,
            "highPriorityIssues": 8240,
            "resolutionRate": 54,
            "infrastructureGapIndex": 72,
            "citizenSatisfaction": 46,
            "activeHotspots": 8,
            "countriesConnected": 5,
            "complaintsChange": 18.4,
            "resolutionChange": 6.2,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/governance/hotspots")
async def get_hotspots(
    country: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
):
    """Retrieves high-demand geospatial hotspots."""
    return {
        "success": True,
        "data": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/citizen/dashboard")
async def get_citizen_dashboard():
    """Retrieves citizen home dashboard metrics."""
    return {
        "success": True,
        "data": {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
