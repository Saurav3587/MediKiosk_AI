from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.schemas.history import ClinicalHistorySchema
from app.schemas.document import DocumentSchema

class TimelineEventSchema(BaseModel):
    year: str
    date: str
    title: str
    type: str
    facility: Optional[str] = None
    summary: Optional[str] = None

    class Config:
        from_attributes = True

class TranscriptTurnSchema(BaseModel):
    speaker: str
    text: str
    inputMode: Optional[str] = None
    time: Optional[str] = None

    class Config:
        from_attributes = True

class PatientIntakeSubmission(BaseModel):
    id: Optional[str] = None
    token: Optional[str] = None
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    abhaId: Optional[str] = None
    department: Optional[str] = "General Medicine"
    language: Optional[str] = "English"
    chiefComplaint: str
    symptoms: List[str] = []
    symptomDuration: Optional[str] = None
    symptomCharacter: Optional[str] = None
    priority: Optional[bool] = False
    priorityReason: Optional[str] = None
    status: Optional[str] = "Ready"
    isAyush: Optional[bool] = False
    ayushDetails: Optional[Dict[str, Any]] = None
    clinicalHistory: Optional[ClinicalHistorySchema] = None
    aiSummary: Optional[str] = None
    documents: Optional[List[DocumentSchema]] = []
    timeline: Optional[List[TimelineEventSchema]] = []
    transcript: Optional[List[TranscriptTurnSchema]] = []

class PatientResponse(BaseModel):
    id: str
    token: str
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    abhaId: Optional[str] = None
    department: str
    language: str
    chiefComplaint: str
    symptoms: List[str] = []
    symptomDuration: Optional[str] = None
    priority: bool
    priorityReason: Optional[str] = None
    status: str
    waitingTime: Optional[str] = "Just now"
    intakeCompletedAt: Optional[str] = None
    isAyush: Optional[bool] = False
    ayushDetails: Optional[Dict[str, Any]] = None
    verifiedByDoctor: Optional[bool] = False
    verifiedAt: Optional[str] = None
    verifiedDoctorName: Optional[str] = None
    doctorVerificationNotes: Optional[str] = None
    consultationStarted: Optional[bool] = False
    clinicalHistory: Optional[ClinicalHistorySchema] = None
    aiSummary: Optional[str] = None
    documents: List[DocumentSchema] = []
    timeline: List[TimelineEventSchema] = []
    transcript: List[TranscriptTurnSchema] = []

    class Config:
        from_attributes = True

class VerificationRequest(BaseModel):
    doctorName: Optional[str] = "Dr. Arun Sharma"
    notes: Optional[str] = None
