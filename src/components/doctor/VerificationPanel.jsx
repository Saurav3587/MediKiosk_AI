import React from "react";
import { CheckCircle2, ShieldCheck, PlayCircle, Edit, MessageSquare, AlertCircle } from "lucide-react";

export function VerificationPanel({
  patient,
  isVerified,
  verifiedBy,
  verifiedAt,
  onVerify,
  onStartConsultation,
  onEditHistory,
  onRequestClarification,
}) {
  return (
    <div className="sticky bottom-4 z-40 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
      {/* Status Info */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div
          className={`p-2.5 rounded-2xl ${
            isVerified
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
          }`}
        >
          {isVerified ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-100">
              {isVerified ? "Physician Verified" : "Pending Physician Verification"}
            </h4>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Token {patient?.token || "—"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {isVerified
              ? `Verified by ${verifiedBy || "Dr. Sharma"} • ${
                  verifiedAt ? new Date(verifiedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today"
                }`
              : "Review patient responses and document findings before consultation."}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
        <button
          onClick={onEditHistory}
          className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Edit Draft</span>
        </button>

        <button
          onClick={onRequestClarification}
          className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span>Clarify</span>
        </button>

        {!isVerified ? (
          <button
            onClick={onVerify}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verify History</span>
          </button>
        ) : (
          <button
            onClick={onStartConsultation}
            className="px-5 py-2.5 rounded-2xl bg-mediblue-600 hover:bg-mediblue-500 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start Consultation</span>
          </button>
        )}
      </div>
    </div>
  );
}
