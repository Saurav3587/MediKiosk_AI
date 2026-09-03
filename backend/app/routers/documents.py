from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.document import OCRExtractResponse, OCRExtractRequest
from app.services.ocr_engine import ocr_engine

router = APIRouter(prefix="/documents", tags=["Documents & OCR"])

@router.post("/ocr/extract", response_model=OCRExtractResponse)
def extract_ocr_parameters(payload: OCRExtractRequest):
    result = ocr_engine.extract_document(payload.documentType, payload.fileName or "medical_record.pdf")
    return result

@router.post("/upload", response_model=OCRExtractResponse)
async def upload_and_process_document(
    file: UploadFile = File(...),
    doc_type: Optional[str] = Form("Lab Report")
):
    result = ocr_engine.extract_document(doc_type, file.filename)
    return result
