"""Pydantic schemas and models for the BRICS AI Governance platform."""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field

PriorityType = Literal["low", "medium", "high", "critical"]
ComplaintStatusType = Literal["submitted", "under_review", "in_progress", "resolved", "rejected"]
CountryType = Literal["India", "Brazil", "Russia", "China", "South Africa"]


class Location(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    region: str
    district: Optional[str] = None
    country: CountryType = "India"
    manualAddress: Optional[str] = None


class TimelineEvent(BaseModel):
    stage: str
    label: str
    completedAt: Optional[str] = None
    note: Optional[str] = None
    completed: bool = False


class ComplaintCreate(BaseModel):
    text: str
    category: str
    location: Location
    mediaUrls: Optional[List[str]] = []
    audioUrl: Optional[str] = None
    language: Optional[str] = "en"


class ComplaintResponse(BaseModel):
    id: str
    citizenId: str
    text: str
    originalLanguage: Optional[str] = None
    translatedText: Optional[str] = None
    category: str
    severity: int
    priority: PriorityType
    status: ComplaintStatusType
    location: Location
    mediaUrls: Optional[List[str]] = []
    aiClassification: Optional[str] = None
    aiConfidence: Optional[float] = None
    createdAt: str
    updatedAt: str
    timeline: List[TimelineEvent] = []


class HotspotResponse(BaseModel):
    id: str
    regionId: str
    regionName: str
    country: CountryType
    coordinates: dict
    population: int
    complaintCount: int
    topIssue: str
    infrastructureGapScore: float
    demandScore: float
    populationImpactScore: float
    priorityScore: float
    priority: PriorityType
    aiRecommendation: str


class RecommendationResponse(BaseModel):
    id: str
    regionId: str
    regionName: str
    country: CountryType
    category: str
    priority: PriorityType
    priorityScore: float
    title: str
    evidence: List[str]
    recommendedAction: str
    expectedImpact: str
    estimatedCost: Optional[str] = None
    timeframe: Optional[str] = None
    confidence: int
    affectedPopulation: int
    aiGenerated: bool = True
    createdAt: str
