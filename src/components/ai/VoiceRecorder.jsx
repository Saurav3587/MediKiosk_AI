import React, { useState, useEffect } from "react";
import { Mic, MicOff, Check, RotateCcw, Edit3, MessageSquare, Volume2, Sparkles, AlertCircle } from "lucide-react";
import { speechService } from "../../services/speechService";
import { VoiceWaveform } from "./VoiceWaveform";
import { usePatient } from "../../context/PatientContext";

export function VoiceRecorder({
  onTranscriptConfirmed,
  onSwitchToType,
  currentQuestionPrompt = "",
}) {
  const { language, t } = usePatient();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hasRecognized, setHasRecognized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleStartListening = () => {
    setErrorMessage(null);
    setHasRecognized(false);
    setTranscript("");

    if (!speechService.isSpeechRecognitionSupported()) {
      setErrorMessage("Microphone recognition is not supported in this browser. You can type or pick a quick answer.");
      return;
    }

    setIsListening(true);
    const recognition = speechService.startListening({
      lang: language,
      onResult: (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          setIsListening(false);
          setHasRecognized(true);
        }
      },
      onError: (err) => {
        setIsListening(false);
        console.warn("Speech recognition event:", err);
        if (err.error === "not-allowed") {
          setErrorMessage("Microphone permission denied. Please allow mic access in your browser settings.");
        } else if (err.error === "no-speech") {
          setErrorMessage("No speech detected. Please speak closer to the microphone and try again.");
        } else {
          setErrorMessage("Could not capture speech clearly. You can try speaking again or type your answer.");
        }
      },
      onEnd: () => {
        setIsListening(false);
        if (transcript.trim()) {
          setHasRecognized(true);
        }
      },
    });
  };

  const handleConfirm = () => {
    if (transcript.trim()) {
      onTranscriptConfirmed(transcript.trim());
      setTranscript("");
      setHasRecognized(false);
      setIsEditing(false);
    }
  };

  const handleRetry = () => {
    setTranscript("");
    setHasRecognized(false);
    setIsEditing(false);
    handleStartListening();
  };

  const handleQuickChip = (text) => {
    setTranscript(text);
    setHasRecognized(true);
    setErrorMessage(null);
  };

  const sampleChips = language === "hi"
    ? ["हाँ (Yes)", "नहीं (No)", "2 दिनों से", "हल्का दर्द", "कोई एलर्जी नहीं", "सामान्य"]
    : ["Yes", "No", "Since 2 days", "Mild discomfort", "No allergies", "Normal"];

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center space-y-4 select-none animate-in fade-in duration-200">
      {/* Waveform when listening */}
      {isListening && (
        <div className="space-y-3 text-center w-full animate-in fade-in zoom-in-95">
          <VoiceWaveform active={true} />
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
            <span>{t.aiInterview?.listening || "Listening... Speak clearly into the microphone"}</span>
          </div>
          {transcript && (
            <p className="text-sm font-medium text-slate-800 bg-white p-3 rounded-xl border border-slate-200 italic shadow-sm">
              "{transcript}..."
            </p>
          )}
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && !isListening && (
        <div className="w-full p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-[11px] text-amber-700">Tip: You can also choose from the quick phrases below or type your response.</p>
          </div>
        </div>
      )}

      {/* Transcription Confirmation & Edit Card */}
      {hasRecognized && transcript ? (
        <div className="w-full bg-white rounded-3xl border-2 border-mediblue-300 p-6 shadow-soft space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-mediblue-600" />
              {t.aiInterview?.weHeard || "Captured Voice Answer:"}
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-semibold text-mediblue-600 hover:text-mediblue-800 flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditing ? "Done Editing" : "Edit Text"}</span>
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full p-3.5 rounded-2xl border-2 border-mediblue-400 focus:outline-none text-sm font-medium text-slate-900 bg-white"
              rows={3}
              autoFocus
            />
          ) : (
            <div className="text-base font-semibold text-slate-900 bg-slate-50 p-4 rounded-2xl border border-slate-200 italic">
              "{transcript}"
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 font-bold text-white shadow-md hover:shadow-lg transition text-sm"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t.aiInterview?.btnCorrect || "Confirm & Continue ✓"}</span>
            </button>

            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-1.5 py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 text-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.aiInterview?.btnTryAgain || "Speak Again"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Microphone Action Area */
        !isListening && (
          <div className="flex flex-col items-center space-y-4 w-full">
            <button
              type="button"
              onClick={handleStartListening}
              className="relative group flex items-center justify-center w-24 h-24 rounded-full shadow-xl bg-gradient-to-tr from-mediblue-600 to-teal-500 text-white hover:shadow-glow-blue transition-all transform hover:scale-105 active:scale-95"
            >
              <Mic className="w-10 h-10" />
              <div className="absolute -inset-1 rounded-full border-2 border-mediblue-400/40 animate-ping pointer-events-none" />
            </button>

            <div className="text-center">
              <h4 className="text-base font-bold text-slate-900">
                {t.aiInterview?.tapToSpeak || "Tap to Speak into Microphone"}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "hi" ? "अपनी भाषा में बोलें • आवाज से उत्तर दें" : "Speak naturally in your selected language"}
              </p>
            </div>

            {/* Quick Voice Suggestion Chips */}
            <div className="w-full pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-2">
                Or tap a common quick response:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {sampleChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickChip(chip)}
                    className="px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-mediblue-400 hover:bg-mediblue-50 text-slate-700 hover:text-mediblue-700 text-xs font-semibold shadow-xs transition active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
