import React from "react";
import { Check, User, Globe, Shield, HeartPulse, FileText, CheckCircle2, Award } from "lucide-react";
import { usePatient } from "../context/PatientContext";

export const PATIENT_STEPS = [
  { id: "identify", label: "Identify", icon: User },
  { id: "language", label: "Language", icon: Globe },
  { id: "consent", label: "Consent", icon: Shield },
  { id: "history", label: "History", icon: HeartPulse },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "review", label: "Review", icon: CheckCircle2 },
  { id: "complete", label: "Complete", icon: Award },
];

export function ProgressStepper({ activeStepId = "identify" }) {
  const { t } = usePatient();
  const currentIndex = PATIENT_STEPS.findIndex((s) => s.id === activeStepId);

  return (
    <div className="w-full bg-white border-b border-slate-200/90 py-3 px-4 shadow-sm select-none">
      <div className="max-w-4xl mx-auto">
        {/* Desktop Stepper */}
        <div className="hidden sm:flex items-center justify-between relative">
          {/* Background Connecting Line */}
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />

          {/* Active Progress Bar */}
          <div
            className="absolute top-1/2 left-6 -translate-y-1/2 h-0.5 bg-mediblue-600 transition-all duration-500 -z-0"
            style={{
              width: `${(Math.max(0, currentIndex) / (PATIENT_STEPS.length - 1)) * 100}%`,
              maxWidth: "calc(100% - 3rem)",
            }}
          />

          {PATIENT_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = step.icon;
            const label = t.stepper?.[step.id] || step.label;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center group">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-xs ${
                    isCompleted
                      ? "bg-mediblue-600 text-white shadow-sm"
                      : isCurrent
                      ? "bg-navy-900 text-white ring-4 ring-mediblue-100 shadow-md scale-110"
                      : "bg-white border-2 border-slate-300 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                </div>

                <span
                  className={`text-[11px] font-bold mt-1.5 transition-colors ${
                    isCurrent
                      ? "text-navy-900"
                      : isCompleted
                      ? "text-mediblue-800"
                      : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile Stepper */}
        <div className="flex sm:hidden items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center">
              {currentIndex + 1}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                {t.stepper?.[PATIENT_STEPS[currentIndex]?.id] || PATIENT_STEPS[currentIndex]?.label}
              </span>
              <span className="text-[10px] text-slate-400">
                Step {currentIndex + 1} of {PATIENT_STEPS.length}
              </span>
            </div>
          </div>

          <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-mediblue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / PATIENT_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
