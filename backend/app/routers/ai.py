from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.ai_engine import ai_engine

router = APIRouter(prefix="/ai", tags=["AI Clinical Engine"])

class HistorySynthesisRequest(BaseModel):
    patientName: str
    age: int
    gender: str
    answers: Dict[str, Any]

class PriorityEvaluationRequest(BaseModel):
    answers: Dict[str, Any]

@router.post("/synthesize-history")
def synthesize_clinical_history(payload: HistorySynthesisRequest):
    structured = ai_engine.synthesize_history(
        payload.patientName,
        payload.age,
        payload.gender,
        payload.answers
    )
    return {"success": True, "data": structured}

@router.post("/evaluate-priority")
def evaluate_priority_triggers(payload: PriorityEvaluationRequest):
    is_priority, reason = ai_engine.evaluate_priority_triggers(payload.answers)
    return {"isPriority": is_priority, "priorityReason": reason}
