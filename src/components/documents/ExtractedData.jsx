import React, { useState } from "react";
import { Check, Edit2, Trash2, Eye, ShieldAlert, Sparkles, Building2, Calendar, FileText } from "lucide-react";

export function ExtractedData({ document, onConfirm, onEdit, onDelete, onViewOriginal }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(document?.extractedData || {});

  if (!document) return null;

  const { extractedData, type, date, hospital, confidence = 95 } = document;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Banner with AI Badge and Confidence */}
      <div className="bg-gradient-to-r from-slate-900 to-navy-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-mediblue-600/40 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-tight">AI-Extracted Clinical Information</h4>
            <span className="text-[11px] text-slate-300">OCR Entity Recognition & Normalization</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Needs Verification
          </span>
          <span className="px-2.5 py-1 text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full">
            {confidence}% Confidence
          </span>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-mediblue-600" />
          <span>Type: <strong className="text-slate-800">{type}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-mediblue-600" />
          <span>Date: <strong className="text-slate-800">{date || "Recent"}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-mediblue-600" />
          <span className="truncate">Facility: <strong className="text-slate-800">{hospital || "Hospital"}</strong></span>
        </div>
      </div>

      {/* Extracted Details Content */}
      <div className="p-6 space-y-4">
        {/* If Lab Parameters */}
        {extractedData?.parameters && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-2">Parameter</th>
                  <th className="pb-2">Value</th>
                  <th className="pb-2">Reference</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extractedData.parameters.map((param, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-2.5 font-semibold text-slate-800">{param.name}</td>
                    <td className="py-2.5 font-bold text-mediblue-700">
                      {param.value} <span className="text-[11px] font-normal text-slate-500">{param.unit}</span>
                    </td>
                    <td className="py-2.5 text-slate-500">{param.reference || "--"}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          param.status === "High" || param.status === "Very High"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : param.status === "Borderline High"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {param.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-500">{param.confidence || 95}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* If Medications List */}
        {extractedData?.medications && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Identified Medications
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {extractedData.medications.map((med, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{med.name}</span>
                    <p className="text-slate-500 text-[11px]">{med.dose || "1 tab daily"}</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 rounded">
                    Rx
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* If Radiography / Summary Text */}
        {extractedData?.findings && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <strong className="block text-slate-900 mb-1">Radiology Findings:</strong>
            {extractedData.findings}
          </div>
        )}

        {/* Mandatory Clinical UX Disclaimer */}
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
          <strong>Clinical Verification Notice:</strong> Automatically extracted information should be verified by your attending physician before clinical decision-making.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onViewOriginal && (
            <button
              onClick={onViewOriginal}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              View Original
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>

        <button
          onClick={onConfirm}
          className="px-5 py-2.5 rounded-xl bg-mediblue-600 hover:bg-mediblue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
        >
          <Check className="w-4 h-4" />
          Confirm & Add to Medical Timeline
        </button>
      </div>
    </div>
  );
}
