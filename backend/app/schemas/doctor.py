from pydantic import BaseModel, Field
from typing import Optional

class DoctorBase(BaseModel):
    name: str
    email: str
    title: Optional[str] = "MD, Consultant Physician"
    department: Optional[str] = "General Medicine"
    opd_room: Optional[str] = "OPD Room 14"
    hospital: Optional[str] = "Apex Super Specialty Hospital"

class DoctorCreate(DoctorBase):
    password: str = Field(..., min_length=4)

class DoctorLogin(BaseModel):
    email: str
    password: str

class DoctorRead(DoctorBase):
    id: str
    is_active: bool = True

    class Config:
        from_attributes = True

class DoctorLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    doctor: DoctorRead
