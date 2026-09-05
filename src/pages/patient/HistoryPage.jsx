import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ArrowLeft, MessageSquare, Mic, RotateCcw, ShieldAlert, AlertTriangle, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
import { PatientLayout } from "../../layouts/PatientLayout";
import { AIHealthOrb } from "../../components/ai/AIHealthOrb";
import { AIQuestion } from "../../components/ai/AIQuestion";
import { TouchAnswer } from "../../components/ai/TouchAnswer";
import { VoiceRecorder } from "../../components/ai/VoiceRecorder";
import { HistoryProgress } from "../../components/ai/HistoryProgress";
import { PriorityAlert } from "../../components/common/PriorityAlert";
import { INTERVIEW_SECTIONS } from "../../data/interviewQuestions";
import { usePatient } from "../../context/PatientContext";
import { useAccessibility } from "../../context/AccessibilityContext";
import { apiService } from "../../services/apiService";
import { speechService } from "../../services/speechService";

export function HistoryPage() {
  const navigate = useNavigate();
  const {
    t,
    language,
    setLanguage,
    patientInfo,
    answers,
    recordAnswer,
    isPriority,
    priorityReason,
    setIsPriority,
    setPriorityReason,
    isAyushMode,
    setIsAyushMode,
    setCurrentStep,
  } = usePatient();

  const { speakGuidance, stopSpeaking, assistedMode } = useAccessibility();

  // Conversational AI dynamic state - Single Brain for Voice, Touch, and Text
  const initialPromptHi = "नमस्ते! मैं मेडीकियोस्क एआई हूँ। कृपया बताइए, आज आपको क्या परेशानी या लक्षण महसूस हो रहे हैं?";
  const initialPromptEn = "Hello! I am MediKiosk AI. Please describe your health problem or symptoms today.";

  const initialChipsHi = [
    "बुखार और सर्दी (Fever & Cold)",
    "पेट में दर्द या गैस (Stomach Pain)",
    "सीने में भारीपन या दर्द (Chest Pain)",
    "सिरदर्द और चक्कर (Headache)",
    "बदन दर्द और कमजोरी (Body Pain)",
    "उल्टी या जी मिचलाना (Nausea)",
  ];

  const initialChipsEn = [
    "Fever & Cold",
    "Stomach Pain or Acidity",
    "Chest Pain or Heaviness",
    "Headache & Dizziness",
    "Body Pain & Weakness",
    "Nausea & Vomiting",
  ];

  const initialChips = language === "hi" ? initialChipsHi : initialChipsEn;

  const [conversationTurn, setConversationTurn] = useState(1);
  const [completedSections, setCompletedSections] = useState([]);
  const [orbState, setOrbState] = useState("idle"); // 'idle' | 'listening' | 'processing' | 'speaking' | 'complete'
  const [inputMode, setInputMode] = useState("voice"); // 'voice' | 'touch' | 'text'
  const [isMuted, setIsMuted] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);

  const [conversationalHistory, setConversationalHistory] = useState([]);
  const [conversationQuestionHi, setConversationQuestionHi] = useState(initialPromptHi);
  const [conversationQuestionEn, setConversationQuestionEn] = useState(initialPromptEn);
  const [conversationChips, setConversationChips] = useState(initialChips);
  const [ragGuideline, setRagGuideline] = useState("MoHFW Standard Treatment Guidelines");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const isAiRespondingRef = React.useRef(false);
  const hasSpokenInitialRef = React.useRef(false);

  // Active question text
  const activeQuestionHi = conversationQuestionHi || initialPromptHi;
  const activeQuestionEn = conversationQuestionEn || initialPromptEn;

  // Current clinical section for progress tracker
  const currentSectionId =
    conversationTurn === 1 ? "chief_complaint" : conversationTurn === 2 ? "symptoms" : "medications";

  // Unified voice player - guarantees only one sound source plays at a time
  const speakCurrentQuestion = (forced = false, overrideText = null) => {
    if (isMuted && !forced) return;
    const qText = overrideText || (language === "hi" ? activeQuestionHi : activeQuestionEn);

    stopSpeaking();
    speechService.stopSpeaking();
    setOrbState("speaking");

    speechService.speakText(qText, {
      lang: language === "hi" ? "hi" : "en",
      onStart: () => setOrbState("speaking"),
      onEnd: () => {
        if (inputMode === "voice") {
          setOrbState("listening");
        } else {
          setOrbState("idle");
        }
      },
    });
  };

  // Speak initial greeting ONCE when patient loads the interview page
  useEffect(() => {
    if (!hasSpokenInitialRef.current && !isMuted) {
      hasSpokenInitialRef.current = true;
      const isHi = language === "hi";
      const initialText = isHi ? initialPromptHi : initialPromptEn;
      const timer = setTimeout(() => {
        setOrbState("speaking");
        speechService.speakText(initialText, {
          lang: isHi ? "hi" : "en",
          onStart: () => setOrbState("speaking"),
          onEnd: () => {
            if (inputMode === "voice") {
              setOrbState("listening");
            } else {
              setOrbState("idle");
            }
          },
        });
      }, 400);
      return () => clearTimeout(timer);
    }
    return () => {
      stopSpeaking();
      speechService.stopSpeaking();
    };
  }, []);

  // Single Unified Input Handler for Voice, Touch Chips, and Typed Input
  const handlePatientInput = async (inputText) => {
    const cleanText = (inputText || "").trim();
    if (!cleanText) return;

    if (isAiRespondingRef.current) {
      console.warn("Already analyzing clinical response, skipping concurrent input.");
      return;
    }
    isAiRespondingRef.current = true;

    // Immediately kill any lingering speech
    stopSpeaking();
    speechService.stopSpeaking();
    setOrbState("processing");
    setIsAiResponding(true);

    // Detect whether patient asked in Hindi or Hinglish
    const isHindiPatient =
      language === "hi" ||
      /[\u0900-\u097F]/.test(cleanText) ||
      /\b(mujhe|mera|meri|mere|dard|bukhar|khansi|seene|pet|sir|sar|ulti|chakkar|thand|badan|dawa|davai|nahi|nhi|hai|hain|ho|raha|rahi|din|subah|shaam|raat|bahut|bohot|tez|kam|kya|bhi|aur|sujan|jalan|ghabrahat)\b/i.test(cleanText);

    const requestLang = isHindiPatient ? "hi" : (language || "en");

    // Record answer in patient clinical history
    recordAnswer(
      `turn_${conversationTurn}`,
      cleanText,
      language === "hi" || isHindiPatient ? activeQuestionHi : activeQuestionEn,
      cleanText
    );

    // Update progress section
    if (conversationTurn === 1 && !completedSections.includes("chief_complaint")) {
      setCompletedSections((prev) => [...prev, "chief_complaint"]);
    } else if (conversationTurn === 2 && !completedSections.includes("symptoms")) {
      setCompletedSections((prev) => [...prev, "symptoms"]);
    } else if (conversationTurn >= 3) {
      setCompletedSections((prev) => [...prev, "medications", "allergies"]);
    }

    try {
      const payload = {
        patient_name: patientInfo.name || "Patient",
        age: parseInt(patientInfo.age) || 30,
        gender: patientInfo.gender || "Male",
        language: requestLang,
        history: conversationalHistory,
        user_message: cleanText,
        turn_count: conversationTurn,
        synthesize_audio: !isMuted,
      };

      const res = await apiService.conversationalIntakeChat(payload);

      if (res && res.success) {
        // Red flag triage alert
        if (res.is_priority) {
          setIsPriority(true);
          setPriorityReason(res.priority_reason);
        }

        if (res.rag_guideline) {
          setRagGuideline(res.rag_guideline);
        }

        const replyHi = res.assistant_reply_hi || res.spoken_reply_hi || res.spoken_reply || "";
        const replyEn = res.assistant_reply_en || res.reply_en || "";
        const chips = res.suggested_chips || [];

        // Check if response should be in Hindi
        const isHindiResponse = res.detected_language === "hi";

        // Update single-source conversation state
        setConversationQuestionHi(replyHi);
        setConversationQuestionEn(replyEn);
        if (chips.length > 0) {
          setConversationChips(chips);
        }
        setConversationalHistory((prev) => [
          ...prev,
          { role: "user", speaker: "patient", content: cleanText, text: cleanText, english: res.user_english_translation || cleanText },
          { role: "assistant", speaker: "assistant", content: replyHi || replyEn, text: replyHi || replyEn, english: replyEn },
        ]);
        setConversationTurn((prev) => prev + 1);

        // SPEAK SINGLE UNIFIED AI VOICE ANSWER IN HINDI
        if (!isMuted) {
          setOrbState("speaking");
          const spokenContent = isHindiResponse
            ? (replyHi || res.spoken_reply || replyEn)
            : (replyEn || res.spoken_reply || replyHi);

          if (res.audio_base64) {
            await speechService.playBase64Audio(res.audio_base64, {
              onStart: () => setOrbState("speaking"),
              onEnd: () => {
                if (res.is_intake_complete) {
                  setOrbState("complete");
                  setIsInterviewComplete(true);
                } else {
                  setOrbState(inputMode === "voice" ? "listening" : "idle");
                }
              },
            });
          } else {
            speechService.speakText(spokenContent, {
              lang: isHindiResponse ? "hi" : "en",
              onStart: () => setOrbState("speaking"),
              onEnd: () => {
                if (res.is_intake_complete) {
                  setOrbState("complete");
                  setIsInterviewComplete(true);
                } else {
                  setOrbState(inputMode === "voice" ? "listening" : "idle");
                }
              },
            });
          }
        } else {
          if (res.is_intake_complete) {
            setOrbState("complete");
            setIsInterviewComplete(true);
          } else {
            setOrbState("idle");
          }
        }


        if (res.is_intake_complete) {
          setTimeout(() => {
            setIsInterviewComplete(true);
            setOrbState("complete");
          }, 1000);
        }
      } else {
        // Fallback gentle acknowledgment
        const fallbackHi = "आपकी जानकारी नोट कर ली गई है। क्या आप कोई नियमित दवाइयाँ लेते हैं या कोई एलर्जी है?";
        setConversationQuestionHi(fallbackHi);
        setConversationChips(["कोई दवा नहीं", "बीपी की दवा", "शुगर की दवा", "एलर्जी है"]);
        setOrbState("idle");
      }
    } catch (err) {
      console.warn("Conversational intake error:", err);
      setOrbState("idle");
    } finally {
      isAiRespondingRef.current = false;
      setIsAiResponding(false);
    }
  };

  const handleOrbClick = () => {
    if (orbState === "speaking") {
      stopSpeaking();
      speechService.stopSpeaking();
      setOrbState("idle");
    } else {
      speakCurrentQuestion(true);
    }
  };


  // Navigation to Documents
  const handleProceedToDocuments = () => {
    stopSpeaking();
    setCurrentStep("documents");
    navigate("/patient/documents");
  };

  return (
    <PatientLayout activeStepId="history">
      <div className="w-full space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
        {/* Interview Sub-Header with Talking Assistant Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-mediblue-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-soft">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  {t.aiInterview?.assistantHeader || "MediKiosk AI"}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sarvam-105B • Verified Medical RAG • Bulbul v3</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500 font-medium">
                  {t.aiInterview?.patientLabel || "Patient"}: <strong className="text-slate-700">{patientInfo.name || "Patient"}</strong> •{" "}
                  {t.aiInterview?.languageLabel || "Language"}: <span className="text-mediblue-700 font-bold">हिन्दी / English</span>
                </p>
                {ragGuideline && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/80">
                    {ragGuideline}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Mute / Unmute Toggle Button */}
            <button
              type="button"
              onClick={() => {
                if (!isMuted) {
                  stopSpeaking();
                  speechService.stopSpeaking();
                }
                setIsMuted(!isMuted);
              }}
              title={isMuted ? "Unmute Voice Assistant" : "Mute Voice Assistant"}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                isMuted
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-mediblue-50 text-mediblue-700 hover:bg-mediblue-100 border border-mediblue-200"
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4 text-mediblue-600 animate-pulse" />}
              <span className="hidden sm:inline">{isMuted ? "Muted" : "Voice Output ON"}</span>
            </button>

            <HistoryProgress
              currentSectionId={currentSectionId}
              completedSectionIds={completedSections}
              compact={true}
            />
          </div>
        </div>

        {/* Priority Red-Flag Banner (If Triggered) */}
        {isPriority && (
          <PriorityAlert
            title={t.aiInterview?.priorityAlertTitle || "Priority Review Requested (प्राथमिकता समीक्षा)"}
            message={priorityReason || "Some of your responses will be highlighted for prompt review by hospital triage staff."}
          />
        )}

        {/* Interactive AI Health Assistant Orb */}
        <div className="py-2 flex flex-col items-center">
          <AIHealthOrb state={orbState} onClick={handleOrbClick} />

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold text-slate-600 font-mono uppercase tracking-wider">
              {orbState === "listening"
                ? "सुन रहे हैं... बोलिए (Listening...)"
                : orbState === "processing"
                ? "AI उत्तर तैयार कर रहा है (Sarvam-105B + Medical RAG...)"
                : orbState === "speaking"
                ? "AI बोल रहा है (Sarvam Bulbul v3 Voice Output...)"
                : "माइक बटन दबाएं या विकल्प चुनें (Tap to Speak)"}
            </span>

            {orbState === "speaking" && (
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  speechService.stopSpeaking();
                  setOrbState("idle");
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline"
              >
                Skip Audio
              </button>
            )}
          </div>
        </div>

        {/* Main AI Question Card */}
        {!isInterviewComplete ? (
          <div className="space-y-6">
            <AIQuestion
              questionEn={activeQuestionEn}
              questionHi={activeQuestionHi}
              sectionName={
                conversationTurn === 1
                  ? "CHIEF COMPLAINT (मुख्य शिकायत)"
                  : conversationTurn === 2
                  ? "SYMPTOM DETAILS (लक्षण एवं अवधि)"
                  : "MEDICATIONS & ALLERGIES (दवाइयाँ एवं सुरक्षा)"
              }
            />

            {/* Input Mode Switcher Strip */}
            <div className="flex items-center justify-center gap-2 pt-1 select-none">
              <button
                type="button"
                onClick={() => setInputMode("voice")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  inputMode === "voice"
                    ? "bg-mediblue-600 text-white shadow-md"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>बोलकर बताएं (Voice Answer)</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode("touch")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  inputMode === "touch"
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                विकल्प चुनें (Touch Options)
              </button>

              <button
                type="button"
                onClick={() => setInputMode("text")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  inputMode === "text"
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>लिखकर बताएं (Type)</span>
              </button>
            </div>

            {/* Input Modes */}
            {inputMode === "voice" ? (
              <VoiceRecorder
                onTranscriptConfirmed={handlePatientInput}
                onSwitchToType={() => setInputMode("text")}
                currentQuestionPrompt={activeQuestionHi}
                suggestedChips={conversationChips}
              />
            ) : (
              <TouchAnswer
                options={conversationChips.map((chip, idx) => ({
                  id: `chip_${idx}`,
                  labelHi: chip,
                  labelEn: chip,
                }))}
                isMultiSelect={false}
                onSelectOption={(val, label) => handlePatientInput(label || val)}
                onTextSubmit={(text) => handlePatientInput(text)}
                showTextInput={inputMode === "text"}
              />
            )}
          </div>
        ) : (
          /* Interview Complete Card */
          <div className="bg-white rounded-3xl border-2 border-emerald-500 p-8 text-center space-y-5 shadow-soft animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                स्वास्थ्य इतिहास पूरा हुआ (Intake Completed)
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
                आपकी सभी स्वास्थ्य जानकारी और लक्षण डॉक्टर के लिए तैयार कर लिए गए हैं। अब आप पुराने पर्चे या रिपोर्ट जोड़ सकते हैं।
              </p>
            </div>

            <button
              onClick={handleProceedToDocuments}
              className="py-4 px-8 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-base shadow-md hover:shadow-lg inline-flex items-center gap-2 transition"
            >
              <span>पुराने पर्चे या रिपोर्ट जोड़ें (Optional)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Clinical Safety UX Note */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            {t.aiInterview?.clinicalUxNote ||
              "MediKiosk डॉक्टर के लिए आपकी बीमारी का विवरण व्यवस्थित करता है। यह स्वतः दवा या निदान नहीं देता है।"}
          </p>
        </div>
      </div>
    </PatientLayout>
  );
}
