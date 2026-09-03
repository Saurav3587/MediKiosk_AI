import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  User,
  ArrowLeft,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  FileText,
  Calendar,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  FlaskConical,
  Activity,
  Heart,
  Plus
} from "lucide-react";
import { DoctorLayout } from "../../layouts/DoctorLayout";
import { ClinicalSummary } from "../../components/doctor/ClinicalSummary";
import { SourceBadge } from "../../components/doctor/SourceBadge";
import { VerificationPanel } from "../../components/doctor/VerificationPanel";
import { DocumentViewer } from "../../components/documents/DocumentViewer";
import { MedicalTimeline } from "../../components/documents/MedicalTimeline";
import { StatusBadge } from "../../components/common/StatusBadge";
import { LoadingState } from "../../components/common/LoadingState";
import { apiService } from "../../services/apiService";
import { useDoctor } from "../../context/DoctorContext";

export function DoctorPatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { doctorProfile, verifyPatientHistory, startConsultation } = useDoctor();

  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("history"); // 'overview' | 'history' | 'timeline' | 'documents' | 'transcript'
  const [selectedDocModal, setSelectedDocModal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionValues, setSectionValues] = useState({});

  useEffect(() => {
    async function loadPatient() {
      setIsLoading(true);
      const res = await apiService.getPatient(id);
      if (res.success && res.data) {
        setPatient(res.data);
        setSectionValues(res.data.clinicalHistory || {});
      }
      setIsLoading(false);
    }
    loadPatient();
  }, [id]);

  if (isLoading) {
    return (
      <DoctorLayout>
        <LoadingState message="Loading Patient Clinical Workspace..." submessage="Fetching intake transcript, OCR parameters, and structured timeline" />
      </DoctorLayout>
    );
  }

  if (!patient) {
    return (
      <DoctorLayout>
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <h3 className="text-base font-bold text-slate-800 mb-2">Patient record not found</h3>
          <Link to="/doctor/queue" className="text-xs font-bold text-mediblue-600 hover:underline">
            ← Return to Patient Queue
          </Link>
        </div>
      </DoctorLayout>
    );
  }

  const { clinicalHistory, aiSummary, documents = [], timeline = [], transcript = [] } = patient;

  const handleVerify = async () => {
    const updated = await verifyPatientHistory(patient.id);
    if (updated) setPatient(updated);
  };

  const handleConsult = async () => {
    const updated = await startConsultation(patient.id);
    if (updated) setPatient(updated);
  };

  const handleSaveSectionEdit = async (sectionKey, newVal) => {
    const updatedHistory = { ...sectionValues, [sectionKey]: newVal };
    setSectionValues(updatedHistory);
    setEditingSection(null);
    await apiService.updatePatientHistory(patient.id, updatedHistory);
    setPatient((prev) => ({ ...prev, clinicalHistory: updatedHistory }));
  };

  return (
    <DoctorLayout>
      <div className="space-y-6 pb-20">
        {/* Workspace Top Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <Link
              to="/doctor/queue"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-mediblue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Patient Queue</span>
            </Link>

            <div className="flex items-center gap-2">
              <StatusBadge
                status={patient.status}
                isPriority={patient.priority}
                isVerified={patient.verifiedByDoctor}
              />
              <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs">
                Token {patient.token}
              </span>
            </div>
          </div>

          {/* Patient Demographic Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-mediblue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                {patient.name?.[0] || "P"}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-navy-900 tracking-tight">{patient.name}</h1>
                  <span className="text-xs text-slate-500 font-semibold">
                    {patient.age} Yrs • {patient.gender}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                  <span className="font-mono">ABHA: {patient.abhaId || "N/A"}</span>
                  <span>•</span>
                  <span>Dept: <strong className="text-slate-800">{patient.department}</strong></span>
                  <span>•</span>
                  <span>Language: {patient.language}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Intake Completed</span>
                <strong className="text-slate-800 font-mono">
                  {new Date(patient.intakeCompletedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </strong>
              </div>
              <div className="w-px h-6 bg-slate-200"></div>
              <div>
                <span className="text-slate-400 block text-[11px]">Records Attached</span>
                <strong className="text-mediblue-700">{documents.length} Documents</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Banner if Flagged */}
        {patient.priority && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs flex items-start gap-3 text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-sm block text-red-950">
                Priority Clinical Triage Alert
              </strong>
              <p className="mt-0.5">{patient.priorityReason || "Responses require prompt clinical review."}</p>
            </div>
          </div>
        )}

        {/* Workspace Navigation Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
          {[
            { id: "history", label: "Clinical History", icon: Activity },
            { id: "timeline", label: "Medical Timeline", icon: Calendar },
            { id: "documents", label: `Documents & OCR (${documents.length})`, icon: FileText },
            { id: "transcript", label: "Interview Transcript", icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? "border-mediblue-600 text-mediblue-700 bg-white rounded-t-2xl shadow-xs"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: CLINICAL HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* AI-Prepared Summary Draft */}
            <ClinicalSummary
              summaryText={patient.aiSummary || aiSummary}
              isVerified={patient.verifiedByDoctor}
              verifiedDoctorName={patient.verifiedDoctorName}
              verifiedAt={patient.verifiedAt}
              onVerify={handleVerify}
              onEdit={(newSummary) => {
                setPatient((p) => ({ ...p, aiSummary: newSummary }));
              }}
              onRequestClarification={() => alert("Clarification request sent to patient's MediKiosk device.")}
            />

            {/* AYUSH Assessment Module (If applicable) */}
            {patient.isAyush && patient.ayushDetails && (
              <div className="bg-white rounded-3xl border-2 border-emerald-500 p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    AYUSH / Ayurveda Assessment
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">Prakriti & Dosha Evaluation</h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-emerald-800 font-bold block">Prakriti (Constitution)</span>
                    <strong className="text-slate-800">{patient.ayushDetails.prakriti}</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-emerald-800 font-bold block">Agni (Digestion)</span>
                    <strong className="text-slate-800">{patient.ayushDetails.agni}</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-emerald-800 font-bold block">Koshtha (Bowel Habit)</span>
                    <strong className="text-slate-800">{patient.ayushDetails.koshtha}</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-emerald-800 font-bold block">Vikriti Dominance</span>
                    <strong className="text-slate-800">{patient.ayushDetails.vikriti || "Pitta Pradhana"}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Structured Clinical Sections with Source Traceability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section: Chief Complaint */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-soft space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Chief Complaint</h4>
                  <SourceBadge source="Patient Interview" onClick={() => setActiveTab("transcript")} />
                </div>
                <p className="text-sm font-semibold text-slate-800">{clinicalHistory?.chiefComplaint || patient.chiefComplaint}</p>
              </div>

              {/* Section: HPI */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-soft space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">History of Present Illness (HPI)</h4>
                  <SourceBadge source="Patient Interview" onClick={() => setActiveTab("transcript")} />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{clinicalHistory?.hpi || patient.chiefComplaint}</p>
              </div>

              {/* Section: Past Medical History */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-soft space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Past Medical History</h4>
                  <SourceBadge source="Prescription 12 Aug 2026" onClick={() => { if (documents[0]) setSelectedDocModal(documents[0]); }} />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{clinicalHistory?.pastMedicalHistory || "None declared."}</p>
              </div>

              {/* Section: Previous Surgeries */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-soft space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Past Surgical History</h4>
                  <SourceBadge source="Patient Interview" onClick={() => setActiveTab("transcript")} />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{clinicalHistory?.pastSurgicalHistory || "No previous surgical interventions."}</p>
              </div>

              {/* Section: Current Medications */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-soft space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Current Medications</h4>
                  <SourceBadge source="Prescription & Interview" onClick={() => { if (documents[0]) setSelectedDocModal(documents[0]); }} />
                </div>
                <div className="space-y-2">
                  {clinicalHistory?.currentMedications?.map((med, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900 block">{med.name}</strong>
                        <span className="text-slate-500 text-[11px]">{med.frequency}</span>
                      </div>
                      <SourceBadge
                        source={med.source || "Prescription"}
                        onClick={() => {
                          const targetDoc = documents.find(d => d.id === med.sourceId) || documents[0];
                          if (targetDoc) setSelectedDocModal(targetDoc);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Allergies */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-soft space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Drug Allergies</h4>
                  <SourceBadge source="Patient Interview" onClick={() => setActiveTab("transcript")} />
                </div>
                <div className="space-y-2">
                  {clinicalHistory?.allergies?.length > 0 ? (
                    clinicalHistory.allergies.map((a, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-red-50/70 border border-red-200 text-xs flex justify-between items-center">
                        <div>
                          <strong className="text-red-950 block">{a.allergen}</strong>
                          <span className="text-red-700 text-[11px]">{a.reaction}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">
                          Allergy
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No known drug allergies declared.</p>
                  )}
                </div>
              </div>

              {/* Section: Family History */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-soft space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Family History</h4>
                  <SourceBadge source="Patient Interview" onClick={() => setActiveTab("transcript")} />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{clinicalHistory?.familyHistory || "Non-contributory."}</p>
              </div>

              {/* Section: Lifestyle & Personal */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-soft space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Lifestyle & Habits</h4>
                  <SourceBadge source="Patient Interview" onClick={() => setActiveTab("transcript")} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-slate-400 block text-[10px]">Tobacco / Smoking</span>
                    <strong>{clinicalHistory?.lifestyle?.tobacco || "No"}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-slate-400 block text-[10px]">Alcohol</span>
                    <strong>{clinicalHistory?.lifestyle?.alcohol || "Social"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEDICAL TIMELINE */}
        {activeTab === "timeline" && (
          <MedicalTimeline
            timeline={timeline}
            onSelectDocument={(docId) => {
              const doc = documents.find((d) => d.id === docId);
              if (doc) setSelectedDocModal(doc);
            }}
          />
        )}

        {/* TAB 3: DOCUMENTS & OCR */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-soft hover:shadow-soft-lg transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-mediblue-50 text-mediblue-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{doc.name}</h4>
                        <p className="text-xs text-slate-500">{doc.type} • {doc.date}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold">
                      {doc.confidence || 95}% OCR
                    </span>
                  </div>

                  {doc.extractedData?.parameters && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                      <strong className="text-slate-700 block mb-1">Key OCR Extracted Parameters:</strong>
                      {doc.extractedData.parameters.slice(0, 4).map((p, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-slate-600">{p.name}:</span>
                          <strong className="text-slate-900">{p.value} {p.unit} ({p.status})</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedDocModal(doc)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-mediblue-50 text-slate-800 hover:text-mediblue-700 text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Split-Screen Document Viewer</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: INTERVIEW TRANSCRIPT */}
        {activeTab === "transcript" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-base">Conversational Intake Transcript</h4>
              <span className="text-xs text-slate-400">Captured in real-time by MediKiosk Assistant</span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto p-2">
              {transcript.map((item, idx) => {
                const isAssistant = item.speaker === "assistant";
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
                  >
                    {isAssistant && (
                      <div className="w-8 h-8 rounded-full bg-mediblue-600 text-white flex items-center justify-center text-xs flex-shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-md p-4 rounded-2xl text-xs space-y-1 ${
                        isAssistant
                          ? "bg-slate-100 text-slate-800 rounded-tl-none"
                          : "bg-mediblue-600 text-white rounded-tr-none shadow-sm"
                      }`}
                    >
                      <p className="leading-relaxed">{item.text}</p>
                      <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 pt-1">
                        <span>{item.time || "10:15 AM"}</span>
                        {item.inputMode && (
                          <span className="uppercase font-semibold tracking-wider">
                            via {item.inputMode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sticky Physician Verification Bottom Bar */}
        <VerificationPanel
          patient={patient}
          isVerified={patient.verifiedByDoctor}
          verifiedBy={patient.verifiedDoctorName || doctorProfile.name}
          verifiedAt={patient.verifiedAt}
          onVerify={handleVerify}
          onStartConsultation={handleConsult}
          onEditHistory={() => setActiveTab("history")}
          onRequestClarification={() => alert("Clarification request logged.")}
        />

        {/* Document Split Screen Modal */}
        {selectedDocModal && (
          <DocumentViewer
            document={selectedDocModal}
            onClose={() => setSelectedDocModal(null)}
            onVerify={() => {
              setSelectedDocModal((prev) => ({ ...prev, verified: true }));
            }}
          />
        )}
      </div>
    </DoctorLayout>
  );
}
