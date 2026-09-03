# MediKiosk — AI-Powered Clinical Intake Platform

MediKiosk is a production-grade, multi-role clinical intake web application backed by **FastAPI + PostgreSQL / SQLite** and **React 18 + Vite + Tailwind CSS**. It allows patients to record their medical history before consultation using voice, touch, or text in Indian languages, upload and scan past medical documents with optical entity extraction, and delivers a structured, source-traceable clinical history draft directly to the attending physician’s workspace.

---

## 1. Complete Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT 18 FRONTEND (Vite)                 │
│  - Patient Intake Kiosk (Voice, Touch, Mobile-First)        │
│  - Framer Motion AI Health Assistant Orb                    │
│  - Medical Document Laser Scanner & OCR Extraction          │
│  - Doctor Clinical Workspace & Verification Panel           │
│  - Admin Analytics (Recharts) & System Diagnostics          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST API (port 8000)
┌──────────────────────────────▼──────────────────────────────┐
│                    FASTAPI BACKEND (Python)                 │
│  - Lifespan Database Auto-Seeding (8 Realistic Patients)   │
│  - SQLAlchemy ORM Models (Patient, History, Document, etc.) │
│  - OCR Parameter Extraction Pipeline (LayoutXLM / Paddle)   │
│  - AI History Synthesizer & Triage Red-Flag Classifier      │
│  - Doctor Verification Stamping & Consultation Controls     │
│  - Interactive Swagger OpenAPI Docs at /docs                │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  DATABASE (PostgreSQL / SQLite)             │
│  - Configurable via DATABASE_URL                            │
│  - Auto-fallback to local medikiosk.db for zero-config run │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Quick Start Instructions

### A. Run Backend (FastAPI)
```bash
# Navigate to project directory
cd "d:/Medikiosk AG"

# Start the FastAPI backend server
python backend/run.py
```
- **Backend API:** `http://127.0.0.1:8000/`
- **Interactive Swagger Documentation:** `http://127.0.0.1:8000/docs`

### B. Run Frontend (React Vite)
```bash
# In a second terminal
cd "d:/Medikiosk AG"

# Start the Vite development server
npm run dev
```
- **Frontend App:** `http://localhost:3000/`

---

## 3. Application Routes & URLs

### Frontend Web Routes (`http://localhost:3000/`)
| Route | Page | Description |
|---|---|---|
| `/` | `LandingPage` | Healthcare hero, 5-stage clinical workflow, 4 capabilities, ABHA badge, role gateways. |
| `/patient/identify` | `IdentifyPage` | Patient identification via simulated ABHA QR scanner, 14-digit ABHA input, phone lookup. |
| `/patient/language` | `LanguagePage` | 10 Indian language selection cards with audio previews and live Hindi/English switching. |
| `/patient/consent` | `ConsentPage` | Transparent 3-card consent summary, audio guidance narrator, privacy safeguards. |
| `/patient/history` | `HistoryPage` | Framer Motion AI Health Orb, voice/touch/text intake, adaptive clinical questions, AYUSH mode, priority triage alert. |
| `/patient/documents` | `DocumentsPage` | Prescription & Lab report upload, animated laser beam scanner, confidence-scored OCR parameter extraction. |
| `/patient/review` | `ReviewPage` | Section-by-section review of clinical history, past surgeries, medications, allergies, and patient affirmation. |
| `/patient/complete` | `CompletePage` | Patient token generation (`Token A-104`), department queue assignment, and direct link to Doctor View. |
| `/doctor` | `DoctorAuthPage` | Physician portal login with 1-click "Continue as Demo Doctor (Dr. Arun Sharma)". |
| `/doctor/queue` | `DoctorDashboardPage` | Doctor KPI metrics (Patients Waiting, Intakes Ready, Priority Alerts, Avg Time) and live searchable patient queue table. |
| `/doctor/priority` | `DoctorPriorityPage` | Dedicated triage queue for urgent priority patients with clinical trigger indications. |
| `/doctor/patient/:id` | `DoctorPatientDetailPage` | Clinical Workspace: AI draft, clickable source traceability badges, split-screen document viewer, verification bar. |
| `/admin` | `AdminDashboardPage` | Hospital operations overview and executive metrics. |
| `/admin/analytics` | `AdminAnalyticsPage` | 4 interactive Recharts charts: Patients by hour, department workload, language distribution, and intake trends. |
| `/admin/system` | `AdminSystemPage` | Real-time service health monitor for FastAPI, PostgreSQL, PaddleOCR, Speech engine, and ABDM sandbox. |

---

### Backend API Endpoints (`http://127.0.0.1:8000/`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API root health check and version info. |
| `GET` | `/docs` | Interactive Swagger UI API playground. |
| `POST` | `/api/v1/patients/intake` | Submit patient intake answers, generate token, auto-detect priority red-flags, and save structured history. |
| `GET` | `/api/v1/patients/{id_or_token}` | Retrieve complete clinical workspace bundle for a patient. |
| `GET` | `/api/v1/patients` | List patients with optional department, status, and search query filters. |
| `GET` | `/api/v1/doctor/queue` | Fetch live OPD patient queue sorted by priority and wait time. |
| `GET` | `/api/v1/doctor/priority` | Fetch only priority red-flag triage patients. |
| `POST` | `/api/v1/doctor/verify/{patient_id}` | Stamp clinical history as "Physician Verified" with doctor name, timestamp, and notes. |
| `POST` | `/api/v1/doctor/consult/{patient_id}` | Update patient status to "Consulting". |
| `PUT` | `/api/v1/doctor/history/{patient_id}` | Doctor edits clinical history draft. |
| `POST` | `/api/v1/documents/upload` | Multipart file upload and OCR extraction. |
| `POST` | `/api/v1/documents/ocr/extract` | Extract lab parameters & medications with confidence scoring. |
| `POST` | `/api/v1/ai/synthesize-history` | Synthesize HPI draft from interview answers. |
| `POST` | `/api/v1/ai/evaluate-priority` | Evaluate clinical red-flag triage conditions. |
| `GET` | `/api/v1/analytics/overview` | Live aggregate KPI counters (waiting, ready, priority, avg time). |
| `GET` | `/api/v1/analytics/system-health` | Real-time diagnostics for API, Database, OCR, and ABDM sandbox. |

---

## 4. PostgreSQL Configuration

To switch from the default local SQLite database to PostgreSQL:
Set the `DATABASE_URL` environment variable:
```bash
# Windows PowerShell
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/medikiosk_db"
python backend/run.py
```
SQLAlchemy will automatically connect to PostgreSQL and create all required tables and indexes on startup.
