from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional

from app.schemas.doctor import DoctorLogin, DoctorLoginResponse, DoctorRead, DoctorCreate
from app.crud.doctor import get_doctor_by_email, get_doctor_by_id, create_doctor
from app.auth import verify_password, create_access_token, decode_access_token
from app.database import get_db

router = APIRouter(prefix="/doctor", tags=["Doctor Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/doctor/login", auto_error=False)

def get_current_doctor(
    token: Optional[str] = Depends(oauth2_scheme),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    # Support Authorization header directly or via OAuth2 bearer
    jwt_token = token
    if not jwt_token and authorization:
        if authorization.lower().startswith("bearer "):
            jwt_token = authorization[7:].strip()
        else:
            jwt_token = authorization.strip()

    if not jwt_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(jwt_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    doctor_id: str = payload.get("sub")
    if not doctor_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    doctor = get_doctor_by_id(db, doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Doctor profile not found in database",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor account is inactive",
        )

    return doctor

@router.post("/login", response_model=DoctorLoginResponse)
def login_doctor(payload: DoctorLogin, db: Session = Depends(get_db)):
    """
    Authenticate physician against persistent database records.
    Returns signed JWT access token and complete physician profile.
    """
    email = payload.email.strip().lower()
    doctor = get_doctor_by_email(db, email)

    if not doctor or not verify_password(payload.password, doctor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid doctor email or password. Please verify credentials."
        )

    access_token = create_access_token(data={"sub": doctor.id, "email": doctor.email})
    return DoctorLoginResponse(
        access_token=access_token,
        token_type="bearer",
        doctor=DoctorRead.from_orm(doctor) if hasattr(DoctorRead, "from_orm") else DoctorRead.model_validate(doctor)
    )

@router.get("/me", response_model=DoctorRead)
def get_current_doctor_profile(current_doctor = Depends(get_current_doctor)):
    """
    Get authenticated physician profile from active JWT session.
    """
    return current_doctor

@router.post("/register", response_model=DoctorLoginResponse, status_code=status.HTTP_201_CREATED)
def register_doctor(payload: DoctorCreate, db: Session = Depends(get_db)):
    """
    Register a new physician in the hospital database.
    """
    existing = get_doctor_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Doctor with this email already exists")

    new_doc = create_doctor(db, payload)
    access_token = create_access_token(data={"sub": new_doc.id, "email": new_doc.email})
    return DoctorLoginResponse(
        access_token=access_token,
        token_type="bearer",
        doctor=DoctorRead.from_orm(new_doc) if hasattr(DoctorRead, "from_orm") else DoctorRead.model_validate(new_doc)
    )
