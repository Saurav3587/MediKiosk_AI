import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, FileText, UserCheck, Volume2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { PatientLayout } from "../../layouts/PatientLayout";
import { usePatient } from "../../context/PatientContext";
import { speechService } from "../../services/speechService";

export function ConsentPage() {
  const navigate = useNavigate();
  const { t, language, setCurrentStep } = usePatient();
  const [hasConsented, setHasConsented] = useState(false);

  const handleListenConsent = () => {
    const text =
      language === "hi"
        ? "हम आपके द्वारा दी गई जानकारी का उपयोग आपके डॉक्टर के लिए क्लिनिकल इतिहास तैयार करने में करते हैं। आप डॉक्टर को भेजने से पहले अपनी पूरी जानकारी जांच सकते हैं।"
        : language === "bn"
        ? "আপনার দেওয়া তথ্য আমরা ডাক্তারের জন্য চিকিৎসার ইতিহাস তৈরি করতে ব্যবহার করি। জমা দেওয়ার আগে আপনি সমস্ত তথ্য যাচাই করতে পারেন।"
        : language === "ta"
        ? "உங்கள் மருத்துவ வரலாற்றை மருத்துவருக்குத் தயாரிக்க நீங்கள் தரும் தகவலைப் பயன்படுத்துகிறோம். சமர்ப்பிக்கும் முன் தகவல்களை சரிபார்க்கலாம்."
        : language === "te"
        ? "వైద్యుడి కోసం మీ క్లినికల్ రికార్డ్ సిద్ధం చేయడానికి మీరు ఇచ్చిన సమాచారాన్ని ఉపయోగిస్తాము."
        : language === "mr"
        ? "आम्ही आपल्या माहितीचा वापर डॉक्टरांसाठी वैद्यकीय इतिहास तयार करण्यासाठी करतो."
        : language === "gu"
        ? "અમે તમારી માહિતીનો ઉપયોગ તમારા ડૉક્ટર માટે તબીબી ઇતિહાસ તૈયાર કરવા માટે કરીએ છીએ."
        : language === "kn"
        ? "ವೈದ್ಯರಿಗಾಗಿ ನಿಮ್ಮ ಕ್ಲಿನಿಕಲ್ ಇತಿಹಾಸವನ್ನು ಸಿದ್ಧಪಡಿಸಲು ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಬಳಸುತ್ತೇವೆ."
        : "We use the information you provide to prepare your structured medical history draft for your healthcare professional. You have full control to review your information before submitting.";
    speechService.speakText(text, { lang: language });
  };

  const handleAgree = () => {
    if (hasConsented) {
      setCurrentStep("history");
      navigate("/patient/history");
    }
  };

  return (
    <PatientLayout activeStepId="consent">
      <div className="max-w-xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mediblue-50 text-mediblue-700 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.consent?.consentRequired || "Consent Required"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            {t.consent?.title || "Your Privacy & Consent"}
          </h1>
          <p className="text-sm text-slate-500">
            {t.consent?.subtitle || "MediKiosk is designed with your trust and medical confidentiality first."}
          </p>
        </div>

        {/* Listen Button */}
        <div className="flex justify-center">
          <button
            onClick={handleListenConsent}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-mediblue-600 hover:border-mediblue-300 text-xs font-semibold shadow-xs transition"
          >
            <Volume2 className="w-4 h-4 text-mediblue-600" />
            <span>{t.consent?.listen || "Listen to Consent Summary"}</span>
          </button>
        </div>

        {/* 3 Transparent Cards */}
        <div className="space-y-3">
          {/* Card 1 */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-soft flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-50 text-mediblue-600 flex-shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                {t.consent?.card1Title || "YOUR HEALTH INFORMATION"}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t.consent?.card1Desc ||
                  "We use the information you provide to prepare your medical history draft for your healthcare professional."}
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-soft flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                {t.consent?.card2Title || "YOUR DOCUMENTS"}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t.consent?.card2Desc ||
                  "Medical records you upload may be processed locally to extract relevant clinical parameters and timelines."}
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-soft flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 flex-shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                {t.consent?.card3Title || "YOUR CONTROL"}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t.consent?.card3Desc ||
                  "You can review and edit all your information before final submission to your doctor."}
              </p>
            </div>
          </div>
        </div>

        {/* Consent Checkbox */}
        <div
          onClick={() => setHasConsented(!hasConsented)}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3.5 ${
            hasConsented
              ? "bg-mediblue-50/70 border-mediblue-600"
              : "bg-white border-slate-300 hover:border-slate-400"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
              hasConsented
                ? "bg-mediblue-600 border-mediblue-600 text-white"
                : "border-slate-400 bg-white"
            }`}
          >
            {hasConsented && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-800 select-none leading-snug">
            {t.consent?.checkbox || "I understand and consent to the processing of the information I provide."}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/patient/language")}
            className="order-2 sm:order-1 py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.consent?.btnBack || "Go Back"}</span>
          </button>

          <button
            type="button"
            disabled={!hasConsented}
            onClick={handleAgree}
            className="order-1 sm:order-2 flex-1 py-4 px-8 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
          >
            <span>{t.consent?.btnAgree || "Agree & Continue"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            {t.consent?.secureSession || "Secure Session"}
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            {t.consent?.privacyProtected || "Privacy Protected"}
          </span>
        </div>
      </div>
    </PatientLayout>
  );
}
