import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, Plus, Calendar, Eye } from "lucide-react";
import { PatientLayout } from "../../layouts/PatientLayout";
import { DocumentUploader } from "../../components/documents/DocumentUploader";
import { DocumentScanner } from "../../components/documents/DocumentScanner";
import { ExtractedData } from "../../components/documents/ExtractedData";
import { DocumentViewer } from "../../components/documents/DocumentViewer";
import { MedicalTimeline } from "../../components/documents/MedicalTimeline";
import { ocrService } from "../../services/ocrService";
import { usePatient } from "../../context/PatientContext";

export function DocumentsPage() {
  const navigate = useNavigate();
  const { t, uploadedDocuments, addDocument, removeDocument, setCurrentStep } = usePatient();

  const [isProcessing, setIsProcessing] = useState(false);
  const [scanStage, setScanStage] = useState("idle");
  const [scanMessage, setScanMessage] = useState("");
  const [scanPercent, setScanPercent] = useState(0);
  const [activeExtractedDoc, setActiveExtractedDoc] = useState(null);
  const [viewOriginalDoc, setViewOriginalDoc] = useState(null);

  // Dynamic Timeline events for real patient
  const defaultTimeline = [
    ...uploadedDocuments.map((doc) => ({
      year: doc.date?.includes("20") ? doc.date.match(/20\d\d/)?.[0] || "2026" : "2026",
      date: doc.date || "Recent",
      title: `${doc.type}: ${doc.hospital || "Medical Facility"}`,
      type: doc.type,
      facility: doc.hospital || "Diagnostic Center",
      summary: doc.extractedData?.instructions || doc.extractedData?.admittingDiagnosis || `${doc.type} record uploaded by patient`,
    })),
    {
      year: "2026",
      date: "Today",
      title: "Current Intake Consultation",
      type: "Current Visit",
      facility: "MediKiosk General OPD",
      summary: "AI clinical intake completed; queued for physician review"
    }
  ];

  const handleStartOCR = async (fileOrCategory) => {
    setIsProcessing(true);
    setActiveExtractedDoc(null);

    try {
      const processedDoc = await ocrService.processDocument(fileOrCategory, (progress) => {
        setScanStage(progress.stage);
        setScanMessage(progress.message);
        setScanPercent(progress.percentage);
      });

      setIsProcessing(false);
      setActiveExtractedDoc(processedDoc);
    } catch (e) {
      setIsProcessing(false);
      console.error(e);
    }
  };

  const handleConfirmDoc = () => {
    if (activeExtractedDoc) {
      addDocument(activeExtractedDoc);
      setActiveExtractedDoc(null);
    }
  };

  const handleProceed = () => {
    setCurrentStep("review");
    navigate("/patient/review");
  };

  return (
    <PatientLayout activeStepId="documents">
      <div className="max-w-3xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            {t.documents?.title || "Add your previous medical records"}
          </h1>
          <p className="text-sm text-slate-500">
            {t.documents?.subtitle || "Upload any records you'd like your doctor to review."}
          </p>
        </div>

        {/* OCR Scanner Animation State */}
        {isProcessing && (
          <DocumentScanner
            currentStage={scanStage}
            progressPercent={scanPercent}
            stageMessage={scanMessage}
          />
        )}

        {/* Newly Extracted Document Preview */}
        {!isProcessing && activeExtractedDoc && (
          <ExtractedData
            document={activeExtractedDoc}
            onConfirm={handleConfirmDoc}
            onDelete={() => setActiveExtractedDoc(null)}
            onViewOriginal={() => setViewOriginalDoc(activeExtractedDoc)}
          />
        )}

        {/* Document Uploader Categories */}
        {!isProcessing && !activeExtractedDoc && (
          <DocumentUploader
            onSelectDocumentType={handleStartOCR}
            onFileUpload={(file) => handleStartOCR(file.name)}
            isProcessing={isProcessing}
          />
        )}

        {/* Already Processed Documents List */}
        {uploadedDocuments.length > 0 && !activeExtractedDoc && !isProcessing && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Attached Documents ({uploadedDocuments.length})
              </h4>
              <span className="text-xs font-semibold text-slate-400">Added to patient record</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-mediblue-600" />
                    <div>
                      <strong className="text-slate-800 block truncate max-w-[180px]">{doc.name}</strong>
                      <span className="text-[11px] text-slate-400">{doc.type} • {doc.date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewOriginalDoc(doc)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-mediblue-600 hover:bg-slate-200"
                    title="View Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chronological Medical Timeline */}
        <MedicalTimeline timeline={defaultTimeline} />

        {/* Bottom Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate("/patient/history")}
            className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Questions</span>
          </button>

          <button
            type="button"
            onClick={handleProceed}
            className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
          >
            <span>{t.documents?.btnContinue || "Proceed to Final Review"}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Split Screen Document Modal */}
        {viewOriginalDoc && (
          <DocumentViewer
            document={viewOriginalDoc}
            onClose={() => setViewOriginalDoc(null)}
          />
        )}
      </div>
    </PatientLayout>
  );
}
