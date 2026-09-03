import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Stethoscope, Home, Clock, ArrowRight } from "lucide-react";
import { PatientLayout } from "../../layouts/PatientLayout";
import { usePatient } from "../../context/PatientContext";

export function CompletePage() {
  const navigate = useNavigate();
  const { t, patientInfo, generatedToken, isPriority, isAyushMode, resetIntake } = usePatient();

  const handleStartNewIntake = () => {
    resetIntake();
    navigate("/patient/identify");
  };

  return (
    <PatientLayout activeStepId="complete" hideStepper={true}>
      <div className="max-w-lg mx-auto w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
        {/* Animated Check Icon */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg border-2 border-emerald-200">
            <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
          </div>
          <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/40 animate-ping pointer-events-none" />
        </div>

        {/* Headings */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            {t.complete?.heading || "You're all set."}
          </h1>
          <p className="text-sm text-slate-600">
            {t.complete?.subheading || "Your medical history has been saved and is ready for physician review."}
          </p>
        </div>

        {/* Official Token Card — from database response */}
        <div className="bg-gradient-to-b from-slate-900 to-navy-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-mediblue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                {t.complete?.tokenLabel || "PATIENT TOKEN"}
              </span>
              <span className="text-3xl sm:text-4xl font-mono font-black text-white tracking-wider">
                {generatedToken || patientInfo.token || "—"}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                {t.complete?.statusLabel || "STATUS"}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isPriority
                  ? "bg-red-500/20 text-red-300 border-red-400/30"
                  : "bg-mediblue-500/20 text-teal-300 border-teal-500/30"
              }`}>
                <Clock className="w-3.5 h-3.5" />
                {isPriority ? "Priority Triage" : (t.complete?.waitingStatus || "Waiting for Doctor")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Patient Name</span>
              <strong className="text-white text-sm">{patientInfo.name || "—"}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">{t.complete?.deptLabel || "Department"}</span>
              <strong className="text-teal-300 text-sm">
                {isAyushMode ? "AYUSH / Ayurveda" : patientInfo.department || "General Medicine"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">ABHA ID</span>
              <strong className="text-white text-sm font-mono">{patientInfo.abhaId || "—"}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Patient ID</span>
              <strong className="text-white text-sm font-mono">{patientInfo.id || "—"}</strong>
            </div>
          </div>

          {/* 3 Green Processed Checkmarks */}
          <div className="space-y-2 border-t border-slate-800/90 pt-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{t.complete?.step1 || "Clinical History Saved to Database ✓"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{t.complete?.step2 || "Documents Processed & Attached ✓"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{t.complete?.step3 || "Queued for Physician Review ✓"}</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {t.complete?.message || "Your doctor will see this structured clinical draft during your consultation. Please wait for your token to be called."}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate("/doctor/queue")}
            className="w-full py-4 px-6 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Stethoscope className="w-5 h-5" />
            <span>{t.complete?.btnSwitchDoctor || "Go to Doctor's Queue"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleStartNewIntake}
            className="w-full py-3 px-6 rounded-2xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            <span>{t.complete?.btnDone || "Start New Patient Intake"}</span>
          </button>
        </div>
      </div>
    </PatientLayout>
  );
}
