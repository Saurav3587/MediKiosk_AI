import time
import uuid

SAMPLE_EXTRACTIONS = {
    "lab_report": {
        "type": "Lab Report",
        "hospital": "Max Healthcare Central Pathology Lab",
        "date": "14 August 2026",
        "confidence": 94.0,
        "parameters": [
            {"name": "Hemoglobin", "value": "14.2", "unit": "g/dL", "reference": "13.0 - 17.0", "status": "Normal", "confidence": 98},
            {"name": "Fasting Blood Glucose", "value": "108", "unit": "mg/dL", "reference": "70 - 100", "status": "Borderline High", "confidence": 95},
            {"name": "Serum Creatinine", "value": "0.92", "unit": "mg/dL", "reference": "0.7 - 1.2", "status": "Normal", "confidence": 96},
            {"name": "Total Cholesterol", "value": "218", "unit": "mg/dL", "reference": "< 200", "status": "High", "confidence": 93},
            {"name": "LDL Cholesterol", "value": "138", "unit": "mg/dL", "reference": "< 100", "status": "High", "confidence": 92},
            {"name": "HDL Cholesterol", "value": "42", "unit": "mg/dL", "reference": "> 40", "status": "Normal", "confidence": 91},
            {"name": "Serum Triglycerides", "value": "190", "unit": "mg/dL", "reference": "< 150", "status": "High", "confidence": 95}
        ]
    },
    "prescription": {
        "type": "Prescription",
        "hospital": "City Heart & Care Clinic, New Delhi",
        "date": "12 August 2026",
        "confidence": 96.0,
        "prescriber": "Dr. K. S. Murthy, MD (Cardiology)",
        "medications": [
            {"name": "Tab. Telmisartan 40 mg", "dose": "1 tab OD morning", "duration": "90 days", "confidence": 98},
            {"name": "Tab. Atorvastatin 10 mg", "dose": "1 tab HS night", "duration": "90 days", "confidence": 96}
        ],
        "instructions": "Low salt diet, maintain regular BP chart."
    },
    "discharge_summary": {
        "type": "Discharge Summary",
        "hospital": "Apex Super Specialty Hospital",
        "date": "18 June 2024",
        "confidence": 92.0,
        "admittingDiagnosis": "Acute Viral Gastroenteritis with Dehydration",
        "conditionAtDischarge": "Hemodynamically stable",
        "dischargeMedications": [
            {"name": "Cap. Ofloxacin + Ornidazole", "dose": "1 tab BD x 5 days", "confidence": 94},
            {"name": "Sachet ORS", "dose": "As needed", "confidence": 96}
        ]
    }
}

class OCREngine:
    @staticmethod
    def extract_document(doc_type: str, file_name: str = "medical_doc.pdf") -> dict:
        key = "lab_report"
        if "presc" in doc_type.lower() or "presc" in file_name.lower():
            key = "prescription"
        elif "disch" in doc_type.lower():
            key = "discharge_summary"

        template = SAMPLE_EXTRACTIONS.get(key, SAMPLE_EXTRACTIONS["lab_report"])
        
        return {
            "id": f"doc-{uuid.uuid4().hex[:8]}",
            "name": file_name,
            "type": template["type"],
            "date": template["date"],
            "hospital": template["hospital"],
            "confidence": template["confidence"],
            "extractedData": template,
            "verified": False
        }

ocr_engine = OCREngine()
