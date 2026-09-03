import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldAlert, ArrowRight, Clock, FileText, User } from "lucide-react";
import { DoctorLayout } from "../../layouts/DoctorLayout";
import { useDoctor } from "../../context/DoctorContext";

export function DoctorPriorityPage() {
  const { patients } = useDoctor();
  const priorityPatients = patients.filter((p) => p.priority);

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-soft flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-glow-priority animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-red-950 tracking-tight">
                  Priority Review & Clinical Triage
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold font-mono">
                  {priorityPatients.length} Active
                </span>
              </div>
              <p className="text-xs text-red-800 mt-0.5">
                Patients flagged by clinical red-flag triggers (e.g. acute chest discomfort, exertional dyspnea, extreme hyperglycemia) for prompt physician review.
              </p>
            </div>
          </div>
        </div>

        {/* Priority Patient Cards */}
        {priorityPatients.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-sm text-slate-500 font-medium">No priority patients currently waiting.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priorityPatients.map((patient) => (
              <div
                key={patient.id || patient.token}
                className="bg-white rounded-3xl border-2 border-red-200 p-6 shadow-soft hover:shadow-soft-lg transition-all space-y-4 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600" />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-mono font-black text-sm flex items-center justify-center shadow-sm">
                      {patient.token}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{patient.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {patient.age} Yrs • {patient.gender} • {patient.department}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 animate-pulse">
                    Priority Flag
                  </span>
                </div>

                {/* Chief Complaint */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Chief Complaint:</span>
                  <p className="text-slate-900 font-semibold">{patient.chiefComplaint}</p>
                </div>

                {/* Clinical Triage Reason (NO diagnosis claim) */}
                <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200 text-xs text-red-900">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block mb-0.5">Triage Indication:</strong>
                      <p>{patient.priorityReason || "Responses require prompt clinical review."}</p>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Waiting: {patient.waitingTime || "5 min"}
                  </span>

                  <Link
                    to={`/doctor/patient/${patient.id || patient.token}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    <span>Review Patient</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
