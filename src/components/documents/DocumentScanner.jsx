import React from "react";
import { Loader2, CheckCircle2, FileText, Sparkles } from "lucide-react";

export function DocumentScanner({ currentStage = "reading", progressPercent = 60, stageMessage = "Reading document..." }) {
  const stages = [
    { id: "uploading", label: "Uploading" },
    { id: "reading", label: "Reading OCR" },
    { id: "extracting", label: "Extracting" },
    { id: "normalizing", label: "Organizing" },
    { id: "complete", label: "Complete" },
  ];

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden p-6 text-center space-y-5">
      {/* Animated Simulated Document Viewport with Laser Beam */}
      <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 flex flex-col items-center justify-center p-4">
        {/* Laser Scanning Line */}
        <div className="laser-scanner-line" />

        {/* Faint Medical Document Mockup Graphic */}
        <div className="w-4/5 h-4/5 bg-slate-800/80 rounded-xl border border-slate-600 p-4 text-left space-y-2.5 opacity-90">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-mediblue-400" />
              <div className="h-2.5 w-24 bg-slate-600 rounded"></div>
            </div>
            <div className="h-2 w-12 bg-slate-600 rounded"></div>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="h-2 w-full bg-slate-700 rounded"></div>
            <div className="h-2 w-5/6 bg-slate-700 rounded"></div>
            <div className="h-2 w-3/4 bg-mediblue-500/40 rounded animate-pulse"></div>
            <div className="h-2 w-4/5 bg-slate-700 rounded"></div>
          </div>
        </div>

        {/* Dynamic Scanning Status Banner */}
        <div className="absolute bottom-3 left-4 right-4 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 flex items-center justify-between text-xs text-white">
          <span className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
            <span className="font-mono">{stageMessage}</span>
          </span>
          <span className="font-bold text-teal-400">{progressPercent}%</span>
        </div>
      </div>

      {/* 5-Step Progression Pills */}
      <div className="space-y-2">
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-mediblue-600 via-teal-400 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          {stages.map((s, idx) => {
            const isFinished = progressPercent >= ((idx + 1) / stages.length) * 100;
            return (
              <span
                key={s.id}
                className={`text-[10px] font-semibold ${
                  isFinished ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
