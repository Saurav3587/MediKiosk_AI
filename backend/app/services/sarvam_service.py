import os
import urllib.request
import urllib.parse
import json
import uuid
from typing import Dict, Any, Optional
from app.config import settings


class SarvamService:
    """Service client for Sarvam AI sovereign Indian language platform.
    Provides Speech-to-Text (Saaras ASR), Text-to-Speech (Bulbul TTS), and Translation.
    """

    BASE_URL = "https://api.sarvam.ai"

    def __init__(self):
        self.api_key = os.getenv("SARVAM_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(
            self.api_key
            and not self.api_key.startswith("your_")
            and len(self.api_key.strip()) > 8
        )

    def speech_to_text(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language_code: str = "unknown",
        model: str = "saaras:v3",
    ) -> Dict[str, Any]:
        """Transcribes Indian conversational speech (Hindi, Hinglish, Tamil, etc.) using Sarvam Saaras."""
        if not self.is_configured():
            return {
                "success": False,
                "error": "Sarvam AI API key is not configured in .env",
                "transcript": "",
            }

        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        content_type = f"multipart/form-data; boundary={boundary}"

        # Construct multipart body
        body_parts = []

        # Model field
        body_parts.append(f"--{boundary}\r\n".encode("utf-8"))
        body_parts.append(b'Content-Disposition: form-data; name="model"\r\n\r\n')
        body_parts.append(f"{model}\r\n".encode("utf-8"))

        # Language code field (optional, 'unknown' for auto-detection)
        if language_code:
            body_parts.append(f"--{boundary}\r\n".encode("utf-8"))
            body_parts.append(b'Content-Disposition: form-data; name="language_code"\r\n\r\n')
            body_parts.append(f"{language_code}\r\n".encode("utf-8"))

        # Audio file field
        body_parts.append(f"--{boundary}\r\n".encode("utf-8"))
        body_parts.append(
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8")
        )
        mime_type = "audio/webm" if filename.endswith(".webm") else ("audio/mp4" if filename.endswith(".mp4") else "audio/wav")
        body_parts.append(f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8"))
        body_parts.append(audio_bytes)
        body_parts.append(b"\r\n")

        # Closing boundary
        body_parts.append(f"--{boundary}--\r\n".encode("utf-8"))
        body = b"".join(body_parts)

        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": content_type,
        }

        try:
            req = urllib.request.Request(
                f"{self.BASE_URL}/speech-to-text",
                data=body,
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=20) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                transcript = res_data.get("transcript", "")
                detected_lang = res_data.get("language_code", language_code)
                return {
                    "success": True,
                    "transcript": transcript,
                    "language_code": detected_lang,
                }
        except urllib.error.HTTPError as e:
            try:
                err_json = json.loads(e.read().decode("utf-8"))
                err_msg = err_json.get("message", f"HTTP {e.code} Error")
            except Exception:
                err_msg = f"HTTP {e.code} Error"
            return {"success": False, "error": err_msg, "transcript": ""}
        except Exception as ex:
            return {"success": False, "error": str(ex), "transcript": ""}

    def text_to_speech(
        self,
        text: str,
        target_language_code: str = "hi-IN",
        speaker: str = "ritu",
    ) -> Dict[str, Any]:
        """Synthesizes natural Indian regional speech using Sarvam Bulbul TTS."""
        if not self.is_configured():
            return {
                "success": False,
                "error": "Sarvam AI API key is not configured in .env",
                "audio_base64": "",
            }

        payload = json.dumps({
            "inputs": [text],
            "target_language_code": target_language_code,
            "speaker": speaker,
            "model": "bulbul:v3",
        }).encode("utf-8")

        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json",
        }

        try:
            req = urllib.request.Request(
                f"{self.BASE_URL}/text-to-speech",
                data=payload,
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                audios = res_data.get("audios", [])
                audio_base64 = audios[0] if audios else ""
                return {
                    "success": True,
                    "audio_base64": audio_base64,
                    "format": "audio/wav;base64",
                }
        except urllib.error.HTTPError as e:
            try:
                err_json = json.loads(e.read().decode("utf-8"))
                err_msg = err_json.get("message", f"HTTP {e.code} Error")
            except Exception:
                err_msg = f"HTTP {e.code} Error"
            return {"success": False, "error": err_msg, "audio_base64": ""}
        except Exception as ex:
            return {"success": False, "error": str(ex), "audio_base64": ""}

    def translate(
        self,
        text: str,
        source_language_code: str = "hi-IN",
        target_language_code: str = "en-IN",
    ) -> Dict[str, Any]:
        """Translates regional Indian clinical descriptions into medical English."""
        if not self.is_configured():
            return {
                "success": False,
                "error": "Sarvam AI API key is not configured in .env",
                "translated_text": text,
            }

        payload = json.dumps({
            "input": text,
            "source_language_code": source_language_code,
            "target_language_code": target_language_code,
            "mode": "formal",
            "model": "mayura:v1",
        }).encode("utf-8")

        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json",
        }

        try:
            req = urllib.request.Request(
                f"{self.BASE_URL}/translate",
                data=payload,
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return {
                    "success": True,
                    "translated_text": res_data.get("translated_text", text),
                }
        except urllib.error.HTTPError as e:
            try:
                err_json = json.loads(e.read().decode("utf-8"))
                err_msg = err_json.get("message", f"HTTP {e.code} Error")
            except Exception:
                err_msg = f"HTTP {e.code} Error"
            return {"success": False, "error": err_msg, "translated_text": text}
        except Exception as ex:
            return {"success": False, "error": str(ex), "translated_text": text}

    def chat_completion(
        self,
        messages: list,
        model: str = "sarvam-105b-conversations",
        temperature: float = 0.3,
        max_tokens: int = 350,
    ) -> Dict[str, Any]:
        """Runs conversational LLM chat completion using Sarvam AI."""
        if not self.is_configured():
            return {
                "success": False,
                "error": "Sarvam AI API key is not configured in .env",
                "content": "",
            }

        payload = json.dumps({
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }).encode("utf-8")

        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json",
        }

        try:
            req = urllib.request.Request(
                f"{self.BASE_URL}/v1/chat/completions",
                data=payload,
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=20) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                choices = res_data.get("choices", [])
                content = choices[0]["message"]["content"].strip() if choices else ""
                return {
                    "success": True,
                    "content": content,
                    "model": model,
                }
        except urllib.error.HTTPError as e:
            try:
                err_json = json.loads(e.read().decode("utf-8"))
                err_msg = err_json.get("error", {}).get("message", f"HTTP {e.code} Error")
            except Exception:
                err_msg = f"HTTP {e.code} Error"
            return {"success": False, "error": err_msg, "content": ""}
        except Exception as ex:
            return {"success": False, "error": str(ex), "content": ""}

