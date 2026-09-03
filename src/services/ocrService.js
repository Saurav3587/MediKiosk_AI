/**
 * MediKiosk Medical Document OCR & Entity Extraction Service
 * Simulates optical character recognition, confidence scoring, and clinical entity normalization.
 * Prepared for connection to PaddleOCR / AWS Textract / Google Cloud Document AI in production.
 */

export const SAMPLE_OCR_TEMPLATES = {
  prescription: {
    type: "Prescription",
    name: "Prescription_DrMurthy.pdf",
    date: "12 August 2026",
    hospital: "City Heart & Care Clinic, New Delhi",
    doctor: "Dr. K. S. Murthy, MD (Cardiology)",
    confidence: 96,
    extractedData: {
      documentType: "Prescription",
      date: "12 August 2026",
      prescriber: "Dr. K. S. Murthy (Cardiologist)",
      medications: [
        { name: "Tab. Telmisartan 40 mg", dose: "1 tab OD Morning", duration: "90 days", confidence: 98 },
        { name: "Tab. Atorvastatin 10 mg", dose: "1 tab HS Night", duration: "90 days", confidence: 96 }
      ],
      instructions: "Low salt diet, maintain regular BP chart.",
      diagnosis: "Essential Hypertension, Hyperlipidemia"
    }
  },
  lab_report: {
    type: "Lab Report",
    name: "Comprehensive_Metabolic_Panel.pdf",
    date: "14 August 2026",
    hospital: "Max Healthcare Central Pathology Lab",
    confidence: 94,
    extractedData: {
      documentType: "Lab Report",
      date: "14 August 2026",
      hospital: "Max Healthcare Central Pathology Lab",
      parameters: [
        { name: "Hemoglobin", value: "14.2", unit: "g/dL", reference: "13.0 - 17.0", status: "Normal", confidence: 98 },
        { name: "Fasting Blood Glucose", value: "108", unit: "mg/dL", reference: "70 - 100", status: "Borderline High", confidence: 95 },
        { name: "Serum Creatinine", value: "0.92", unit: "mg/dL", reference: "0.7 - 1.2", status: "Normal", confidence: 96 },
        { name: "Total Cholesterol", value: "218", unit: "mg/dL", reference: "< 200", status: "High", confidence: 93 },
        { name: "LDL Cholesterol", value: "138", unit: "mg/dL", reference: "< 100", status: "High", confidence: 92 },
        { name: "HDL Cholesterol", value: "42", unit: "mg/dL", reference: "> 40", status: "Normal", confidence: 91 },
        { name: "Serum Triglycerides", value: "190", unit: "mg/dL", reference: "< 150", status: "High", confidence: 95 }
      ]
    }
  },
  discharge_summary: {
    type: "Discharge Summary",
    name: "Hospital_Discharge_Summary.pdf",
    date: "18 June 2024",
    hospital: "Apex Super Specialty Hospital",
    confidence: 92,
    extractedData: {
      documentType: "Discharge Summary",
      admissionDate: "15 June 2024",
      dischargeDate: "18 June 2024",
      admittingDiagnosis: "Acute Viral Gastroenteritis with Dehydration",
      procedures: "IV Hydration, Symptomatic Management",
      conditionAtDischarge: "Hemodynamically stable, tolerating oral diet",
      dischargeMedications: [
        { name: "Cap. Ofloxacin + Ornidazole", dose: "1 tab BD x 5 days", confidence: 94 },
        { name: "Sachet Oral Rehydration Salts (ORS)", dose: "As needed", confidence: 96 }
      ]
    }
  },
  imaging_report: {
    type: "Imaging Report",
    name: "Chest_XRay_PA_View.pdf",
    date: "10 January 2025",
    hospital: "Prime Diagnostic Imaging",
    confidence: 91,
    extractedData: {
      documentType: "X-Ray Report",
      investigation: "Chest X-Ray PA View",
      date: "10 January 2025",
      radiologist: "Dr. S. K. Roy, MD (Radiodiagnosis)",
      findings: "Lung fields clear. Cardiothoracic ratio within normal limits. Both costophrenic angles sharp. No focal consolidation or pleural effusion."
    }
  }
};

export const ocrService = {
  /**
   * Process document file with simulated multi-stage OCR progress callbacks
   */
  async processDocument(fileOrType, onProgress = () => {}) {
    const stages = [
      { stage: "uploading", message: "Uploading document file securely...", delay: 400 },
      { stage: "reading", message: "Reading visual layout & bounding boxes...", delay: 600 },
      { stage: "extracting", message: "Extracting clinical parameters & medication entities...", delay: 700 },
      { stage: "normalizing", message: "Organizing medical timeline & verification draft...", delay: 500 },
      { stage: "complete", message: "Extraction complete ✓", delay: 200 },
    ];

    for (let i = 0; i < stages.length; i++) {
      onProgress({
        step: i + 1,
        total: stages.length,
        percentage: Math.round(((i + 1) / stages.length) * 100),
        stage: stages[i].stage,
        message: stages[i].message,
      });
      await sleep(stages[i].delay);
    }

    // Match file type or default to lab report
    let templateKey = "lab_report";
    if (typeof fileOrType === "string") {
      if (fileOrType.toLowerCase().includes("presc")) templateKey = "prescription";
      else if (fileOrType.toLowerCase().includes("disch")) templateKey = "discharge_summary";
      else if (fileOrType.toLowerCase().includes("imag") || fileOrType.toLowerCase().includes("xray")) templateKey = "imaging_report";
    }

    const template = SAMPLE_OCR_TEMPLATES[templateKey] || SAMPLE_OCR_TEMPLATES.lab_report;

    return {
      id: `doc-${Date.now()}`,
      ...template,
      uploadedAt: new Date().toISOString(),
      verified: false,
    };
  }
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
