import React, { useState } from "react";
import { Sparkles, CheckCircle2, ShieldAlert, Edit3, HelpCircle, ShieldCheck } from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";

export function ClinicalSummary({
  summaryText,
  isVerified,
  verifiedDoctorName,
  verifiedAt,
  onVerify,
  onEdit,
  onRequestClarification,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(summaryText || "");

  const handleSaveEdit = () => {
    setIsEditing(false);
    onEdit?.(draftText);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-navy-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-mediblue-600/40 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base tracking-tight">AI-Prepared Clinical History</h3>
            <span className="text-xs text-slate-300">Synthesized pre-consultation intake draft</span>
          </div>
        </div>

        <div>
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified by {verifiedDoctorName || "Dr. Sharma"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-semibold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              Pending Physician Verification
            </span>
          )}
        </div>
      </div>

      {/* Summary Body */}
      <div className="p-6 space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">
              Edit Clinical Draft:
            </label>
            <textarea
              rows={4}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="w-full p-4 text-sm rounded-2xl border border-mediblue-300 focus:outline-none focus:ring-2 focus:ring-mediblue-500 bg-slate-50 font-sans"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-lg bg-mediblue-600 text-white text-xs font-bold hover:bg-mediblue-700 shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-800 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            {summaryText || "No clinical draft generated yet."}
          </p>
        )}

        {/* Clinical UX Non-Diagnosis Disclaimer */}
        <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
          <HelpCircle className="w-4 h-4 text-mediblue-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Clinical Safety Protocol:</strong> Prepared from patient responses and uploaded medical records. This is a structured clinical-history draft and <em>not an AI diagnosis</em>.
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            Edit Draft
          </button>
          <button
            onClick={onRequestClarification}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Request Clarification
          </button>
        </div>

        {!isVerified && (
          <button
            onClick={onVerify}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            Verify Clinical History
          </button>
        )}
      </div>
    </div>
  );
}
