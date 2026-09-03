from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class DocumentSchema(BaseModel):
    id: Optional[str] = None
    name: str
    type: str
    date: Optional[str] = None
    hospital: Optional[str] = None
    doctor: Optional[str] = None
    confidence: Optional[float] = 95.0
    extractedData: Dict[str, Any] = {}
    verified: Optional[bool] = False
    previewUrl: Optional[str] = None

    class Config:
        from_attributes = True

class OCRExtractRequest(BaseModel):
    documentType: str
    fileName: Optional[str] = "medical_record.pdf"

class OCRExtractResponse(BaseModel):
    id: str
    name: str
    type: str
    date: str
    hospital: str
    confidence: float
    extractedData: Dict[str, Any]
    verified: bool
