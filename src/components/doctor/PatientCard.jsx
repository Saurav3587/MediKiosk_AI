import React from "react";
import { Link } from "react-router-dom";
import { User, Clock, FileText, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";

export function PatientCard({ patient }) {
  if (!patient) return null;

  return (
    <div
      className={`clinical-card p-5 rounded-3xl border transition-all ${
        patient.priority
          ? "bg-red-50/30 border-red-200 hover:border-red-400"
          : "bg-white border-slate-200 hover:border-mediblue-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${
              patient.priority
                ? "bg-red-600 text-white shadow-glow-priority"
                : "bg-mediblue-600 text-white"
            }`}
          >
            {patient.token || "—"}
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-base">{patient.name}</h4>
            <p className="text-xs text-slate-500 font-medium">
              {patient.age} Yrs • {patient.gender} • {patient.department}
            </p>
          </div>
        </div>

        <StatusBadge
          status={patient.status}
          isPriority={patient.priority}
          isVerified={patient.verifiedByDoctor}
          size="small"
        />
      </div>

      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs mb-4">
        <span className="font-bold text-slate-700 block mb-0.5">Chief Complaint:</span>
        <p className="text-slate-600 line-clamp-2">{patient.chiefComplaint}</p>
        {patient.priority && patient.priorityReason && (
          <p className="text-red-700 font-semibold mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {patient.priorityReason}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            {patient.documents?.length || 0} Docs
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Wait: {patient.waitingTime || "5m"}
          </span>
        </div>

        <Link
          to={`/doctor/patient/${patient.id || patient.token}`}
          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-xs shadow-sm transition"
        >
          <span>Open Workspace</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
