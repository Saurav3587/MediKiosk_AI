from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.otp_service import send_otp, verify_otp

router = APIRouter(prefix="/otp", tags=["Patient OTP Verification (Fast2SMS)"])


class SendOtpRequest(BaseModel):
    phone: str = Field(..., description="10-digit Indian phone number")


class SendOtpResponse(BaseModel):
    success: bool
    message: str
    code: str = ""
    is_live: bool


class VerifyOtpRequest(BaseModel):
    phone: str = Field(..., description="10-digit Indian phone number")
    code: str = Field(..., description="6-digit verification code")


class VerifyOtpResponse(BaseModel):
    success: bool
    message: str


@router.post("/send", response_model=SendOtpResponse)
async def send_otp_endpoint(request: SendOtpRequest):
    clean_phone = "".join(filter(str.isdigit, request.phone))[-10:]
    if len(clean_phone) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid 10-digit mobile number is required.",
        )

    code, is_live, status_msg = await send_otp(clean_phone)
    return SendOtpResponse(
        success=True,
        message="OTP dispatched via Fast2SMS live SMS" if is_live else status_msg,
        code=code,
        is_live=is_live,
    )


@router.post("/verify", response_model=VerifyOtpResponse)
async def verify_otp_endpoint(request: VerifyOtpRequest):
    clean_phone = "".join(filter(str.isdigit, request.phone))[-10:]
    clean_code = request.code.strip()

    if len(clean_phone) < 10 or len(clean_code) < 4:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Valid phone number and verification code are required.",
        )

    is_valid = await verify_otp(clean_phone, clean_code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please request a new code.",
        )

    return VerifyOtpResponse(
        success=True,
        message="Phone number successfully verified.",
    )
