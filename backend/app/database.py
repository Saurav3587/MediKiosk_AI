from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Engine configuration with sqlite check_same_thread compatibility
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.models.patient import Patient, ClinicalHistory, MedicalDocument, TimelineEvent, TranscriptTurn
    from app.models.doctor import Doctor
    from app.services.seed_data import seed_initial_patients, seed_initial_doctors
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_initial_patients(db)
        seed_initial_doctors(db)
    finally:
        db.close()
