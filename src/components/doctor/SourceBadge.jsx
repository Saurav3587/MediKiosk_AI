import React from "react";
import { MessageSquare, FileText, FlaskConical, ExternalLink } from "lucide-react";

export function SourceBadge({ source = "Patient Interview", onClick, isClickable = true }) {
  const isInterview = source.toLowerCase().includes("interview") || source.toLowerCase().includes("patient");
  const isPrescription = source.toLowerCase().includes("prescription");
  const isLab = source.toLowerCase().includes("lab") || source.toLowerCase().includes("report");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border transition ${
        isInterview
          ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
          : isPrescription
          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          : isLab
          ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
      }`}
      title={isClickable ? "Click to view original source reference" : ""}
    >
      {isInterview && <MessageSquare className="w-3 h-3 text-purple-600" />}
      {isPrescription && <FileText className="w-3 h-3 text-blue-600" />}
      {isLab && <FlaskConical className="w-3 h-3 text-teal-600" />}

      <span>Source: {source}</span>
      {isClickable && <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />}
    </button>
  );
}
