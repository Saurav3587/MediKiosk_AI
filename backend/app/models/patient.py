import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(50), primary_key=True, index=True)
    token = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False, index=True)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    phone = Column(String(30), nullable=True)
    abha_id = Column(String(50), nullable=True, index=True)
    department = Column(String(50), nullable=False, default="General Medicine")
    language = Column(String(50), default="English")
    
    chief_complaint = Column(Text, nullable=False)
    symptoms = Column(JSON, default=list)
    symptom_duration = Column(String(100), nullable=True)
    symptom_character = Column(String(100), nullable=True)
    
    # Priority Triage
    priority = Column(Boolean, default=False, index=True)
    priority_reason = Column(Text, nullable=True)
    status = Column(String(30), default="Ready", index=True) # Ready, Priority, Processing, Consulting, Completed
    waiting_time = Column(String(30), default="Just now")
    intake_completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # AYUSH Integration
    is_ayush = Column(Boolean, default=False)
    ayush_details = Column(JSON, nullable=True)
    
    # Physician Verification
    verified_by_doctor = Column(Boolean, default=False, index=True)
    verified_at = Column(DateTime, nullable=True)
    verified_doctor_name = Column(String(100), nullable=True)
    doctor_verification_notes = Column(Text, nullable=True)
    consultation_started = Column(Boolean, default=False)
    consultation_started_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    clinical_history = relationship("ClinicalHistory", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    documents = relationship("MedicalDocument", back_populates="patient", cascade="all, delete-orphan")
    timeline = relationship("TimelineEvent", back_populates="patient", cascade="all, delete-orphan")
    transcript = relationship("TranscriptTurn", back_populates="patient", cascade="all, delete-orphan")

class ClinicalHistory(Base):
    __tablename__ = "clinical_histories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(50), ForeignKey("patients.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    chief_complaint = Column(Text, nullable=True)
    hpi = Column(Text, nullable=True)
    past_medical_history = Column(Text, nullable=True)
    past_surgical_history = Column(Text, nullable=True)
    current_medications = Column(JSON, default=list)
    allergies = Column(JSON, default=list)
    family_history = Column(Text, nullable=True)
    personal_history = Column(Text, nullable=True)
    lifestyle = Column(JSON, default=dict)
    review_of_systems = Column(JSON, default=dict)
    ai_summary = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="clinical_history")

class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id = Column(String(50), primary_key=True, index=True)
    patient_id = Column(String(50), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False) # Prescription, Lab Report, Discharge Summary, Imaging Report
    date = Column(String(50), nullable=True)
    hospital = Column(String(150), nullable=True)
    doctor = Column(String(100), nullable=True)
    confidence = Column(Float, default=95.0)
    extracted_data = Column(JSON, default=dict)
    verified = Column(Boolean, default=False)
    preview_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="documents")

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(50), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    year = Column(String(10), nullable=False)
    date = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False)
    facility = Column(String(150), nullable=True)
    summary = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="timeline")

class TranscriptTurn(Base):
    __tablename__ = "transcript_turns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(50), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    speaker = Column(String(20), nullable=False) # assistant, patient
    text = Column(Text, nullable=False)
    input_mode = Column(String(20), nullable=True) # voice, touch, text
    time = Column(String(20), nullable=True)

    patient = relationship("Patient", back_populates="transcript")
