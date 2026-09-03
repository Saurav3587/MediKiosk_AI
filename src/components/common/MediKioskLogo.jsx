import React from "react";
import { Activity, Sparkles, ShieldCheck } from "lucide-react";

export function MediKioskLogo({ size = "default", showTagline = true, light = false }) {
  const isCompact = size === "compact";
  const isLarge = size === "large";

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Brand Icon: Cross + Pulse + AI Spark */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-mediblue-600 to-teal-500 shadow-md ${
          isCompact ? "w-8 h-8 rounded-lg" : isLarge ? "w-12 h-12 rounded-2xl" : "w-10 h-10"
        }`}
      >
        <Activity className={`${isCompact ? "w-4 h-4" : isLarge ? "w-7 h-7" : "w-5 h-5"} text-white`} />
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
          <Sparkles className="w-2 h-2 text-navy-900" />
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold tracking-tight ${
              isCompact ? "text-lg" : isLarge ? "text-2xl" : "text-xl"
            } ${light ? "text-white" : "text-navy-900"}`}
          >
            Medi<span className="text-mediblue-600">Kiosk</span>
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-mediblue-100 text-mediblue-800 rounded tracking-wider uppercase">
            AI
          </span>
        </div>

        {showTagline && (
          <span
            className={`text-[11px] font-medium tracking-tight ${
              light ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Clinical Intake Platform
          </span>
        )}
      </div>
    </div>
  );
}
