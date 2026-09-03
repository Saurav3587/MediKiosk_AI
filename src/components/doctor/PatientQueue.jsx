import React from "react";
import { Link } from "react-router-dom";
import { Clock, FileText, ChevronRight, AlertTriangle, ShieldCheck, User } from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import { PatientCard } from "./PatientCard";

export function PatientQueue({ patients = [] }) {
  if (!patients.length) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-sm text-slate-500 font-medium">No patients currently in this queue.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden lg:block bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4">Token</th>
              <th className="py-3.5 px-4">Patient</th>
              <th className="py-3.5 px-4">Age / Sex</th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4">Chief Complaint</th>
              <th className="py-3.5 px-4 text-center">Docs</th>
              <th className="py-3.5 px-4">Triage Status</th>
              <th className="py-3.5 px-4">Wait Time</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => {
              const isPriority = patient.priority;
              return (
                <tr
                  key={patient.id || patient.token}
                  className={`hover:bg-slate-50/90 transition-colors ${
                    isPriority ? "bg-red-50/25" : ""
                  }`}
                >
                  {/* Token */}
                  <td className="py-3 px-4 font-mono font-bold">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs ${
                        isPriority
                          ? "bg-red-600 text-white font-bold shadow-sm"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      {patient.token}
                    </span>
                  </td>

                  {/* Patient Name & ABHA */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-sm">{patient.name}</div>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      ABHA: {patient.abhaId ? patient.abhaId.slice(-9) : "N/A"}
                    </span>
                  </td>

                  {/* Age / Sex */}
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {patient.age} / {patient.gender?.[0]}
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {patient.department}
                    </span>
                  </td>

                  {/* Chief Complaint */}
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-slate-800 font-medium truncate">{patient.chiefComplaint}</p>
                    {isPriority && (
                      <span className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        Priority Flagged
                      </span>
                    )}
                  </td>

                  {/* Docs Count */}
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-slate-600 font-semibold px-2 py-0.5 rounded bg-slate-100">
                      <FileText className="w-3 h-3 text-slate-400" />
                      {patient.documents?.length || 0}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusBadge
                      status={patient.status}
                      isPriority={patient.priority}
                      isVerified={patient.verifiedByDoctor}
                      size="small"
                    />
                  </td>

                  {/* Wait Time */}
                  <td className="py-3 px-4 text-slate-500 font-medium font-mono">
                    {patient.waitingTime || "5m"}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/doctor/patient/${patient.id || patient.token}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {patients.map((patient) => (
          <PatientCard key={patient.id || patient.token} patient={patient} />
        ))}
      </div>
    </>
  );
}
