import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.patient import Patient, ClinicalHistory
from app.schemas.patient import PatientResponse, VerificationRequest
from app.schemas.history import HistoryUpdateSchema
from app.routers.patients import format_patient_response
from app.routers.doctor_auth import get_current_doctor

router = APIRouter(prefix="/doctor", tags=["Doctor Workspace"])

@router.get("/queue", response_model=List[PatientResponse])
def get_doctor_queue(current_doctor = Depends(get_current_doctor), db: Session = Depends(get_db)):
    patients = db.query(Patient).order_by(Patient.priority.desc(), Patient.created_at.desc()).all()
    return [format_patient_response(p) for p in patients]

@router.get("/priority", response_model=List[PatientResponse])
def get_priority_queue(current_doctor = Depends(get_current_doctor), db: Session = Depends(get_db)):
    priority_patients = db.query(Patient).filter(Patient.priority == True).order_by(Patient.created_at.desc()).all()
    return [format_patient_response(p) for p in priority_patients]

@router.post("/verify/{patient_id}", response_model=PatientResponse)
def verify_patient_history(patient_id: str, payload: VerificationRequest, current_doctor = Depends(get_current_doctor), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter((Patient.id == patient_id) | (Patient.token == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.verified_by_doctor = True
    patient.verified_at = datetime.datetime.utcnow()
    patient.verified_doctor_name = payload.doctorName or "Dr. Arun Sharma"
    patient.doctor_verification_notes = payload.notes

    db.commit()
    db.refresh(patient)
    return format_patient_response(patient)

@router.post("/consult/{patient_id}", response_model=PatientResponse)
def start_consultation(patient_id: str, current_doctor = Depends(get_current_doctor), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter((Patient.id == patient_id) | (Patient.token == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.consultation_started = True
    patient.consultation_started_at = datetime.datetime.utcnow()
    patient.status = "Consulting"

    db.commit()
    db.refresh(patient)
    return format_patient_response(patient)

@router.put("/history/{patient_id}", response_model=PatientResponse)
def update_clinical_history(patient_id: str, payload: HistoryUpdateSchema, current_doctor = Depends(get_current_doctor), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter((Patient.id == patient_id) | (Patient.token == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not patient.clinical_history:
        patient.clinical_history = ClinicalHistory(patient_id=patient.id)

    if payload.chiefComplaint:
        patient.clinical_history.chief_complaint = payload.chiefComplaint
    if payload.hpi:
        patient.clinical_history.hpi = payload.hpi
    if payload.pastMedicalHistory:
        patient.clinical_history.past_medical_history = payload.pastMedicalHistory
    if payload.pastSurgicalHistory:
        patient.clinical_history.past_surgical_history = payload.pastSurgicalHistory
    if payload.currentMedications is not None:
        patient.clinical_history.current_medications = payload.currentMedications
    if payload.allergies is not None:
        patient.clinical_history.allergies = payload.allergies
    if payload.familyHistory:
        patient.clinical_history.family_history = payload.familyHistory
    if payload.aiSummary:
        patient.clinical_history.ai_summary = payload.aiSummary

    db.commit()
    db.refresh(patient)
    return format_patient_response(patient)
