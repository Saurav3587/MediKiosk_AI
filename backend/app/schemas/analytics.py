from pydantic import BaseModel
from typing import Dict, Any, Optional

class DashboardStatsResponse(BaseModel):
    patientsWaiting: int
    intakesReady: int
    priorityReviews: int
    intakesCompleted: int
    totalDocumentsProcessed: int
    avgIntakeTime: str
    completionRate: str

class SystemHealthResponse(BaseModel):
    api: Dict[str, Any]
    database: Dict[str, Any]
    ocrService: Dict[str, Any]
    voiceService: Dict[str, Any]
    historyAIService: Dict[str, Any]
    abdmIntegration: Dict[str, Any]
    sarvamService: Optional[Dict[str, Any]] = None
