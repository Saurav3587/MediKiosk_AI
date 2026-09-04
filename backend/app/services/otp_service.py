import random
import time
from typing import Dict, Tuple
from app.services.fast2sms_provider import Fast2SMSProvider

_fast2sms = Fast2SMSProvider()

# In-memory storage for active OTPs: { "clean_phone": (code_str, expires_at_timestamp) }
_active_otps: Dict[str, Tuple[str, float]] = {}
OTP_EXPIRY_SECONDS = 600  # 10 minutes


def generate_otp_code() -> str:
    """Generate a random 6-digit numeric OTP."""
    return f"{random.randint(100000, 999999)}"


async def send_otp(phone: str) -> Tuple[str, bool, str]:
    """Generates a 6-digit OTP and dispatches it via Fast2SMS.
    
    Returns:
        (dev_code_if_not_live, is_live_delivered, status_message)
    """
    clean_phone = "".join(filter(str.isdigit, phone))[-10:]
    code = generate_otp_code()
    expires_at = time.time() + OTP_EXPIRY_SECONDS
    _active_otps[clean_phone] = (code, expires_at)

    is_live, status_msg = _fast2sms.send_sms_otp(clean_phone, code)

    if not is_live:
        print("\n" + "=" * 60)
        print(f"  [FAST2SMS OTP NOTICE] Phone: +91 {clean_phone} | Code: {code}")
        print(f"  Fast2SMS Gateway Status: {status_msg}")
        print("=" * 60 + "\n")
        # Return code for test/dev fallback alongside the exact Fast2SMS status
        return code, False, status_msg

    return "", True, status_msg


async def verify_otp(phone: str, code: str) -> bool:
    """Strictly validates the OTP code for the given phone number."""
    clean_phone = "".join(filter(str.isdigit, phone))[-10:]
    entered_code = str(code).strip()

    if not entered_code or clean_phone not in _active_otps:
        return False

    saved_code, expires_at = _active_otps[clean_phone]

    if time.time() > expires_at:
        del _active_otps[clean_phone]
        return False

    if entered_code == saved_code:
        # Single use code: invalidate after successful verification
        del _active_otps[clean_phone]
        return True

    return False
