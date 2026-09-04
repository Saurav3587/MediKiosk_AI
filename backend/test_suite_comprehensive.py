import sys
import os
import io
import uuid

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models.patient import Patient, ClinicalHistory, MedicalDocument, TimelineEvent, TranscriptTurn
from app.models.doctor import Doctor
from app.services.seed_data import seed_initial_doctors

client = TestClient(app)

def cleanup_patients():
    db = SessionLocal()
    try:
        db.query(TranscriptTurn).delete()
        db.query(TimelineEvent).delete()
        db.query(MedicalDocument).delete()
        db.query(ClinicalHistory).delete()
        db.query(Patient).delete()
        db.commit()
    finally:
        db.close()

def run_comprehensive_tests():
    print("================================================================")
    print("   MEDIKIOSK AG COMPREHENSIVE BACKEND API & FEATURE TEST SUITE   ")
    print("================================================================\n")
    
    passed_count = 0
    total_count = 0

    def test(desc, func):
        nonlocal passed_count, total_count
        total_count += 1
        try:
            func()
            passed_count += 1
            print(f"  [PASS {passed_count:02d}] {desc}")
        except Exception as e:
            print(f"  [FAIL] {desc}: {e}")
            raise e

    # Ensure doctors are seeded
    init_db()
    cleanup_patients()

    # 1. Root & Health
    def t1():
        r = client.get("/")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "online"
        assert "MediKiosk" in data["message"]
    test("Root endpoint returns online status (GET /)", t1)

    def t2():
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"
    test("Health check returns healthy (GET /health)", t2)

    # 2. Doctor Registration
    unique_doc_email = f"dr.test_{uuid.uuid4().hex[:6]}@medikiosk.in"
    def t3():
        r = client.post("/api/v1/doctor/register", json={
            "name": "Dr. Test Specialist",
            "email": unique_doc_email,
            "password": "securepass123",
            "title": "MS (General Surgery)",
            "department": "Surgery",
            "opd_room": "Room 22",
            "hospital": "Apex Super Specialty Hospital"
        })
        assert r.status_code == 201
        res = r.json()
        assert res["doctor"]["email"] == unique_doc_email
        assert res["doctor"]["name"] == "Dr. Test Specialist"
        assert "access_token" in res
    test("Doctor Registration creates new doctor (POST /api/v1/doctor/register)", t3)

    def t4():
        r = client.post("/api/v1/doctor/register", json={
            "name": "Duplicate Doctor",
            "email": unique_doc_email,
            "password": "anotherpassword",
            "department": "Surgery"
        })
        assert r.status_code == 400
        assert "already registered" in r.text.lower() or "already exists" in r.text.lower()
    test("Doctor Registration rejects duplicate email with 400", t4)

    def t5():
        r = client.post("/api/v1/doctor/register", json={"name": "Incomplete Doctor"})
        assert r.status_code == 422
    test("Doctor Registration validates required fields with 422", t5)

    # 3. Doctor Authentication & JWT
    def t6():
        r = client.post("/api/v1/doctor/login", json={"email": unique_doc_email, "password": "wrongpassword"})
        assert r.status_code == 401
    test("Doctor Login rejects invalid password with 401 Unauthorized", t6)

    def t7():
        r = client.post("/api/v1/doctor/login", json={"email": "nonexistent@medikiosk.in", "password": "password"})
        assert r.status_code == 401
    test("Doctor Login rejects non-existent email with 401", t7)

    token_holder = {}
    def t8():
        r = client.post("/api/v1/doctor/login", json={"email": "dr.arun@medikiosk.in", "password": "doctor123"})
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["doctor"]["name"] == "Dr. Arun Sharma"
        token_holder["token"] = data["access_token"]
        token_holder["headers"] = {"Authorization": f"Bearer {data['access_token']}"}
    test("Doctor Login issues valid JWT bearer token (Dr. Arun Sharma)", t8)

    # 4. Doctor Me endpoint
    def t9():
        r = client.get("/api/v1/doctor/me")
        assert r.status_code == 401
    test("GET /api/v1/doctor/me requires authorization token (401)", t9)

    def t10():
        r = client.get("/api/v1/doctor/me", headers={"Authorization": "Bearer invalid_token_xyz"})
        assert r.status_code == 401
    test("GET /api/v1/doctor/me rejects invalid token (401)", t10)

    def t11():
        r = client.get("/api/v1/doctor/me", headers=token_holder["headers"])
        assert r.status_code == 200
        assert r.json()["email"] == "dr.arun@medikiosk.in"
        assert r.json()["name"] == "Dr. Arun Sharma"
    test("GET /api/v1/doctor/me returns current doctor profile with valid token", t11)

    # 5. Patient Intake Submission (Standard & Priority)
    patient_holder = {}
    def t12():
        payload = {
            "name": "Ramesh Chandra",
            "age": 52,
            "gender": "Male",
            "phone": "+91 98765 43210",
            "abhaId": "14-5555-6666-7777",
            "department": "Cardiology",
            "language": "Hindi",
            "chiefComplaint": "Substernal chest tightness radiating to left arm",
            "symptoms": ["Chest Tightness", "Diaphoresis", "Mild Nausea"],
            "symptomDuration": "2 hours",
            "symptomCharacter": "Crushing retrosternal pressure",
            "priority": True,
            "priorityReason": "Acute retrosternal chest discomfort with radiation to left arm warrants prompt triage.",
            "clinicalHistory": {
                "chiefComplaint": "Substernal chest tightness radiating to left arm",
                "hpi": "52-year-old male with new onset severe crushing chest discomfort.",
                "pastMedicalHistory": "Hypertension (5 years), Type 2 Diabetes",
                "currentMedications": [{"name": "Amlodipine 5mg", "frequency": "OD", "source": "Prescription"}],
                "allergies": [{"allergen": "Penicillin", "reaction": "Urticaria", "source": "Patient"}],
                "aiSummary": "PRIORITY REVIEW: Acute coronary syndrome suspicion."
            },
            "documents": [
                {
                    "name": "ECG_Prior.pdf",
                    "type": "Lab Report",
                    "date": "10 Aug 2026",
                    "confidence": 95.0,
                    "extractedData": {"parameters": [{"name": "PR Interval", "value": "160", "unit": "ms"}]}
                }
            ],
            "timeline": [
                {
                    "year": "2026",
                    "date": "03 Sep 2026",
                    "title": "Emergency OPD Walk-in",
                    "type": "Emergency",
                    "facility": "MediKiosk Cardiology OPD"
                }
            ],
            "transcript": [
                {"speaker": "assistant", "text": "Describe your chest discomfort", "inputMode": "touch", "time": "12:00"},
                {"speaker": "patient", "text": "Heavy chest pain radiating down my left arm for 2 hours", "inputMode": "voice", "time": "12:01"}
            ]
        }
        r = client.post("/api/v1/patients/intake", json=payload)
        assert r.status_code == 200
        p = r.json()
        assert p["name"] == "Ramesh Chandra"
        assert p["priority"] is True
        assert p["token"] is not None
        assert p["clinicalHistory"]["chiefComplaint"] == payload["chiefComplaint"]
        assert len(p["documents"]) == 1
        assert len(p["timeline"]) == 1
        assert len(p["transcript"]) == 2
        patient_holder["priority_id"] = p["id"]
        patient_holder["priority_token"] = p["token"]
    test("Patient Intake creates high-priority patient with all relational data (POST /api/v1/patients/intake)", t12)

    def t13():
        payload = {
            "name": "Sunita Verma",
            "age": 29,
            "gender": "Female",
            "phone": "+91 94111 22334",
            "abhaId": "91-1122-3344-5566",
            "department": "AYUSH / Ayurveda",
            "language": "English",
            "chiefComplaint": "Chronic indigestion and acid reflux",
            "symptoms": ["Indigestion", "Bloating"],
            "symptomDuration": "3 months",
            "priority": False,
            "isAyush": True,
            "ayushDetails": {"prakriti": "Pitta dominant", "dietPreference": "Vegetarian"},
            "clinicalHistory": {
                "chiefComplaint": "Chronic indigestion and acid reflux",
                "hpi": "29-year-old female complaining of recurrent dyspepsia.",
                "aiSummary": "Chronic dyspepsia, candidate for Ayurvedic dietary protocol."
            }
        }
        r = client.post("/api/v1/patients/intake", json=payload)
        assert r.status_code == 200
        p = r.json()
        assert p["name"] == "Sunita Verma"
        assert p["isAyush"] is True
        patient_holder["standard_id"] = p["id"]
        patient_holder["standard_token"] = p["token"]
    test("Patient Intake supports AYUSH / Non-priority consultation", t13)

    # 6. Patient List, Filtering and Search
    def t14():
        r = client.get("/api/v1/patients")
        assert r.status_code == 200
        pts = r.json()
        assert len(pts) >= 2
    test("List all patients (GET /api/v1/patients)", t14)

    def t15():
        r = client.get("/api/v1/patients?department=Cardiology")
        assert r.status_code == 200
        pts = r.json()
        assert all(p["department"] == "Cardiology" for p in pts)
        assert len(pts) >= 1
    test("Filter patients by Department (Cardiology)", t15)

    def t16():
        r = client.get(f"/api/v1/patients?search={patient_holder['priority_token']}")
        assert r.status_code == 200
        pts = r.json()
        assert len(pts) == 1
        assert pts[0]["id"] == patient_holder["priority_id"]
    test("Search patient by exact Token", t16)

    def t17():
        r = client.get("/api/v1/patients?search=Sunita")
        assert r.status_code == 200
        pts = r.json()
        assert len(pts) == 1
        assert pts[0]["name"] == "Sunita Verma"
    test("Search patient by Name query", t17)

    # 7. Get Patient by ID and Token
    def t18():
        r = client.get(f"/api/v1/patients/{patient_holder['priority_id']}")
        assert r.status_code == 200
        assert r.json()["name"] == "Ramesh Chandra"
    test("Get patient by UUID (GET /api/v1/patients/{id})", t18)

    def t19():
        r = client.get(f"/api/v1/patients/{patient_holder['standard_token']}")
        assert r.status_code == 200
        assert r.json()["name"] == "Sunita Verma"
    test("Get patient by Token (GET /api/v1/patients/{token})", t19)

    def t20():
        r = client.get("/api/v1/patients/NON_EXISTENT_TOKEN_999")
        assert r.status_code == 404
    test("Get patient with non-existent token returns 404", t20)

    # 8. Doctor Queue & Priority Queue
    def t21():
        r = client.get("/api/v1/doctor/queue", headers=token_holder["headers"])
        assert r.status_code == 200
        queue = r.json()
        assert len(queue) >= 2
        # Priority patients should appear first
        assert queue[0]["priority"] is True
    test("Doctor Queue lists patients with Priority sorted first (GET /api/v1/doctor/queue)", t21)

    def t22():
        r = client.get("/api/v1/doctor/priority", headers=token_holder["headers"])
        assert r.status_code == 200
        priority_pts = r.json()
        assert len(priority_pts) >= 1
        assert all(p["priority"] is True for p in priority_pts)
    test("Doctor Priority Queue filters strictly priority cases (GET /api/v1/doctor/priority)", t22)

    # 9. Doctor Clinical Operations
    def t23():
        r = client.post(
            f"/api/v1/doctor/verify/{patient_holder['priority_id']}",
            json={"doctorName": "Dr. Arun Sharma", "notes": "Verified high priority status. Immediate 12-lead ECG ordered."},
            headers=token_holder["headers"]
        )
        assert r.status_code == 200
        p = r.json()
        assert p["verifiedByDoctor"] is True
        assert p["verifiedDoctorName"] == "Dr. Arun Sharma"
        assert "ECG ordered" in p["doctorVerificationNotes"]
    test("Doctor verifies clinical history with notes & digital signature (POST /api/v1/doctor/verify)", t23)

    def t24():
        r = client.post(
            f"/api/v1/doctor/consult/{patient_holder['priority_id']}",
            headers=token_holder["headers"]
        )
        assert r.status_code == 200
        p = r.json()
        assert p["consultationStarted"] is True
        assert p["status"] == "Consulting"
    test("Doctor starts patient consultation (POST /api/v1/doctor/consult)", t24)

    def t25():
        r = client.put(
            f"/api/v1/doctor/history/{patient_holder['priority_id']}",
            json={
                "chiefComplaint": "Acute Coronary Syndrome / STEMI Evaluation",
                "hpi": "Detailed HPI: Retrosternal pain started at 10 AM, unresponsive to rest. Prior episode 1 month ago.",
                "pastMedicalHistory": "Hypertension (5 years, regular meds), Type 2 DM, Non-smoker.",
                "aiSummary": "Verified acute coronary event presentation. Immediate intervention pathway."
            },
            headers=token_holder["headers"]
        )
        assert r.status_code == 200
        p = r.json()
        assert p["clinicalHistory"]["chiefComplaint"] == "Acute Coronary Syndrome / STEMI Evaluation"
        assert "Retrosternal pain started at 10 AM" in p["clinicalHistory"]["hpi"]
    test("Doctor updates patient clinical history (PUT /api/v1/doctor/history)", t25)

    # 10. AI Engine Evaluation & Clinical Synthesis
    def t26():
        r = client.post("/api/v1/ai/evaluate-priority", json={
            "answers": {
                "chief_complaint": "chest_discomfort",
                "chest_radiation": "left_arm",
                "chest_duration": "today_few_hours"
            }
        })
        assert r.status_code == 200
        res = r.json()
        assert res["isPriority"] is True
        assert "Acute retrosternal" in res["priorityReason"]
    test("AI Priority Engine flags acute chest pain radiating to left arm as priority", t26)

    def t27():
        r = client.post("/api/v1/ai/evaluate-priority", json={
            "answers": {
                "chief_complaint": "shortness_breath",
                "breath_duration": "at_rest"
            }
        })
        assert r.status_code == 200
        res = r.json()
        assert res["isPriority"] is True
        assert "Dyspnea at rest" in res["priorityReason"]
    test("AI Priority Engine flags dyspnea at rest as priority", t27)

    def t28():
        r = client.post("/api/v1/ai/evaluate-priority", json={
            "answers": {
                "chief_complaint": "mild_skin_rash",
                "chest_duration": "3_weeks"
            }
        })
        assert r.status_code == 200
        res = r.json()
        assert res["isPriority"] is False
    test("AI Priority Engine correctly clears non-emergency complaint", t28)

    def t29():
        r = client.post("/api/v1/ai/synthesize-history", json={
            "patientName": "Ananya Sen",
            "age": 28,
            "gender": "Female",
            "answers": {
                "chief_complaint": "fever",
                "general_duration": "4 days",
                "past_medical_history": ["Asthma"],
                "drug_allergies": ["Sulfa"],
                "current_medications": "Salbutamol Inhaler SOS"
            }
        })
        assert r.status_code == 200
        res = r.json()
        assert res["success"] is True
        ch = res["data"]
        assert "febrile illness" in ch["chiefComplaint"].lower()
        assert "Asthma" in ch["pastMedicalHistory"]
        assert ch["allergies"][0]["allergen"] == "Sulfa"
        assert len(ch["currentMedications"]) == 1
    test("AI Clinical Synthesis builds full structured clinical history (POST /api/v1/ai/synthesize-history)", t29)

    # 11. Document OCR Extraction & Upload
    def t30():
        r = client.post("/api/v1/documents/ocr/extract", json={
            "documentType": "Lab Report",
            "fileName": "cbc_and_lipid_profile.pdf"
        })
        assert r.status_code == 200
        res = r.json()
        assert res["confidence"] >= 90.0
        assert res["extractedData"]["type"] == "Lab Report"
        assert len(res["extractedData"]["parameters"]) >= 5
    test("OCR Engine extracts Lab Report parameters with high confidence", t30)

    def t31():
        r = client.post("/api/v1/documents/ocr/extract", json={
            "documentType": "Prescription",
            "fileName": "rx_cardiology.jpg"
        })
        assert r.status_code == 200
        res = r.json()
        assert res["extractedData"]["type"] == "Prescription"
        assert len(res["extractedData"]["medications"]) >= 1
    test("OCR Engine extracts Prescription medications and dosages", t31)

    def t32():
        r = client.post("/api/v1/documents/ocr/extract", json={
            "documentType": "Discharge Summary",
            "fileName": "discharge_report.pdf"
        })
        assert r.status_code == 200
        res = r.json()
        assert res["extractedData"]["type"] == "Discharge Summary"
        assert "admittingDiagnosis" in res["extractedData"]
    test("OCR Engine extracts Discharge Summary diagnosis & discharge medications", t32)

    def t33():
        dummy_file = io.BytesIO(b"%PDF-1.4 simulated pdf document data for testing")
        files = {"file": ("test_upload_report.pdf", dummy_file, "application/pdf")}
        data = {"doc_type": "Lab Report"}
        r = client.post("/api/v1/documents/upload", files=files, data=data)
        assert r.status_code == 200
        res = r.json()
        assert res["name"] == "test_upload_report.pdf"
        assert res["confidence"] >= 90.0
    test("Document Upload endpoint processes multipart file upload (POST /api/v1/documents/upload)", t33)

    # 12. Analytics & System Health
    def t34():
        r = client.get("/api/v1/analytics/overview")
        assert r.status_code == 200
        stats = r.json()
        assert "patientsWaiting" in stats
        assert "totalDocumentsProcessed" in stats
        assert stats["patientsWaiting"] >= 1
    test("Analytics Overview returns real-time OPD metrics (GET /api/v1/analytics/overview)", t34)

    def t35():
        r = client.get("/api/v1/analytics/system-health")
        assert r.status_code == 200
        health = r.json()
        assert health["api"]["uptime"] == "99.99%"
        assert health["database"]["connectionPool"] == "Healthy"
        assert health["abdmIntegration"]["status"] == "Sandbox Environment Ready"
    test("System Health returns status for DB, OCR, Voice, BioMistral, ABDM (GET /api/v1/analytics/system-health)", t35)

    # 13. Fast2SMS Patient Mobile OTP Verification
    def t36():
        r = client.post("/api/v1/otp/send", json={"phone": "9876543210"})
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert "message" in data
    test("Fast2SMS OTP Generation & Gateway Dispatch (POST /api/v1/otp/send)", t36)

    def t37():
        # Dispatch code
        r_send = client.post("/api/v1/otp/send", json={"phone": "9988776655"})
        assert r_send.status_code == 200
        code = r_send.json()["code"]
        # Verify valid code
        r_verify = client.post("/api/v1/otp/verify", json={"phone": "9988776655", "code": code})
        assert r_verify.status_code == 200
        assert r_verify.json()["success"] is True
        # Verify invalid code rejects with 400
        r_bad = client.post("/api/v1/otp/verify", json={"phone": "9988776655", "code": "000000"})
        assert r_bad.status_code == 400
        # Verify code is single-use: second attempt fails
        r_reuse = client.post("/api/v1/otp/verify", json={"phone": "9988776655", "code": code})
        assert r_reuse.status_code == 400
    test("Fast2SMS OTP Verification validates authentic code and rejects wrong or reused codes (POST /api/v1/otp/verify)", t37)

    # 14. Sarvam AI Sovereign Indian Voice & Translation Integration
    def t38():
        r = client.get("/api/v1/ai/sarvam/status")
        assert r.status_code == 200
        data = r.json()
        assert data["provider"] == "Sarvam AI"
        assert "Saaras ASR (Hinglish & Regional Speech-to-Text)" in data["features"]
        assert data["models"]["tts"] == "bulbul:v3"
    test("Sarvam AI Status endpoint exposes sovereign Indian voice capabilities (GET /api/v1/ai/sarvam/status)", t38)

    def t39():
        # Test TTS endpoint gracefully validates payload
        r_tts = client.post("/api/v1/ai/sarvam/text-to-speech", json={
            "text": "नमस्ते! आपको क्या तकलीफ है?",
            "language_code": "hi-IN",
            "speaker": "meera"
        })
        assert r_tts.status_code == 200
        # Test Translation endpoint gracefully handles text
        r_tr = client.post("/api/v1/ai/sarvam/translate", json={
            "text": "दो दिन से बुखार है",
            "source_language_code": "hi-IN",
            "target_language_code": "en-IN"
        })
        assert r_tr.status_code == 200
    test("Sarvam AI TTS and Translation endpoints process requests gracefully (POST /api/v1/ai/sarvam/*)", t39)

    # Clean up test patients
    cleanup_patients()
    print(f"\n================================================================")
    print(f"  ALL {passed_count}/{total_count} BACKEND API TESTS EXECUTED AND PASSED! ")
    print(f"================================================================\n")

if __name__ == "__main__":
    run_comprehensive_tests()
