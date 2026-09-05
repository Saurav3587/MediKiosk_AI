import os
import json
import base64
import io
import wave
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional, Tuple

import socket
from pathlib import Path
from dotenv import load_dotenv, dotenv_values

from app.services.medical_rag_service import medical_rag

# Force IPv4 resolution to prevent 10-15s timeouts on Windows dual-stack network
_orig_getaddrinfo = socket.getaddrinfo
def _getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
    try:
        return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
    except Exception:
        return _orig_getaddrinfo(host, port, family, type, proto, flags)
socket.getaddrinfo = _getaddrinfo_ipv4

root_env = Path(__file__).resolve().parent.parent.parent / ".env"
backend_env = Path(__file__).resolve().parent.parent / ".env"


class UnifiedAIService:
    """Sovereign Indian AI Architecture for MediKiosk.
    Combines:
      - Main Clinical LLM: Sarvam AI (Sarvam-105B / sarvam-105b-conversations)
      - Medical Accuracy: Verified Medical RAG (MoHFW Standard Treatment Guidelines & Emergency Red Flags)
      - Indian Regional Speech (TTS): Sarvam AI Bulbul v3 (Native Indian Spoken Voice)
      - Indian Speech-to-Text (ASR): Sarvam AI Saaras v3 (Hindi, Hinglish & 22 Indian languages)
      - Sovereign Translation: Sarvam AI Mayura v1 (Indian Languages <-> Medical English)
    """

    def __init__(self):
        self.reload_keys()

    def reload_keys(self):
        env_dict = {}
        if backend_env.exists():
            env_dict = dotenv_values(backend_env)
        elif root_env.exists():
            env_dict = dotenv_values(root_env)

        self.sarvam_key = (env_dict.get("SARVAM_API_KEY") if "SARVAM_API_KEY" in env_dict else os.getenv("SARVAM_API_KEY", "")).strip()
        self.openai_key = (env_dict.get("OPENAI_API_KEY") if "OPENAI_API_KEY" in env_dict else os.getenv("OPENAI_API_KEY", "")).strip()
        self.elevenlabs_key = (env_dict.get("ELEVENLABS_API_KEY") if "ELEVENLABS_API_KEY" in env_dict else "").strip()
        self.elevenlabs_voice = (env_dict.get("ELEVENLABS_VOICE_ID") if "ELEVENLABS_VOICE_ID" in env_dict else "21m00Tcm4TlvDq8ikWAM").strip()

    def get_provider_status(self) -> Dict[str, Any]:
        self.reload_keys()
        has_sarvam = bool(self.sarvam_key and not self.sarvam_key.startswith("your_"))
        return {
            "main_llm": "Sarvam AI (Sarvam-105B)",
            "voice_to_text": "Sarvam AI (Saaras v3)",
            "text_to_voice": "Sarvam AI (Bulbul v3)",
            "translation": "Sarvam AI (Mayura v1)",
            "medical_grounding": "Verified Medical RAG (MoHFW STG & Emergency Red-Flag DB)",
            "sarvam": has_sarvam,
            "openai": bool(self.openai_key and not self.openai_key.startswith("your_")),
            "elevenlabs": bool(self.elevenlabs_key and not self.elevenlabs_key.startswith("your_")),
        }

    # =========================================================================
    # 1. BRAIN (Conversational Clinical LLM - Sarvam-105B + Medical RAG)
    # =========================================================================
    def generate_chat_response(
        self,
        system_prompt: str,
        user_message: str,
        history: List[Dict[str, str]] = None,
        language: str = "hi"
    ) -> Tuple[str, str]:
        """Generates clinical intake reply using Sarvam-105B with RAG grounding."""
        self.reload_keys()

        # 1. Primary: Sarvam AI 105B Conversations
        if self.sarvam_key and not self.sarvam_key.startswith("your_"):
            reply = self._call_sarvam_chat(system_prompt, user_message, history)
            if reply:
                return reply, "Sarvam AI (Sarvam-105B)"

        # 2. Secondary fallback: OpenAI GPT-4o-mini
        if self.openai_key and not self.openai_key.startswith("your_"):
            reply = self._call_openai_chat(system_prompt, user_message, history)
            if reply:
                return reply, "OpenAI GPT-4o-mini"

        # 3. Rule-Based Fallback
        return "", "Deterministic Clinical Engine"

    def generate_unified_intake(
        self,
        patient_name: str,
        age: int,
        gender: str,
        user_message: str,
        history: List[Dict[str, str]] = None,
        turn_count: int = 1,
        language: str = "hi"
    ) -> Dict[str, Any]:
        """Generates single-call, unified clinical intake response using Sarvam-105B
        grounded strictly on Verified Medical RAG (MoHFW Standard Treatment Guidelines).
        """
        self.reload_keys()

        # Step 1: Medical RAG Retrieval (Ground Truth from Indian Clinical Guidelines)
        rag_context, rag_meta = medical_rag.build_grounded_rag_context(
            user_text=user_message,
            patient_name=patient_name,
            age=age,
            gender=gender,
            department="General Medicine",
            turn_count=turn_count
        )

        system_instruction = (
            "You are MediKiosk AI, an empathetic Indian hospital OPD triage assistant. "
            "You converse with patients in natural, caring spoken Hindi (or English if explicitly requested).\n\n"
            f"{rag_context}\n\n"
            "CRITICAL OPERATIONAL RULES:\n"
            "1. ACT AS ONE SINGLE UNIFIED ASSISTANT. Speak directly in 1 or 2 concise, caring sentences. NEVER output two disconnected statements.\n"
            "2. In 'spoken_reply_hi': Provide EXACTLY 1-2 warm, natural sentences in fluent spoken Hindi (Devanagari script: हिन्दी) combining empathy and 1 targeted clinical question guided by the verified guidelines above.\n"
            "   Even if the patient speaks Hinglish, output 'spoken_reply_hi' in polite Devanagari script (e.g. 'यह सुनकर चिंता हुई। क्या आपको ठंड या कंपकंपी भी लग रही है?').\n"
            "3. In 'suggested_chips': Provide 3-5 concise touch options in Hindi (Devanagari script).\n"
            "4. In 'reply_en': Provide the accurate English translation for physician clinical documentation.\n"
            "5. Keep the spoken text under 30 words so it speaks quickly and naturally via Bulbul v3.\n"
            "6. In 'is_priority': Check against Mandatory Emergency Red Flags. If triggered, set is_priority=true and priority_reason.\n"
            "Output strictly a raw valid JSON object without markdown formatting or code blocks."
        )

        history_summary = []
        if history:
            for h in history[-4:]:
                spk = "Patient" if h.get("speaker") in ("patient", "user") or h.get("role") == "user" else "MediKiosk"
                txt = h.get("content") or h.get("text") or ""
                history_summary.append(f"{spk}: {txt}")

        history_str = "\n".join(history_summary) if history_summary else "None (first turn)"

        prompt = (
            f"Patient Details: {patient_name}, {age} years old, {gender}.\n"
            f"Current Intake Turn: {turn_count}.\n"
            f"Prior Conversation:\n{history_str}\n\n"
            f"Latest Patient Message: '{user_message}'\n\n"
            "Return JSON matching this schema:\n"
            "{\n"
            '  "spoken_reply_hi": "1-2 concise warm spoken Hindi sentences combining empathy and follow-up question",\n'
            '  "reply_en": "English translation of spoken_reply_hi",\n'
            '  "suggested_chips": ["chip1", "chip2", "chip3", "chip4"],\n'
            '  "is_priority": false,\n'
            '  "priority_reason": "",\n'
            '  "is_complete": false,\n'
            '  "clinical_summary": "1 concise clinical sentence in English for doctor notes"\n'
            "}"
        )

        # 1. Primary Brain: Sarvam-105B
        if self.sarvam_key and not self.sarvam_key.startswith("your_"):
            parsed_sarvam = self._call_sarvam_105b_json(system_instruction, prompt)
            if parsed_sarvam:
                parsed_sarvam["llm_provider"] = "Sarvam AI (Sarvam-105B)"
                parsed_sarvam["rag_guideline"] = rag_meta.get("primary_protocol_title", "General OPD Clinical Protocol")
                # Supplement suggested chips from RAG if model returned empty
                if not parsed_sarvam.get("suggested_chips"):
                    parsed_sarvam["suggested_chips"] = rag_meta.get("suggested_chips_hi", [])
                return parsed_sarvam

        # 2. Secondary fallback: OpenAI GPT-4o-mini
        if self.openai_key and not self.openai_key.startswith("your_"):
            parsed_openai = self._call_openai_json(system_instruction, prompt)
            if parsed_openai:
                parsed_openai["llm_provider"] = "OpenAI GPT-4o-mini (Medical RAG Grounded)"
                parsed_openai["rag_guideline"] = rag_meta.get("primary_protocol_title", "General OPD Clinical Protocol")
                return parsed_openai

        # 3. High-Reliability Deterministic Fallback with RAG metadata
        fallback = self._deterministic_unified_intake(user_message, turn_count, language)
        fallback["rag_guideline"] = rag_meta.get("primary_protocol_title", "General OPD Clinical Protocol")
        if rag_meta.get("suggested_chips_hi"):
            fallback["suggested_chips"] = rag_meta.get("suggested_chips_hi")
        return fallback

    def _call_sarvam_105b_json(self, system_instruction: str, prompt: str) -> Optional[Dict[str, Any]]:
        """Calls Sarvam-105B completions API and extracts structured JSON response."""
        models_to_try = ["sarvam-105b-conversations", "sarvam-105b"]

        for model in models_to_try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.15,
                "max_tokens": 450,
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
                        raw_text = choices[0].get("message", {}).get("content", "")
                        if not raw_text:
                            continue
                        clean = raw_text.strip()
                        # Strip markdown fences if present
                        if clean.startswith("```"):
                            lines = clean.split("\n")
                            clean = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:]).strip()

                        # Locate JSON bounds
                        start_idx = clean.find("{")
                        end_idx = clean.rfind("}")
                        if start_idx != -1 and end_idx != -1:
                            clean = clean[start_idx:end_idx + 1]

                        parsed = json.loads(clean)
                        if isinstance(parsed, dict) and ("spoken_reply_hi" in parsed or "reply_en" in parsed):
                            return parsed
            except Exception as e:
                continue

        return None

    def _call_sarvam_chat(self, system_prompt: str, user_message: str, history: List[Dict[str, str]] = None) -> Optional[str]:
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for h in history[-4:]:
                role = "assistant" if h.get("speaker") == "assistant" or h.get("role") == "assistant" else "user"
                messages.append({"role": role, "content": h.get("content") or h.get("text") or ""})
        messages.append({"role": "user", "content": user_message})

        for model in ["sarvam-105b-conversations", "sarvam-105b"]:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 250,
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
                continue
        return None

    def _call_openai_json(self, system_instruction: str, prompt: str) -> Optional[Dict[str, Any]]:
        payload = {
            "model": "gpt-4o-mini",
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 500,
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
            with urllib.request.urlopen(req, timeout=6) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                choices = data.get("choices", [])
                if choices:
                    raw_text = choices[0]["message"]["content"].strip()
                    parsed = json.loads(raw_text)
                    if isinstance(parsed, dict):
                        return parsed
        except Exception:
            return None
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
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                choices = data.get("choices", [])
                if choices:
                    return choices[0]["message"]["content"].strip()
        except Exception:
            return None
        return None

    def _deterministic_unified_intake(self, user_text: str, turn_count: int, language: str = "hi") -> Dict[str, Any]:
        lower = user_text.lower()
        is_concluding = turn_count >= 3 or any(
            w in lower for w in ["दवा नहीं", "no medicine", "no allergies", "कोई एलर्जी नहीं", "all good", "बस यही है", "done"]
        ) and turn_count >= 2

        if is_concluding:
            return {
                "spoken_reply_hi": "धन्यवाद! आपकी सभी स्वास्थ्य जानकारी सुरक्षित रूप से दर्ज कर ली गई है। आपका विवरण अब डॉक्टर के पास तैयार है।",
                "reply_en": "Thank you! All your health information has been recorded and prepared for the attending physician.",
                "suggested_chips": ["हाँ, तैयार हूँ ✓", "कागजात जोड़ें", "समीक्षा करें"],
                "is_priority": False,
                "priority_reason": "",
                "is_complete": True,
                "clinical_summary": f"Patient completed intake. Chief complaint: {user_text}",
                "llm_provider": "Deterministic Clinical Engine"
            }
        elif turn_count == 2:
            return {
                "spoken_reply_hi": "समझ गया। क्या आप वर्तमान में कोई नियमित दवाइयां ले रहे हैं, या आपको किसी दवा से कोई एलर्जी है?",
                "reply_en": "Understood. Are you currently taking any regular daily medications, or do you have any known drug allergies?",
                "suggested_chips": ["कोई दवा नहीं", "बीपी की दवा", "शुगर की दवा", "कोई एलर्जी नहीं"],
                "is_priority": False,
                "priority_reason": "",
                "is_complete": False,
                "clinical_summary": f"Symptom details: {user_text}",
                "llm_provider": "Deterministic Clinical Engine"
            }
        else:
            if "पेट" in user_text or "stomach" in lower:
                reply_hi = "समझा, पेट की तकलीफ काफी परेशान कर सकती है। क्या यह दर्द खाना खाने के बाद ज्यादा होता है, या उल्टी भी आ रही है?"
                reply_en = "Understood, abdominal pain can be uncomfortable. Does it increase after meals, or do you have nausea?"
                chips = ["खाना खाने के बाद", "खाली पेट दर्द", "उल्टी या जी मिचलाना", "हल्का दर्द"]
            elif "सीने" in user_text or "chest" in lower:
                reply_hi = "समझा, सीने में भारीपन या दर्द को तुरंत देखना जरूरी है। क्या यह दर्द बाएं हाथ या गर्दन में भी फैलता है?"
                reply_en = "Understood. Chest discomfort requires prompt evaluation. Does this pain radiate to your left arm or neck?"
                chips = ["बाएं हाथ में दर्द", "भारीपन और घबराहट", "सिर्फ सीने में", "सांस फूलना"]
            elif "सिर" in user_text or "head" in lower:
                reply_hi = "समझा, सिरदर्द के बारे में नोट कर लिया है। क्या आपको चक्कर या आंखों के आगे धुंधलापन भी महसूस हो रहा है?"
                reply_en = "Understood, noted your headache. Are you also feeling dizzy or having blurred vision?"
                chips = ["चक्कर आ रहे हैं", "धुंधलापन है", "उल्टी जैसा लगना", "2 दिनों से"]
            elif "बुखार" in user_text or "fever" in lower:
                reply_hi = "समझा, बुखार के लक्षण दर्ज कर लिए हैं। क्या आपको ठंड या कंपकंपी भी लग रही है, और यह कब से है?"
                reply_en = "Understood, noted your fever. Are you experiencing chills or shivering, and since when?"
                chips = ["ठंड लग रही है", "खांसी भी है", "2-3 दिनों से", "काफी तेज बुखार"]
            else:
                reply_hi = "समझा, आपकी परेशानी को ध्यानपूर्वक दर्ज कर लिया है। यह समस्या कब से शुरू हुई है और कितनी तेज है?"
                reply_en = "Understood, your concern has been noted. When did this begin and how severe is it?"
                chips = ["आज से शुरू हुआ", "2-3 दिनों से", "हल्का दर्द", "काफी तेज तकलीफ"]

            return {
                "spoken_reply_hi": reply_hi,
                "reply_en": reply_en,
                "suggested_chips": chips,
                "is_priority": False,
                "priority_reason": "",
                "is_complete": False,
                "clinical_summary": f"Presenting complaint: {user_text}",
                "llm_provider": "Deterministic Clinical Engine"
            }

    # =========================================================================
    # 2. VOICE OUTPUT (Text-to-Speech / TTS via Sarvam Bulbul:v3)
    # =========================================================================
    def synthesize_speech(self, text: str, language_code: str = "hi-IN") -> Tuple[str, str]:
        """Synthesizes high-fidelity voice using Sarvam Bulbul v3.
        Returns (base64_audio, provider_used)
        """
        self.reload_keys()

        # 1. Primary: Sarvam Bulbul v3 for Indian regional languages and accents
        if (language_code.startswith("hi") or language_code.endswith("-IN")) and self.sarvam_key and not self.sarvam_key.startswith("your_"):
            audio_b64 = self._call_sarvam_tts(text, language_code)
            if audio_b64:
                return audio_b64, "Sarvam Bulbul (bulbul:v3)"

        # 2. Fallback: ElevenLabs
        if self.elevenlabs_key and not self.elevenlabs_key.startswith("your_"):
            audio_b64 = self._call_elevenlabs_tts(text)
            if audio_b64:
                return audio_b64, "ElevenLabs (Multilingual Human Voice)"

        # 3. Fallback: OpenAI TTS
        if self.openai_key and not self.openai_key.startswith("your_"):
            audio_b64 = self._call_openai_tts(text)
            if audio_b64:
                return audio_b64, "OpenAI TTS (tts-1-hd)"

        # 4. Sarvam Bulbul fallback for any other language
        if self.sarvam_key and not self.sarvam_key.startswith("your_"):
            audio_b64 = self._call_sarvam_tts(text, language_code)
            if audio_b64:
                return audio_b64, "Sarvam Bulbul (bulbul:v3)"

        return "", "Browser Web Speech"

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

    def _call_elevenlabs_tts(self, text: str) -> Optional[str]:
        voice_id = self.elevenlabs_voice or "21m00Tcm4TlvDq8ikWAM"
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
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
            with urllib.request.urlopen(req, timeout=4) as resp:
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

    # =========================================================================
    # 3. TRANSLATION (Sarvam AI Mayura:v1)
    # =========================================================================
    def translate_text(self, text: str, source_language_code: str = "hi-IN", target_language_code: str = "en-IN") -> str:
        """Translates regional Indian clinical descriptions into medical English using Sarvam Mayura."""
        self.reload_keys()
        if self.sarvam_key and not self.sarvam_key.startswith("your_"):
            payload = json.dumps({
                "input": text,
                "source_language_code": source_language_code,
                "target_language_code": target_language_code,
                "mode": "formal",
                "model": "mayura:v1",
            }).encode("utf-8")
            try:
                req = urllib.request.Request(
                    "https://api.sarvam.ai/translate",
                    data=payload,
                    headers={
                        "api-subscription-key": self.sarvam_key,
                        "Content-Type": "application/json",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    return res_data.get("translated_text", text)
            except Exception:
                return text
        return text

    # =========================================================================
    # 4. EAR (Speech-to-Text / ASR via Sarvam Saaras:v3)
    # =========================================================================
    def transcribe_speech(self, audio_bytes: bytes, filename: str = "audio.wav", language_code: str = "hi-IN") -> Dict[str, Any]:
        """Transcribes Indian regional voice audio using Sarvam Saaras v3."""
        from app.services.sarvam_service import sarvam
        return sarvam.speech_to_text(audio_bytes, filename, language_code, model="saaras:v3")


unified_ai = UnifiedAIService()
