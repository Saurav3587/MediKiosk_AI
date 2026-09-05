from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.services.ai_engine import ai_engine
from app.services.sarvam_service import SarvamService
from app.services.unified_ai_service import unified_ai

router = APIRouter(prefix="/ai", tags=["AI Clinical Engine & Sarvam AI"])
sarvam = SarvamService()

class HistorySynthesisRequest(BaseModel):
    patientName: str
    age: int
    gender: str
    answers: Dict[str, Any]

class PriorityEvaluationRequest(BaseModel):
    answers: Dict[str, Any]

class SarvamTtsRequest(BaseModel):
    text: str = Field(..., description="Text prompt to speak out")
    language_code: str = Field("hi-IN", description="Language code (e.g. hi-IN, bn-IN, ta-IN, en-IN)")
    speaker: str = Field("ritu", description="Voice speaker profile (ritu, aditya, etc.)")

class SarvamTranslateRequest(BaseModel):
    text: str = Field(..., description="Regional text to translate")
    source_language_code: str = Field("hi-IN", description="Source Indian language code")
    target_language_code: str = Field("en-IN", description="Target language code (usually en-IN for doctors)")

@router.post("/synthesize-history")
def synthesize_clinical_history(payload: HistorySynthesisRequest):
    structured = ai_engine.synthesize_history(
        payload.patientName,
        payload.age,
        payload.gender,
        payload.answers
    )
    return {"success": True, "data": structured}

@router.post("/evaluate-priority")
def evaluate_priority_triggers(payload: PriorityEvaluationRequest):
    is_priority, reason = ai_engine.evaluate_priority_triggers(payload.answers)
    return {"isPriority": is_priority, "priorityReason": reason}

# -------------------------------------------------------------
# Sarvam AI Sovereign Indian Voice & Language Endpoints
# -------------------------------------------------------------
@router.get("/sarvam/status")
def get_sarvam_status():
    """Checks whether Sarvam AI is configured in .env and active."""
    configured = sarvam.is_configured()
    return {
        "configured": configured,
        "provider": "Sarvam AI",
        "features": [
            "Saaras ASR (Hinglish & Regional Speech-to-Text)",
            "Bulbul TTS (Natural Indian Regional Voice Prompts)",
            "Mayura Translation (Patient Vernacular -> Clinical English)"
        ],
        "models": {
            "asr": "saaras:v1",
            "tts": "bulbul:v3",
            "translation": "mayura:v1"
        }
    }

@router.post("/sarvam/speech-to-text")
async def sarvam_speech_to_text(
    file: UploadFile = File(...),
    language_code: str = Form("unknown")
):
    """Transcribes audio using Sarvam Saaras model. Supports Hinglish, Hindi, and 10 Indian languages."""
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio recording submitted.")

    res = sarvam.speech_to_text(
        audio_bytes=audio_bytes,
        filename=file.filename or "recording.wav",
        language_code=language_code
    )
    return res

@router.post("/sarvam/text-to-speech")
def sarvam_text_to_speech(payload: SarvamTtsRequest):
    """Converts clinical question text into natural regional spoken voice using Sarvam Bulbul TTS."""
    res = sarvam.text_to_speech(
        text=payload.text,
        target_language_code=payload.language_code,
        speaker=payload.speaker
    )
    return res

@router.post("/sarvam/translate")
def sarvam_translate(payload: SarvamTranslateRequest):
    """Translates patient narrative from regional Indian language into medical English for physicians."""
    res = sarvam.translate(
        text=payload.text,
        source_language_code=payload.source_language_code,
        target_language_code=payload.target_language_code
    )
    return res


# -------------------------------------------------------------
# Smart Conversational Clinical Intake Engine (Hindi & English Voice)
# -------------------------------------------------------------
class ConversationalIntakeRequest(BaseModel):
    patient_name: Optional[str] = "Patient"
    age: Optional[int] = 30
    gender: Optional[str] = "Male"
    language: str = Field("hi", description="Preferred language code ('hi' or 'en')")
    history: list[Dict[str, str]] = Field(default_factory=list, description="Prior conversation turns")
    user_message: str = Field(..., description="Patient input text spoken or typed")
    turn_count: int = Field(1, description="Sequential intake turn number")
    synthesize_audio: bool = Field(True, description="Whether to generate Sarvam voice audio base64")


def _detect_priority_triggers(text: str) -> tuple[bool, str]:
    lower = text.lower()
    # Chest red flags
    if any(k in lower for k in ["chest", "सीने", "छाती", "दिल", "heart"]) and any(
        k in lower for k in ["pain", "दर्द", "दबाव", "pressure", "भारीपन", "tightness", "heavy", "घबराहट"]
    ):
        if any(k in lower for k in ["arm", "हाथ", "बाएं", "left", "jaw", "जबड़ा", "neck", "गले", "back", "पीठ"]):
            return True, "Acute chest discomfort with radiation to arm/jaw/back detected (Cardiac alert)."
        return True, "Acute chest discomfort / pressure reported (Priority triage alert)."

    # Breathlessness red flags
    if any(k in lower for k in ["सांस", "breath", "dyspnea"]) and any(
        k in lower for k in ["बैठे", "rest", "रात", "night", "फूल", "चढ़", "severe", "गंभीर"]
    ):
        return True, "Severe dyspnea / shortness of breath at rest flagged for prompt triage."

    # Neurological red flags
    if any(k in lower for k in ["बेहोश", "faint", "unconscious", "कमजोरी", "slurred", "लकवा", "paralysis"]):
        return True, "Acute neurological or consciousness warning signs detected."

    return False, ""


def _is_hindi_language(text: str, declared_lang: str) -> bool:
    """Accurately detects whether patient input is in Hindi (Devanagari script or Hinglish phonetic words)
    or if Hindi was requested.
    """
    if declared_lang and declared_lang.lower().startswith("hi"):
        return True

    # 1. Any Devanagari Unicode characters (Hindi script: \u0900 to \u097F)
    if any("\u0900" <= c <= "\u097f" for c in text):
        return True

    # 2. Common Hindi / Hinglish clinical & conversational keywords
    lower = text.lower()
    hindi_tokens = {
        "mujhe", "mera", "meri", "mere", "hamko", "humko", "dard", "bukhar", "khansi",
        "seene", "seena", "chhati", "pet", "pait", "sir", "sar", "ulti", "chakkar",
        "thand", "badan", "gale", "saans", "sans", "dawa", "davai", "dawai", "nahi",
        "nhi", "hai", "hain", "ho", "raha", "rahi", "rahe", "din", "subah", "shaam",
        "raat", "bahut", "bohot", "tez", "kam", "jyada", "zyada", "kya", "bhi", "aur",
        "pe", "me", "mein", "se", "lag", "aaya", "aayi", "hua", "hui", "thik", "theek",
        "pareshaan", "takleef", "sujan", "jalan", "ghabrahat", "kamzori", "kamjori",
        "kharash", "petkharab", "dust", "khana", "paani", "so", "uth", "aata", "aati",
        "hota", "hoti", "hote", "batao", "bataiye", "kripya", "namaste", "dhanyawad"
    }
    cleaned = "".join(c if c.isalnum() else " " for c in lower)
    words = set(cleaned.split())
    if words & hindi_tokens:
        return True

    # 3. If declared language is English and no Hindi keywords/characters detected, return False (English)
    if declared_lang and declared_lang.lower().startswith("en"):
        return False

    # 4. If declared language is Hindi, return True
    if declared_lang and declared_lang.lower().startswith("hi"):
        return True

    return False


@router.post("/conversational-intake")
async def process_conversational_intake(payload: ConversationalIntakeRequest):
    """Processes patient natural voice/text intake in Hindi or English using Sarvam-105B
    grounded strictly on Verified Medical RAG (MoHFW Standard Treatment Guidelines).
    Synthesizes natural Indian spoken voice via Sarvam Bulbul v3.
    """
    import time
    start_total = time.time()

    user_text = payload.user_message.strip()

    # Detect language accurately (Hindi vs English)
    is_hindi = _is_hindi_language(user_text, payload.language)
    target_locale = "hi-IN" if is_hindi else "en-IN"

    # 1. Deterministic red-flag safety trigger check
    flag_priority, flag_reason = _detect_priority_triggers(user_text)

    # 2. Sovereign AI Call: Sarvam-105B + Verified Medical RAG Grounding
    t0_llm = time.time()
    intake_data = unified_ai.generate_unified_intake(
        patient_name=payload.patient_name or "Patient",
        age=payload.age or 30,
        gender=payload.gender or "Male",
        user_message=user_text,
        history=payload.history,
        turn_count=payload.turn_count,
        language="hi" if is_hindi else "en"
    )
    llm_ms = int((time.time() - t0_llm) * 1000)

    # Merge red flag alerts
    is_priority = flag_priority or intake_data.get("is_priority", False)
    priority_reason = flag_reason or intake_data.get("priority_reason", "")

    assistant_reply_hi = intake_data.get("spoken_reply_hi", "")
    assistant_reply_en = intake_data.get("reply_en", "")

    # Guarantee spoken_text matches Hindi when Hindi is detected
    spoken_text = assistant_reply_hi if is_hindi else (assistant_reply_en or assistant_reply_hi)
    suggested_chips = intake_data.get("suggested_chips", [])
    is_complete = intake_data.get("is_complete", payload.turn_count >= 3)
    clinical_summary = intake_data.get("clinical_summary", user_text)
    llm_provider = intake_data.get("llm_provider", "Sarvam AI (Sarvam-105B)")
    rag_guideline = intake_data.get("rag_guideline", "MoHFW Standard Treatment Guidelines")

    # 3. Voice Audio Synthesis via Sarvam Bulbul v3
    t0_tts = time.time()
    audio_base64, voice_provider = "", "Browser Web Speech"
    if payload.synthesize_audio and spoken_text:
        audio_base64, voice_provider = unified_ai.synthesize_speech(
            text=spoken_text,
            language_code=target_locale
        )
    tts_ms = int((time.time() - t0_tts) * 1000)
    total_ms = int((time.time() - start_total) * 1000)

    return {
        "success": True,
        "assistant_reply_hi": assistant_reply_hi,
        "assistant_reply_en": assistant_reply_en,
        "spoken_reply": spoken_text,
        "spoken_reply_hi": assistant_reply_hi,
        "detected_language": "hi" if is_hindi else "en",
        "audio_base64": audio_base64,
        "audio_format": "audio/mpeg;base64" if "ElevenLabs" in voice_provider or "OpenAI" in voice_provider else "audio/wav;base64",
        "is_priority": is_priority,
        "priority_reason": priority_reason,
        "suggested_chips": suggested_chips,
        "is_intake_complete": is_complete,
        "user_english_translation": clinical_summary,
        "clinical_summary": clinical_summary,
        "turn_count": payload.turn_count + 1,
        "llm_provider": llm_provider,
        "main_llm": "Sarvam-105B",
        "voice_to_text": "Sarvam Saaras (saaras:v3)",
        "text_to_voice": "Sarvam Bulbul (bulbul:v3)",
        "voice_provider": voice_provider,
        "translation_provider": "Sarvam AI Mayura (mayura:v1)",
        "medical_grounding": "Verified Medical RAG (MoHFW STGs)",
        "rag_guideline": rag_guideline,
        "performance": {
            "llm_ms": llm_ms,
            "tts_ms": tts_ms,
            "total_ms": total_ms
        }
    }


@router.get("/providers")
def get_active_providers():
    """Returns status of configured sovereign AI providers (Sarvam-105B, Saaras v3, Bulbul v3, Medical RAG)."""
    return unified_ai.get_provider_status()



