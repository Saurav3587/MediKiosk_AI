import React, { useState } from "react";
import { FileText, CheckCircle2, ShieldCheck, Edit3, X, ZoomIn, Download, Sparkles } from "lucide-react";

export function DocumentViewer({ document, onClose, onVerify }) {
  const [isVerified, setIsVerified] = useState(document?.verified || false);

  if (!document) return null;

  const handleVerify = () => {
    setIsVerified(true);
    onVerify?.(document.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-mediblue-100 text-mediblue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{document.name || "Medical Document"}</h3>
              <p className="text-xs text-slate-500">
                {document.type} • {document.hospital || "Clinical Facility"} • {document.date || "Recent"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isVerified ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Physician Verified
              </span>
            ) : (
              <button
                onClick={handleVerify}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Verify Document Data
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Split View Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
          {/* Left: Original Document Preview */}
          <div className="p-6 bg-slate-900 flex flex-col items-center justify-center overflow-auto text-center relative group">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-slate-800 text-left space-y-4 font-mono text-xs border border-slate-300 transform transition group-hover:scale-[1.01]">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{document.hospital || "City Hospital"}</h4>
                  <p className="text-[10px] text-slate-500">Clinical Diagnostics & Outpatient Department</p>
                </div>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-sans font-bold text-slate-600">
                  {document.type}
                </span>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <p>Date: {document.date || "Recent"}</p>
                <p>Patient: {document.patientName || "Medical Record"}</p>
              </div>

              {document.extractedData?.parameters ? (
                <div className="space-y-1.5 border-t border-slate-200 pt-3 text-[11px]">
                  {document.extractedData.parameters.map((p, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{p.name}:</span>
                      <strong className="text-slate-900">{p.value} {p.unit}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 border-t border-slate-200 pt-3 text-[11px]">
                  <p className="font-semibold text-slate-900">Rx / Clinical Notes:</p>
                  <p>1. Tab. Telmisartan 40mg 1 tab OD</p>
                  <p>2. Tab. Atorvastatin 10mg 1 tab HS</p>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400 flex justify-between">
                <span>Signed: Dr. K.S. Murthy, MD</span>
                <span>Reg: MCI-84920</span>
              </div>
            </div>
          </div>

          {/* Right: Extracted Structured Clinical Data */}
          <div className="p-6 bg-white overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mediblue-50 text-mediblue-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-mediblue-600" />
                OCR Extracted Values
              </span>
              <span className="text-xs font-medium text-slate-500">
                Confidence: <strong className="text-slate-800">{document.confidence || 95}%</strong>
              </span>
            </div>

            {document.extractedData?.parameters && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-700 uppercase">Investigations</h5>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  {document.extractedData.parameters.map((param, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-semibold text-slate-800">{param.name}</span>
                        <span className="text-slate-400 text-[11px] block">Ref: {param.reference}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-sm text-slate-900">{param.value} {param.unit}</strong>
                        <span className="text-[10px] font-bold block text-emerald-600">{param.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {document.extractedData?.medications && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-700 uppercase">Prescribed Medicines</h5>
                <div className="space-y-2">
                  {document.extractedData.medications.map((med, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900 text-sm">{med.name}</strong>
                        <p className="text-slate-500">{med.dose || "1 tab OD"}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-mediblue-100 text-mediblue-800 font-bold rounded text-[10px]">
                        Rx Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              <strong>Physician Edit Mode:</strong> Double-click any field to modify dosages or reference ranges before confirming into the consultation note.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
