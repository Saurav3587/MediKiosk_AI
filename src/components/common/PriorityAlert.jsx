import React from "react";
import { AlertOctagon, ShieldAlert } from "lucide-react";

export function PriorityAlert({ title, message, doctorView = false }) {
  return (
    <div className="rounded-xl bg-red-50/90 border border-red-200 p-4 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-600"></div>
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-red-100 text-red-700 flex-shrink-0 mt-0.5">
          {doctorView ? <ShieldAlert className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-red-900">
              {title || "Priority Review Requested"}
            </h4>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white rounded">
              Triage Flag
            </span>
          </div>
          <p className="text-xs text-red-800 leading-relaxed">
            {message ||
              "Some of your responses (such as acute chest discomfort) will be highlighted for prompt review by hospital triage staff."}
          </p>
          <p className="text-[11px] font-medium text-red-600 mt-1">
            * Note: An alert has been queued for the clinical team. This is a triage protocol and not a diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
