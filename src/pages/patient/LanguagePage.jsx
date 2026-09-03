import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, Check, ArrowRight, Sparkles } from "lucide-react";
import { PatientLayout } from "../../layouts/PatientLayout";
import { LANGUAGES } from "../../locales/translations";
import { usePatient } from "../../context/PatientContext";
import { speechService } from "../../services/speechService";

export function LanguagePage() {
  const navigate = useNavigate();
  const { language, setLanguage, t, setCurrentStep } = usePatient();
  const [selectedCode, setSelectedCode] = useState(language || "en");

  const handleSelect = (code) => {
    setSelectedCode(code);
    setLanguage(code);
  };

  const handleAudioPreview = (e, lang) => {
    e.stopPropagation();
    const textToSpeak =
      lang.code === "hi"
        ? "नमस्ते, MediKiosk में आपका स्वागत है।"
        : lang.code === "bn"
        ? "নমস্কার, MediKiosk এ আপনাকে স্বাগতম।"
        : lang.code === "ta"
        ? "வணக்கம், MediKiosk-க்கு உங்களை வரவேற்கிறோம்."
        : lang.code === "te"
        ? "నమస్కారం, MediKiosk కు స్వాగతం."
        : lang.code === "mr"
        ? "नमस्कार, MediKiosk मध्ये आपले स्वागत आहे."
        : lang.code === "gu"
        ? "નમસ્તે, MediKiosk માં આપનું સ્વાગત છે."
        : lang.code === "kn"
        ? "ನಮಸ್ಕಾರ, MediKiosk ಗೆ ಸುಸ್ವಾಗತ."
        : `Welcome to MediKiosk. Language set to ${lang.name}.`;
    speechService.speakText(textToSpeak, { lang: lang.code });
  };

  const handleContinue = () => {
    setLanguage(selectedCode);
    setCurrentStep("consent");
    navigate("/patient/consent");
  };

  return (
    <PatientLayout activeStepId="language">
      <div className="max-w-2xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            {t.languagePage?.title || "Which language are you most comfortable with?"}
          </h1>
          <p className="text-sm text-slate-500">
            {t.languagePage?.subtitle || "You can speak or read in your preferred language throughout intake."}
          </p>
        </div>

        {/* 10 Language Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedCode === lang.code;

            return (
              <div
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group active:scale-[0.98] ${
                  isSelected
                    ? "bg-mediblue-50/80 border-mediblue-600 shadow-soft"
                    : "bg-white border-slate-200 hover:border-mediblue-300 hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-xs ${
                      isSelected ? "bg-mediblue-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span>{lang.flag}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{lang.nativeName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{lang.name}</span>
                      {lang.supported ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                          Live UI
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {t.languagePage?.demoNotice || "Demo translation support ready"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Speaker Audio Preview Button */}
                  <button
                    type="button"
                    onClick={(e) => handleAudioPreview(e, lang)}
                    className="p-2 rounded-xl text-slate-400 hover:text-mediblue-600 hover:bg-mediblue-100 transition"
                    title="Listen language preview"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  {/* Radio / Check mark */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "bg-mediblue-600 border-mediblue-600 text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center pt-2 max-w-sm mx-auto">
          <button
            onClick={handleContinue}
            className="w-full py-4 px-8 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
          >
            <span>Agree & Continue</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </PatientLayout>
  );
}
