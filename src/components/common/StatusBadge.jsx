import React from "react";
import { CheckCircle2, Clock, AlertTriangle, UserCheck, Loader2 } from "lucide-react";

export function StatusBadge({ status, isPriority, isVerified, size = "default" }) {
  const isSm = size === "small";

  if (isVerified) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
        <CheckCircle2 className={`${isSm ? "w-3 h-3" : "w-3.5 h-3.5"} text-emerald-600`} />
        Physician Verified
      </span>
    );
  }

  if (isPriority || status === "Priority") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 animate-pulse ${isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
        <AlertTriangle className={`${isSm ? "w-3 h-3" : "w-3.5 h-3.5"} text-red-600`} />
        Priority Review
      </span>
    );
  }

  switch (status) {
    case "Ready":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
          <CheckCircle2 className={`${isSm ? "w-3 h-3" : "w-3.5 h-3.5"} text-blue-600`} />
          Ready for Doctor
        </span>
      );
    case "Consulting":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
          <UserCheck className={`${isSm ? "w-3 h-3" : "w-3.5 h-3.5"} text-purple-600`} />
          In Consultation
        </span>
      );
    case "Processing":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
          <Loader2 className={`${isSm ? "w-3 h-3" : "w-3.5 h-3.5"} animate-spin text-amber-600`} />
          Intake in Progress
        </span>
      );
    case "Completed":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
          <CheckCircle2 className={`${isSm ? "w-3 h-3" : "w-3.5 h-3.5"} text-slate-500`} />
          Completed
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 ${isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
          <Clock className="w-3 h-3 text-slate-500" />
          {status || "Waiting"}
        </span>
      );
  }
}
