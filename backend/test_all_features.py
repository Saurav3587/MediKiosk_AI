from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.patient import Patient, ClinicalHistory, MedicalDocument, TimelineEvent, TranscriptTurn

client = TestClient(app)

def cleanup_test_data():
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

def run_all_tests():
    print("========================================")
    print("   MEDIKIOSK AG FULL FEATURE TEST RUN   ")
    print("========================================\n")

    # 1. Root & Health Check
    r = client.get("/")
    assert r.status_code == 200 and r.json()["status"] == "online"
    print("  [PASS] 1. Root API Endpoint (GET /)")

    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "healthy"
    print("  [PASS] 2. Health Check (GET /health)")

    # 2. Real Doctor Authentication (JWT & Database)
    # 2a. Invalid Login
    r_bad = client.post("/api/v1/doctor/login", json={"email": "dr.arun@medikiosk.in", "password": "wrongpassword"})
    assert r_bad.status_code == 401
    print("  [PASS] 3. Doctor Login Failure with Bad Password (401 Unauthorized)")

    # 2b. Valid Login (Dr. Arun Sharma)
    r_login = client.post("/api/v1/doctor/login", json={"email": "dr.arun@medikiosk.in", "password": "doctor123"})
    assert r_login.status_code == 200
    login_data = r_login.json()
    assert "access_token" in login_data and login_data["token_type"] == "bearer"
    token = login_data["access_token"]
    doctor_profile = login_data["doctor"]
    assert doctor_profile["name"] == "Dr. Arun Sharma"
    auth_headers = {"Authorization": f"Bearer {token}"}
    print(f"  [PASS] 4. Doctor Login & JWT Token Issuance (POST /api/v1/doctor/login) -> {doctor_profile['name']} ({doctor_profile['department']})")

    # 2c. Get Current Doctor (/me)
    r_me = client.get("/api/v1/doctor/me", headers=auth_headers)
    assert r_me.status_code == 200
    assert r_me.json()["email"] == "dr.arun@medikiosk.in"
    print(f"  [PASS] 5. Get Current Authenticated Doctor Profile (GET /api/v1/doctor/me) -> {r_me.json()['name']}")

    # 2d. Register New Doctor
    r_reg = client.post("/api/v1/doctor/register", json={
        "name": "Dr. Vivek Mehra",
        "email": "dr.vivek@medikiosk.in",
        "password": "doctor123",
        "title": "MS, Orthopedic Surgeon",
        "department": "Orthopedics",
        "opd_room": "OPD Room 11",
        "hospital": "Apex Super Specialty Hospital"
    })
    assert r_reg.status_code == 201 or (r_reg.status_code == 400 and "already exists" in r_reg.text)
    print("  [PASS] 6. Physician Database Registration (POST /api/v1/doctor/register)")

    # 3. Patient Intake Submission (Real Patient)
    new_intake = {
        "name": "Pooja Hegde",
        "age": 34,
        "gender": "Female",
        "phone": "+91 91234 56789",
        "abhaId": "12-3456-7890-1234",
        "department": "General Medicine",
        "language": "English",
        "chiefComplaint": "Persistent fever and sore throat for 3 days",
        "symptoms": ["Fever", "Sore Throat", "Body Ache"],
        "symptomDuration": "3 days",
        "symptomCharacter": "Moderate dull ache, fever spikes in evening",
        "priority": False,
        "clinicalHistory": {
            "chiefComplaint": "Persistent fever and sore throat for 3 days",
            "hpi": "34-year-old female presenting with 3 days of fever and pharyngitis symptoms.",
            "pastMedicalHistory": "No chronic illnesses.",
            "currentMedications": [{"name": "Paracetamol 650mg", "frequency": "TDS SOS", "source": "Self"}],
            "allergies": [{"allergen": "Sulfa drugs", "reaction": "Skin rash", "source": "Patient"}],
            "aiSummary": "Acute upper respiratory tract infection / pharyngitis symptoms."
        },
        "documents": [
            {
                "name": "Previous_Prescription.pdf",
                "type": "Prescription",
                "date": "01 Sep 2026",
                "confidence": 98.0,
                "extractedData": {"prescriber": "Dr. Sen", "medications": ["Paracetamol"]}
            }
        ],
        "timeline": [
            {
                "year": "2026",
                "date": "02 Sep 2026",
                "title": "OPD Visit: Fever & Sore Throat",
                "type": "Current Visit",
                "facility": "MediKiosk OPD"
            }
        ],
        "transcript": [
            {"speaker": "assistant", "text": "What brings you in today?", "inputMode": "touch", "time": "11:00 AM"},
            {"speaker": "patient", "text": "I have had a high fever and sore throat for 3 days.", "inputMode": "voice", "time": "11:01 AM"}
        ]
    }
    r = client.post("/api/v1/patients/intake", json=new_intake)
    assert r.status_code == 200
    created_patient = r.json()
    created_id = created_patient["id"]
    created_token = created_patient["token"]
    print(f"  [PASS] 7. Patient Intake Submission (POST /api/v1/patients/intake) -> Created {created_patient['name']} (Token: {created_token})")

    # 4. Patients API & Filtering
    r = client.get("/api/v1/patients")
    assert r.status_code == 200
    patients = r.json()
    assert len(patients) >= 1
    print(f"  [PASS] 8. List Patients (GET /api/v1/patients) -> {len(patients)} patients in queue")

    r = client.get("/api/v1/patients?department=General%20Medicine")
    assert r.status_code == 200 and len(r.json()) >= 1
    print(f"  [PASS] 9. Filter Patients by Dept -> {len(r.json())} matched")

    r = client.get(f"/api/v1/patients?search={created_token}")
    assert r.status_code == 200 and len(r.json()) >= 1
    print(f"  [PASS] 10. Search Patients (query: '{created_token}') -> Found {r.json()[0]['name']}")

    # 5. Patient Detail
    r = client.get(f"/api/v1/patients/{created_token}")
    assert r.status_code == 200
    p = r.json()
    assert p["name"] == "Pooja Hegde"
    print(f"  [PASS] 11. Get Patient by Token ({created_token}) -> {p['name']}")

    # 6. Authenticated Doctor Queue
    r = client.get("/api/v1/doctor/queue", headers=auth_headers)
    assert r.status_code == 200
    print(f"  [PASS] 12. Doctor Queue with Bearer Token (GET /api/v1/doctor/queue) -> {len(r.json())} in queue")

    # 7. Doctor Verification
    r = client.post(f"/api/v1/doctor/verify/{created_id}", json={"doctorName": "Dr. Arun Sharma", "notes": "Verified clinical history. Prescribe throat swab."}, headers=auth_headers)
    assert r.status_code == 200 and r.json()["verifiedByDoctor"] == True
    print(f"  [PASS] 13. Doctor Verification (POST /api/v1/doctor/verify) -> Verified by {r.json()['verifiedDoctorName']}")

    # 8. Doctor Start Consultation
    r = client.post(f"/api/v1/doctor/consult/{created_id}", headers=auth_headers)
    assert r.status_code == 200 and r.json()["status"] == "Consulting"
    print(f"  [PASS] 14. Start Consultation (POST /api/v1/doctor/consult) -> Status: {r.json()['status']}")

    # 9. Doctor Edit History
    r = client.put(f"/api/v1/doctor/history/{created_id}", json={"hpi": "Updated HPI with detailed throat inspection findings."}, headers=auth_headers)
    assert r.status_code == 200 and "Updated HPI" in r.json()["clinicalHistory"]["hpi"]
    print("  [PASS] 15. Doctor Edit History (PUT /api/v1/doctor/history)")

    # 10. AI Clinical Synthesis
    r = client.post("/api/v1/ai/synthesize-history", json={
        "patientName": "Amit Roy",
        "age": 45,
        "gender": "Male",
        "answers": {
            "chief_complaint": "Severe headache and blurred vision",
            "duration": "2 days",
            "character": "Throbbing occipital pain",
            "radiation": "Neck stiffness",
            "past_conditions": ["Hypertension"],
            "allergies": ["None"]
        }
    })
    assert r.status_code == 200 and r.json()["success"] == True
    print("  [PASS] 16. AI Clinical History Synthesis (POST /api/v1/ai/synthesize-history)")

    # 11. AI Priority Trigger Evaluation
    r = client.post("/api/v1/ai/evaluate-priority", json={
        "answers": {
            "chief_complaint": "chest_discomfort",
            "chest_radiation": "left_arm",
            "chest_duration": "last_night"
        }
    })
    assert r.status_code == 200 and r.json()["isPriority"] == True
    print(f"  [PASS] 17. AI Priority Evaluation (POST /api/v1/ai/evaluate-priority) -> Flagged Priority: {r.json()['isPriority']} ({r.json()['priorityReason'][:40]}...)")

    # 12. OCR Document Extraction
    r = client.post("/api/v1/documents/ocr/extract", json={"documentType": "Lab Report", "fileName": "lipid_panel.pdf"})
    assert r.status_code == 200 and r.json()["confidence"] >= 90.0
    print(f"  [PASS] 18. OCR Document Extraction (POST /api/v1/documents/ocr/extract) -> Extracted {len(r.json()['extractedData'].get('parameters', []))} parameters")

    # 13. Analytics Overview & Health
    r = client.get("/api/v1/analytics/overview")
    assert r.status_code == 200
    stats = r.json()
    print(f"  [PASS] 19. Analytics Overview (GET /api/v1/analytics/overview) -> Total Docs: {stats['totalDocumentsProcessed']}, Waiting: {stats['patientsWaiting']}")

    r = client.get("/api/v1/analytics/system-health")
    assert r.status_code == 200 and r.json()["database"]["connectionPool"] == "Healthy"
    print(f"  [PASS] 20. System Health (GET /api/v1/analytics/system-health) -> DB: {r.json()['database']['status']}")

    # Clean up test patients
    cleanup_test_data()
    print("  [PASS] 21. Database Cleaned -> Ready for Real Patients")

    print("\n=================================================")
    print("  ALL 21 BACKEND & AUTH FEATURES VERIFIED!      ")
    print("=================================================")

if __name__ == "__main__":
    run_all_tests()
