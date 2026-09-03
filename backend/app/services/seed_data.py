import datetime
from sqlalchemy.orm import Session
from app.models.patient import Patient, ClinicalHistory, MedicalDocument, TimelineEvent, TranscriptTurn

def seed_initial_patients(db: Session):
    """
    Real clinical intake mode:
    No mock patients seeded. OPD queue begins completely clean for live real patient registration.
    """
    pass


def seed_initial_doctors(db: Session):
    from app.models.doctor import Doctor
    from app.auth import get_password_hash

    existing_count = db.query(Doctor).count()
    if existing_count > 0:
        return

    print("Seeding initial MediKiosk hospital physicians into database...")
    demo_doctors = [
        Doctor(
            id="DOC-8401",
            name="Dr. Arun Sharma",
            email="dr.arun@medikiosk.in",
            hashed_password=get_password_hash("doctor123"),
            title="MD, Senior Consultant Physician",
            department="General Medicine",
            opd_room="OPD Room 14 (Ground Floor)",
            hospital="Apex Super Specialty Hospital",
            is_active=True
        ),
        Doctor(
            id="DOC-8402",
            name="Dr. K. S. Murthy",
            email="dr.murthy@medikiosk.in",
            hashed_password=get_password_hash("doctor123"),
            title="MD, DM (Cardiology), Senior Consultant",
            department="Cardiology",
            opd_room="OPD Room 08 (First Floor)",
            hospital="City Heart & Care Clinic, New Delhi",
            is_active=True
        ),
        Doctor(
            id="DOC-8403",
            name="Dr. Priya Nair",
            email="dr.priya@medikiosk.in",
            hashed_password=get_password_hash("doctor123"),
            title="MD, DNB (Pediatrics)",
            department="Pediatrics",
            opd_room="OPD Room 04 (Ground Floor)",
            hospital="Apex Super Specialty Hospital",
            is_active=True
        ),
        Doctor(
            id="DOC-8404",
            name="Dr. Rajesh Vaidya",
            email="dr.rajesh@medikiosk.in",
            hashed_password=get_password_hash("doctor123"),
            title="BAMS, MD (Ayurveda Chikitsa)",
            department="AYUSH / Ayurveda",
            opd_room="AYUSH Wing Room 02",
            hospital="Apex Super Specialty Hospital",
            is_active=True
        )
    ]

    for d in demo_doctors:
        db.add(d)

    db.commit()
    print("Physician database seeding completed successfully.")
