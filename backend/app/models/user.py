import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(30), default="doctor", index=True) # doctor, admin, triage_nurse
    department = Column(String(100), default="General Medicine")
    hospital = Column(String(150), default="Apex Super Specialty Hospital")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
