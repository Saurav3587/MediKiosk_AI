import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Edit3, ArrowRight, ArrowLeft, Send, AlertCircle } from "lucide-react";
import { PatientLayout } from "../../layouts/PatientLayout";
import { PriorityAlert } from "../../components/common/PriorityAlert";
import { usePatient } from "../../context/PatientContext";

export function ReviewPage() {
  const navigate = useNavigate();
  const { t, patientInfo, answers, uploadedDocuments, isPriority, priorityReason, submitIntake, setCurrentStep } = usePatient();
  const [isAffirmed, setIsAffirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Helper to display answer values with human-readable fallback
  const displayAnswer = (key, fallback = "Not provided") => {
    const val = answers[key];
    if (!val) return fallback;
    if (Array.isArray(val)) return val.length > 0 ? val.map(s => s.replace(/_/g, " ")).join(", ") : fallback;
    return String(val).replace(/_/g, " ");
  };

  const sections = [
    {
      id: "personal",
      title: t.review?.personalInfo || "Personal Information",
      content: `${patientInfo.name || "—"} • ${patientInfo.age || "—"} Yrs • ${patientInfo.gender || "—"} | ABHA: ${patientInfo.abhaId || "—"}`,
      editStep: "identify",
    },
    {
      id: "chief",
      title: t.review?.chiefComplaint || "Chief Complaint",
      content: displayAnswer("chief_complaint", "General consultation"),
      editStep: "history",
    },
    {
      id: "symptoms",
      title: t.review?.currentSymptoms || "Current Symptoms & Duration",
      content: (() => {
        const duration = answers.chest_duration || answers.general_duration;
        const character = answers.chest_character;
        const radiation = answers.chest_radiation;
        if (duration || character || radiation) {
          return [
            duration && `Onset: ${duration.replace(/_/g, " ")}`,
            character && `Character: ${character.replace(/_/g, " ")}`,
            radiation && radiation !== "nowhere" && `Radiation: ${radiation.replace(/_/g, " ")}`,
          ].filter(Boolean).join(" | ");
        }
        return "Symptoms collected during clinical interview";
      })(),
      editStep: "history",
    },
    {
      id: "past_history",
      title: t.review?.pastHistory || "Past Medical History",
      content: displayAnswer("past_medical_history", "None declared"),
      editStep: "history",
    },
    {
      id: "medications",
      title: t.review?.medications || "Current Medications",
      content: displayAnswer("current_medications", "None reported"),
      editStep: "history",
    },
    {
      id: "allergies",
      title: t.review?.allergies || "Drug Allergies",
      content: displayAnswer("drug_allergies", "NKDA — No known drug allergies"),
      editStep: "history",
    },
    {
      id: "family",
      title: t.review?.familyHistory || "Family History",
      content: Array.isArray(answers.family_history) && answers.family_history.length > 0
        ? answers.family_history.map(f => f.replace("family_", "").replace(/_/g, " ")).join(", ")
        : "Non-contributory",
      editStep: "history",
    },
    {
      id: "docs",
      title: t.review?.uploadedDocs || "Uploaded Documents",
      content: uploadedDocuments.length > 0
        ? `${uploadedDocuments.length} medical record${uploadedDocuments.length > 1 ? "s" : ""} attached: ${uploadedDocuments.map(d => d.name || d.type).join(", ")}`
        : "No documents uploaded",
      editStep: "documents",
    },
  ];

  const handleSubmit = async () => {
    if (!isAffirmed) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Submit directly to PostgreSQL database via backend
      const result = await submitIntake();
      if (result) {
        setCurrentStep("complete");
        navigate("/patient/complete");
      } else {
        setSubmitError("Failed to save intake to database. Please try again.");
        setIsSubmitting(false);
      }
    } catch (e) {
      setSubmitError("Could not connect to the database. Please check your connection.");
      setIsSubmitting(false);
    }
  };

  return (
    <PatientLayout activeStepId="review">
      <div className="max-w-2xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            {t.review?.title || "Review your information"}
          </h1>
          <p className="text-sm text-slate-500">
            {t.review?.subtitle || "Please check everything before sending it to your doctor."}
          </p>
        </div>

        {/* Priority Alert Banner if active */}
        {isPriority && (
          <PriorityAlert
            title="Priority Triage Queued"
            message="Your responses have been flagged. You will be prioritized in the physician queue."
          />
        )}

        {/* Section Cards */}
        <div className="space-y-3">
          {sections.map((sec) => (
            <div
              key={sec.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-soft flex items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{sec.title}</h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3 stroke-[3]" />
                    {t.review?.completedBadge || "Recorded"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed capitalize">{sec.content}</p>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/patient/${sec.editStep}`)}
                className="p-2 rounded-xl text-slate-400 hover:text-mediblue-600 hover:bg-slate-100 transition flex items-center gap-1 text-xs font-semibold"
                title="Edit this section"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.review?.editBtn || "Edit"}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Error Banner */}
        {submitError && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* Affirmation Checkbox */}
        <div
          onClick={() => setIsAffirmed(!isAffirmed)}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3.5 ${
            isAffirmed ? "bg-mediblue-50/70 border-mediblue-600" : "bg-white border-slate-300"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
              isAffirmed ? "bg-mediblue-600 border-mediblue-600 text-white" : "border-slate-400 bg-white"
            }`}
          >
            {isAffirmed && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-800 select-none">
            {t.review?.affirmation || "I confirm that the information I've provided is accurate to the best of my knowledge."}
          </span>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate("/patient/documents")}
            className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Documents</span>
          </button>

          <button
            type="button"
            disabled={!isAffirmed || isSubmitting}
            onClick={handleSubmit}
            className="w-full sm:w-auto py-4 px-10 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 disabled:opacity-50 text-white font-bold text-base shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition"
          >
            <Send className="w-5 h-5" />
            <span>{isSubmitting ? "Saving to Database..." : (t.review?.btnSubmit || "Send to Doctor")}</span>
          </button>
        </div>
      </div>
    </PatientLayout>
  );
}
