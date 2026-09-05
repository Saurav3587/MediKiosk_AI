import React, { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import { historyAIService } from "../services/historyAIService";
import { TRANSLATIONS } from "../locales/translations";

const PatientContext = createContext(null);

const INITIAL_PATIENT_INFO = {
  id: "",
  token: "",
  name: "",
  age: "",
  gender: "Male",
  phone: "",
  abhaId: "",
  department: "General Medicine",
};

export function PatientProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    // Check clean preference key
    const saved = localStorage.getItem("medikiosk_language_v3");
    if (saved) return saved;

    // Purge legacy stored keys that may have been polluted with 'hi'
    try {
      localStorage.removeItem("medikiosk_language");
      localStorage.removeItem("medikiosk_language_v1");
      localStorage.removeItem("medikiosk_language_v2");
      localStorage.setItem("medikiosk_language_v3", "en");
    } catch (e) {}

    return "en";
  });
  const [patientInfo, setPatientInfo] = useState(INITIAL_PATIENT_INFO);
  const [currentStep, setCurrentStep] = useState("identify"); // identify, language, consent, history, documents, review, complete
  const [answers, setAnswers] = useState({});
  const [isAyushMode, setIsAyushMode] = useState(false);
  const [ayushAnswers, setAyushAnswers] = useState({});
  const [isPriority, setIsPriority] = useState(false);
  const [priorityReason, setPriorityReason] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [generatedToken, setGeneratedToken] = useState("");
  const [transcript, setTranscript] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Set language and persist
  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("medikiosk_language_v3", lang);
      localStorage.setItem("medikiosk_language", lang);
    } catch (e) {}
  };

  // Translation accessor
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Record an answer in the adaptive interview tree
  const recordAnswer = (questionId, value, questionText, inputText) => {
    const updatedAnswers = { ...answers, [questionId]: value };
    setAnswers(updatedAnswers);

    // Evaluate priority red flags
    const { isPriority: flagged, priorityReason: reason } = historyAIService.evaluatePriorityTriggers(updatedAnswers);
    if (flagged) {
      setIsPriority(true);
      setPriorityReason(reason);
    }

    // Append to transcript
    if (questionText && inputText) {
      setTranscript((prev) => [
        ...prev,
        { speaker: "assistant", text: questionText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        { speaker: "patient", text: inputText, inputMode: typeof value === "string" ? "touch" : "selection", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    }
  };

  // Add an uploaded/scanned document
  const addDocument = (doc) => {
    setUploadedDocuments((prev) => [doc, ...prev]);
  };

  // Remove a document
  const removeDocument = (docId) => {
    setUploadedDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Submit intake and store into PostgreSQL database via FastAPI backend
  const submitIntake = async () => {
    const structured = historyAIService.synthesizeStructuredHistory(patientInfo, answers, uploadedDocuments);

    const timeline = [];
    uploadedDocuments.forEach((doc) => {
      timeline.push({
        year: new Date().getFullYear().toString(),
        date: doc.date || "Recent",
        title: `${doc.type}: ${doc.hospital || "Medical Record"}`,
        type: doc.type,
        facility: doc.hospital || "Clinic",
        summary: doc.type === "Lab Report" ? "Uploaded laboratory test investigation." : "Uploaded prescription.",
      });
    });

    timeline.push({
      year: new Date().getFullYear().toString(),
      date: "Today",
      title: `Current Intake: ${structured.chiefComplaint}`,
      type: "Current Visit",
      facility: "MediKiosk OPD",
      summary: isPriority ? `Priority review flagged: ${priorityReason}` : "Clinical intake completed, ready for physician consultation.",
    });

    const fullPatientRecord = {
      ...patientInfo,
      name: patientInfo.name || "Patient Intake",
      age: parseInt(patientInfo.age) || 30,
      gender: patientInfo.gender || "Male",
      department: isAyushMode ? "AYUSH / Ayurveda" : patientInfo.department || "General Medicine",
      language: language === "hi" ? "Hindi / English" : language === "bn" ? "Bengali / English" : "English",
      chiefComplaint: structured.chiefComplaint,
      symptoms: answers.chief_complaint === "chest_discomfort" ? ["Chest discomfort", "Pressure feeling", "Left arm radiation"] : ["Reported symptoms"],
      symptomDuration: answers.chest_duration || answers.general_duration || "Recent",
      priority: isPriority,
      priorityReason: isPriority ? priorityReason : null,
      status: isPriority ? "Priority" : "Ready",
      waitingTime: "Just now",
      intakeCompletedAt: new Date().toISOString(),
      isAyush: isAyushMode,
      ayushDetails: isAyushMode
        ? {
            prakriti: answers.ayush_prakriti || "Pitta-Vata",
            agni: answers.ayush_agni || "Samagni",
            koshtha: answers.ayush_koshtha || "Madhyama",
            ahara: "Regular",
            vihara: "Active",
          }
        : null,
      verifiedByDoctor: false,
      verifiedAt: null,
      verifiedDoctorName: null,
      clinicalHistory: structured,
      aiSummary: structured.aiSummary,
      documents: uploadedDocuments,
      timeline,
      transcript,
    };

    // Save directly to backend / PostgreSQL database
    const res = await apiService.createPatientIntake(fullPatientRecord);
    if (res.success && res.data) {
      if (res.data.token) setGeneratedToken(res.data.token);
      setPatientInfo(res.data);
    }
    setIsCompleted(true);
    return res.data || fullPatientRecord;
  };

  // Quick reset intake flow
  const resetIntake = () => {
    setPatientInfo(INITIAL_PATIENT_INFO);
    setAnswers({});
    setIsPriority(false);
    setPriorityReason("");
    setUploadedDocuments([]);
    setTranscript([]);
    setGeneratedToken("");
    setIsCompleted(false);
    setCurrentStep("identify");
  };

  return (
    <PatientContext.Provider
      value={{
        language,
        setLanguage,
        t,
        patientInfo,
        setPatientInfo,
        currentStep,
        setCurrentStep,
        answers,
        setAnswers,
        recordAnswer,
        isAyushMode,
        setIsAyushMode,
        ayushAnswers,
        setAyushAnswers,
        isPriority,
        setIsPriority,
        priorityReason,
        setPriorityReason,
        uploadedDocuments,
        setUploadedDocuments,
        addDocument,
        removeDocument,
        generatedToken,
        setGeneratedToken,
        transcript,
        submitIntake,
        resetIntake,
        isCompleted,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatient must be used within PatientProvider");
  }
  return context;
}
