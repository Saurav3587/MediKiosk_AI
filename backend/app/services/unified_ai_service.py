import os
import json
import base64
import io
import wave
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional, Tuple


from pathlib import Path
from dotenv import load_dotenv

root_env = Path(__file__).resolve().parent.parent.parent / ".env"
backend_env = Path(__file__).resolve().parent.parent / ".env"


class UnifiedAIService:
    """Unified Multi-Provider AI Architecture for MediKiosk.
    Combines:
      - Brain (Clinical LLM): Google Gemini (Gemini 2.0 Flash) -> OpenAI (GPT-4o-mini) -> Sarvam AI (105B)
      - Voice (TTS): ElevenLabs (Multilingual Human Voice) -> OpenAI TTS -> Sarvam Bulbul:v3
      - Ear (ASR): OpenAI Whisper -> Sarvam Saaras -> Browser Web Speech API
    """

    def __init__(self):
        self.reload_keys()

    def reload_keys(self):
        if backend_env.exists():
            load_dotenv(backend_env, override=True)
        elif root_env.exists():
            load_dotenv(root_env, override=True)

        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.elevenlabs_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
        self.elevenlabs_voice = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM").strip()
        self.sarvam_key = os.getenv("SARVAM_API_KEY", "").strip()

    def get_provider_status(self) -> Dict[str, Any]:
        self.reload_keys()
        return {
            "gemini": bool(self.gemini_key and not self.gemini_key.startswith("your_")),
            "openai": bool(self.openai_key and not self.openai_key.startswith("your_")),
            "elevenlabs": bool(self.elevenlabs_key and not self.elevenlabs_key.startswith("your_")),
            "sarvam": bool(self.sarvam_key and not self.sarvam_key.startswith("your_")),
        }

    # =========================================================================
    # 1. BRAIN (Conversational Clinical LLM)
    # =========================================================================
    def generate_chat_response(
        self,
        system_prompt: str,
        user_message: str,
        history: List[Dict[str, str]] = None,
        language: str = "hi"
    ) -> Tuple[str, str]:
        """Generates clinical intake reply.
        Returns (content, provider_used)
        """
        self.reload_keys()

        # 1. Try Google Gemini (Gemini 2.0 Flash / 1.5 Flash)
        if self.gemini_key and not self.gemini_key.startswith("your_"):
            reply = self._call_gemini(system_prompt, user_message, history)
            if reply:
                return reply, "Google Gemini Flash"

        # 2. Try OpenAI GPT-4o-mini
        if self.openai_key and not self.openai_key.startswith("your_"):
            reply = self._call_openai_chat(system_prompt, user_message, history)
            if reply:
                return reply, "OpenAI GPT-4o-mini"

        # 3. Try Sarvam AI 105B Conversations
        if self.sarvam_key and not self.sarvam_key.startswith("your_"):
            reply = self._call_sarvam_chat(system_prompt, user_message, history)
            if reply:
                return reply, "Sarvam AI (sarvam-105b-conversations)"

        # 4. Fallback Rule-Based Response
        return "", "Deterministic Clinical Engine"

    def _call_gemini(self, system_prompt: str, user_message: str, history: List[Dict[str, str]] = None) -> Optional[str]:
        contents = []
        if history:
            for h in history[-4:]:
                role = "model" if h.get("speaker") == "assistant" or h.get("role") == "assistant" else "user"
                contents.append({"role": role, "parts": [{"text": h.get("content") or h.get("text") or ""}]})
        contents.append({"role": "user", "parts": [{"text": user_message}]})

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 800,
            }
        }

        gemini_models = [
            "models/gemini-3.6-flash",
            "models/gemini-flash-latest",
            "models/gemini-flash-lite-latest",
            "models/gemini-pro-latest",
            "models/gemini-2.5-flash",
        ]
        for model in gemini_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={self.gemini_key}"
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=12) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        text_parts = [p.get("text", "") for p in parts if "text" in p and not p.get("thought", False)]
                        if text_parts:
                            return "\n".join(text_parts).strip()
            except Exception:
                continue
        return None

    def _call_openai_chat(self, system_prompt: str, user_message: str, history: List[Dict[str, str]] = None) -> Optional[str]:
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for h in history[-4:]:
                role = "assistant" if h.get("speaker") == "assistant" or h.get("role") == "assistant" else "user"
                messages.append({"role": role, "content": h.get("content") or h.get("text") or ""})
        messages.append({"role": "user", "content": user_message})

        payload = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 200,
        }

        try:
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                choices = data.get("choices", [])
                if choices:
                    return choices[0]["message"]["content"].strip()
        except Exception:
            return None
        return None

    def _call_sarvam_chat(self, system_prompt: str, user_message: str, history: List[Dict[str, str]] = None) -> Optional[str]:
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for h in history[-4:]:
                role = "assistant" if h.get("speaker") == "assistant" or h.get("role") == "assistant" else "user"
                messages.append({"role": role, "content": h.get("content") or h.get("text") or ""})
        messages.append({"role": "user", "content": user_message})

        payload = {
            "model": "sarvam-105b-conversations",
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 180,
        }

        try:
            req = urllib.request.Request(
                "https://api.sarvam.ai/v1/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "api-subscription-key": self.sarvam_key,
                    "Content-Type": "application/json",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                choices = data.get("choices", [])
                if choices:
                    return choices[0]["message"]["content"].strip()
        except Exception:
            return None
        return None

    # =========================================================================
    # 2. VOICE OUTPUT (Text-to-Speech / TTS)
    # =========================================================================
    def synthesize_speech(self, text: str, language_code: str = "hi-IN") -> Tuple[str, str]:
        """Synthesizes high-fidelity voice.
        Returns (base64_audio, provider_used)
        """
        self.reload_keys()

        # 1. Try ElevenLabs (Undisputed #1 realistic human voice)
        if self.elevenlabs_key and not self.elevenlabs_key.startswith("your_"):
            audio_b64 = self._call_elevenlabs_tts(text)
            if audio_b64:
                return audio_b64, "ElevenLabs (Multilingual Human Voice)"

        # 2. Try OpenAI TTS (tts-1-hd with nova/alloy)
        if self.openai_key and not self.openai_key.startswith("your_"):
            audio_b64 = self._call_openai_tts(text)
            if audio_b64:
                return audio_b64, "OpenAI TTS (tts-1-hd)"

        # 3. Try Gemini Native Voice (gemini-2.5-flash-preview-tts)
        if self.gemini_key and not self.gemini_key.startswith("your_"):
            audio_b64 = self._call_gemini_tts(text)
            if audio_b64:
                return audio_b64, "Google Gemini Audio Engine"

        # 4. Try Sarvam Bulbul:v3
        if self.sarvam_key and not self.sarvam_key.startswith("your_"):
            audio_b64 = self._call_sarvam_tts(text, language_code)
            if audio_b64:
                return audio_b64, "Sarvam Bulbul (bulbul:v3)"

        return "", "Browser Web Speech"

    def _call_elevenlabs_tts(self, text: str) -> Optional[str]:
        voice_id = self.elevenlabs_voice or "21m00Tcm4TlvDq8ikWAM"
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.2,
                "use_speaker_boost": True,
            }
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "xi-api-key": self.elevenlabs_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                audio_bytes = resp.read()
                if audio_bytes:
                    return base64.b64encode(audio_bytes).decode("utf-8")
        except Exception:
            return None
        return None

    def _call_openai_tts(self, text: str) -> Optional[str]:
        payload = {
            "model": "tts-1",
            "input": text,
            "voice": "nova",
            "response_format": "mp3",
        }
        try:
            req = urllib.request.Request(
                "https://api.openai.com/v1/audio/speech",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                audio_bytes = resp.read()
                if audio_bytes:
                    return base64.b64encode(audio_bytes).decode("utf-8")
        except Exception:
            return None
        return None

    def _call_sarvam_tts(self, text: str, target_language_code: str = "hi-IN") -> Optional[str]:
        payload = {
            "inputs": [text],
            "target_language_code": target_language_code,
            "speaker": "ritu",
            "model": "bulbul:v3",
        }
        try:
            req = urllib.request.Request(
                "https://api.sarvam.ai/text-to-speech",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "api-subscription-key": self.sarvam_key,
                    "Content-Type": "application/json",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                audios = data.get("audios", [])
                if audios:
                    return audios[0]
        except Exception:
            return None
        return None

    def _call_gemini_tts(self, text: str) -> Optional[str]:
        """Synthesizes voice using Google Gemini native TTS preview model and converts to WAV."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key={self.gemini_key}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": f"Read the following text aloud: {text}"}]}],
            "generationConfig": {
                "responseModalities": ["AUDIO"]
            }
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                cand = data.get("candidates", [])[0].get("content", {}).get("parts", [])[0]
                raw_pcm_b64 = cand.get("inlineData", {}).get("data")
                if not raw_pcm_b64:
                    return None

                # Convert raw 24kHz 16-bit mono PCM into standard browser-compatible WAV
                raw_pcm = base64.b64decode(raw_pcm_b64)
                wav_buf = io.BytesIO()
                with wave.open(wav_buf, "wb") as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(24000)
                    wf.writeframes(raw_pcm)

                return base64.b64encode(wav_buf.getvalue()).decode("utf-8")
        except Exception:
            return None



unified_ai = UnifiedAIService()
