from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class MedicationItem(BaseModel):
    name: str
    frequency: Optional[str] = None
    source: Optional[str] = None
    sourceId: Optional[str] = None
    sourceDoc: Optional[str] = None

class AllergyItem(BaseModel):
    allergen: str
    reaction: Optional[str] = None
    source: Optional[str] = None

class ClinicalHistorySchema(BaseModel):
    chiefComplaint: Optional[str] = None
    hpi: Optional[str] = None
    pastMedicalHistory: Optional[str] = None
    pastSurgicalHistory: Optional[str] = None
    currentMedications: List[Dict[str, Any]] = []
    allergies: List[Dict[str, Any]] = []
    familyHistory: Optional[str] = None
    personalHistory: Optional[str] = None
    lifestyle: Dict[str, Any] = {}
    reviewOfSystems: Dict[str, Any] = {}
    aiSummary: Optional[str] = None

    class Config:
        from_attributes = True

class HistoryUpdateSchema(BaseModel):
    chiefComplaint: Optional[str] = None
    hpi: Optional[str] = None
    pastMedicalHistory: Optional[str] = None
    pastSurgicalHistory: Optional[str] = None
    currentMedications: Optional[List[Dict[str, Any]]] = None
    allergies: Optional[List[Dict[str, Any]]] = None
    familyHistory: Optional[str] = None
    aiSummary: Optional[str] = None
