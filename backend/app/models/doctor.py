from sqlalchemy import Column, String, Boolean
from app.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String, primary_key=True, index=True)  # e.g. "DOC-1234"
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    title = Column(String, default="MD, Consultant Physician")
    department = Column(String, default="General Medicine")
    opd_room = Column(String, default="OPD Room 14")
    hospital = Column(String, default="Apex Super Specialty Hospital")
    is_active = Column(Boolean, default=True)
