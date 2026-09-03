import React, { useRef } from "react";
import { FileText, FlaskConical, FileCheck, Image, PlusCircle, Camera, UploadCloud, Sparkles } from "lucide-react";
import { usePatient } from "../../context/PatientContext";

export const DOCUMENT_CATEGORIES = [
  { id: "prescription", label: "Prescription", icon: FileText, desc: "Doctor's Rx slips, medication lists", color: "blue" },
  { id: "lab_report", label: "Lab / Blood Report", icon: FlaskConical, desc: "CBC, Lipid panel, Glucose, LFT", color: "purple" },
  { id: "discharge_summary", label: "Discharge Summary", icon: FileCheck, desc: "Hospital IPD discharge summaries", color: "emerald" },
  { id: "imaging_report", label: "Imaging Report", icon: Image, desc: "X-Ray, Ultrasound, CT, MRI scans", color: "amber" },
  { id: "other", label: "Other Document", icon: PlusCircle, desc: "Vaccination cards, certificates", color: "slate" },
];

export function DocumentUploader({ onSelectDocumentType, onFileUpload, isProcessing = false }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { t } = usePatient();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload?.(file, "custom_upload");
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Quick Picks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DOCUMENT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              disabled={isProcessing}
              onClick={() => onSelectDocumentType(cat.id)}
              className="clinical-card-interactive p-4 rounded-2xl bg-white border border-slate-200 text-left hover:border-mediblue-400 hover:shadow-soft transition group relative overflow-hidden"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-mediblue-50 text-mediblue-600 group-hover:bg-mediblue-600 group-hover:text-white transition">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-mediblue-700">
                    {cat.label}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.desc}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-mediblue-600 mt-2">
                    <Sparkles className="w-3 h-3" />
                    Simulate OCR Scan
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Upload Action Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => cameraInputRef.current?.click()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition"
        >
          <Camera className="w-5 h-5" />
          <span>{t.documents?.takePhoto || "Take Photo (Camera)"}</span>
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-sm hover:bg-slate-50 transition"
        >
          <UploadCloud className="w-5 h-5 text-mediblue-600" />
          <span>{t.documents?.uploadFile || "Upload Document File"}</span>
        </button>
      </div>
    </div>
  );
}
