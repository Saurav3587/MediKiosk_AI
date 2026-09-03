import React from "react";
import { Volume2, Sparkles } from "lucide-react";
import { useAccessibility } from "../../context/AccessibilityContext";
import { usePatient } from "../../context/PatientContext";

export function AIQuestion({ questionEn, questionHi, sectionName }) {
  const { language } = usePatient();
  const { speakGuidance, assistedMode } = useAccessibility();

  const currentText = language === "hi" ? (questionHi || questionEn) : questionEn;

  const handleSpeak = () => {
    speakGuidance(currentText, language);
  };

  return (
    <div className={`w-full bg-white rounded-3xl border border-slate-200/90 shadow-soft p-6 sm:p-8 text-center relative overflow-hidden transition-all question-card ${
      assistedMode ? "py-10" : ""
    }`}>
      {/* Top Accent Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-mediblue-500 via-teal-400 to-blue-600" />

      {/* Section Badge */}
      {sectionName && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mediblue-50 text-mediblue-700 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3 h-3 text-mediblue-500" />
          <span>{sectionName}</span>
        </div>
      )}

      {/* Large Clinical Question Text */}
      <h2 className={`font-bold text-slate-900 leading-snug tracking-tight mx-auto max-w-2xl ${
        assistedMode ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
      }`}>
        {currentText}
      </h2>

      {/* Speaker Narration Button */}
      <div className="mt-4 flex items-center justify-center">
        <button
          onClick={handleSpeak}
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-mediblue-50 text-slate-700 hover:text-mediblue-700 text-xs font-semibold transition"
          title="Listen to question"
        >
          <Volume2 className="w-3.5 h-3.5 text-mediblue-600" />
          <span>Listen</span>
        </button>
      </div>
    </div>
  );
}
