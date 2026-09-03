import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ArrowLeft, MessageSquare, Mic, RotateCcw, ShieldAlert, AlertTriangle } from "lucide-react";
import { PatientLayout } from "../../layouts/PatientLayout";
import { AIHealthOrb } from "../../components/ai/AIHealthOrb";
import { AIQuestion } from "../../components/ai/AIQuestion";
import { TouchAnswer } from "../../components/ai/TouchAnswer";
import { VoiceRecorder } from "../../components/ai/VoiceRecorder";
import { HistoryProgress } from "../../components/ai/HistoryProgress";
import { PriorityAlert } from "../../components/common/PriorityAlert";
import { QUESTION_DECISION_TREE, INTERVIEW_SECTIONS } from "../../data/interviewQuestions";
import { usePatient } from "../../context/PatientContext";
import { useAccessibility } from "../../context/AccessibilityContext";

export function HistoryPage() {
  const navigate = useNavigate();
  const {
    t,
    language,
    patientInfo,
    answers,
    recordAnswer,
    isPriority,
    priorityReason,
    isAyushMode,
    setIsAyushMode,
    setCurrentStep,
  } = usePatient();

  const { speakGuidance, assistedMode } = useAccessibility();

  // Active question in decision tree
  const [currentQuestionId, setCurrentQuestionId] = useState("consultation_type");
  const [completedSections, setCompletedSections] = useState([]);
  const [orbState, setOrbState] = useState("idle"); // 'idle' | 'listening' | 'processing' | 'speaking' | 'complete'
  const [inputMode, setInputMode] = useState("touch"); // 'touch' | 'voice' | 'text'
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);

  const currentQ = QUESTION_DECISION_TREE[currentQuestionId] || QUESTION_DECISION_TREE.chief_complaint;

  // Whenever a new question loads, trigger assistant speaking animation & optional audio guidance
  useEffect(() => {
    setOrbState("speaking");
    const qText = language === "hi" ? (currentQ.questionHi || currentQ.questionEn) : currentQ.questionEn;
    speakGuidance(qText, language);

    const timer = setTimeout(() => {
      setOrbState("idle");
    }, 1800);

    return () => clearTimeout(timer);
  }, [currentQuestionId, language]);

  // Handle patient answer selection
  const handleAnswer = (answerValue, answerLabel) => {
    setOrbState("processing");

    // Check if AYUSH mode selected
    if (currentQuestionId === "consultation_type" && answerValue === "ayush") {
      setIsAyushMode(true);
    }

    const qText = language === "hi" ? (currentQ.questionHi || currentQ.questionEn) : currentQ.questionEn;
    recordAnswer(currentQuestionId, answerValue, qText, answerLabel || String(answerValue));

    // Mark current section as completed
    if (currentQ.section && !completedSections.includes(currentQ.section)) {
      setCompletedSections((prev) => [...prev, currentQ.section]);
    }

    // Determine next question
    setTimeout(() => {
      let nextId = null;
      if (typeof currentQ.next === "function") {
        nextId = currentQ.next(answerValue);
      } else if (typeof currentQ.next === "string") {
        nextId = currentQ.next;
      }

      if (nextId && QUESTION_DECISION_TREE[nextId]) {
        setCurrentQuestionId(nextId);
        setOrbState("idle");
      } else {
        // All questions completed!
        setOrbState("complete");
        setIsInterviewComplete(true);
      }
    }, 500);
  };

  // Voice transcript confirmed
  const handleVoiceConfirmed = (text) => {
    handleAnswer("voice_input", text);
  };

  // Navigation to Documents
  const handleProceedToDocuments = () => {
    setCurrentStep("documents");
    navigate("/patient/documents");
  };

  return (
    <PatientLayout activeStepId="history">
      <div className="w-full space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
        {/* Interview Sub-Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mediblue-50 text-mediblue-600 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  {t.aiInterview?.assistantHeader || "MediKiosk Assistant"}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {t.aiInterview?.patientLabel || "Patient"}: <strong className="text-slate-700">{patientInfo.name}</strong> •{" "}
                {t.aiInterview?.languageLabel || "Language"}: {language === "hi" ? "हिन्दी" : "English"}
              </p>
            </div>
          </div>

          <HistoryProgress
            currentSectionId={currentQ.section}
            completedSectionIds={completedSections}
            compact={true}
          />
        </div>

        {/* Priority Red-Flag Banner (If Triggered) */}
        {isPriority && (
          <PriorityAlert
            title={t.aiInterview?.priorityAlertTitle || "Priority Review Requested"}
            message={t.aiInterview?.priorityAlertDesc || "Some of your responses (such as acute chest discomfort) will be highlighted for prompt review by hospital triage staff."}
          />
        )}

        {/* AI Health Assistant Orb */}
        <div className="py-2 flex flex-col items-center">
          <AIHealthOrb state={orbState} onClick={() => setInputMode("voice")} />

          <span className="text-xs font-semibold text-slate-400 mt-2 font-mono uppercase tracking-wider">
            {orbState === "listening"
              ? (t.aiInterview?.statusListening || "Listening...")
              : orbState === "processing"
              ? (t.aiInterview?.statusProcessing || "Processing Response...")
              : orbState === "speaking"
              ? (t.aiInterview?.statusSpeaking || "Speaking Question...")
              : (t.aiInterview?.statusIdle || "Ready to assist")}
          </span>
        </div>

        {/* Main AI Question Card */}
        {!isInterviewComplete ? (
          <div className="space-y-6">
            <AIQuestion
              questionEn={currentQ.questionEn}
              questionHi={currentQ.questionHi}
              sectionName={currentQ.section?.replace(/_/g, " ").toUpperCase()}
            />

            {/* Input Mode Switcher Strip */}
            <div className="flex items-center justify-center gap-2 pt-1 select-none">
              <button
                type="button"
                onClick={() => setInputMode("touch")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  inputMode === "touch"
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Touch Options
              </button>

              <button
                type="button"
                onClick={() => setInputMode("voice")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  inputMode === "voice"
                    ? "bg-mediblue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Answer</span>
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
                <span>Type Instead</span>
              </button>
            </div>

            {/* Input Modes */}
            {inputMode === "voice" ? (
              <VoiceRecorder
                onTranscriptConfirmed={handleVoiceConfirmed}
                onSwitchToType={() => setInputMode("text")}
                currentQuestionPrompt={language === "hi" ? currentQ.questionHi : currentQ.questionEn}
              />
            ) : (
              <TouchAnswer
                options={currentQ.options || []}
                isMultiSelect={currentQ.isMultiSelect}
                onSelectOption={handleAnswer}
                onTextSubmit={(text) => handleAnswer("custom_text", text)}
                showTextInput={inputMode === "text"}
              />
            )}
          </div>
        ) : (
          /* Interview Complete Card */
          <div className="bg-white rounded-3xl border-2 border-emerald-500 p-8 text-center space-y-5 shadow-soft animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Clinical History Intake Completed
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
                Your responses have been structured for your physician. Next, you can upload previous medical documents or prescriptions.
              </p>
            </div>

            <button
              onClick={handleProceedToDocuments}
              className="py-4 px-8 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-base shadow-md hover:shadow-lg inline-flex items-center gap-2 transition"
            >
              <span>Add Medical Documents (Optional)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Clinical Safety UX Note */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            {t.aiInterview?.clinicalUxNote ||
              "MediKiosk organizes your history for the doctor. It does not provide medical diagnoses or prescribe medications."}
          </p>
        </div>
      </div>
    </PatientLayout>
  );
}
