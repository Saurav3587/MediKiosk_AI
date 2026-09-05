import React, { useState } from "react";
import { Mic, MicOff, MessageSquare, Volume2, AlertCircle, Globe, Square } from "lucide-react";
import { speechService } from "../../services/speechService";
import { VoiceWaveform } from "./VoiceWaveform";
import { usePatient } from "../../context/PatientContext";

export function VoiceRecorder({
  onTranscriptConfirmed,
  onSwitchToType,
  currentQuestionPrompt = "",
  suggestedChips = [],
}) {
  const { language, t } = usePatient();
  // Spoken language: match patient language preference (en or hi)
  const [speechLang, setSpeechLang] = useState(language === "hi" ? "hi" : "en");

  React.useEffect(() => {
    setSpeechLang(language === "hi" ? "hi" : "en");
  }, [language]);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);

  const handleSpeakQuestion = () => {
    if (!currentQuestionPrompt) return;
    setIsSpeakingPrompt(true);

    speechService.speakText(currentQuestionPrompt, {
      lang: speechLang,
      onStart: () => setIsSpeakingPrompt(true),
      onEnd: () => setIsSpeakingPrompt(false),
    });
  };

  const handleStartListening = () => {
    setErrorMessage(null);
    setLiveTranscript("");

    if (!speechService.isSpeechRecognitionSupported()) {
      setErrorMessage("Microphone recognition is not supported in this browser. You can type or pick a quick answer.");
      return;
    }

    setIsListening(true);
    let capturedText = "";
    let hasDispatched = false;

    const dispatchTranscript = (text) => {
      if (hasDispatched) return;
      const clean = (text || "").trim();
      if (!clean) return;
      hasDispatched = true;
      capturedText = "";
      setLiveTranscript("");
      setIsListening(false);
      try {
        speechService.stopListening();
      } catch (e) {}
      onTranscriptConfirmed(clean);
    };

    speechService.startListening({
      lang: speechLang,
      onResult: (text, isFinal) => {
        if (hasDispatched) return;
        setLiveTranscript(text);
        capturedText = text;
        // DIRECT TRANSMISSION: When speech recognition detects final sentence, dispatch once!
        if (isFinal && text.trim()) {
          dispatchTranscript(text);
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
          setErrorMessage("Could not capture speech clearly. You can try speaking again or pick an answer.");
        }
      },
      onEnd: () => {
        setIsListening(false);
        // Only dispatch if not already sent by isFinal
        if (!hasDispatched && capturedText.trim()) {
          dispatchTranscript(capturedText);
        }
      },
    });
  };

  // Immediate send if user taps "Done Speaking" while recording
  const handleStopAndSend = () => {
    speechService.stopListening();
    setIsListening(false);
    if (liveTranscript.trim()) {
      onTranscriptConfirmed(liveTranscript.trim());
      setLiveTranscript("");
    }
  };

  // Immediate send on chip tap - NO confirmation
  const handleQuickChip = (text) => {
    onTranscriptConfirmed(text);
  };

  const defaultChips = speechLang === "hi"
    ? ["हाँ (Yes)", "नहीं (No)", "2 दिनों से", "हल्का दर्द", "काफी तेज दर्द", "कोई दवा नहीं"]
    : ["Yes", "No", "Since 2 days", "Mild discomfort", "Severe discomfort", "No medications"];

  const activeChips = suggestedChips && suggestedChips.length > 0 ? suggestedChips : defaultChips;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center space-y-4 select-none animate-in fade-in duration-200">
      {/* Language Selector & Hear Prompt Button */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1">
        {/* Speaking Language Toggle (Hindi vs English) */}
        <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <span className="text-slate-500 px-2 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-mediblue-600" />
            <span className="hidden sm:inline">बोलने की भाषा:</span>
          </span>
          <button
            type="button"
            onClick={() => setSpeechLang("hi")}
            className={`px-3 py-1 rounded-lg transition font-bold ${
              speechLang === "hi"
                ? "bg-mediblue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-navy-900"
            }`}
          >
            🇮🇳 हिन्दी (Hindi)
          </button>
          <button
            type="button"
            onClick={() => setSpeechLang("en")}
            className={`px-3 py-1 rounded-lg transition font-bold ${
              speechLang === "en"
                ? "bg-mediblue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-navy-900"
            }`}
          >
            English
          </button>
        </div>

        {currentQuestionPrompt && (
          <button
            type="button"
            onClick={handleSpeakQuestion}
            disabled={isSpeakingPrompt}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-mediblue-50 hover:bg-mediblue-100 disabled:opacity-60 text-mediblue-700 text-xs font-bold border border-mediblue-200/60 shadow-xs transition"
          >
            <Volume2 className={`w-3.5 h-3.5 text-mediblue-600 ${isSpeakingPrompt ? "animate-bounce" : ""}`} />
            <span>{isSpeakingPrompt ? "Speaking..." : "Hear Question Out Loud"}</span>
          </button>
        )}
      </div>

      {/* Waveform and Live Transcript when listening */}
      {isListening ? (
        <div className="space-y-3 text-center w-full animate-in fade-in zoom-in-95">
          <VoiceWaveform active={true} />
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
            <span>
              {speechLang === "hi" ? "सुन रहे हैं... बोलते ही तुरंत उत्तर भेजा जाएगा" : "Listening... reply sends automatically when you finish speaking"}
            </span>
          </div>

          {liveTranscript && (
            <p className="text-sm font-semibold text-slate-900 bg-white p-3.5 rounded-2xl border-2 border-mediblue-400 shadow-sm italic animate-in fade-in">
              "{liveTranscript}"
            </p>
          )}

          {/* Quick stop & send button */}
          <button
            type="button"
            onClick={handleStopAndSend}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-xs shadow-md transition"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>{speechLang === "hi" ? "बोलना समाप्त (Send Now)" : "Done Speaking (Send Now)"}</span>
          </button>
        </div>
      ) : (
        /* Microphone Action Area (Ready to speak) */
        <div className="flex flex-col items-center space-y-4 w-full">
          <button
            type="button"
            onClick={handleStartListening}
            className="relative group flex items-center justify-center w-24 h-24 rounded-full shadow-xl bg-gradient-to-tr from-mediblue-600 to-teal-500 text-white hover:shadow-glow-blue transition-all transform hover:scale-105 active:scale-95"
          >
            <Mic className="w-10 h-10" />
            <div className="absolute -inset-2 rounded-full border-2 border-mediblue-400/40 animate-ping pointer-events-none" />
          </button>

          <div className="text-center space-y-1">
            <span className="text-sm font-bold text-slate-900 block">
              {speechLang === "hi"
                ? "बोलने के लिए माइक बटन दबाएं"
                : (t.aiInterview?.tapToSpeak || "Tap microphone to speak your answer")}
            </span>
            <p className="text-xs text-slate-500">
              {speechLang === "hi"
                ? "आपकी बात समाप्त होते ही AI तुरंत जवाब देगा (बिना किसी रोक-टोक के)।"
                : "Speech sends automatically to the AI assistant with zero confirmation."}
            </p>
          </div>

          {/* Quick Answer Suggested Chips (Direct click to send) */}
          <div className="w-full pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-2">
              {speechLang === "hi" ? "या तुरंत उत्तर चुनें (1-Tap Send):" : "Or tap a quick phrase (1-Tap Send):"}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {activeChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickChip(chip)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-mediblue-50 hover:text-mediblue-700 border border-slate-200 hover:border-mediblue-300 text-xs font-medium text-slate-700 transition active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && !isListening && (
        <div className="w-full p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-[11px] text-amber-700">सुझाव: आप नीचे दिए गए विकल्पों में से भी चुन सकते हैं या लिखकर बता सकते हैं।</p>
          </div>
        </div>
      )}

      {/* Switch to text alternative */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onSwitchToType}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-mediblue-600 transition"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Prefer typing? Switch to text box</span>
        </button>
      </div>
    </div>
  );
}
