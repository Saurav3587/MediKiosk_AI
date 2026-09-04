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


@router.post("/conversational-intake")
async def process_conversational_intake(payload: ConversationalIntakeRequest):
    """Processes patient natural voice/text intake in Hindi or English using Sarvam AI.
    Provides empathetic clinical acknowledgment, asks 1 smart targeted follow-up question,
    evaluates red flags, translates into medical English, and generates native voice audio in Hindi.
    """
    is_hindi = payload.language.startswith("hi")
    target_locale = "hi-IN" if is_hindi else "en-IN"
    user_text = payload.user_message.strip()

    # 1. Red-flag evaluation
    is_priority, priority_reason = _detect_priority_triggers(user_text)

    # 2. Determine conversational stage based on turn_count
    # Turn 1: Chief complaint -> Acknowledge symptom + ask onset/severity/clarification
    # Turn 2: Symptom details -> Ask current daily medicines & known drug allergies
    # Turn 3+: Conclude intake politely and mark complete
    is_concluding = payload.turn_count >= 3 or any(
        w in user_text.lower()
        for w in ["दवा नहीं", "no medicine", "no allergies", "कोई एलर्जी नहीं", "all good", "बस यही है", "done"]
    ) and payload.turn_count >= 2

    # 3. System prompt for Sarvam 105B Conversations
    if is_concluding:
        system_prompt = (
            "You are MediKiosk AI, an empathetic Indian hospital OPD triage assistant. "
            "The patient has shared their symptoms and medical details. "
            "Politely thank the patient, assure them that their clinical information has been structured for the doctor, "
            "and tell them they are ready for their physician consultation. "
            "Do NOT diagnose or prescribe. Keep response strictly under 2 brief sentences in natural, polite Hindi (or English if requested)."
        )
    elif payload.turn_count == 2:
        system_prompt = (
            "You are MediKiosk AI, an empathetic Indian hospital OPD triage assistant. "
            "Acknowledge the patient's symptom details briefly and warmly. "
            "Then ask ONLY this essential clinical safety question: whether they are taking any regular daily medicines, or have any known medicine/drug allergies. "
            "NEVER ask irrelevant questions (do not ask about Ayurvedic doshas, do not ask about appendectomy or gallbladder surgery, do not ask about smoking/alcohol). "
            "Keep response strictly under 2 brief sentences in natural, polite Hindi (or English if requested)."
        )
    else:
        system_prompt = (
            "You are MediKiosk AI, an empathetic Indian hospital OPD triage assistant. "
            "The patient just described their health issue: '" + user_text + "'. "
            "1. Acknowledge their specific problem in 1 warm, comforting sentence in natural Hindi. "
            "2. Ask exactly ONE targeted, clinically relevant follow-up question (e.g. how long they have had this, or if fever whether they have chills/cough, or if chest pain whether it radiates to left arm, or if stomach pain whether it is after meals). "
            "NEVER ask irrelevant questions (no doshas, no unnecessary surgeries, no intrusive lifestyle questions). "
            "Keep response strictly under 2 brief sentences in natural Hindi (or English if requested). Do NOT diagnose."
        )

    # Prepare chat messages
    messages = [{"role": "system", "content": system_prompt}]
    for h in payload.history[-4:]:
        role = "assistant" if h.get("speaker") == "assistant" or h.get("role") == "assistant" else "user"
        messages.append({"role": role, "content": h.get("text") or h.get("content") or ""})
    messages.append({"role": "user", "content": user_text})

    # 4. Generate Clinical Intake Response using Unified AI (Gemini -> OpenAI -> Sarvam)
    assistant_reply_hi = ""
    assistant_reply_en = ""

    chat_content, llm_provider = unified_ai.generate_chat_response(
        system_prompt=system_prompt,
        user_message=user_text,
        history=payload.history,
        language="hi" if is_hindi else "en"
    )
    if chat_content:
        if is_hindi:
            assistant_reply_hi = chat_content
        else:
            assistant_reply_en = chat_content
    else:
        # High-reliability Clinical Fallback
        llm_provider = "Deterministic Clinical Engine"
        if is_concluding:
            assistant_reply_hi = "धन्यवाद! आपकी सभी स्वास्थ्य जानकारी सुरक्षित रूप से दर्ज कर ली गई है। आपका विवरण अब डॉक्टर के पास तैयार है।"
            assistant_reply_en = "Thank you! All your health information has been recorded and prepared for the attending physician."
        elif payload.turn_count == 2:
            assistant_reply_hi = "समझ गया। क्या आप वर्तमान में कोई नियमित दवाइयां ले रहे हैं, या आपको किसी दवा से कोई एलर्जी है?"
            assistant_reply_en = "Understood. Are you currently taking any regular daily medications, or do you have any known drug allergies?"
        else:
            if "पेट" in user_text or "stomach" in user_text.lower():
                assistant_reply_hi = "समझा, पेट की तकलीफ काफी परेशान कर सकती है। क्या यह दर्द खाना खाने के बाद ज्यादा होता है, या उल्टी भी आ रही है?"
                assistant_reply_en = "Understood, abdominal pain can be very uncomfortable. Does it increase after eating, or do you also have nausea/vomiting?"
            elif "सीने" in user_text or "chest" in user_text.lower():
                assistant_reply_hi = "समझा, सीने में भारीपन या दर्द को तुरंत देखना जरूरी है। क्या यह दर्द बाएं हाथ या गर्दन में भी फैलता है?"
                assistant_reply_en = "Understood. Chest discomfort requires prompt evaluation. Does this pain radiate to your left arm or neck?"
            elif "सिर" in user_text or "head" in user_text.lower():
                assistant_reply_hi = "समझा, सिरदर्द के बारे में नोट कर लिया है। क्या आपको चक्कर या आंखों के आगे धुंधलापन भी महसूस हो रहा है?"
                assistant_reply_en = "Understood, noted your headache. Are you also feeling dizzy or having blurred vision?"
            elif "बुखार" in user_text or "fever" in user_text.lower():
                assistant_reply_hi = "समझा, बुखार के लक्षण दर्ज कर लिए हैं। क्या आपको ठंड या कंपकंपी भी लग रही है, और यह कब से है?"
                assistant_reply_en = "Understood, noted your fever. Are you experiencing chills or shivering, and since when?"
            else:
                assistant_reply_hi = "समझा, आपकी परेशानी को ध्यानपूर्वक दर्ज कर लिया है। यह समस्या कब से शुरू हुई है और कितनी तेज है?"
                assistant_reply_en = "Understood, your health concern has been noted. When did this begin and how severe is it?"

    # Ensure both English and Hindi versions exist
    if is_hindi and not assistant_reply_en:
        tr_res = sarvam.translate(assistant_reply_hi, "hi-IN", "en-IN")
        assistant_reply_en = tr_res.get("translated_text", assistant_reply_hi)
    elif not is_hindi and not assistant_reply_hi:
        tr_res = sarvam.translate(assistant_reply_en, "en-IN", "hi-IN")
        assistant_reply_hi = tr_res.get("translated_text", assistant_reply_en)

    spoken_text = assistant_reply_hi if is_hindi else assistant_reply_en

    # 5. Synthesize native voice audio using Unified Voice (ElevenLabs -> OpenAI TTS -> Sarvam Bulbul)
    audio_base64, voice_provider = "", "Browser Web Speech"
    if payload.synthesize_audio and spoken_text:
        audio_base64, voice_provider = unified_ai.synthesize_speech(
            text=spoken_text,
            language_code=target_locale
        )

    # Contextual Quick Chips
    if is_concluding:
        suggested_chips = (
            ["हाँ, तैयार हूँ ✓", "कागजात जोड़ें", "समीक्षा करें"]
            if is_hindi
            else ["Yes, I am Ready ✓", "Add Documents", "Review Summary"]
        )
    elif payload.turn_count == 2:
        suggested_chips = (
            ["कोई दवा नहीं", "बीपी की दवा", "शुगर की दवा", "कोई एलर्जी नहीं", "पेनिसिलिन से एलर्जी"]
            if is_hindi
            else ["No regular medicines", "BP medicines", "Diabetes medicines", "No allergies", "Penicillin allergy"]
        )
    else:
        suggested_chips = (
            ["आज से शुरू हुआ", "2-3 दिनों से", "1 सप्ताह से", "हल्का दर्द", "काफी तेज दर्द", "उल्टी भी है"]
            if is_hindi
            else ["Started today", "Since 2-3 days", "Past 1 week", "Mild pain", "Severe pain", "Also have nausea"]
        )

    # Translate user message to English if needed for doctor summary
    user_english = user_text
    if is_hindi:
        tr_user = sarvam.translate(user_text, "hi-IN", "en-IN")
        user_english = tr_user.get("translated_text", user_text)

    return {
        "success": True,
        "assistant_reply_hi": assistant_reply_hi,
        "assistant_reply_en": assistant_reply_en,
        "spoken_reply": spoken_text,
        "audio_base64": audio_base64,
        "audio_format": "audio/mpeg;base64" if "ElevenLabs" in voice_provider or "OpenAI" in voice_provider else "audio/wav;base64",
        "is_priority": is_priority,
        "priority_reason": priority_reason,
        "suggested_chips": suggested_chips,
        "is_intake_complete": is_concluding,
        "user_english_translation": user_english,
        "turn_count": payload.turn_count + 1,
        "llm_provider": llm_provider,
        "voice_provider": voice_provider,
    }


@router.get("/providers")
def get_active_providers():
    """Returns status of configured AI providers (Gemini, OpenAI, ElevenLabs, Sarvam)."""
    return unified_ai.get_provider_status()



