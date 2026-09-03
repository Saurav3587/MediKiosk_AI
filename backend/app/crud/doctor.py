import datetime
from sqlalchemy.orm import Session
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate
from app.auth import get_password_hash

def get_doctor_by_email(db: Session, email: str):
    if not email:
        return None
    return db.query(Doctor).filter(Doctor.email.ilike(email.strip())).first()

def get_doctor_by_id(db: Session, doctor_id: str):
    return db.query(Doctor).filter(Doctor.id == doctor_id).first()

def create_doctor(db: Session, doctor_in: DoctorCreate, custom_id: str = None):
    doc_id = custom_id or f"DOC-{int(datetime.datetime.utcnow().timestamp())}"
    db_doctor = Doctor(
        id=doc_id,
        name=doctor_in.name,
        email=doctor_in.email.lower().strip(),
        hashed_password=get_password_hash(doctor_in.password),
        title=doctor_in.title or "MD, Consultant Physician",
        department=doctor_in.department or "General Medicine",
        opd_room=doctor_in.opd_room or "OPD Room 14",
        hospital=doctor_in.hospital or "Apex Super Specialty Hospital",
        is_active=True
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor
