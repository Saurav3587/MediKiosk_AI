import React from "react";
import { Loader2, Activity } from "lucide-react";

export function LoadingState({ message = "Preparing MediKiosk Clinical Assistant...", submessage = "Structuring medical workspace" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-mediblue-50 flex items-center justify-center border border-mediblue-100 shadow-soft">
          <Activity className="w-8 h-8 text-mediblue-600 animate-pulse" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-mediblue-400/30 animate-ping pointer-events-none"></div>
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{message}</h3>
      {submessage && <p className="text-xs text-slate-500 max-w-sm">{submessage}</p>}
    </div>
  );
}

export function SkeletonRow({ count = 3 }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse w-full"></div>
      ))}
    </div>
  );
}
