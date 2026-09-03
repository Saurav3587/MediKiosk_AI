import React from "react";
import { Check } from "lucide-react";
import { INTERVIEW_SECTIONS } from "../../data/interviewQuestions";
import { usePatient } from "../../context/PatientContext";

export function HistoryProgress({ currentSectionId, completedSectionIds = [], compact = false }) {
  const { language } = usePatient();

  const totalSections = INTERVIEW_SECTIONS.length;
  const completedCount = completedSectionIds.length;
  const progressPercent = Math.min(100, Math.round(((completedCount + 0.5) / totalSections) * 100));

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-24 sm:w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-mediblue-500 to-teal-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-bold text-slate-700">{progressPercent}%</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          History Sections
        </span>
        <span className="text-xs font-bold text-mediblue-600 bg-mediblue-50 px-2.5 py-0.5 rounded-full">
          {progressPercent}% Complete
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {INTERVIEW_SECTIONS.map((sec, index) => {
          const isCompleted = completedSectionIds.includes(sec.id);
          const isCurrent = currentSectionId === sec.id;
          const label = language === "hi" ? sec.labelHi : sec.label;

          return (
            <div
              key={sec.id}
              className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition ${
                isCompleted
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : isCurrent
                  ? "bg-mediblue-50 border-mediblue-300 text-mediblue-900 font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${
                  isCompleted
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                    ? "bg-mediblue-600 text-white"
                    : "border border-slate-300 text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : index + 1}
              </div>
              <span className="truncate">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
