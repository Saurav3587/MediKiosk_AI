import os
import urllib.request
import urllib.parse
import json
from typing import Tuple
from app.config import settings


class Fast2SMSProvider:
    """Fast2SMS Gateway Service for direct SMS delivery to Indian (+91) phone numbers."""

    def __init__(self):
        self.api_key = os.getenv("FAST2SMS_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.api_key and not self.api_key.startswith("your_"))

    def send_sms_otp(self, clean_phone: str, code: str) -> Tuple[bool, str]:
        """Dispatches real SMS to a 10-digit Indian phone number via Fast2SMS API.
        
        Returns:
            (is_delivered_live: bool, status_message: str)
        """
        if not self.is_configured():
            return False, "Fast2SMS API key is not configured in .env"

        headers = {
            "Authorization": self.api_key,
            "authorization": self.api_key,
            "Content-Type": "application/x-www-form-urlencoded",
        }

        # Attempt 1: Fast2SMS dedicated OTP route
        try:
            payload = urllib.parse.urlencode({
                "route": "otp",
                "variables_values": code,
                "numbers": clean_phone,
            }).encode("utf-8")

            req = urllib.request.Request(
                "https://www.fast2sms.com/dev/bulkV2",
                data=payload,
                headers=headers,
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                if res_data.get("return") is True:
                    print(f"[Fast2SMS] Successfully dispatched live SMS OTP to +91 {clean_phone}")
                    return True, "SMS dispatched via Fast2SMS live gateway"
                else:
                    msg = res_data.get("message", ["Fast2SMS dispatch failed"])
                    msg_text = msg[0] if isinstance(msg, list) else str(msg)
                    print(f"[Fast2SMS] Gateway response: {msg_text}")
                    return False, msg_text
        except urllib.error.HTTPError as e:
            try:
                err_body = json.loads(e.read().decode("utf-8"))
                err_msg = err_body.get("message", f"HTTP {e.code} Error")
            except Exception:
                err_msg = f"HTTP {e.code} Error"
            print(f"[Fast2SMS] OTP Route Error ({e.code}): {err_msg}")
        except Exception as ex:
            err_msg = str(ex)
            print(f"[Fast2SMS] Connection error: {ex}")

        # Attempt 2: Fast2SMS Quick Route fallback
        try:
            payload_q = urllib.parse.urlencode({
                "route": "q",
                "message": f"Your MediKiosk clinical verification code is {code}. Valid for 10 minutes.",
                "language": "english",
                "numbers": clean_phone,
            }).encode("utf-8")

            req_q = urllib.request.Request(
                "https://www.fast2sms.com/dev/bulkV2",
                data=payload_q,
                headers=headers,
            )
            with urllib.request.urlopen(req_q, timeout=5) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                if res_data.get("return") is True:
                    print(f"[Fast2SMS] Dispatched via Quick route to +91 {clean_phone}")
                    return True, "SMS dispatched via Fast2SMS live gateway"
                else:
                    msg = res_data.get("message", ["Dispatch failed"])
                    msg_text = msg[0] if isinstance(msg, list) else str(msg)
                    return False, msg_text
        except urllib.error.HTTPError as e:
            try:
                err_body = json.loads(e.read().decode("utf-8"))
                err_msg = err_body.get("message", f"Fast2SMS error {e.code}")
            except Exception:
                err_msg = f"Fast2SMS HTTP {e.code}"
            return False, err_msg
        except Exception as ex:
            return False, str(ex)
