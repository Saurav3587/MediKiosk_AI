import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.patient import Patient, ClinicalHistory, MedicalDocument, TimelineEvent, TranscriptTurn
from app.schemas.patient import PatientIntakeSubmission, PatientResponse
from app.services.ai_engine import ai_engine

router = APIRouter(prefix="/patients", tags=["Patients"])

def format_patient_response(p: Patient) -> dict:
    history_data = None
    if p.clinical_history:
        history_data = {
            "chiefComplaint": p.clinical_history.chief_complaint,
            "hpi": p.clinical_history.hpi,
            "pastMedicalHistory": p.clinical_history.past_medical_history,
            "pastSurgicalHistory": p.clinical_history.past_surgical_history,
            "currentMedications": p.clinical_history.current_medications or [],
            "allergies": p.clinical_history.allergies or [],
            "familyHistory": p.clinical_history.family_history,
            "personalHistory": p.clinical_history.personal_history,
            "lifestyle": p.clinical_history.lifestyle or {},
            "reviewOfSystems": p.clinical_history.review_of_systems or {},
            "aiSummary": p.clinical_history.ai_summary,
        }

    docs_data = [
        {
            "id": d.id,
            "name": d.name,
            "type": d.type,
            "date": d.date,
            "hospital": d.hospital,
            "doctor": d.doctor,
            "confidence": d.confidence,
            "extractedData": d.extracted_data or {},
            "verified": d.verified,
            "previewUrl": d.preview_url
        } for d in p.documents
    ]

    timeline_data = [
        {
            "year": t.year,
            "date": t.date,
            "title": t.title,
            "type": t.type,
            "facility": t.facility,
            "summary": t.summary
        } for t in p.timeline
    ]

    transcript_data = [
        {
            "speaker": tr.speaker,
            "text": tr.text,
            "inputMode": tr.input_mode,
            "time": tr.time
        } for tr in p.transcript
    ]

    return {
        "id": p.id,
        "token": p.token,
        "name": p.name,
        "age": p.age,
        "gender": p.gender,
        "phone": p.phone,
        "abhaId": p.abha_id,
        "department": p.department,
        "language": p.language,
        "chiefComplaint": p.chief_complaint,
        "symptoms": p.symptoms or [],
        "symptomDuration": p.symptom_duration,
        "priority": p.priority,
        "priorityReason": p.priority_reason,
        "status": p.status,
        "waitingTime": p.waiting_time,
        "intakeCompletedAt": p.intake_completed_at.isoformat() if p.intake_completed_at else None,
        "isAyush": p.is_ayush,
        "ayushDetails": p.ayush_details,
        "verifiedByDoctor": p.verified_by_doctor,
        "verifiedAt": p.verified_at.isoformat() if p.verified_at else None,
        "verifiedDoctorName": p.verified_doctor_name,
        "doctorVerificationNotes": p.doctor_verification_notes,
        "consultationStarted": p.consultation_started,
        "clinicalHistory": history_data,
        "aiSummary": p.clinical_history.ai_summary if p.clinical_history else None,
        "documents": docs_data,
        "timeline": timeline_data,
        "transcript": transcript_data
    }

@router.post("/intake", response_model=PatientResponse)
def submit_patient_intake(payload: PatientIntakeSubmission, db: Session = Depends(get_db)):
    patient_id = payload.id or f"P-{uuid.uuid4().hex[:6]}"
    token_str = payload.token or f"A-{100 + db.query(Patient).count() + 1}"

    existing = db.query(Patient).filter((Patient.id == patient_id) | (Patient.token == token_str)).first()
    if existing:
        db.delete(existing)
        db.commit()

    patient = Patient(
        id=patient_id,
        token=token_str,
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        phone=payload.phone,
        abha_id=payload.abhaId,
        department=payload.department or "General Medicine",
        language=payload.language or "English",
        chief_complaint=payload.chiefComplaint,
        symptoms=payload.symptoms,
        symptom_duration=payload.symptomDuration,
        symptom_character=payload.symptomCharacter,
        priority=payload.priority or False,
        priority_reason=payload.priorityReason,
        status="Priority" if payload.priority else "Ready",
        waiting_time="Just now",
        intake_completed_at=datetime.datetime.utcnow(),
        is_ayush=payload.isAyush or False,
        ayush_details=payload.ayushDetails,
        verified_by_doctor=False
    )
    db.add(patient)
    db.flush()

    # Add clinical history
    if payload.clinicalHistory:
        ch = payload.clinicalHistory
        history = ClinicalHistory(
            patient_id=patient.id,
            chief_complaint=ch.chiefComplaint or payload.chiefComplaint,
            hpi=ch.hpi,
            past_medical_history=ch.pastMedicalHistory,
            past_surgical_history=ch.pastSurgicalHistory,
            current_medications=ch.currentMedications,
            allergies=ch.allergies,
            family_history=ch.familyHistory,
            personal_history=ch.personalHistory,
            lifestyle=ch.lifestyle,
            review_of_systems=ch.reviewOfSystems,
            ai_summary=payload.aiSummary or ch.aiSummary
        )
        db.add(history)

    # Add documents
    if payload.documents:
        for doc in payload.documents:
            db.add(MedicalDocument(
                id=doc.id or f"doc-{uuid.uuid4().hex[:8]}",
                patient_id=patient.id,
                name=doc.name,
                type=doc.type,
                date=doc.date,
                hospital=doc.hospital,
                confidence=doc.confidence or 95.0,
                extracted_data=doc.extractedData,
                verified=doc.verified or False,
                preview_url=doc.previewUrl
            ))

    # Add timeline
    if payload.timeline:
        for ev in payload.timeline:
            db.add(TimelineEvent(
                patient_id=patient.id,
                year=ev.year,
                date=ev.date,
                title=ev.title,
                type=ev.type,
                facility=ev.facility,
                summary=ev.summary
            ))

    # Add transcript
    if payload.transcript:
        for tr in payload.transcript:
            db.add(TranscriptTurn(
                patient_id=patient.id,
                speaker=tr.speaker,
                text=tr.text,
                input_mode=tr.inputMode,
                time=tr.time
            ))

    db.commit()
    db.refresh(patient)
    return format_patient_response(patient)

@router.get("/{id_or_token}", response_model=PatientResponse)
def get_patient(id_or_token: str, db: Session = Depends(get_db)):
    clean_query = id_or_token.strip()
    patient = db.query(Patient).filter(
        (Patient.id == clean_query) |
        (Patient.token == clean_query) |
        (Patient.phone == clean_query) |
        (Patient.abha_id == clean_query)
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return format_patient_response(patient)

@router.get("", response_model=List[PatientResponse])
def list_patients(
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    if department and department != "all":
        query = query.filter(Patient.department.ilike(f"%{department}%"))
    if status and status != "all":
        query = query.filter(Patient.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Patient.name.ilike(s)) |
            (Patient.token.ilike(s)) |
            (Patient.chief_complaint.ilike(s)) |
            (Patient.abha_id.ilike(s))
        )
    
    patients = query.order_by(Patient.priority.desc(), Patient.created_at.desc()).all()
    return [format_patient_response(p) for p in patients]
